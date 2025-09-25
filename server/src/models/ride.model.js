// File: server/src/models/ride.model.js

const mongoose = require('mongoose');

const RideSchema = new mongoose.Schema({
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startLocation: {
    address: { type: String, required: true },
    coordinates: { 
      type: [Number],
      index: '2dsphere'
    }
  },
  endLocation: {
    address: { type: String, required: true },
    coordinates: { 
      type: [Number],
      index: '2dsphere'
    }
  },
  dateTime: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['Open', 'Closed', 'Completed'],
    default: 'Open',
    index: true
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  seats: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  contractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract'
  },
  weeklySchedule: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    time: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Ride', RideSchema);
