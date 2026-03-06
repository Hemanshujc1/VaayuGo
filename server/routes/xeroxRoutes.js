const express = require('express');
const { calculatePages } = require('../controllers/xeroxController');
const { xeroxUpload } = require('../middlewares/uploadMiddleware');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// Publicly accessible for calculation, but requires login for security
router.post('/calculate-pages', authenticateToken, xeroxUpload, calculatePages);

module.exports = router;
