const express = require('express');
const router = express.Router();
const { 
  getAllUsers, 
  getUserById, 
  warnUser, 
  suspendUser, 
  deleteUser, 
  getAllFeedback, 
  generateActivityReport,
  getAllSOSAlerts 
} = require('../controllers/admin.controller');
const auth = require('../middleware/auth.middleware');
const adminAuth = require('../middleware/admin.middleware');

router.use(auth);
router.use(adminAuth);

router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.post('/users/:id/warn', warnUser);
router.post('/users/:id/suspend', suspendUser);
router.delete('/users/:id', deleteUser);
router.get('/feedback', getAllFeedback);
router.get('/reports/activity', generateActivityReport);
router.get('/sos-alerts', getAllSOSAlerts);

module.exports = router;
