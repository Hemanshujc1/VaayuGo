const express = require('express');
const router = express.Router();
const { calculateCart } = require('../controllers/cartController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.post('/calculate', authenticateToken, calculateCart);

module.exports = router;

