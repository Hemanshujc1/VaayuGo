const { sequelize, ServiceConfig, DeliverySlot, Shop, User, Order, OrderRevenueLog, Location, Penalty, Category, ShopCategory } = require('../models/index');

const getAnalytics = async (req, res) => {
    try {
        const totalUsers = await User.count({ where: { role: 'customer' } });
        const totalShops = await Shop.count({ where: { status: 'approved' } });
        const totalOrders = await Order.count({ where: { status: 'delivered' } });

        const revenueLogMetrics = await OrderRevenueLog.findAll({
            include: [{
                model: Order,
                attributes: [],
                where: { status: 'delivered' }
            }],
            attributes: [
                [sequelize.fn('SUM', sequelize.col('order_value')), 'totalOrderValue'],
                [sequelize.fn('SUM', sequelize.col('applied_delivery_fee')), 'totalDeliveryRevenue'],
                [sequelize.fn('SUM', sequelize.col('commission_amount')), 'totalCommissionRevenue'],
                [sequelize.fn('SUM', sequelize.col('vaayugo_delivery_earned')), 'totalVaayugoDeliveryShare'],
                [sequelize.fn('SUM', sequelize.col('vaayugo_final_earning')), 'totalVaayugoRevenue'],
            ],
            raw: true
        });
        const metrics = revenueLogMetrics[0] || {};

        // Calculate decompositions via JavaScript to avoid SQLite Dialect GROUP BY Prefix issues
        const rawLogs = await OrderRevenueLog.findAll({
            include: [
                {
                    model: Order,
                    where: { status: 'delivered' }
                },
                {
                    model: Shop,
                    include: [{ model: User }]
                }
            ]
        });

        const shopMap = {};
        const categoryMap = {};
        const locationMap = {};
        const dayMap = {};

        rawLogs.forEach(log => {
            const revenue = log.vaayugo_final_earning || 0;
            const shopName = log.Shop?.name || 'Unknown';
            const category = log.Shop?.category || 'General';
            const location = log.Shop?.User?.location || 'Unknown';
            const dateStr = new Date(log.createdAt).toISOString().split('T')[0];

            shopMap[shopName] = (shopMap[shopName] || 0) + revenue;
            categoryMap[category] = (categoryMap[category] || 0) + revenue;
            locationMap[location] = (locationMap[location] || 0) + revenue;
            dayMap[dateStr] = (dayMap[dateStr] || 0) + revenue;
        });

        const revenueByShop = Object.entries(shopMap)
            .map(([shopName, revenue]) => ({ shopName, revenue }))
            .sort((a, b) => b.revenue - a.revenue).slice(0, 10);
            
        const revenueByCategory = Object.entries(categoryMap)
            .map(([category, revenue]) => ({ category, revenue }))
            .sort((a, b) => b.revenue - a.revenue);
            
        const revenueByLocation = Object.entries(locationMap)
            .map(([location, revenue]) => ({ location, revenue }))
            .sort((a, b) => b.revenue - a.revenue);

        const revenueByDay = Object.entries(dayMap)
            .map(([date, revenue]) => ({ date, revenue }))
            .sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 30);

        res.json({
            users: totalUsers,
            shops: totalShops,
            orders: totalOrders,
            totalOrderValue: metrics.totalOrderValue || 0,
            totalDeliveryRevenue: metrics.totalDeliveryRevenue || 0,
            totalCommissionRevenue: metrics.totalCommissionRevenue || 0,
            totalVaayugoDeliveryShare: metrics.totalVaayugoDeliveryShare || 0,
            totalVaayugoRevenue: metrics.totalVaayugoRevenue || 0,
            avgOrderValue: totalOrders > 0 ? ((metrics.totalOrderValue || 0) / totalOrders).toFixed(2) : 0,
            revenuePerOrder: totalOrders > 0 ? ((metrics.totalVaayugoRevenue || 0) / totalOrders).toFixed(2) : 0,
            revenueByShop,
            revenueByCategory,
            revenueByLocation,
            revenueByDay // Simple daily breakdown to power charts or lists
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Analytics Error', error });
    }
};

const getShopDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const shop = await Shop.findByPk(id, { include: User });
        if (!shop) return res.status(404).json({ message: 'Shop not found' });

        const products = await sequelize.models.Product.findAll({ where: { shop_id: id } });
        const orders = await Order.findAll({ 
            where: { shop_id: id },
            include: [
                { model: User, attributes: ['name', 'mobile_number', 'email'] },
                { model: OrderRevenueLog }
            ],
            order: [['createdAt', 'DESC']]
        });

        const shopEarned = orders
            .filter(o => o.status === 'delivered' && o.OrderRevenueLog)
            .reduce((sum, o) => sum + Number(o.OrderRevenueLog.shop_final_earning || 0), 0);

        const vaayugoEarned = orders
            .filter(o => o.status === 'delivered' && o.OrderRevenueLog)
            .reduce((sum, o) => sum + Number(o.OrderRevenueLog.vaayugo_final_earning || 0), 0);

        const totalRevenue = orders
            .filter(o => o.status === 'delivered' && o.OrderRevenueLog)
            .reduce((sum, o) => sum + Number(o.OrderRevenueLog.order_value || o.grand_total || 0), 0); 

        res.json({ shop, products, orders, totalRevenue, shopEarned, vaayugoEarned });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching shop details', error });
    }
};

const getCustomerDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const orders = await Order.findAll({ 
            where: { customer_id: id },
            include: [{ model: Shop, attributes: ['name'] }],
            order: [['createdAt', 'DESC']]
        });

        const totalSpent = orders.reduce((sum, o) => sum + o.grand_total, 0);

        res.json({ user, orders, totalSpent });
    } catch (error) {
         res.status(500).json({ message: 'Error fetching customer details', error });
    }
};

// --- Penalties ---

const createPenalty = async (req, res) => {
    try {
        const { user_id, amount, reason } = req.body;
        const admin_id = req.user.id;

        if (!user_id || !amount || !reason) {
            return res.status(400).json({ message: 'user_id, amount, and reason are required' });
        }

        const user = await User.findByPk(user_id);
        if (!user) return res.status(404).json({ message: 'Target user not found' });

        const penalty = await Penalty.create({
            user_id,
            admin_id,
            amount,
            reason
        });

        res.status(201).json({ message: 'Penalty issued successfully', penalty });
    } catch (error) {
        res.status(500).json({ message: 'Error issuing penalty', error: error.message });
    }
};

const getPenaltiesByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const penalties = await Penalty.findAll({
            where: { user_id: userId },
            include: [
                { model: User, as: 'admin', attributes: ['name', 'email'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        
        res.json(penalties);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching penalties', error: error.message });
    }
};

const getAllPenalties = async (req, res) => {
    try {
        const penalties = await Penalty.findAll({
            include: [
                { model: User, as: 'user', attributes: ['name', 'email', 'role'] },
                { model: User, as: 'admin', attributes: ['name'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(penalties);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching all penalties', error: error.message });
    }
};

// --- Service Configuration ---

const getConfigs = async (req, res) => {
  try {
    const configs = await ServiceConfig.findAll();
    res.json(configs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching configs', error });
  }
};

const upsertConfig = async (req, res) => {
  try {
    const { shop_id, category, min_order_value, delivery_fee, commission_rate, delivery_revenue_share, is_prepaid_only } = req.body;

    // Check if config exists for this specific generic combo
    let config = await ServiceConfig.findOne({ where: { shop_id: shop_id || null, category: category || null } });

    if (config) {
      await config.update({ min_order_value, delivery_fee, commission_rate, delivery_revenue_share, is_prepaid_only });
    } else {
      config = await ServiceConfig.create({ shop_id, category, min_order_value, delivery_fee, commission_rate, delivery_revenue_share, is_prepaid_only });
    }

    res.json({ message: 'Configuration saved', config });
  } catch (error) {
    res.status(500).json({ message: 'Error saving config', error });
  }
};

// --- Delivery Slots ---

const getSlots = async (req, res) => {
  try {
    const slots = await DeliverySlot.findAll({ order: [['start_time', 'ASC']] });
    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching slots', error });
  }
};

const createSlot = async (req, res) => {
  try {
    const { name, start_time, end_time, cutoff_time } = req.body;
    const newSlot = await DeliverySlot.create({ name, start_time, end_time, cutoff_time });
    res.status(201).json(newSlot);
  } catch (error) {
    res.status(500).json({ message: 'Error creating slot', error });
  }
};

const addLocation = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Location name is required' });
    const location = await Location.create({ name });
    res.status(201).json(location);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Location already exists' });
    }
    res.status(500).json({ message: 'Error creating location', error });
  }
};

const deleteSlot = async (req, res) => {
    try {
        const { id } = req.params;
        await DeliverySlot.destroy({ where: { id } });
        res.json({ message: 'Slot deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting slot', error });
    }
}

// --- User Management ---

const getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'name', 'mobile_number', 'email', 'role', 'location', 'address', 'is_blocked', 'createdAt']
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error });
    }
};

const blockUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Prevent blocking self (admin)
        if (user.email === 'admin@vaayugo.com' || user.id === req.user.id) {
             return res.status(400).json({ message: 'Cannot block admin account' });
        }

        user.is_blocked = !user.is_blocked;
        await user.save();
        res.json({ message: `User ${user.is_blocked ? 'blocked' : 'unblocked'}`, user });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user status', error });
    }
};

