const { sequelize, DeliverySlot, Shop, User, Order, OrderRevenueLog, Location, Penalty, Category, ShopCategory } = require('../models/index');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const AnalyticsService = require('../services/AnalyticsService');

const getAnalytics = catchAsync(async (req, res, next) => {
    const metrics = await AnalyticsService.getPlatformMetrics();
    res.json(metrics);
});

const getShopDetails = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const shop = await Shop.findByPk(id, { include: User });
    if (!shop) return next(new AppError('Shop not found', 404));

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
});

const getCustomerDetails = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return next(new AppError('User not found', 404));

    const orders = await Order.findAll({ 
        where: { customer_id: id },
        include: [{ model: Shop, attributes: ['name'] }],
        order: [['createdAt', 'DESC']]
    });

    const totalSpent = orders.reduce((sum, o) => sum + o.grand_total, 0);

    res.json({ user, orders, totalSpent });
});

// --- Penalties ---

const createPenalty = catchAsync(async (req, res, next) => {
    const { user_id, amount, reason } = req.body;
    const admin_id = req.user.id;

    if (!user_id || !amount || !reason) {
        return next(new AppError('user_id, amount, and reason are required', 400));
    }

    const user = await User.findByPk(user_id);
    if (!user) return next(new AppError('Target user not found', 404));

    const penalty = await Penalty.create({
        user_id,
        admin_id,
        amount,
        reason
    });

    res.status(201).json({ message: 'Penalty issued successfully', penalty });
});

const getPenaltiesByUser = catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    const penalties = await Penalty.findAll({
        where: { user_id: userId },
        include: [
            { model: User, as: 'admin', attributes: ['name', 'email'] }
        ],
        order: [['createdAt', 'DESC']]
    });
    
    res.json(penalties);
});

const getAllPenalties = catchAsync(async (req, res, next) => {
    const penalties = await Penalty.findAll({
        include: [
            { model: User, as: 'user', attributes: ['name', 'email', 'role'] },
            { model: User, as: 'admin', attributes: ['name'] }
        ],
        order: [['createdAt', 'DESC']]
    });
    res.json(penalties);
});



// --- Delivery Slots ---

const getSlots = catchAsync(async (req, res, next) => {
  const slots = await DeliverySlot.findAll({ order: [['start_time', 'ASC']] });
  res.json(slots);
});

const createSlot = catchAsync(async (req, res, next) => {
  const { name, start_time, end_time, cutoff_time } = req.body;
  const newSlot = await DeliverySlot.create({ name, start_time, end_time, cutoff_time });
  res.status(201).json(newSlot);
});

const addLocation = catchAsync(async (req, res, next) => {
  const { name } = req.body;
  if (!name) return next(new AppError('Location name is required', 400));
  const location = await Location.create({ name });
  res.status(201).json(location);
});

const deleteSlot = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    await DeliverySlot.destroy({ where: { id } });
    res.json({ message: 'Slot deleted' });
});

// --- User Management ---

const getUsers = catchAsync(async (req, res, next) => {
    const users = await User.findAll({
        attributes: ['id', 'name', 'mobile_number', 'email', 'role', 'location', 'address', 'is_blocked', 'createdAt']
    });
    res.json(users);
});

const blockUser = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return next(new AppError('User not found', 404));

    // Prevent blocking self (admin)
    if (user.email === 'admin@vaayugo.com' || user.id === req.user.id) {
         return next(new AppError('Cannot block admin account', 400));
    }

    user.is_blocked = !user.is_blocked;
    await user.save();
    res.json({ message: `User ${user.is_blocked ? 'blocked' : 'unblocked'}`, user });
});

// --- Phase 12: Admin Order Override ---

const overrideOrderStatus = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!reason) {
        return next(new AppError('A reason must be provided for an admin override.', 400));
    }

    const validStatuses = ['pending', 'accepted', 'out_for_delivery', 'delivered', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return next(new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400));
    }

    const order = await Order.findByPk(id);
    if (!order) return next(new AppError('Order not found', 404));

    order.cancel_reason = `ADMIN OVERRIDE by User ID ${req.user.id}: ${reason}`;
    order.status = status;
    
    if (['delivered', 'failed', 'cancelled'].includes(status)) {
        order.final_status_locked = true;
        if (status === 'delivered') order.delivered_at = new Date();
        if (status === 'failed') order.failed_at = new Date();
        if (status === 'cancelled') {
            order.cancelled_at = new Date();
            order.cancelled_by = 'admin';
        }
    } else {
        order.final_status_locked = false;
    }

    await order.save();
    console.log(`[AUDIT] Admin ${req.user.id} overrode Order ${id} to status ${status}. Reason: ${reason}`);

    res.json({ message: `Order forcibly updated to ${status} via Admin Override.`, order });
});

// --- Shop Logic ---

const getPendingShops = catchAsync(async (req, res, next) => {
    const shops = await Shop.findAll({ where: { status: 'pending' }, include: User });
    res.json(shops);
});

const getAllShops = catchAsync(async (req, res, next) => {
    const shops = await Shop.findAll({ include: User });
    res.json(shops);
});

const updateShopStatus = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body; // 'approved', 'rejected', 'suspended'
    
    const validStatuses = ['approved', 'rejected', 'suspended', 'pending'];
    if (!validStatuses.includes(status)) {
        return next(new AppError('Invalid status', 400));
    }

    const shop = await Shop.findByPk(id);
    if (!shop) return next(new AppError('Shop not found', 404));

    shop.status = status;
    await shop.save();
    res.json({ message: `Shop status updated to ${status}`, shop });
});

const verifyShop = catchAsync(async (req, res, next) => { 
    const { id } = req.params;
    const shop = await Shop.findByPk(id);
    if (!shop) return next(new AppError('Shop not found', 404));

    shop.status = 'approved';
    await shop.save();
    res.json({ message: 'Shop verified successfully', shop });
});

const rejectShop = catchAsync(async (req, res, next) => { 
    const { id } = req.params;
    const shop = await Shop.findByPk(id);
    if (!shop) return next(new AppError('Shop not found', 404));

    shop.status = 'rejected';
    await shop.save();
    res.json({ message: 'Shop rejected', shop });
});



// --- Category Management ---

const getAllCategories = catchAsync(async (req, res, next) => {
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    res.json(categories);
});

const createCategory = catchAsync(async (req, res, next) => {
    const { name, icon_url } = req.body;
    if (!name) return next(new AppError('Category name is required', 400));
    
    const category = await Category.create({ name, icon_url });
    res.status(201).json(category);
});

const deleteCategory = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const category = await Category.findByPk(id);
    if (!category) return next(new AppError('Category not found', 404));
    
    await category.destroy();
    res.json({ message: 'Category deleted successfully' });
});

module.exports = {
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
