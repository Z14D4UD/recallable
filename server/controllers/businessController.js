const mongoose = require('mongoose');
const Business = require('../models/Business');
const Booking  = require('../models/Booking');
const Car      = require('../models/Car');

/**
 * ID Verification – update business record with uploaded ID document
 */
exports.verifyID = async (req, res) => {
  const businessId = req.business?.id;
  const idDocumentPath = req.file ? req.file.path : '';
  if (!idDocumentPath) {
    return res.status(400).json({ msg: 'No ID document uploaded' });
  }
  try {
    const business = await Business.findByIdAndUpdate(
      businessId,
      { idDocument: idDocumentPath, verified: true },
      { new: true }
    );
    res.json({ msg: 'ID verified successfully', business });
  } catch (error) {
    console.error('Error in verifyID:', error.stack);
    res.status(500).send('Server error');
  }
};

/**
 * Dashboard stats: revenue, bookings count, cars, balances, points, rent status
 */
exports.getStats = async (req, res) => {
  if (!req.business) {
    console.error("getStats: req.business is undefined", req);
    return res.status(403).json({ msg: 'Forbidden: not a business user' });
  }
  const businessId = req.business.id;
  const today      = new Date();

  try {
    // 1) Total revenue (all time)
    const totalRevenueResult = await Booking.aggregate([
      { $match: { business: new mongoose.Types.ObjectId(businessId) } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // 2) Total bookings count
    const bookingsCount = await Booking.countDocuments({ business: businessId });

    // calculate points: 10 points per booking
    const points = bookingsCount * 10;

    // 3) Total cars for this business
    const totalCars = await Car.countDocuments({ business: businessId });

    // 4) Rented cars ever
    const rentedCarsResult = await Booking.aggregate([
      { $match: { business: new mongoose.Types.ObjectId(businessId) } },
      { $group: { _id: "$car" } },
      { $count: "count" }
    ]);
    const rentedCars = rentedCarsResult[0]?.count || 0;

    // 5) Active cars right now (today between start/end)
    const activeCarsResult = await Booking.aggregate([
      { $match: {
          business: new mongoose.Types.ObjectId(businessId),
          startDate: { $lte: today },
          endDate:   { $gte: today }
      }},
      { $group: { _id: "$car" } },
      { $count: "count" }
    ]);
    const activeCars = activeCarsResult[0]?.count || 0;

    // 6) Available Balance = sum of payouts for bookings that HAVE STARTED
    const availableResult = await Booking.aggregate([
      { $match: {
          business:  new mongoose.Types.ObjectId(businessId),
          startDate: { $lte: today }
      }},
      { $group: { _id: null, total: { $sum: "$payout" } } }
    ]);
    const availableBalance = availableResult[0]?.total || 0;

    // 7) Pending Balance = sum of payouts for FUTURE bookings
    const pendingResult = await Booking.aggregate([
      { $match: {
          business:  new mongoose.Types.ObjectId(businessId),
          startDate: { $gt: today }
      }},
      { $group: { _id: null, total: { $sum: "$payout" } } }
    ]);
    const pendingPayouts = pendingResult[0]?.total || 0;

    // 8) Rent-status breakdown for chart
    const hiredCount     = activeCars;
    const upcomingCount  = await Booking.countDocuments({
      business:  businessId,
      startDate: { $gt: today }
    });
    const completedCount = await Booking.countDocuments({
      business: businessId,
      endDate:  { $lt: today }
    });

    res.json({
      totalRevenue,
      bookings:       bookingsCount,
      rentedCars,
      activeCars,
      availableBalance,
      pendingBalance: pendingPayouts,  // React expects stats.pendingBalance
      points,                          // 10 points per booking
      rentStatus: {
        hired:     hiredCount,
        pending:   upcomingCount,
        cancelled: completedCount
      }
    });
  } catch (error) {
    console.error('Error in getStats:', error.stack);
    res.status(500).json({ msg: 'Server error while fetching stats' });
  }
};

/**
 * Earnings over months for chart
 */
exports.getEarnings = async (req, res) => {
  if (!req.business) {
    console.error("getEarnings: req.business is undefined", req);
    return res.status(403).json({ msg: 'Forbidden: not a business user' });
  }
  const businessId = req.business.id;

  try {
    const earnings = await Booking.aggregate([
      { $match: { business: new mongoose.Types.ObjectId(businessId) } },
      { $group: {
          _id: { $month: "$startDate" },
          totalEarnings: { $sum: "$totalAmount" }
      }},
      { $sort: { "_id": 1 } }
    ]);

    const monthlyEarnings = Array(12).fill(0);
    earnings.forEach(item => {
      monthlyEarnings[item._id - 1] = item.totalEarnings;
    });
    res.json(monthlyEarnings);
  } catch (error) {
    console.error('Error in getEarnings:', error.stack);
    res.status(500).json({ msg: 'Server error while fetching earnings' });
  }
};

/**
 * Bookings overview counts over months for chart
 */
exports.getBookingsOverview = async (req, res) => {
  if (!req.business) {
    console.error("getBookingsOverview: req.business is undefined", req);
    return res.status(403).json({ msg: 'Forbidden: not a business user' });
  }
  const businessId = req.business.id;

  try {
    const overview = await Booking.aggregate([
      { $match: { business: new mongoose.Types.ObjectId(businessId) } },
      { $group: {
          _id: { $month: "$startDate" },
          count: { $sum: 1 }
      }},
      { $sort: { "_id": 1 } }
    ]);

    const monthlyCounts = Array(12).fill(0);
    overview.forEach(item => {
      monthlyCounts[item._id - 1] = item.count;
    });
    res.json(monthlyCounts);
  } catch (error) {
    console.error('Error in getBookingsOverview:', error.stack);
    res.status(500).json({ msg: 'Server error while fetching bookings overview' });
  }
};

/**
 * Release payouts for bookings whose startDate has arrived:
 *  - move from pendingBalance → balance
 *  - mark bookings as released
 */
exports.releasePayouts = async (req, res) => {
  if (!req.business) return res.status(401).json({ msg: 'Unauthorized' });
  const businessId = req.business.id;
  const today      = new Date();

  try {
    // 1) Find all unreleased bookings that have started
    const toRelease = await Booking.find({
      business:  businessId,
      startDate: { $lte: today },
      released:  false
    });

    // 2) Sum up total payout
    const total = toRelease.reduce((sum, b) => sum + (b.payout || 0), 0);

    // 3) Mark each booking as released
    await Promise.all(toRelease.map(b => {
      b.released = true;
      return b.save();
    }));

    // 4) Move money on the Business account
    const biz = await Business.findById(businessId);
    biz.balance        = (biz.balance || 0) + total;
    biz.pendingBalance = (biz.pendingBalance || 0) - total;
    await biz.save();

    // 5) Respond with updated balances
    return res.json({
      availableBalance: biz.balance,
      pendingBalance:   biz.pendingBalance
    });
  } catch (err) {
    console.error('Error releasing payouts:', err);
    return res.status(500).json({ msg: 'Server error releasing payouts' });
  }
};
