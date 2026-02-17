const express = require('express');
const router = express.Router();
const { 
  createOrder, 
  getMyOrders, 
  getShopOrders, 
  updateOrderStatus 
} = require('../controllers/orderController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Customer routes
router.post('/', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);

// Shopkeeper routes
router.get('/shop-orders', protect, authorize('shopkeeper'), getShopOrders);
router.patch('/:id/status', protect, authorize('shopkeeper'), updateOrderStatus);

module.exports = router;
