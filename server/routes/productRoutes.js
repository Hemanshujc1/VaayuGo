const express = require('express');
const { getMyProducts, addProduct, updateProduct, deleteProduct, uploadProductImages, deleteProductImage, bulkUploadProducts } = require('../controllers/productController');

const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');
const { uploadProductBulk } = require('../middlewares/uploadMiddleware');

const router = express.Router();

// Bulk upload allows both shopkeepers and admins
router.post('/bulk-upload', authenticateToken, authorizeRole(['shopkeeper', 'admin']), uploadProductBulk, bulkUploadProducts);

// Other routes remain strictly shopkeeper
router.use(authenticateToken, authorizeRole(['shopkeeper']));

router.get('/', getMyProducts);
router.post('/', addProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.post('/:id/images', uploadProductBulk, uploadProductImages);
router.delete('/:id/images', deleteProductImage);


module.exports = router;
