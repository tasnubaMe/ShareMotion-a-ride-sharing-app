const Feedback = require('../models/feedback.model');
const User = require('../models/user.model');
const Ride = require('../models/ride.model');

exports.createFeedback = async (req, res) => {
  try {
    const { toUserId, rideId, rating, comment, category } = req.body;
    const fromUserId = req.user;

    if (!toUserId || !rating) {
      return res.status(400).json({ message: 'Recipient user and rating are required' });
    }

    const existingFeedback = await Feedback.findOne({
      fromUser: fromUserId,
      toUser: toUserId,
      rideId: rideId
    });

    if (existingFeedback) {
      return res.status(400).json({ 
        message: 'You have already given feedback for this user and ride',
        existingFeedback
      });
    }

    const feedback = new Feedback({
      fromUser: fromUserId,
      toUser: toUserId,
      rideId: rideId || undefined,
      rating,
      comment: comment || undefined,
      category: category || 'Overall'
    });

    await feedback.save();
    res.status(201).json(feedback);
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ message: 'Error creating feedback', error: error.message });
  }
};

exports.checkExistingFeedback = async (req, res) => {
  try {
    const { fromUserId, toUserId, rideId } = req.params;
    
    const feedback = await Feedback.findOne({
      fromUser: fromUserId,
      toUser: toUserId,
      rideId: rideId
    });

    res.json({ feedback });
  } catch (error) {
    console.error('Error checking existing feedback:', error);
    res.status(500).json({ message: 'Error checking existing feedback', error: error.message });
  }
};

exports.getUserFeedback = async (req, res) => {
  try {
    const { userId } = req.params;

    const feedback = await Feedback.find({ toUser: userId })
      .populate('fromUser', 'name email')
      .populate('rideId', 'startLocation endLocation dateTime')
      .sort({ createdAt: -1 });

    const averageRating = feedback.length > 0 
      ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
      : 0;

    res.json({
      feedback,
      averageRating: parseFloat(averageRating),
      totalFeedback: feedback.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching feedback', error: error.message });
  }
};

exports.updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, category } = req.body;
    const userId = req.user;

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    if (feedback.fromUser.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this feedback' });
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      }
      feedback.rating = parseInt(rating);
    }

    if (comment !== undefined) {
      feedback.comment = comment ? comment.trim() : '';
    }

    if (category !== undefined) {
      feedback.category = category;
    }

    await feedback.save();

    const updatedFeedback = await Feedback.findById(id)
      .populate('fromUser', 'name email')
      .populate('toUser', 'name email')
      .populate('rideId', 'startLocation endLocation dateTime');

    res.json(updatedFeedback);
  } catch (error) {
    res.status(500).json({ message: 'Error updating feedback', error: error.message });
  }
};

exports.deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user;

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    if (feedback.fromUser.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this feedback' });
    }

    await Feedback.findByIdAndDelete(id);

    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting feedback', error: error.message });
  }
};