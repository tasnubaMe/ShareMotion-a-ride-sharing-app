const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth.middleware');
const {
  createRequest,
  getRequestsForRide,
  getUserRequests,
  updateRequestStatus
} = require('../controllers/request.controller');

router.post('/:rideId',       auth, createRequest);
router.get('/ride/:rideId',   auth, getRequestsForRide);
router.get('/user',           auth, getUserRequests);
router.patch('/:id',          auth, updateRequestStatus);


module.exports = router;
