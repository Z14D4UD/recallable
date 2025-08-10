// server/models/Customer.js
const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  location: { type: String },
  aboutMe: { type: String },
  dateOfBirth: { type: Date,   required: true },    // NEW
  phoneNumber: { type: String },
  approvedToDrive: { type: Boolean, default: false },
  avatarUrl: { type: String },
  idDocument: { type: String },
  idVerified:   { type: Boolean, default: false },
  idVerifiedAt: { type: Date },
  idVerificationError: { type: String, default: null },
  idSimilarity: { type: Number },
  transmission: { type: String }, // ensure transmission field exists
  points: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Customer', CustomerSchema);
