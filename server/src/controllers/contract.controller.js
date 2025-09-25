const Contract = require('../models/contract.model');
const Ride = require('../models/ride.model');
const User = require('../models/user.model');

const validateContractData = (data) => {
  const errors = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 3) {
    errors.push('Contract name must be at least 3 characters long');
  }

  if (!Array.isArray(data.memberIds) || data.memberIds.length === 0) {
    errors.push('At least one member is required');
  }

  if (!data.startDate || !data.endDate) {
    errors.push('Start date and end date are required');
  } else {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      errors.push('Invalid date format');
    } else if (startDate < today) {
      errors.push('Start date cannot be in the past');
    } else if (endDate <= startDate) {
      errors.push('End date must be after start date');
    }
  }

  if (!data.totalSeats || typeof data.totalSeats !== 'number' || data.totalSeats < 2 || data.totalSeats > 20) {
    errors.push('Total seats must be between 2 and 20');
  }

  if (!data.route || !data.route.startLocation || !data.route.endLocation) {
    errors.push('Start and end locations are required');
  } else {
    if (!data.route.startLocation.address || typeof data.route.startLocation.address !== 'string' || data.route.startLocation.address.trim().length === 0) {
      errors.push('Start location address is required');
    }
    if (!data.route.endLocation.address || typeof data.route.endLocation.address !== 'string' || data.route.endLocation.address.trim().length === 0) {
      errors.push('End location address is required');
    }
    if (data.route.startLocation.address && data.route.endLocation.address && 
        data.route.startLocation.address.trim().toLowerCase() === data.route.endLocation.address.trim().toLowerCase()) {
      errors.push('Start and end locations cannot be the same');
    }
  }

  if (!Array.isArray(data.weeklySchedule) || data.weeklySchedule.length === 0) {
    errors.push('Weekly schedule is required');
  } else {
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    for (const schedule of data.weeklySchedule) {
      if (!schedule.day || !validDays.includes(schedule.day)) {
        errors.push(`Invalid day in schedule: ${schedule.day}`);
      }
      if (!schedule.time || !timeRegex.test(schedule.time)) {
        errors.push(`Invalid time format in schedule: ${schedule.time}`);
      }
    }
  }

  if (data.memberIds && data.totalSeats && data.memberIds.length > data.totalSeats) {
    errors.push(`Number of members (${data.memberIds.length}) cannot exceed total seats (${data.totalSeats})`);
  }

  return errors;
};

exports.createContract = async (req, res) => {
  try {
    const { name, memberIds, startDate, endDate, totalSeats, autoPostExtraSeats, route, weeklySchedule } = req.body;
    const creatorId = req.user;

    const validationErrors = validateContractData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }

    if (!creatorId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const members = await User.find({ _id: { $in: memberIds } });
    if (members.length !== memberIds.length) {
      const foundIds = members.map(m => m._id.toString());
      const missingIds = memberIds.filter(id => !foundIds.includes(id.toString()));
      return res.status(404).json({ 
        message: 'Some members not found', 
        missingIds 
      });
    }

    const contract = new Contract({
      name: name.trim(),
      members: memberIds,
      creator: creatorId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalSeats: parseInt(totalSeats),
      autoPostExtraSeats: Boolean(autoPostExtraSeats),
      route: {
        startLocation: { address: route.startLocation.address.trim() },
        endLocation: { address: route.endLocation.address.trim() }
      },
      weeklySchedule: weeklySchedule.map(s => ({
        day: s.day,
        time: s.time
      }))
    });

    const savedContract = await contract.save();
    const populatedContract = await Contract.findById(savedContract._id)
      .populate('members', 'name email')
      .populate('creator', 'name email');

    if (autoPostExtraSeats && totalSeats > memberIds.length) {
      try {
        await this.createRecurringRides(savedContract);
      } catch (rideError) {
        console.error('Error creating recurring rides:', rideError);
      }
    }

    res.status(201).json(populatedContract);
  } catch (err) {
    console.error('Contract creation error:', err);
    
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }
    
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Contract with this name already exists' });
    }
    
    res.status(500).json({ 
      message: 'Internal server error occurred while creating contract',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Please try again later'
    });
  }
};

exports.createRecurringRides = async (contract) => {
  try {
    const extraSeats = contract.totalSeats - contract.members.length;
    if (extraSeats <= 0) return;

    const startDate = new Date(contract.startDate);
    const endDate = new Date(contract.endDate);
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const scheduleItem = contract.weeklySchedule.find(s => s.day === dayName);
      
      if (scheduleItem) {
        const [hours, minutes] = scheduleItem.time.split(':');
        const rideDateTime = new Date(date);
        rideDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const ride = new Ride({
          host: contract.creator,
          postedBy: contract.creator,
          startLocation: contract.route.startLocation,
          endLocation: contract.route.endLocation,
          dateTime: rideDateTime,
          basePrice: 0,
          seats: extraSeats,
          status: 'Open',
          isRecurring: true,
          contractId: contract._id
        });

        await ride.save();
      }
    }
  } catch (err) {
    console.error('Error creating recurring rides:', err);
    throw err;
  }
};

