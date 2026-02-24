const express = require('express');
const { registerShop, getMyShop, toggleShopStatus, uploadShopImages, deleteShopImage, getMyShopAnalytics } = require('../controllers/shopController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');

const router = express.Router();

// Middleware: Require Shopkeeper Role
router.use(authenticateToken, authorizeRole(['shopkeeper']));

router.post('/register', registerShop);
router.get('/my-shop', getMyShop);
router.get('/my-analytics', getMyShopAnalytics);
router.patch('/status', toggleShopStatus);
router.post('/images', uploadShopImages);
router.delete('/images', deleteShopImage);

module.exports = router;
