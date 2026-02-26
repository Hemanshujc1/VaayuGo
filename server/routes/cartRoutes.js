const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');

router.post('/calculate', authenticateToken, calculateCart);

module.exports = router;
