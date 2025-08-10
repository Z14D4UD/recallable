const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  car:             { type: mongoose.Schema.Types.ObjectId, ref: 'Listing',  required: true },
  business:        { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  customer:        { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName:    { type: String,                                        required: true },
  startDate:       { type: Date,                                          required: true },
  endDate:         { type: Date,                                          required: true },
  basePrice:       { type: Number,                                        required: true },
  bookingFee:      { type: Number },
  serviceFee:      { type: Number },
  totalAmount:     { type: Number },
  paymentChargeId: { type: String },
  payout:          { type: Number },
  currency:        { type: String,        default: 'usd' },
  affiliate:       { type: mongoose.Schema.Types.ObjectId, ref: 'Affiliate' },

  licenseUrl:      { type: String },               // ← NEW: store uploaded license path

  status: {
    type: String,
    enum: ['Pending', 'Active', 'Upcoming', 'cancelRequested', 'Cancelled'],
    default: 'Pending',
  },

  refundable:      { type: Boolean, default: true },
  reviewEmailSent: { type: Boolean, default: false },
  hasReview:       { type: Boolean, default: false },
  released:        { type: Boolean, default: false }, // prevent double-payout
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);
