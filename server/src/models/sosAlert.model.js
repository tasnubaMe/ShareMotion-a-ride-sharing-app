const mongoose = require('mongoose');

const SOSAlertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    address: String,
    coordinates: {
      type: [Number],
      index: '2dsphere'
    }
  },
  message: {
    type: String,
    trim: true,
    maxlength: 200
  },
  status: {
    type: String,
    enum: ['Active', 'Resolved', 'False Alarm'],
    default: 'Active'
  },
  emergencyContacts: [{
    name: String,
    phone: String,
    email: String,
    notified: {
      type: Boolean,
      default: false
    },
    notifiedAt: Date
  }],
  rideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride'
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SOSAlert', SOSAlertSchema);