exports.getContracts = async (req, res) => {
  try {
    const userId = req.user;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const contracts = await Contract.find({
      members: userId
    })
    .populate('members', 'name email')
    .populate('creator', 'name email')
    .sort({ createdAt: -1 });

    res.json(contracts);
  } catch (err) {
    console.error('Get contracts error:', err);
    res.status(500).json({ 
      message: 'Internal server error occurred while fetching contracts',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Please try again later'
    });
  }
};

exports.getContractById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid contract ID format' });
    }

    const contract = await Contract.findById(id)
      .populate('members', 'name email')
      .populate('creator', 'name email');

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    if (!contract.members.some(member => member._id.toString() === userId)) {
      return res.status(403).json({ message: 'Not authorized to view this contract' });
    }

    res.json(contract);
  } catch (err) {
    console.error('Get contract by ID error:', err);
    res.status(500).json({ 
      message: 'Internal server error occurred while fetching contract',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Please try again later'
    });
  }
};

exports.updateContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, autoPostExtraSeats } = req.body;
    const userId = req.user;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid contract ID format' });
    }

    const contract = await Contract.findById(id);
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    if (contract.creator.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this contract' });
    }

    if (status && !['Active', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    if (status) contract.status = status;
    if (autoPostExtraSeats !== undefined) {
      contract.autoPostExtraSeats = Boolean(autoPostExtraSeats);
      if (autoPostExtraSeats) {
        try {
          await this.createRecurringRides(contract);
        } catch (rideError) {
          console.error('Error creating recurring rides:', rideError);
        }
      }
    }

    await contract.save();
    const updatedContract = await Contract.findById(id)
      .populate('members', 'name email')
      .populate('creator', 'name email');

    res.json(updatedContract);
  } catch (err) {
    console.error('Update contract error:', err);
    res.status(500).json({ 
      message: 'Internal server error occurred while updating contract',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Please try again later'
    });
  }
};

exports.joinContract = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid contract ID format' });
    }

    const contract = await Contract.findById(id);
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    if (contract.members.includes(userId)) {
      return res.status(400).json({ message: 'Already a member of this contract' });
    }

    if (contract.members.length >= contract.totalSeats) {
      return res.status(400).json({ message: 'Contract is full' });
    }

    if (contract.status !== 'Active') {
      return res.status(400).json({ message: 'Cannot join inactive contract' });
    }

    contract.members.push(userId);
    await contract.save();

    const updatedContract = await Contract.findById(id)
      .populate('members', 'name email')
      .populate('creator', 'name email');

    res.json(updatedContract);
  } catch (err) {
    console.error('Join contract error:', err);
    res.status(500).json({ 
      message: 'Internal server error occurred while joining contract',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Please try again later'
    });
  }
};

exports.scheduleRecurringRides = async () => {
  try {
    console.log('Running scheduled recurring rides task...');
    
    const activeContracts = await Contract.find({
      status: 'Active',
      autoPostExtraSeats: true,
      endDate: { $gte: new Date() }
    });

    for (const contract of activeContracts) {
      try {
        const extraSeats = contract.totalSeats - contract.members.length;
        if (extraSeats <= 0) continue;

        const today = new Date();
        const endDate = new Date(contract.endDate);
        
        // Create rides for the next 7 days
        for (let i = 0; i < 7; i++) {
          const targetDate = new Date(today);
          targetDate.setDate(today.getDate() + i);
          
          if (targetDate > endDate) break;
          
          const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
          const scheduleItem = contract.weeklySchedule.find(s => s.day === dayName);
          
          if (scheduleItem) {
            const [hours, minutes] = scheduleItem.time.split(':');
            const rideDateTime = new Date(targetDate);
            rideDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            // Check if ride already exists for this date and contract
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);
            
            const existingRide = await Ride.findOne({
              contractId: contract._id,
              dateTime: {
                $gte: startOfDay,
                $lt: endOfDay
              }
            });
            
            if (!existingRide) {
              const ride = new Ride({
                host: contract.creator,
                postedBy: contract.creator,
                startLocation: contract.route.startLocation,
                endLocation: contract.route.endLocation,
                dateTime: rideDateTime,
                basePrice: 0,
                seats: extraSeats,
                status: 'Open',
                isRecurring: true,
                contractId: contract._id,
                weeklySchedule: [{
                  day: dayName,
                  time: scheduleItem.time
                }]
              });

              await ride.save();
              console.log(`Created recurring ride for contract ${contract.name} on ${dayName} at ${scheduleItem.time}`);
            }
          }
        }
      } catch (contractError) {
        console.error(`Error processing contract ${contract._id}:`, contractError);
      }
    }
    
    console.log('Scheduled recurring rides task completed');
  } catch (err) {
    console.error('Error in scheduled recurring rides task:', err);
  }
};
