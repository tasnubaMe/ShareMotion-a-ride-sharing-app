const express = require('express');
const router = express.Router();
const { createContract, getContracts, getContractById, updateContract, joinContract } = require('../controllers/contract.controller');
const auth = require('../middleware/auth.middleware');

router.post('/', auth, createContract);
router.get('/', auth, getContracts);
router.get('/:id', auth, getContractById);
router.patch('/:id', auth, updateContract);
router.post('/:id/join', auth, joinContract);

module.exports = router;
