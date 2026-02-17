const express = require('express');
const { 
    getConfigs,
    upsertConfig,
    updateServiceConfig, 
    getServiceConfig, 
    addDeliverySlot, 
    getDeliverySlots,
    deleteSlot,
    verifyShop,
    rejectShop,
    updateShopStatus,
    getPendingShops,
    getAllShops,
    getUsers,
    blockUser,
    getAnalytics
} = require('../controllers/adminController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');

const router = express.Router();

// Middleware: All admin routes require Admin Role
router.use(authenticateToken, authorizeRole(['admin']));

// Config Routes
router.get('/config', getConfigs);
router.post('/config', upsertConfig);
router.get('/config/shop/:shopId', getServiceConfig); // Changed to avoid optional param issue

// Slot Routes
router.get('/slots', getDeliverySlots); // Changed controller
router.post('/slots', addDeliverySlot); // Changed controller
router.delete('/slots/:id', deleteSlot);

// Shop Routes
router.get('/shops/pending', getPendingShops);
router.get('/shops/all', getAllShops);
router.put('/shops/verify/:id', verifyShop);
router.patch('/shops/:id/reject', rejectShop);
router.patch('/shops/:id', updateShopStatus); // Generic Status Update

// User Routes
router.get('/users', getUsers);
router.patch('/users/:id/block', blockUser);

// Analytics Route
router.get('/analytics', getAnalytics); // New analytics route


module.exports = router;
