// server/controllers/chatController.js

const Conversation = require('../models/Conversation');
const Message      = require('../models/Message');
const Booking      = require('../models/Booking');
const Business     = require('../models/Business');
const Customer     = require('../models/Customer');
const Affiliate    = require('../models/Affiliate');

/**
 * DELETE CONVERSATION – deletes the conversation and all its messages
 */
exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.customer
      ? req.customer.id
      : req.business
      ? req.business.id
      : null;
    if (!userId) return res.status(401).json({ msg: 'Not authorized' });

    const convo = await Conversation.findById(conversationId);
    if (!convo) return res.status(404).json({ msg: 'Conversation not found' });
    if (!convo.participants.includes(userId)) {
      return res.status(403).json({ msg: 'Not allowed to delete this conversation' });
    }

    // Remove all related messages, then the conversation itself
    await Message.deleteMany({ conversation: conversationId });
    await Conversation.findByIdAndDelete(conversationId);

    res.json({ msg: 'Conversation deleted' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ msg: 'Server error deleting conversation' });
  }
};

/**
 * GET ALL CONVERSATIONS for the current user
 */
exports.getConversations = async (req, res) => {
  try {
    const userId = req.customer
      ? req.customer.id
      : req.business
      ? req.business.id
      : null;
    if (!userId) return res.status(401).json({ msg: 'Not authorized' });

    const filter     = req.query.filter || 'all';
    const searchTerm = req.query.search;

    let convos = await Conversation.find({ participants: userId })
      .sort({ updatedAt: -1 })
      .lean();

    for (let c of convos) {
      // Count unread messages
      c.unreadCount = await Message.countDocuments({
        conversation: c._id,
        readBy:       { $ne: userId },
      });

      // Identify the "other" participant
      const otherId = c.participants.find(id => id.toString() !== userId);
      let otherDoc;
      if (req.customer) {
        otherDoc = await Business.findById(otherId).select('name avatarUrl');
      } else {
        otherDoc = await Customer.findById(otherId).select('name avatarUrl');
      }
      c.name      = otherDoc?.name      || 'Conversation';
      c.avatarUrl = otherDoc?.avatarUrl || '';
    }

    // Filter unread if requested
    if (filter === 'unread') {
      convos = convos.filter(c => c.unreadCount > 0);
    }

    // Optional search by name
    if (searchTerm) {
      convos = convos.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    res.json(convos);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ msg: 'Server error fetching conversations' });
  }
};

/**
 * GET ALL MESSAGES in a conversation
 */
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const convo = await Conversation.findById(conversationId).lean();
    if (!convo) return res.status(404).json({ msg: 'Conversation not found' });

    let bookingDetails = null;
    if (convo.bookingId) {
      bookingDetails = await Booking.findById(convo.bookingId).lean();
    }

    let messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: 1 })
      .lean();

    // Populate each sender's name + avatar
    for (let m of messages) {
      let Model;
      if (m.senderModel === 'Business')    Model = Business;
      else if (m.senderModel === 'Customer') Model = Customer;
      else if (m.senderModel === 'Affiliate') Model = Affiliate;
      const doc = await Model.findById(m.sender).select('name avatarUrl');
      m.sender = {
        _id:       m.sender,
        name:      doc?.name      || '',
        avatarUrl: doc?.avatarUrl || '',
      };
    }

    res.json({ conversation: convo, messages, bookingDetails });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ msg: 'Server error fetching messages' });
  }
};

/**
 * SEND A MESSAGE in a conversation
 */
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.customer
      ? req.customer.id
      : req.business
      ? req.business.id
      : null;
    const senderModel = req.customer ? 'Customer' : 'Business';
    if (!userId) return res.status(401).json({ msg: 'Not authorized' });

    const { text } = req.body;
    const newMessage = new Message({
      conversation: conversationId,
      sender:       userId,
      senderModel,
      text:         text || '',
      attachment:   req.file ? req.file.path : undefined,
      readBy:       [userId],
    });
    await newMessage.save();

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: text,
      updatedAt:   new Date(),
    });

    // Populate sender info for the response
    const SenderModel = senderModel === 'Business' ? Business : Customer;
    const doc = await SenderModel.findById(userId).select('name avatarUrl');
    const payload = {
      ...newMessage.toObject(),
      sender: {
        _id:       userId,
        name:      doc?.name      || '',
        avatarUrl: doc?.avatarUrl || '',
      }
    };

    res.json(payload);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ msg: 'Server error sending message' });
  }
};

/**
 * MARK A SINGLE MESSAGE AS READ
 */
exports.markMessageRead = async (req, res) => {
  try {
    const { conversationId, messageId } = req.params;
    const userId = req.customer
      ? req.customer.id
      : req.business
      ? req.business.id
      : null;
    if (!userId) return res.status(401).json({ msg: 'Not authorized' });

    const msg = await Message.findOne({ _id: messageId, conversation: conversationId });
    if (!msg) return res.status(404).json({ msg: 'Message not found' });

    if (!msg.readBy.includes(userId)) {
      msg.readBy.push(userId);
      await msg.save();
    }

    res.json({ msg: 'Message marked as read' });
  } catch (error) {
    console.error('Error marking message read:', error);
    res.status(500).json({ msg: 'Server error marking message read' });
  }
};

/**
 * MARK ALL MESSAGES IN A CONVERSATION AS READ
 */
exports.markAllReadInConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.customer
      ? req.customer.id
      : req.business
      ? req.business.id
      : null;
    if (!userId) return res.status(401).json({ msg: 'Not authorized' });

    await Message.updateMany(
      { conversation: conversationId, readBy: { $ne: userId } },
      { $push: { readBy: userId } }
    );
    res.json({ msg: 'All messages in conversation marked as read' });
  } catch (error) {
    console.error('Error marking conversation read:', error);
    res.status(500).json({ msg: 'Server error marking conversation read' });
  }
};

/**
 * DELETE a conversation and all its messages
 */
exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    await Message.deleteMany({ conversation: conversationId });
    await Conversation.findByIdAndDelete(conversationId);
    res.json({ msg: 'Conversation deleted' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ msg: 'Server error deleting conversation' });
  }
};