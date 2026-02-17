const express = require('express');
const { getMyProducts, addProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticateToken, authorizeRole(['shopkeeper']));

router.get('/', getMyProducts);
router.post('/', addProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
