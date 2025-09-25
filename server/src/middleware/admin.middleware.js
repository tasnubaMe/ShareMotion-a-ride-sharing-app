const User = require('../models/user.model');

const adminAuth = async (req, res, next) => {
  try {
    const userId = req.user;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error in admin authentication' });
  }
};

module.exports = adminAuth;
