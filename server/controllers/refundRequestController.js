// server/controllers/refundRequestController.js

const RefundRequest = require('../models/RefundRequest');
const Booking       = require('../models/Booking');
const stripe        = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { calculateRefundPercentage } = require('../utils/refundPolicy');
const { sendRefundIssuedEmail }      = require('../utils/mailer');

exports.getPending = async (req, res) => {
  const list = await RefundRequest.find({ status: 'pending' }).populate('booking customer');
  res.json(list);
};

exports.handle = async (req, res) => {
  const { reqId } = req.params;
  const { action } = req.body;

  const rr = await RefundRequest.findById(reqId).populate({
    path: 'booking',
    populate: { path: 'car customer' }
  });
  if (!rr) return res.status(404).send('Not found');

  if (action === 'approved') {
    const today = new Date();
    const start = new Date(rr.booking.startDate);
    const days  = Math.ceil((start - today) / (1000 * 60 * 60 * 24));
    const pct   = calculateRefundPercentage(rr.booking.car.cancellationPolicy, days);
    const amount = Math.round(rr.booking.totalAmount * (pct / 100) * 100) / 100;

    try {
      await stripe.refunds.create({
        charge: rr.booking.paymentChargeId,
        amount: Math.round(amount * 100)
      });
    } catch (err) {
      console.error('❌ Stripe refund failed:', err.message);
      return res.status(500).json({ msg: 'Refund failed. Please try again later.' });
    }

    rr.refundAmount   = amount;
    rr.status         = 'approved';
    rr.processedAt    = new Date();
    await rr.save();

    await Booking.findByIdAndUpdate(rr.booking._id, {
      status:       'Cancelled',
      refundAmount: amount
    });

    try {
      if (rr.booking.customer?.email) {
        await sendRefundIssuedEmail({
          customerEmail: rr.booking.customer.email,
          amount,
          bookingId: rr.booking._id
        });
      }
    } catch (emailErr) {
      console.warn('✉️ Failed to send refund email (ignored):', emailErr.message);
    }

    return res.json(rr);
  } else {
    rr.status      = 'rejected';
    rr.processedAt = new Date();
    await rr.save();
    return res.json(rr);
  }
};
