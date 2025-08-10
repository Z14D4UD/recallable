// server/models/RefundRequest.js
const mongoose = require('mongoose');

const refundRequestSchema = new mongoose.Schema({
  booking:       { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  customer:      { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  requestedAt:   { type: Date, default: Date.now },
  status:        { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  refundAmount:  { type: Number },        // calculated when approved
  processedAt:   { type: Date }
});

module.exports = mongoose.model('RefundRequest', refundRequestSchema);
