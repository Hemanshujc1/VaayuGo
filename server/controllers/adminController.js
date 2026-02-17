const { User, Shop, Order, Product, Config, Penalty, Location, ServiceConfig } = require('../models');

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getAdminStats = async (req, res, next) => {
  try {
    // 1. Total Users (Customers vs Shopkeepers)
    const totalCustomers = await User.count({ where: { role: 'customer' } });
    const totalShopkeepers = await User.count({ where: { role: 'shopkeeper' } });

    // 2. Total Shops
    const totalShops = await Shop.count();
    const pendingShops = await Shop.count({ where: { is_verified: false } });

    // 3. Orders Stats
    const totalOrders = await Order.count();
    const completedOrders = await Order.count({ where: { status: 'completed' } });
    
    // 4. Total Revenue (Sum of total_amount from completed orders)
    // Note: In Sequelize, aggregation returns different structures based on version/dialect.
    // Simplifying logic: Fetch all completed orders and sum manually for now (safe for MVP)
    // For Production: Use Order.sum('total_amount', { where: { status: 'completed' } })
    const revenueOrders = await Order.findAll({ 
      where: { status: 'completed' },
      attributes: ['total_amount']
    });
    const totalRevenue = revenueOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);

    // 5. Recent Orders (Last 5)
    const recentOrders = await Order.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Shop, attributes: ['name'] },
        { model: User, attributes: ['username'] }
      ]
    });

    res.status(200).json({
      users: {
        customers: totalCustomers,
        shopkeepers: totalShopkeepers
      },
      shops: {
        total: totalShops,
        pending: pendingShops
      },
      orders: {
        total: totalOrders,
        completed: completedOrders
      },
      financials: {
        totalRevenue: totalRevenue.toFixed(2)
      },
      recentActivity: recentOrders
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get System Config
// @route   GET /api/admin/config
const getConfig = async (req, res, next) => {
  try {
    const config = await Config.findAll();
    const configMap = {};
    config.forEach(item => {
      configMap[item.key] = item.value;
    });
    res.json(configMap);
  } catch (error) {
    next(error);
  }
};

// @desc    Update System Config
// @route   POST /api/admin/config
const updateConfig = async (req, res, next) => {
  try {
    const updates = req.body; // { 'delivery_fee': '50', 'platform_fee': '10' }
    
    // Validate or Iterate keys
    for (const [key, value] of Object.entries(updates)) {
      await Config.upsert({
        key,
        value: String(value)
      });
    }

    res.json({ message: 'Configuration updated' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Users
// @route   GET /api/admin/users
const getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const whereClause = role ? { role } : {};

    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Block/Unblock User
// @route   PATCH /api/admin/users/:id/block
const toggleBlockUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.role === 'admin') {
      res.status(403);
      throw new Error('Cannot block an admin');
    }

    user.is_blocked = !user.is_blocked;
    await user.save();

    res.json({ message: `User ${user.is_blocked ? 'blocked' : 'unblocked'}` });
  } catch (error) {
    next(error);
  }
};
// @desc    Get All Shops
// @route   GET /api/admin/shops
// @access  Private (Admin)
const getAllShops = async (req, res, next) => {
  try {
    const shops = await Shop.findAll({
      include: [
        { model: User, attributes: ['username', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(shops);
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Shop
// @route   PATCH /api/admin/shops/:id/verify
const verifyShop = async (req, res, next) => {
  try {
    const shop = await Shop.findByPk(req.params.id);
    if (!shop) {
      res.status(404);
      throw new Error('Shop not found');
    }

    shop.is_verified = true;
    shop.status = 'active'; // Also activate shop upon verification
    await shop.save();

    res.json({ message: 'Shop verified successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Suspend/Activate Shop
// @route   PATCH /api/admin/shops/:id/suspend
const suspendShop = async (req, res, next) => {
  try {
    const { status } = req.body; // 'suspended' or 'active'
    const shop = await Shop.findByPk(req.params.id);
    
    if (!shop) {
      res.status(404);
      throw new Error('Shop not found');
    }

    if (!['suspended', 'active'].includes(status)) {
        res.status(400);
        throw new Error('Invalid status');
    }

    shop.status = status;
    shop.is_open = status === 'active'; // Close shop if suspended
    await shop.save();

    res.json({ message: `Shop ${status}` });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Penalties
// @route   GET /api/admin/penalties
const getPenalties = async (req, res, next) => {
    try {
        const penalties = await Penalty.findAll({
            include: [{ model: Shop, attributes: ['name'] }],
            order: [['createdAt', 'DESC']]
        });
        res.json(penalties);
    } catch (error) {
        next(error);
    }
};

// @desc    Create Penalty
// @route   POST /api/admin/penalties
const createPenalty = async (req, res, next) => {
    try {
        const { shop_id, amount, reason } = req.body;
        const penalty = await Penalty.create({
            shop_id,
            amount,
            reason,
            status: 'unpaid'
        });
        res.status(201).json(penalty);
    } catch (error) {
        next(error);
    }
};

// @desc    Get Analytics
// @route   GET /api/admin/analytics
const getAnalytics = async (req, res, next) => {
    try {
        // Mock analytics for MVP, or implement aggregations
        // Real implementation would accept date range filters
        const totalRevenue = await Order.sum('total_amount', { where: { status: 'completed' } }) || 0;
        const totalOrders = await Order.count();
        const pendingPenalties = await Penalty.sum('amount', { where: { status: 'unpaid' } }) || 0;
        
        // Top 5 Shops by Order Count
        // Sequelize complex query omitted for brevity, returning dummy or simple list
        const topShops = await Shop.findAll({ limit: 5 }); 

        res.json({
            revenue: totalRevenue,
            orders: totalOrders,
            pending_penalties: pendingPenalties,
            top_shops: topShops
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get Shop Details (Products, Orders, Stats)
// @route   GET /api/admin/shops/:id
const getShopDetails = async (req, res, next) => {
    try {
        const shopId = req.params.id;

        // 1. Fetch Shop Info
        const shop = await Shop.findByPk(shopId, {
            include: [{ model: User, attributes: ['username', 'email'] }]
        });

        if (!shop) {
            res.status(404);
            throw new Error('Shop not found');
        }

        // 2. Fetch Products
        const products = await Product.findAll({
            where: { shop_id: shopId }
        });

        // 3. Fetch Orders
        const orders = await Order.findAll({
            where: { shop_id: shopId },
            include: [{ model: User, attributes: ['username'] }],
            order: [['createdAt', 'DESC']]
        });

        // 4. Calculate Stats
        // Revenue = Sum of total_amount for completed orders
        const completedOrders = orders.filter(o => o.status === 'completed');
        const totalRevenue = completedOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
        
        // Split Logic (80/20 Placeholder)
        // In real world, this would use a Commission Rate from Config or Shop model
        const shopkeeperRevenue = totalRevenue * 0.8;
        const adminRevenue = totalRevenue * 0.2;

        res.json({
            shop,
            products,
            orders,
            stats: {
                totalRevenue: totalRevenue.toFixed(2),
                shopkeeperRevenue: shopkeeperRevenue.toFixed(2),
                adminRevenue: adminRevenue.toFixed(2),
                totalOrders: orders.length,
                completedOrders: completedOrders.length
            }
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get Customer Details (Info, Orders)
// @route   GET /api/admin/users/:id
const getCustomerDetails = async (req, res, next) => {
    try {
        const userId = req.params.id;

        // 1. Fetch User Info
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        // 2. Fetch Orders
        const orders = await Order.findAll({
            where: { customer_id: userId },
            include: [{ model: Shop, attributes: ['name'] }],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            user,
            orders
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get All Locations
// @route   GET /api/admin/locations
const getLocations = async (req, res, next) => {
    try {
        const locations = await Location.findAll({
            order: [['name', 'ASC']]
        });
        res.json(locations);
    } catch (error) {
        next(error);
    }
};

// @desc    Add New Location
// @route   POST /api/admin/locations
const addLocation = async (req, res, next) => {
    try {
        const { name } = req.body;
        if (!name) {
            res.status(400);
            throw new Error('Location name is required');
        }
        
        const existing = await Location.findOne({ where: { name } });
        if (existing) {
            res.status(400);
            throw new Error('Location already exists');
        }

        const location = await Location.create({ name });
        res.status(201).json(location);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete Location
// @route   DELETE /api/admin/locations/:id
const deleteLocation = async (req, res, next) => {
    try {
        const location = await Location.findByPk(req.params.id);
        if (!location) {
            res.status(404);
            throw new Error('Location not found');
        }

        await location.destroy();
        res.json({ message: 'Location deleted' });
    } catch (error) {
        next(error);
    }
};

// @desc    Get Service Config
// @route   GET /api/admin/service-config
const getServiceConfig = async (req, res, next) => {
    try {
        const { location_id, category } = req.query;
        
        if (!location_id || !category) {
            res.status(400);
            throw new Error('Location ID and Category are required');
        }

        const config = await ServiceConfig.findOne({
            where: { location_id, category }
        });

        res.json(config || {}); // Return empty object if not found (frontend should handle defaults)
    } catch (error) {
        next(error);
    }
};

// @desc    Update Service Config
// @route   POST /api/admin/service-config
const updateServiceConfig = async (req, res, next) => {
    try {
        const { 
            location_id, 
            category, 
            min_order_type,
            min_order_value,
            min_order_range_min,
            min_order_range_max,
            delivery_tiers_instant,
            delivery_tiers_scheduled,
            commission_rate
        } = req.body;

        if (!location_id || !category) {
            res.status(400);
            throw new Error('Location ID and Category are required');
        }

        const [config, created] = await ServiceConfig.upsert({
            location_id,
            category,
            min_order_type,
            min_order_value,
            min_order_range_min,
            min_order_range_max,
            delivery_tiers_instant,
            delivery_tiers_scheduled,
            commission_rate
        });

        res.json(config);
    } catch (error) {
        next(error);
    }
};

module.exports = {
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
  getShopDetails,
  getCustomerDetails,
  getLocations,
  addLocation,
  deleteLocation,
  getServiceConfig,
  updateServiceConfig
};
