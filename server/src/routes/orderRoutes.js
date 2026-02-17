const express = require('express');
const { createOrder, getMyOrders, getShopOrders, updateOrderStatus } = require('../controllers/orderController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticateToken); // Any authenticated user can place orders

router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/shop-orders', getShopOrders); // Shopkeeper only
router.put('/:id/status', updateOrderStatus); // Shopkeeper only

// Note: In production, add specific middleware to strict check 'shopkeeper' role for these routes

module.exports = router;
