const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserByEmail, updateProfile, getProfile } = require('../controllers/auth.controller');
const auth = require('../middleware/auth.middleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/user-by-email/:email', auth, getUserByEmail);
router.get('/profile', auth, getProfile);
router.patch('/profile', auth, updateProfile);

module.exports = router;
