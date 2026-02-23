const { Shop, User, Product } = require('../models');

// @desc    Get all active shops (Public)
// @route   GET /api/shops
// @access  Public
const getAllShops = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    let whereClause = { is_open: true }; // Only show open shops by default

    // Filter by category
    if (category && category !== 'all') {
      whereClause.category = category;
    }
    
    // Simple search (name or address) using Op.like if we imported Op, 
    // but for now let's keep it simple or assume exact match if exact match isn't desired we need Sequelize Op
    // Let's standard fetch for now, we can add search later
    
    const shops = await Shop.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'category', 'location_address', 'rating', 'image_url', 'images'], // sending safe fields
    });

    res.status(200).json(shops);
  } catch (error) {
    next(error);
  }
};

// @desc    Get shop details by ID (Public)
// @route   GET /api/shops/:id
// @access  Public
const getShopById = async (req, res, next) => {
  try {
    const shop = await Shop.findByPk(req.params.id, {
      attributes: ['id', 'name', 'category', 'location_address', 'rating', 'is_open', 'image_url', 'owner_id', 'images'],
    });

    if (!shop) {
      res.status(404);
      throw new Error('Shop not found');
    }

    res.status(200).json(shop);
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new shop
// @route   POST /api/shops/register
// @access  Private (Shopkeeper only)
const registerShop = async (req, res, next) => {
  try {
    const { name, category, location_address } = req.body;
    const owner_id = req.user.id;

    // Check if user already has a shop
    const shopExists = await Shop.findOne({ where: { owner_id } });
    if (shopExists) {
      res.status(400);
      throw new Error('User already owns a shop');
    }

    const shop = await Shop.create({
      owner_id,
      name,
      category,
      location_address,
      is_open: true,
      is_verified: false, // Default to pending verification
    });

    res.status(201).json({
      message: 'Shop registered successfully',
      shop,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's shop details
// @route   GET /api/shops/my-shop
// @access  Private (Shopkeeper only)
const getMyShop = async (req, res, next) => {
  try {
    const shop = await Shop.findOne({ where: { owner_id: req.user.id } });

    if (!shop) {
      res.status(404);
      throw new Error('Shop not found');
    }

    res.status(200).json(shop);
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle shop availability (Open/Closed)
// @route   PATCH /api/shops/availability
// @access  Private (Shopkeeper only)
const toggleAvailability = async (req, res, next) => {
  try {
    const shop = await Shop.findOne({ where: { owner_id: req.user.id } });

    if (!shop) {
      res.status(404);
      throw new Error('Shop not found');
    }

    shop.is_open = !shop.is_open;
    await shop.save();

    res.status(200).json({
      message: `Shop is now ${shop.is_open ? 'Open' : 'Closed'}`,
      is_open: shop.is_open,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerShop,
  getMyShop,
  toggleAvailability,
  getAllShops,
  getShopById,
};
