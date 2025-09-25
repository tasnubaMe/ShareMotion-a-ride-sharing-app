const Message = require('../models/message.model');
const Ride = require('../models/ride.model');
const RideRequest = require('../models/rideRequest.model');

exports.getPollingData = async (req, res) => {
  try {
    const userId = req.user;

    const unreadMessages = await Message.find({
      receiver: userId,
      isRead: false
    }).countDocuments();

    const pastRequests = await RideRequest.find({ 
      requester: userId, 
      status: 'Confirmed' 
    }).populate('ride');
    
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
      }).populate('postedBy', 'name email').limit(2);
      recommendedRides.push(...rides);
    }

    const newRequests = await RideRequest.find({
      ride: { 
        $in: await Ride.find({ postedBy: userId }).distinct('_id')
      },
      status: 'Pending'
    }).countDocuments();

    res.json({
      unreadMessages,
      recommendedRides: recommendedRides.slice(0, 5),
      newRequests,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
