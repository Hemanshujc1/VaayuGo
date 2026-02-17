const express = require('express');
const { getAllShops, getShopDetails, searchShops } = require('../controllers/publicController');

const router = express.Router();

router.get('/shops', getAllShops);
router.get('/shops/search', searchShops);
router.get('/shops/:id', getShopDetails);

module.exports = router;
