const express = require('express');
const { registerShop, getMyShop } = require('../controllers/shopController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');

const router = express.Router();

// Middleware: Require Shopkeeper Role
router.use(authenticateToken, authorizeRole(['shopkeeper']));

router.post('/register', registerShop);
router.get('/my-shop', getMyShop);

module.exports = router;
