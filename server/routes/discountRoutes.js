const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');
const { createDiscount, getDiscounts, toggleDiscount, deleteDiscount, editDiscount } = require('../controllers/discountController');

// All discount management routes require authentication
router.use(authenticateToken);

// Create and Get routes (Available to Admin & Shopkeeper)
router.post('/', authorizeRole(['admin', 'shopkeeper']), createDiscount);
router.get('/', authorizeRole(['admin', 'shopkeeper']), getDiscounts);

// Update and Delete routes
router.put('/:id', authorizeRole(['admin', 'shopkeeper']), editDiscount);
router.put('/:id/toggle', authorizeRole(['admin', 'shopkeeper']), toggleDiscount);
router.delete('/:id', authorizeRole(['admin', 'shopkeeper']), deleteDiscount);

module.exports = router;
