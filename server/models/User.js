const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true },           // 'google' | 'apple' | 'email'
    providerId: { type: String },                          // sub/id from provider
    email: { type: String, lowercase: true, index: true },
    firstName: String,
    lastName: String,
    avatar: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
