const SOSAlert = require('../models/sosAlert.model');
const User = require('../models/user.model');
const Ride = require('../models/ride.model');

exports.createSOSAlert = async (req, res) => {
  try {
    const { location, message, rideId } = req.body;
    const userId = req.user;

    if (!location || !location.address) {
      return res.status(400).json({ message: 'Location is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (rideId) {
      const ride = await Ride.findById(rideId);
      if (!ride) {
        return res.status(404).json({ message: 'Ride not found' });
      }
    }

    const sosAlert = new SOSAlert({
      user: userId,
      location: {
        address: location.address,
        coordinates: location.coordinates || null
      },
      message: message ? message.trim() : '',
      rideId: rideId || null,
      emergencyContacts: user.emergencyContacts || []
    });

    await sosAlert.save();

    const populatedAlert = await SOSAlert.findById(sosAlert._id)
      .populate('user', 'name email phone')
      .populate('rideId', 'startLocation endLocation dateTime');

    res.status(201).json(populatedAlert);
  } catch (error) {
    res.status(500).json({ message: 'Error creating SOS alert', error: error.message });
  }
};

exports.getUserSOSAlerts = async (req, res) => {
  try {
    const userId = req.user;

    const alerts = await SOSAlert.find({ user: userId })
      .populate('rideId', 'startLocation endLocation dateTime')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching SOS alerts', error: error.message });
  }
};

exports.updateSOSStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolvedBy } = req.body;
    const userId = req.user;

    const alert = await SOSAlert.findById(id);
    if (!alert) {
      return res.status(404).json({ message: 'SOS alert not found' });
    }

    if (status && !['Active', 'Resolved', 'False Alarm'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    if (status) alert.status = status;
    if (resolvedBy) {
      alert.resolvedBy = resolvedBy;
      alert.resolvedAt = new Date();
    }

    await alert.save();

    const updatedAlert = await SOSAlert.findById(id)
      .populate('user', 'name email phone')
      .populate('rideId', 'startLocation endLocation dateTime')
      .populate('resolvedBy', 'name email');

    res.json(updatedAlert);
  } catch (error) {
    res.status(500).json({ message: 'Error updating SOS alert', error: error.message });
  }
};

exports.shareLiveLocation = async (req, res) => {
  try {
    const { location, rideId, contactIds } = req.body;
    const userId = req.user;

    if (!location || !location.address) {
      return res.status(400).json({ message: 'Location is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (rideId) {
      const ride = await Ride.findById(rideId);
      if (!ride) {
        return res.status(404).json({ message: 'Ride not found' });
      }
    }

    const sosAlert = new SOSAlert({
      user: userId,
      location: {
        address: location.address,
        coordinates: location.coordinates || null
      },
      message: 'Live location sharing enabled',
      rideId: rideId || null,
      status: 'Active',
      emergencyContacts: user.emergencyContacts.filter(contact => 
        contactIds ? contactIds.includes(contact._id) : true
      )
    });

    await sosAlert.save();

    res.json({ 
      message: 'Live location sharing enabled',
      alertId: sosAlert._id
    });
  } catch (error) {
    res.status(500).json({ message: 'Error sharing live location', error: error.message });
  }
};
