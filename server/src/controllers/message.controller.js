const Message = require('../models/message.model');
const User = require('../models/user.model');

exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user;

    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Receiver and content are required' });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      content: content.trim()
    });

    const savedMessage = await message.save();
    const populatedMessage = await Message.findById(savedMessage._id)
      .populate('sender', 'name email')
      .populate('receiver', 'name email');

    res.status(201).json(populatedMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
    .populate('sender', 'name email')
    .populate('receiver', 'name email')
    .sort({ sentAt: 1 });

    // Automatically mark messages as read when fetched
    const unreadMessages = messages.filter(msg => 
      msg.receiver._id.toString() === currentUserId && !msg.isRead
    );

    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(msg => msg._id);
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { $set: { isRead: true } }
      );
    }

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user;

    // Get all messages for the current user
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    })
    .populate('sender', 'name email')
    .populate('receiver', 'name email')
    .sort({ sentAt: -1 });

    // Group messages by conversation partner
    const conversationMap = new Map();
    
    messages.forEach(message => {
      const partnerId = message.sender._id.toString() === userId ? 
        message.receiver._id.toString() : message.sender._id.toString();
      
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          _id: message.sender._id.toString() === userId ? message.receiver : message.sender,
          lastMessage: message
        });
      }
    });

    const conversations = Array.from(conversationMap.values());
    
    // Ensure all conversations have proper user data
    const finalConversations = conversations.map(conv => {
      // If _id doesn't have a name, try to get it from the lastMessage
      if (!conv._id.name && conv.lastMessage) {
        if (conv.lastMessage.sender._id.toString() === conv._id._id.toString()) {
          conv._id.name = conv.lastMessage.sender.name;
        } else if (conv.lastMessage.receiver._id.toString() === conv._id._id.toString()) {
          conv._id.name = conv.lastMessage.receiver.name;
        }
      }
      return conv;
    });
    
    console.log('Sending conversations:', finalConversations);
    res.json(finalConversations);
  } catch (err) {
    console.error('Error in getConversations:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.receiver.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.isRead = true;
    await message.save();

    res.json({ message: 'Message marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
