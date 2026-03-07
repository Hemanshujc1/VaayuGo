const express = require('express');
const { createOrder, getMyOrders, getShopOrders, updateOrderStatus, rateOrder, getOrderById, getAvailableSlots } = require('../controllers/orderController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticateToken);

router.get('/available-slots', getAvailableSlots);
router.post('/', authorizeRole(['customer']), createOrder);
router.get('/my-orders', authorizeRole(['customer']), getMyOrders);
router.post('/:id/rate', authorizeRole(['customer']), rateOrder);
router.get('/shop-orders', authorizeRole(['shopkeeper']), getShopOrders);
router.put('/:id/status', authorizeRole(['shopkeeper', 'customer']), updateOrderStatus);
router.get('/:id', authorizeRole(['customer', 'shopkeeper', 'admin']), getOrderById);

// Note: In production, add specific middleware to strict check 'shopkeeper' role for these routes

module.exports = router;
