const express = require('express');
const router = express.Router();
const { 
  createFeedback, 
  getUserFeedback, 
  updateFeedback, 
  deleteFeedback,
  checkExistingFeedback
} = require('../controllers/feedback.controller');
const auth = require('../middleware/auth.middleware');

router.post('/', auth, createFeedback);
router.get('/user/:userId', auth, getUserFeedback);
router.get('/check/:fromUserId/:toUserId/:rideId', auth, checkExistingFeedback);
router.patch('/:id', auth, updateFeedback);
router.delete('/:id', auth, deleteFeedback);

module.exports = router;
