const express = require('express');
const router = express.Router();
const { 
  createSOSAlert, 
  getUserSOSAlerts, 
  updateSOSStatus, 
  shareLiveLocation 
} = require('../controllers/sos.controller');
const auth = require('../middleware/auth.middleware');

router.post('/', auth, createSOSAlert);
router.get('/user', auth, getUserSOSAlerts);
router.patch('/:id', auth, updateSOSStatus);
router.post('/share-location', auth, shareLiveLocation);

module.exports = router;
