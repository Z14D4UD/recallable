// server/controllers/bookingController.js

const path         = require('path');
const Booking      = require('../models/Booking');
const Listing      = require('../models/Listing');
const Business     = require('../models/Business');
const Affiliate    = require('../models/Affiliate');
const Conversation = require('../models/Conversation');
const Message      = require('../models/Message');
const Customer     = require('../models/Customer');
const RefundRequest= require('../models/RefundRequest');
const PDFDocument  = require('pdfkit');
const { calculateRefundPercentage } = require('../utils/refundPolicy');
const {
  sendBookingApprovalEmail,
  sendBookingRejectionEmail,
  sendBookingReceivedEmail
} = require('../utils/mailer');

/**
 * CREATE BOOKING
 */
exports.createBooking = async (req, res) => {
  if (!req.customer) {
    return res.status(401).json({ msg: 'Authentication required' });
  }

  // ensure licence was uploaded
  if (!req.file) {
    return res.status(400).json({ msg: 'Driver license image is required' });
  }
  // build a relative URL we can serve statically
  const licenseUrl = path
    .relative(path.join(__dirname, '..'), req.file.path)
    .replace(/\\/g, '/');

  const {
    carId,
    listingId,
    startDate,
    endDate,
    basePrice: basePriceRaw,
    currency,
    affiliateCode,
    bookingType
  } = req.body;

  // parse basePrice from string to Number
  const basePrice = parseFloat(basePriceRaw);
  if (isNaN(basePrice)) {
    return res.status(400).json({ msg: 'Invalid basePrice' });
  }

  try {
    const lookupId   = listingId || carId;
    const listing    = await Listing.findById(lookupId);
    if (!listing) return res.status(404).json({ msg: 'Listing not found' });

    const cust      = await Customer.findById(req.customer.id);
    const custName  = cust?.name || 'Unknown';
    const businessId = listing.business;

    // calculate fees
    const bookingFee  = basePrice * 0.05;
    const serviceFee  = basePrice * 0.05;
    const totalAmount = basePrice + bookingFee;
    const payout      = basePrice - serviceFee;

    const bookingData = {
      car:            lookupId,
      business:       businessId,
      customer:       req.customer.id,
      customerName:   custName,
      startDate,
      endDate,
      basePrice,
      bookingFee,
      serviceFee,
      totalAmount,
      payout,
      currency:       currency || 'usd',
      status:         'Pending',
      refundable:     bookingType === 'refundable',
      licenseUrl,
    };

    if (affiliateCode) {
      const aff = await Affiliate.findOne({ affiliateCode: affiliateCode.toUpperCase() });
      if (!aff) return res.status(400).json({ msg: 'Invalid affiliate code' });
      let commission = 0;
      if (basePrice >= 700) commission = 10;
      else if (basePrice >= 250) commission = 5;
      aff.earnings       += commission;
      aff.pendingBalance += commission;
      aff.referrals      += 1;
      aff.unpaidEarnings += commission;
      await aff.save();
      bookingData.affiliate = aff._id;
    }

    const booking = new Booking(bookingData);
    await booking.save();

    await Business.findByIdAndUpdate(
      businessId,
      { $inc: { points: 10, pendingBalance: payout } }
    );
    let customerPoints = basePrice <= 700 ? 5 : basePrice <= 5000 ? 10 : 50;
    await Customer.findByIdAndUpdate(
      req.customer.id,
      { $inc: { points: customerPoints } }
    );

    try {
      await sendBookingReceivedEmail({
        customerEmail: cust.email,
        customerName:  custName,
        bookingId:     booking._id,
        startDate,
        endDate
      });
    } catch (mailErr) {
      console.warn('✉️ booking-received mail failed (ignored):', mailErr.message);
    }

    let convo = await Conversation.findOne({ bookingId: booking._id });
    if (!convo) {
      convo = await Conversation.create({
        bookingId:    booking._id,
        participants: [booking.customer, businessId].filter(Boolean),
        lastMessage:  ''
      });
    }

    const msgText =
      `🎉 Booking request received!\n\n` +
      `• Car: ${listing.make} ${listing.model}\n` +
      `• Dates: ${new Date(startDate).toLocaleDateString()} – ${new Date(endDate).toLocaleDateString()}\n` +
      `• Status: Pending approval by host.`;

    const msg = await Message.create({
      conversation: convo._id,
      sender:       businessId,
      senderModel:  'Business',
      text:         msgText,
      readBy:       [businessId]
    });

    convo.lastMessage = msg.text;
    convo.updatedAt   = Date.now();
    await convo.save();

    return res.json({ booking });
  } catch (error) {
    console.error('Booking error:', error);
    return res.status(500).send('Server error');
  }
};

