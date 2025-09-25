const express = require('express');
const router = express.Router();
const { getPollingData } = require('../controllers/polling.controller');
const auth = require('../middleware/auth.middleware');

router.get('/data', auth, getPollingData);

module.exports = router;
