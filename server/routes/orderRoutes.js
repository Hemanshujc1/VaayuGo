const express = require('express');
const { createOrder, getMyOrders, getShopOrders, updateOrderStatus, rateOrder } = require('../controllers/orderController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticateToken); // Any authenticated user can place orders

router.post('/', authorizeRole(['customer']), createOrder);
router.get('/my-orders', authorizeRole(['customer']), getMyOrders);
router.post('/:id/rate', authorizeRole(['customer']), rateOrder);
router.get('/shop-orders', authorizeRole(['shopkeeper']), getShopOrders);
router.put('/:id/status', authorizeRole(['shopkeeper']), updateOrderStatus);

// Note: In production, add specific middleware to strict check 'shopkeeper' role for these routes

module.exports = router;
