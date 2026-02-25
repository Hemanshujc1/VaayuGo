const express = require('express');
const { getAllShops, getShopDetails, searchShops, getAllLocations, getAllCategories } = require('../controllers/publicController');

const router = express.Router();

router.get('/shops', getAllShops);
router.get('/shops/search', searchShops);
router.get('/shops/:id', getShopDetails);
router.get('/locations', getAllLocations);
router.get('/categories', getAllCategories);

module.exports = router;
