const express = require('express');
const router = express.Router();
const { sendMessage, getConversation, getConversations, markAsRead } = require('../controllers/message.controller');
const auth = require('../middleware/auth.middleware');

router.post('/', auth, sendMessage);
router.get('/', auth, getConversations);
router.get('/:userId', auth, getConversation);
router.patch('/:messageId/read', auth, markAsRead);

module.exports = router;
