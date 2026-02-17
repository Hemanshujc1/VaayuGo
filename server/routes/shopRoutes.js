const express = require('express');
const router = express.Router();
const { registerShop, getMyShop, toggleAvailability, getAllShops, getShopById } = require('../controllers/shopController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All routes are protected and for shopkeepers only (except public list which will be in a separate customer controller or here with different access)
// For now, these are management routes
// Public Routes
// Protected Routes (Shopkeeper)
router.post('/register', protect, authorize('shopkeeper'), registerShop);
router.get('/my-shop', protect, authorize('shopkeeper'), getMyShop);
router.patch('/availability', protect, authorize('shopkeeper'), toggleAvailability);

// Public Routes
router.get('/', getAllShops);
router.get('/:id', getShopById);

module.exports = router;
