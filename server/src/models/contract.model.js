const mongoose = require('mongoose');

const ContractSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalSeats: {
    type: Number,
    required: true,
    min: 1
  },
  autoPostExtraSeats: {
    type: Boolean,
    default: false
  },
  route: {
    startLocation: {
      address: { type: String, required: true }
    },
    endLocation: {
      address: { type: String, required: true }
    }
  },
  weeklySchedule: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    time: {
      type: String,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Cancelled'],
    default: 'Active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

ContractSchema.index({ creator: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Contract', ContractSchema);
