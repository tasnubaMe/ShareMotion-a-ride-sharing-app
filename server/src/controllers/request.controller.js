// server/src/controllers/request.controller.js
const RideRequest = require('../models/rideRequest.model');
const Ride        = require('../models/ride.model');

// @desc    Create a new ride request
// @route   POST /api/requests/:rideId
exports.createRequest = async (req, res) => {
  try {
    const rideId = req.params.rideId;
    const userId = req.user;
    const { bidPrice } = req.body;

    const ride = await Ride.findById(rideId);
    if (!ride || ride.status !== 'Open')
      return res.status(400).json({ message: 'Ride not available' });

    if (await RideRequest.findOne({ ride: rideId, requester: userId, status: 'Pending' }))
      return res.status(400).json({ message: 'You already have a pending request' });

    const newRequest = new RideRequest({ ride: rideId, requester: userId, bidPrice });
    const savedRequest = await newRequest.save();
    res.status(201).json(savedRequest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc    Get requests for a ride
// @route   GET /api/requests/ride/:rideId
exports.getRequestsForRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.host.toString() !== req.user)
      return res.status(403).json({ message: 'Not authorized' });

    const requests = await RideRequest.find({ ride: ride._id }).populate('requester', 'name email');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc    Get all requests by user
// @route   GET /api/requests/user
exports.getUserRequests = async (req, res) => {
  try {
    const requests = await RideRequest.find({ requester: req.user }).populate('ride');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc    Update request status
// @route   PATCH /api/requests/:id
exports.updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending','Confirmed','Cancelled'].includes(status))
      return res.status(400).json({ message: 'Invalid status' });

    const request = await RideRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const ride = await Ride.findById(request.ride);
    // Cancellation by requester
    if (status === 'Cancelled') {
      if (request.requester.toString() !== req.user)
        return res.status(403).json({ message: 'Not authorized to cancel' });
      if (request.status !== 'Pending')
        return res.status(400).json({ message: 'Only pending can be cancelled' });
    }
    // Confirmation by host
    else if (status === 'Confirmed') {
      if (ride.host.toString() !== req.user)
        return res.status(403).json({ message: 'Not authorized to confirm' });
      if (request.status !== 'Pending')
        return res.status(400).json({ message: 'Only pending can be confirmed' });
    }

    request.status = status;
    await request.save();
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