/**
 * CANCEL REQUEST – customer requests cancellation
 */
exports.requestBookingCancel = async (req, res) => {
  const bookingId = req.params.id;
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });
    if (booking.customer.toString() !== req.customer.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    if (!booking.refundable) {
      return res.status(400).json({ msg: 'This booking is non-refundable.' });
    }

    const rr = new RefundRequest({
      booking:  booking._id,
      customer: req.customer.id
    });
    await rr.save();

    booking.status = 'cancelRequested';
    await booking.save();

    return res.json({ msg: 'Cancellation requested', request: rr });
  } catch (err) {
    console.error('Error requesting cancel:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * GET REFUND REQUESTS – business dashboard
 */
exports.getRefundRequests = async (req, res) => {
  try {
    const requests = await RefundRequest.find({ status: 'pending' })
      .populate({ path: 'booking', populate: { path: 'car business customer' } })
      // include avatarUrl here:
      .populate('customer', 'name email avatarUrl');
    return res.json(requests);
  } catch (err) {
    console.error('Error fetching refund requests:', err);
    return res.status(500).json({ msg: 'Server error fetching refund requests' });
  }
};

/**
 * UPDATE BOOKING STATUS – business clicks Approve / Reject
 */
exports.updateBookingStatus = async (req, res) => {
  const bookingId = req.params.id;
  const { status } = req.body;

  try {
    const booking = await Booking.findById(bookingId)
      .populate('business', 'name email')
      // include avatarUrl on the customer here:
      .populate('customer', 'name email avatarUrl');
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });

    booking.status = status;
    await booking.save();

    const emailData = {
      customerEmail: booking.customer?.email,
      customerName:  booking.customer?.name || booking.customerName,
      bookingId:     booking._id,
      startDate:     booking.startDate,
      endDate:       booking.endDate
    };

    try {
      if (emailData.customerEmail) {
        if (status === 'Active')         await sendBookingApprovalEmail(emailData);
        else if (status === 'Cancelled') await sendBookingRejectionEmail(emailData);
      }
    } catch (mailErr) {
      console.warn('✉️ email failed (ignored):', mailErr.message);
    }

    if (status === 'Cancelled') {
      await RefundRequest.findOneAndUpdate(
        { booking: booking._id, status: 'pending' },
        { status: 'approved', processedAt: new Date() }
      );
    }

    let convo = await Conversation.findOne({ bookingId: booking._id });
    if (!convo) {
      convo = await Conversation.create({
        bookingId:    booking._id,
        participants: [booking.customer?._id, booking.business?._id].filter(Boolean),
        lastMessage:  ''
      });
    }

    const msgText =
      status === 'Active'
        ? `✅ Your booking ${booking._id} has been approved.`
        : `❌ Your cancellation request for booking ${booking._id} has been processed.`;

    const msg = await Message.create({
      conversation: convo._id,
      sender:       booking.business._id,
      senderModel:  'Business',
      text:         msgText,
      readBy:       [booking.business._id]
    });

    convo.lastMessage = msg.text;
    convo.updatedAt   = Date.now();
    await convo.save();

    return res.json({ booking });
  } catch (error) {
    console.error('Error updating booking status:', error);
    return res.status(500).json({ msg: 'Server error while updating status' });
  }
};

/**
 * PAYOUT REQUEST – business withdraws their available balance
 */
exports.requestPayout = async (req, res) => {
  if (!req.business) return res.status(401).json({ msg: 'Unauthorized' });
  const businessId = req.business.id;
  try {
    const biz = await Business.findById(businessId);
    if (!biz) return res.status(404).json({ msg: 'Business not found' });
    const payoutAmount = biz.balance;
    biz.balance = 0;
    await biz.save();
    return res.json({ msg: `Payout of $${payoutAmount.toFixed(2)} processed successfully.` });
  } catch (error) {
    console.error('Payout error:', error);
    return res.status(500).json({ msg: 'Server error processing payout' });
  }
};

/**
 * PUBLIC: LIST ALL BOOKINGS
 */
