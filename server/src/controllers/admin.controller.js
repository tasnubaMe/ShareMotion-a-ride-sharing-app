const User = require('../models/user.model');
const Feedback = require('../models/feedback.model');
const SOSAlert = require('../models/sosAlert.model');
const Ride = require('../models/ride.model');
const RideRequest = require('../models/rideRequest.model');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('name email status isAdmin createdAt warnings')
      .populate('warnings.issuedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id)
      .select('name email status isAdmin createdAt warnings emergencyContacts homeLocation')
      .populate('warnings.issuedBy', 'name email');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

exports.warnUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const adminId = req.user;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Warning message is required' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const admin = await User.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    user.warnings.push({
      message: message.trim(),
      issuedBy: adminId,
      issuedAt: new Date(),
      isRead: false
    });

    await user.save();

    res.json({ message: 'Warning issued successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error issuing warning', error: error.message });
  }
};

exports.suspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'Suspended';
    if (reason) {
      user.warnings.push({
        message: `Account suspended: ${reason}`,
        issuedBy: req.user,
        issuedAt: new Date(),
        isRead: false
      });
    }

    await user.save();

    res.json({ message: 'User suspended successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error suspending user', error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'Deleted';
    await user.save();

    res.json({ message: 'User marked as deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

exports.getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({})
      .populate('fromUser', 'name email')
      .populate('toUser', 'name email')
      .populate('rideId', 'startLocation endLocation dateTime')
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching feedback', error: error.message });
  }
};

exports.generateActivityReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalRides,
      completedRides,
      totalRequests,
      confirmedRequests,
      totalFeedback,
      totalWarnings,
      totalSOSAlerts,
      activeSOSAlerts
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      User.countDocuments({ status: 'Active', createdAt: { $gte: start, $lte: end } }),
      User.countDocuments({ status: 'Suspended', createdAt: { $gte: start, $lte: end } }),
      Ride.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      Ride.countDocuments({ status: 'Completed', createdAt: { $gte: start, $lte: end } }),
      RideRequest.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      RideRequest.countDocuments({ status: 'Confirmed', createdAt: { $gte: start, $lte: end } }),
      Feedback.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      User.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $unwind: '$warnings' },
        { $count: 'total' }
      ]).then(result => result[0]?.total || 0),
      SOSAlert.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      SOSAlert.countDocuments({ status: 'Active' })
    ]);

    const report = {
      period: { start, end },
      userStats: {
        total: totalUsers,
        active: activeUsers,
        suspended: suspendedUsers
      },
      rideStats: {
        total: totalRides,
        completed: completedRides,
        completionRate: totalRides > 0 ? ((completedRides / totalRides) * 100).toFixed(2) + '%' : '0%'
      },
      requestStats: {
        total: totalRequests,
        confirmed: confirmedRequests,
        confirmationRate: totalRequests > 0 ? ((confirmedRequests / totalRequests) * 100).toFixed(2) + '%' : '0%'
      },
      feedbackStats: {
        total: totalFeedback
      },
      safetyStats: {
        warningsIssued: totalWarnings,
        sosAlerts: totalSOSAlerts,
        activeAlerts: activeSOSAlerts
      },
      generatedAt: new Date()
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
};

exports.getAllSOSAlerts = async (req, res) => {
  try {
    const alerts = await SOSAlert.find({})
      .populate('user', 'name email phone')
      .populate('rideId', 'startLocation endLocation dateTime')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching SOS alerts', error: error.message });
  }
};
