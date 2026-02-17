const express = require('express');
const router = express.Router();
const { 
  getProductsByShop, 
  getMyProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct 
} = require('../controllers/productController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Public routes
router.get('/shop/:shopId', getProductsByShop);

// Shopkeeper routes
router.get('/my-products', protect, authorize('shopkeeper'), getMyProducts);
router.post('/', protect, authorize('shopkeeper'), addProduct);
router.put('/:id', protect, authorize('shopkeeper'), updateProduct);
router.delete('/:id', protect, authorize('shopkeeper'), deleteProduct);

module.exports = router;