exports.getBookings = async (_req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate({ path: 'car', model: 'Listing', select: 'make model description images' })
      .populate('business', 'name email')
      // include avatarUrl on each booking
      .populate('customer', 'name email avatarUrl');
    return res.json(bookings);
  } catch (error) {
    console.error('Error listing bookings:', error);
    return res.status(500).send('Server error');
  }
};

/**
 * MY BOOKINGS (by role)
 */
exports.getMyBookings = async (req, res) => {
  try {
    let query = {};
    if (req.accountType === 'business' && req.business) {
      query.business = req.business.id;
    } else if (req.accountType === 'customer' && req.customer) {
      query.customer = req.customer.id;
    } else if (req.accountType === 'affiliate' && req.affiliate) {
      query.affiliate = req.affiliate.id;
    } else {
      return res.status(400).json({ msg: 'Invalid account type for booking retrieval' });
    }

    const bookings = await Booking.find(query)
      .populate({ path: 'car', model: 'Listing', select: 'make model description images' })
      .populate('business', 'name email')
      // include avatarUrl here too
      .populate('customer', 'name email avatarUrl');
    return res.json(bookings);
  } catch (error) {
    console.error('Error fetching my bookings:', error);
    return res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * CUSTOMER’S BOOKINGS
 */
exports.getCustomerBookings = async (req, res) => {
  try {
    if (!req.customer) return res.status(401).json({ msg: 'Unauthorized' });

    const bookings = await Booking.find({ customer: req.customer.id })
      .populate({ path: 'car', model: 'Listing', select: 'make model images' })
      .populate('business', 'name email')
      // and here:
      .populate('customer', 'name email avatarUrl');

    return res.json(bookings);
  } catch (error) {
    console.error('Error fetching customer bookings:', error);
    return res.status(500).json({ msg: 'Server error' });
  }
};

/**
 * SINGLE BOOKING – for detail pages
 */
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({ path: 'car', model: 'Listing', select: 'make model description images' })
      .populate('business', 'name email')
      // make sure avatarUrl is populated here:
      .populate('customer', 'name email avatarUrl');
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });
    return res.json(booking);
  } catch (err) {
    console.error('Error fetching booking:', err);
    return res.status(500).json({ msg: 'Server error fetching booking' });
  }
};

/**
 * GENERATE PDF INVOICE
 */
exports.generateInvoice = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({ path: 'car', select: 'make model year' })
      .populate('business', 'name email')
      .populate('customer', 'name email avatarUrl');

    if (!booking) return res.status(404).json({ msg: 'Booking not found' });

    // prepare UK-format dates
    const startUK = new Date(booking.startDate).toLocaleDateString('en-GB');
    const endUK   = new Date(booking.endDate).toLocaleDateString('en-GB');

    // round money fields to 2 decimals
    const fmt = n => n.toFixed(2);

    // set up PDF
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice_${booking._id}.pdf`
    );
    doc.pipe(res);

    // full-page background
    const { width, height } = doc.page;
    doc.rect(0, 0, width, height)
       .fill('#38b6ff');

    // draw “Hyre” logo text
    doc
      .fillColor('#ffffff')
      .fontSize(36)
      .font('Helvetica-Bold')
      .text('Hyre', { align: 'center', baseline: 'middle' });

    doc.moveDown(2);

    // invoice heading
    doc
      .fontSize(20)
      .font('Helvetica')
      .text('Invoice', { align: 'center' });

    doc.moveDown();

    // details block (left-aligned)
    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`Booking ID: ${booking._id}`)
      .text(`Customer Name: ${booking.customerName}`)
      .text(`Car: ${booking.car.make} ${booking.car.model}`)
      .text(`Booking Dates: ${startUK} – ${endUK}`)
      .moveDown()
      .text(`Base Price: £${fmt(booking.basePrice)}`)
      .text(`Booking Fee (5%): £${fmt(booking.bookingFee)}`)
      .text(`Service Fee (5%): £${fmt(booking.serviceFee)}`)
      .text(`Total Amount: £${fmt(booking.totalAmount)}`)
      .text(`Amount to Payout: £${fmt(booking.payout)}`)
      .text(`Currency: ${booking.currency.toUpperCase()}`)
      .moveDown(2);

    // thank you note
    doc
      .fontSize(14)
      .text('Thank you for booking with Hyre!', {
        align: 'center',
        fillColor: '#ffffff'
      });

    doc.end();
  } catch (error) {
    console.error('Error generating invoice:', error);
    return res.status(500).send('Server error');
  }
};
