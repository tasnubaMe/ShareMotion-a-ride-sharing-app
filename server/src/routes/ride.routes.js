const express = require('express');
const router  = express.Router();
const { createRide, getRides, getRideById, updateRideStatus, getRideHistory, getRecommendedRides } = require('../controllers/ride.controller');
const auth    = require('../middleware/auth.middleware');

router.post('/',         auth, createRide);
router.get('/',          getRides);
router.get('/history',   auth, getRideHistory);
router.get('/recommended', auth, getRecommendedRides);
router.get('/:id',       getRideById);
router.patch('/:id',     auth, updateRideStatus);

module.exports = router;
