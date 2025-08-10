// server/controllers/adminController.js
const Booking   = require('../models/Booking');
const Customer  = require('../models/Customer');
const Business  = require('../models/Business');
const Affiliate = require('../models/Affiliate');

exports.getStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const totalCancellations = await Booking.countDocuments({ status: 'Cancelled' });

    const agg = await Booking.aggregate([
      {
        $group: {
          _id: null,
          totalBookingFees: { $sum: '$bookingFee' },
          totalServiceFees: { $sum: '$serviceFee' },
          totalRevenue:     { $sum: { $add: ['$bookingFee', '$serviceFee'] } }
        }
      }
    ]);
    const { totalBookingFees=0, totalServiceFees=0, totalRevenue=0 } = agg[0] || {};

    const totalCustomers  = await Customer.countDocuments();
    const totalBusinesses = await Business.countDocuments();
    const totalAffiliates = await Affiliate.countDocuments();

    res.json({
      totalBookings,
      totalCancellations,
      totalBookingFees,
      totalServiceFees,
      totalRevenue,
      totalCustomers,
      totalBusinesses,
      totalAffiliates
    });
  } catch (err) {
    console.error('admin stats error', err);
    res.status(500).json({ msg: 'Server error fetching admin stats' });
  }
};

exports.getBusinesses = async (req, res) => {
  try {
    // return all businesses with some key fields
    const businesses = await Business.find()
      .select('name email approvedToDrive pendingBalance createdAt')
      .lean();
    res.json({ businesses });
  } catch (err) {
    console.error('admin getBusinesses error', err);
    res.status(500).json({ msg: 'Server error fetching businesses' });
  }
};

exports.withdrawPlatformFees = async (req, res) => {
  try {
    // You’d hook into your payment provider here to send platform fees
    // For now we'll just log and return success
    console.log('ADMIN: platform fees withdrawn to company bank account');
    return res.json({ msg: 'Withdrawal successful' });
  } catch (err) {
    console.error('admin withdraw error', err);
    res.status(500).json({ msg: 'Server error during withdrawal' });
  }
};
