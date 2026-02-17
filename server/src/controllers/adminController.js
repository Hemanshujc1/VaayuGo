const { sequelize, ServiceConfig, DeliverySlot, Shop, User, Order } = require('../models/index');

const getAnalytics = async (req, res) => {
    try {
        const totalUsers = await User.count({ where: { role: 'customer' } });
        const totalShops = await Shop.count({ where: { status: 'approved' } });
        const totalOrders = await Order.count();
        
        const revenueData = await Order.findAll({
            attributes: [
                [sequelize.fn('SUM', sequelize.col('platform_fee')), 'totalPlatformFee'],
                [sequelize.fn('SUM', sequelize.col('grand_total')), 'totalGrossVolume']
            ],
            raw: true
        });

        res.json({
            users: totalUsers,
            shops: totalShops,
            orders: totalOrders,
            revenue: revenueData[0].totalPlatformFee || 0,
            grossVolume: revenueData[0].totalGrossVolume || 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Analytics Error', error });
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
            attributes: ['id', 'username', 'email', 'role', 'is_blocked', 'createdAt']
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
  getAnalytics
};
