const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getConfig,
  updateConfig,
  getUsers,
  toggleBlockUser,
  getAllShops,
  verifyShop,
  suspendShop,
  getPenalties,
  createPenalty,
  getAnalytics,
  getShopDetails,
  getCustomerDetails,
  getLocations,
  addLocation,
  deleteLocation,
  getServiceConfig,
  updateServiceConfig
} = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All routes here are for Admin only
router.use(protect);
router.use(authorize('admin'));

console.log('Loading Admin Routes...');

// All routes here are for Admin only
router.use(protect);
router.use(authorize('admin'));

// Analytics Routes
router.get('/analytics', getAnalytics);

router.get('/stats', getAdminStats);

// Config Routes
router.get('/config', getConfig);
router.post('/config', updateConfig);

// Location Routes
router.get('/locations', getLocations);
router.post('/locations', addLocation);
router.delete('/locations/:id', deleteLocation);

// Service Config Routes
router.get('/service-config', getServiceConfig);
router.post('/service-config', updateServiceConfig);

// User Management Routes
router.get('/users', getUsers);
router.get('/users/:id', getCustomerDetails);
router.patch('/users/:id/block', toggleBlockUser);

// Shop Management Routes


console.log('Loading Admin Routes...');
console.log('getAnalytics type:', typeof getAnalytics);
console.log('getPenalties type:', typeof getPenalties);

router.get('/shops', getAllShops);
router.get('/shops/:id', getShopDetails);
router.patch('/shops/:id/verify', verifyShop);
router.patch('/shops/:id/suspend', suspendShop);

// Penalty Routes
router.get('/penalties', getPenalties);
router.post('/penalties', createPenalty);



module.exports = router;
