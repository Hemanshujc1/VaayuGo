const express = require('express');
const router = express.Router();
const { calculateCart } = require('../controllers/cartController');

router.post('/calculate', calculateCart);

module.exports = router;
