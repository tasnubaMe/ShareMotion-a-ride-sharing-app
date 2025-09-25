const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500
  },
  category: {
    type: String,
    enum: ['Punctuality', 'Cleanliness', 'Communication', 'Safety', 'Overall'],
    default: 'Overall'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate feedback from same user to same user
FeedbackSchema.index({ fromUser: 1, toUser: 1, rideId: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);
