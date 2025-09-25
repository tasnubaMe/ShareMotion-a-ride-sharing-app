// server/src/controllers/ride.controller.js
const Ride = require('../models/ride.model');

// @desc    Create a new ride
// @route   POST /api/rides
exports.createRide = async (req, res) => {
  try {
    const { startLocation, endLocation, dateTime, basePrice, seats, status } = req.body;
    if (!startLocation || !endLocation || !dateTime || basePrice == null)
      return res.status(400).json({ message: 'Please fill all required fields' });

    const newRide = new Ride({
      host: req.user,
      postedBy: req.user,
      startLocation,
      endLocation,
      dateTime,
      basePrice,
      seats: seats || 1,
      status: status || 'Open'
    });
    const savedRide = await newRide.save();
    res.status(201).json(savedRide);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc    Get list of rides
// @route   GET /api/rides
exports.getRides = async (req, res) => {
  try {
    const { destination, date } = req.query;
    const query = { status: 'Open' };
    if (destination)
      query['endLocation.address'] = { $regex: destination, $options: 'i' };
    if (date) {
      const dayStart = new Date(date); dayStart.setHours(0,0,0,0);
      const dayEnd   = new Date(date); dayEnd.setHours(23,59,59,999);
      query.dateTime = { $gte: dayStart, $lte: dayEnd };
    }
    const rides = await Ride.find(query).populate('postedBy', 'name email');
    res.json(rides);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc    Get ride by ID
// @route   GET /api/rides/:id
exports.getRideById = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id).populate('postedBy', 'name email');
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    res.json(ride);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc    Update ride status
// @route   PATCH /api/rides/:id
exports.updateRideStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Open','Closed','Completed'].includes(status))
      return res.status(400).json({ message: 'Invalid status' });

    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.host.toString() !== req.user)
      return res.status(403).json({ message: 'Not authorized' });

    ride.status = status;
    await ride.save();
    res.json(ride);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRideHistory = async (req, res) => {
  try {
    const userId = req.user;
    const RideRequest = require('../models/rideRequest.model');
    
    const postedRides = await Ride.find({ postedBy: userId }).populate('postedBy', 'name email');
    const joinedRequests = await RideRequest.find({ requester: userId, status: 'Confirmed' }).populate('ride');
    const joinedRides = joinedRequests.map(request => request.ride);
    
    res.json({ postedRides, joinedRides });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRecommendedRides = async (req, res) => {
  try {
    const userId = req.user;
    const RideRequest = require('../models/rideRequest.model');
    
    const pastRequests = await RideRequest.find({ requester: userId, status: 'Confirmed' }).populate('ride');
    const frequentDestinations = {};
    
    pastRequests.forEach(request => {
      if (request.ride && request.ride.endLocation) {
        const dest = request.ride.endLocation.address;
        frequentDestinations[dest] = (frequentDestinations[dest] || 0) + 1;
      }
    });
    
    const topDestinations = Object.keys(frequentDestinations)
      .sort((a, b) => frequentDestinations[b] - frequentDestinations[a])
      .slice(0, 3);
    
    const recommendedRides = [];
    for (const dest of topDestinations) {
      const rides = await Ride.find({
        'endLocation.address': { $regex: dest, $options: 'i' },
        status: 'Open',
        postedBy: { $ne: userId }
      }).populate('postedBy', 'name email').limit(3);
      recommendedRides.push(...rides);
    }
    
    res.json(recommendedRides);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
