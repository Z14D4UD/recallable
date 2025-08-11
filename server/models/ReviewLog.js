// server/models/ReviewLog.js
const mongoose = require('mongoose');
const ReviewLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  card: { type: mongoose.Schema.Types.ObjectId, ref: 'Flashcard', index: true },
  rating: { type: String, enum: ['easy','medium','hard'] },
  reviewedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('ReviewLog', ReviewLogSchema);