// --- Phase 12: Admin Order Override ---

const overrideOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        if (!reason) {
            return res.status(400).json({ message: 'A reason must be provided for an admin override.' });
        }

        const validStatuses = ['pending', 'accepted', 'out_for_delivery', 'delivered', 'failed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        const order = await Order.findByPk(id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Audit Trail Setup (We'll use cancel_reason optionally to store the override reason if we don't have a dedicated audit table yet)
        order.cancel_reason = `ADMIN OVERRIDE by User ID ${req.user.id}: ${reason}`;

        // Unlock it conditionally, or just force the state
        order.status = status;
        
        // Re-lock if the new state is a final state
        if (['delivered', 'failed', 'cancelled'].includes(status)) {
            order.final_status_locked = true;
            if (status === 'delivered') order.delivered_at = new Date();
            if (status === 'failed') order.failed_at = new Date();
            if (status === 'cancelled') {
                order.cancelled_at = new Date();
                order.cancelled_by = 'admin';
            }
        } else {
            // Unlocking because it's moved back to an active state
            order.final_status_locked = false;
        }

        await order.save();
        
        console.log(`[AUDIT] Admin ${req.user.id} overrode Order ${id} to status ${status}. Reason: ${reason}`);

        res.json({ message: `Order forcibly updated to ${status} via Admin Override.`, order });
    } catch (error) {
        res.status(500).json({ message: 'Error performing admin override', error: error.message });
    }
};

// --- Shop Logic ---

const getPendingShops = async (req, res) => {
    try {
        const shops = await Shop.findAll({ where: { status: 'pending' }, include: User });
        res.json(shops);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching pending shops', error });
    }
};

const getAllShops = async (req, res) => {
    try {
        const shops = await Shop.findAll({ include: User });
        res.json(shops);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching shops', error });
    }
};

const updateShopStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'approved', 'rejected', 'suspended'
        
        const validStatuses = ['approved', 'rejected', 'suspended', 'pending'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const shop = await Shop.findByPk(id);
        if (!shop) return res.status(404).json({ message: 'Shop not found' });

        shop.status = status;
        await shop.save();
        res.json({ message: `Shop status updated to ${status}`, shop });
    } catch (error) {
        res.status(500).json({ message: 'Error updating shop status', error });
    }
};

const verifyShop = async (req, res) => { // Keeping for backward compatibility if needed, or use updateShopStatus
    try {
        const { id } = req.params;
        const shop = await Shop.findByPk(id);
        if (!shop) return res.status(404).json({ message: 'Shop not found' });

        shop.status = 'approved';
        await shop.save();
        res.json({ message: 'Shop verified successfully', shop });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying shop', error });
    }
};

const rejectShop = async (req, res) => { // Keeping for backward compatibility
    try {
        const { id } = req.params;
        const shop = await Shop.findByPk(id);
        if (!shop) return res.status(404).json({ message: 'Shop not found' });

        shop.status = 'rejected';
        await shop.save();
        res.json({ message: 'Shop rejected', shop });
    } catch (error) {
        res.status(500).json({ message: 'Error rejecting shop', error });
    }
};

const getServiceConfig = async (req, res) => {
    try {
        const { shopId } = req.params;
        const config = await ServiceConfig.findOne({ where: { shop_id: shopId || null } });
        if (!config) return res.status(404).json({ message: 'Config not found' });
        res.json(config);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching config', error });
    }
};

// --- Category Management ---

const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({ order: [['name', 'ASC']] });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories', error });
    }
};

const createCategory = async (req, res) => {
    try {
        const { name, icon_url } = req.body;
        if (!name) return res.status(400).json({ message: 'Category name is required' });
        
        const category = await Category.create({ name, icon_url });
        res.status(201).json(category);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'Category already exists' });
        }
        res.status(500).json({ message: 'Error creating category', error });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findByPk(id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        
        await category.destroy();
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting category', error });
    }
};

module.exports = {
  getConfigs,
  upsertConfig,
  updateServiceConfig: upsertConfig,
  getServiceConfig,
  getDeliverySlots: getSlots, 
  addDeliverySlot: createSlot,
  deleteSlot,
  getPendingShops,
  getAllShops,
  verifyShop,
  rejectShop,
  updateShopStatus,
  getUsers,
  blockUser,
  getAnalytics,
  getShopDetails,
  getCustomerDetails,
  addLocation,
  overrideOrderStatus,
  createPenalty,
  getPenaltiesByUser,
  getAllPenalties,
  getAllCategories,
  createCategory,
  deleteCategory
};
