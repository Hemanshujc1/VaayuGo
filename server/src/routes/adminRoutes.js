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
    getAnalytics,
    getShopDetails,
    getCustomerDetails,
    addLocation,
    overrideOrderStatus, // Added for Phase 12
    createPenalty,
    getPenaltiesByUser,
    getAllPenalties,
    getAllCategories,
    createCategory,
    deleteCategory
} = require('../controllers/adminController');
const {
    getDeliveryRules,
    createDeliveryRule,
    updateDeliveryRule,
    deleteDeliveryRule
} = require('../controllers/adminRulesController');
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
router.get('/shops/:id', getShopDetails); // New Route

// User Routes
router.get('/users', getUsers);
router.get('/customers/:id', getCustomerDetails); // New Route
router.patch('/users/:id/block', blockUser);

// Order Override Route
router.put('/orders/:id/override-status', overrideOrderStatus);

// Analytics Route
router.get('/analytics', getAnalytics); // New analytics route

// Penalty Routes
router.post('/penalties', createPenalty);
router.get('/penalties', getAllPenalties);
router.get('/users/:userId/penalties', getPenaltiesByUser);

router.get('/delivery-rules', getDeliveryRules);
router.post('/delivery-rules', createDeliveryRule);
router.put('/delivery-rules/:id', updateDeliveryRule);
router.delete('/delivery-rules/:id', deleteDeliveryRule);

// Locations Route
router.post('/locations', addLocation);

// Category Routes
router.get('/categories', getAllCategories);
router.post('/categories', createCategory);
router.delete('/categories/:id', deleteCategory);

module.exports = router;
