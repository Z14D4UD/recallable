// server/models/Affiliate.js
const mongoose = require('mongoose');

const AffiliateSchema = new mongoose.Schema({
  /* ── identity ─────────────────────────────────────────── */
  name:          { type: String, required: true },
  email:         { type: String, required: true, unique: true },
  password:      { type: String, required: true },
  affiliateCode: { type: String, required: true, unique: true },

  /* ── old running totals (kept) ────────────────────────── */
  earnings:          { type: Number, default: 0 },
  referrals:         { type: Number, default: 0 },
  recentReferrals:   { type: Number, default: 0 },
  recentVisits:      { type: Number, default: 0 },
  conversions:       { type: Number, default: 0 },
  paidReferrals:     { type: Number, default: 0 },
  unpaidEarnings:    { type: Number, default: 0 },
  totalEarnings:     { type: Number, default: 0 },

  /* ── NEW escrow buckets ───────────────────────────────── */
  pendingBalance:   { type: Number, default: 0 }, // to be released on trip start
  availableBalance: { type: Number, default: 0 }, // can be withdrawn

  /* ── profile ──────────────────────────────────────────── */
  aboutMe:     { type: String, default: '' },
  phoneNumber: { type: String, default: '' },
  avatarUrl:   { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Affiliate', AffiliateSchema);
