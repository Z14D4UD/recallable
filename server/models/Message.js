// server/models/Message.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'senderModel',
  },
  senderModel: {
    type: String,
    required: true,
    enum: ['Customer', 'Business', 'Affiliate', 'Support'],
  },
  text:       { type: String },
  attachment: { type: String }, // file path if an attachment is uploaded
  // For read/unread:
  readBy: [{ type: mongoose.Schema.Types.ObjectId }], // store IDs that read the message
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
