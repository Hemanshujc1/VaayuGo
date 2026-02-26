const express = require('express');
const { registerShop, getMyShop, toggleShopStatus, uploadShopImages, deleteShopImage, getMyShopAnalytics, updateShopProfile } = require('../controllers/shopController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');

const router = express.Router();

// Middleware: Require Shopkeeper Role
router.use(authenticateToken, authorizeRole(['shopkeeper']));

const { uploadShopImages: uploadShopImagesMiddleware } = require('../middlewares/uploadMiddleware');

router.post('/register', registerShop);
router.get('/my-shop', getMyShop);
router.get('/my-analytics', getMyShopAnalytics);
router.patch('/status', toggleShopStatus);
router.post('/images', uploadShopImagesMiddleware, uploadShopImages);
router.delete('/images', deleteShopImage);
router.put('/profile', updateShopProfile);

module.exports = router;
