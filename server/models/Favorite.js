const mongoose = require('mongoose');
const FavoriteSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  listing:  { type: mongoose.Schema.Types.ObjectId, ref: 'Listing',  required: true },
}, { timestamps: true });
module.exports = mongoose.model('Favorite', FavoriteSchema);