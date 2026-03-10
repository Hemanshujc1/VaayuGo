const { sequelize, DeliverySlot, Shop, User, Order, OrderRevenueLog, Location, Penalty, Category, ShopCategory, DiscountRule, Settlement } = require('../models/index');
const { Op } = require('sequelize');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const AnalyticsService = require('../services/AnalyticsService');
const EmailService = require('../services/EmailService');

const getAnalytics = catchAsync(async (req, res, next) => {
    const metrics = await AnalyticsService.getPlatformMetrics();
    res.json(metrics);
});

const getShopDetails = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const shop = await Shop.findByPk(id, { include: User });
    if (!shop) return next(new AppError('Shop not found', 404));

    // Fetch orders internally just for metrics calculations, but do not send them to the frontend payload
    const orders = await Order.findAll({ 
        where: { shop_id: id },
        include: [
            { model: User, attributes: ['name', 'mobile_number', 'email'] },
            { model: OrderRevenueLog }
        ],
        order: [['createdAt', 'DESC']]
    });

    const Decimal = require('decimal.js');
    const round2 = (val) => val.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();

    let metrics = {
        // SALES
        shopGmv: new Decimal(0),
        shopNetGmv: new Decimal(0),
        totalCompletedOrders: 0,
        aov: 0,
        // PLATFORM REVENUE FROM THIS SHOP
        totalCommission: new Decimal(0),
        deliveryRevenuePlatformShare: new Decimal(0),
        smallOrderRevenuePlatformShare: new Decimal(0),
        grossPlatformRevenue: new Decimal(0),
        platformDiscounts: new Decimal(0),
        netPlatformRevenue: new Decimal(0),
        // SHOP EARNINGS
        shopNetSale: new Decimal(0),
        totalShopDiscounts: new Decimal(0),
        commissionDeducted: new Decimal(0),
        deliveryRevenueShopShare: new Decimal(0),
        smallOrderRevenueShopShare: new Decimal(0),
        shopGrossRevenue: new Decimal(0),
        shopNetRevenueFinalSettlement: new Decimal(0),
    };

    orders.forEach(o => {
        if (o.status === 'delivered' && o.OrderRevenueLog) {
            metrics.totalCompletedOrders++;
            const log = o.OrderRevenueLog;

            const subtotal = new Decimal(log.subtotal || 0);
            const prodDisc = new Decimal(log.product_discount_amount || 0);
            const shopDisc = new Decimal(log.shop_discount_amount || 0);
            const platDisc = new Decimal(log.platform_discount_amount || 0);

            metrics.shopGmv = metrics.shopGmv.plus(subtotal.minus(prodDisc));
            metrics.shopNetGmv = metrics.shopNetGmv.plus(
                subtotal.minus(prodDisc).minus(shopDisc).minus(platDisc)
            );

            metrics.totalCommission = metrics.totalCommission.plus(log.commission_deducted || 0);
            metrics.deliveryRevenuePlatformShare = metrics.deliveryRevenuePlatformShare.plus(log.platform_delivery_share || 0);
            metrics.smallOrderRevenuePlatformShare = metrics.smallOrderRevenuePlatformShare.plus(log.platform_small_order_share || 0);
            metrics.platformDiscounts = metrics.platformDiscounts.plus(log.platform_discount_amount || 0);

            metrics.shopNetSale = metrics.shopNetSale.plus(
                new Decimal(log.subtotal || 0).minus(shopDisc)
            );
            metrics.totalShopDiscounts = metrics.totalShopDiscounts.plus(shopDisc);
            metrics.commissionDeducted = metrics.commissionDeducted.plus(log.commission_deducted || 0);
            metrics.deliveryRevenueShopShare = metrics.deliveryRevenueShopShare.plus(log.shop_delivery_share || 0);
            metrics.smallOrderRevenueShopShare = metrics.smallOrderRevenueShopShare.plus(log.shop_small_order_share || 0);
        }
    });

    metrics.aov = metrics.totalCompletedOrders > 0 
        ? round2(metrics.shopNetGmv.dividedBy(metrics.totalCompletedOrders)) 
        : 0;

    metrics.grossPlatformRevenue = metrics.totalCommission.plus(metrics.deliveryRevenuePlatformShare).plus(metrics.smallOrderRevenuePlatformShare);
    metrics.netPlatformRevenue = metrics.grossPlatformRevenue.minus(metrics.platformDiscounts);

    metrics.shopGrossRevenue = metrics.shopNetSale.plus(metrics.deliveryRevenueShopShare).plus(metrics.smallOrderRevenueShopShare);
    metrics.shopNetRevenueFinalSettlement = metrics.shopGrossRevenue.minus(metrics.commissionDeducted);

    metrics = {
        shopGmv: round2(metrics.shopGmv),
        shopNetGmv: round2(metrics.shopNetGmv),
        totalCompletedOrders: metrics.totalCompletedOrders,
        aov: metrics.aov,
        
        totalCommission: round2(metrics.totalCommission),
        deliveryRevenuePlatformShare: round2(metrics.deliveryRevenuePlatformShare),
        smallOrderRevenuePlatformShare: round2(metrics.smallOrderRevenuePlatformShare),
        grossPlatformRevenue: round2(metrics.grossPlatformRevenue),
        platformDiscounts: round2(metrics.platformDiscounts),
        netPlatformRevenue: round2(metrics.netPlatformRevenue),
        
        shopNetSale: round2(metrics.shopNetSale),
        totalShopDiscounts: round2(metrics.totalShopDiscounts),
        commissionDeducted: round2(metrics.commissionDeducted),
        deliveryRevenueShopShare: round2(metrics.deliveryRevenueShopShare),
        smallOrderRevenueShopShare: round2(metrics.smallOrderRevenueShopShare),
        shopGrossRevenue: round2(metrics.shopGrossRevenue),
        shopNetRevenueFinalSettlement: round2(metrics.shopNetRevenueFinalSettlement),
    };

    res.json({ shop, metrics });
});

const getShopProducts = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const products = await sequelize.models.Product.findAll({ 
        where: { shop_id: id },
        order: [['createdAt', 'DESC']]
    });

    const productIds = products.map(p => p.id);
    const discounts = await DiscountRule.findAll({
        where: { 
            is_active: true,
            [Op.or]: [
                { target_type: 'SHOP', target_id: id },
                { target_type: 'PRODUCT', target_id: { [Op.in]: productIds } }
            ],
            // Only current valid discounts
            [Op.and]: [
                { [Op.or]: [{ valid_from: { [Op.lte]: new Date() } }, { valid_from: null }] },
                { [Op.or]: [{ valid_until: { [Op.gte]: new Date() } }, { valid_until: null }] }
            ]
        }
    });

    res.json({ products, discounts });
});

const getShopOrders = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const orders = await Order.findAll({ 
        where: { shop_id: id },
        include: [
            { model: User, attributes: ['name', 'mobile_number', 'email'] },
            { model: OrderRevenueLog }
        ],
        order: [['createdAt', 'DESC']]
    });
    res.json(orders);
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
    const { target_type, target_id, amount, reason } = req.body;
    const admin_id = req.user.id;

    if (!target_type || !target_id || !amount || !reason) {
        return next(new AppError('target_type, target_id, amount, and reason are required', 400));
    }

    if (!['customer', 'shopkeeper'].includes(target_type)) {
        return next(new AppError('Invalid target_type. Must be customer or shopkeeper', 400));
    }

    // Verify target exists
    if (target_type === 'customer') {
        const user = await User.findByPk(target_id);
        if (!user) return next(new AppError('Target customer not found', 404));
    } else {
        const shop = await Shop.findByPk(target_id);
        if (!shop) return next(new AppError('Target shop not found', 404));
    }

    const penalty = await Penalty.create({
        target_type,
        target_id,
        admin_id,
        amount,
        reason
    });

    // Send email notification (integration with EmailService)
    try {
        let recipientEmail = '';
        if (target_type === 'customer') {
            const user = await User.findByPk(target_id);
            recipientEmail = user.email;
        } else {
            const shop = await Shop.findByPk(target_id, { include: User });
            recipientEmail = shop.User.email;
        }
        
        if (recipientEmail) {
            await EmailService.sendPenaltyNotification(recipientEmail, amount, reason);
        }
    } catch (err) {
        console.error('Failed to send penalty email:', err);
    }

    res.status(201).json({ message: 'Penalty issued successfully', penalty });
});

const getPenaltiesByUser = catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    const penalties = await Penalty.findAll({
        where: { target_id: userId, target_type: 'customer' },
        include: [
            { model: User, as: 'admin', attributes: ['name', 'email'] }
        ],
        order: [['createdAt', 'DESC']]
    });
    
    res.json(penalties);
});

const getAllPenalties = catchAsync(async (req, res, next) => {
    const { status, target_type, target_id } = req.query;
    const where = {};
    if (status) where.status = status;
    if (target_type) where.target_type = target_type;
    if (target_id) where.target_id = target_id;

    const penalties = await Penalty.findAll({
        where,
        include: [
            { model: User, as: 'admin', attributes: ['name'] }
        ],
        order: [['createdAt', 'DESC']]
    });

    // Manual inclusion of user/shop details due to polymorphic-like structure
    const enrichedPenalties = await Promise.all(penalties.map(async (p) => {
        const plain = p.get({ plain: true });
        if (p.target_type === 'customer') {
            const user = await User.findByPk(p.target_id, { attributes: ['name', 'email'] });
            plain.target = user;
        } else {
            const shop = await Shop.findByPk(p.target_id, { attributes: ['name'] });
            plain.target = shop;
        }
        return plain;
    }));

    res.json(enrichedPenalties);
});

const reversePenalty = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const penalty = await Penalty.findByPk(id);

    if (!penalty) return next(new AppError('Penalty not found', 404));
    if (penalty.status !== 'pending') {
        return next(new AppError(`Cannot reverse a penalty that is already ${penalty.status}`, 400));
    }

    penalty.status = 'reversed';
    penalty.is_reversed = true;
    await penalty.save();

    res.json({ message: 'Penalty reversed successfully', penalty });
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
    const { 
        page = 1, 
        limit = 10, 
        search = '', 
        status = '', 
        category_id = '', 
        sort = 'newest' 
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Build Where Clause
    const where = {};
    if (status) where.status = status;
    if (category_id) where.category = category_id;
    
    const categoryInclude = { 
        model: Category, 
        attributes: ['id', 'name'],
        through: { attributes: [] }
    };

    const include = [
        { model: User, attributes: ['id', 'mobile_number', 'email', 'name', 'location'] },
        categoryInclude
    ];

    if (search) {
        where[Op.or] = [
            { name: { [Op.like]: `%${search}%` } },
            { '$User.name$': { [Op.like]: `%${search}%` } },
            { '$User.email$': { [Op.like]: `%${search}%` } },
            { '$User.mobile_number$': { [Op.like]: `%${search}%` } }
        ];
    }

    // Sorting
    let order = [['createdAt', 'DESC']];
    if (sort === 'oldest') order = [['createdAt', 'ASC']];
    if (sort === 'name_asc') order = [['name', 'ASC']];
    if (sort === 'name_desc') order = [['name', 'DESC']];

    const { count, rows: shops } = await Shop.findAndCountAll({
        where,
        include,
        order,
        limit: parseInt(limit),
        offset: parseInt(offset),
        distinct: true,
        subQuery: false
    });

    res.json({
        shops,
        totalCount: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page)
    });
});

const updateShopStatus = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body; // 'approved', 'rejected', 'suspended'
    
    const validStatuses = ['approved', 'rejected', 'suspended', 'pending'];
    if (!validStatuses.includes(status)) {
        return next(new AppError('Invalid status', 400));
    }

    const shop = await Shop.findByPk(id, { include: User });
    if (!shop) return next(new AppError('Shop not found', 404));

    const oldStatus = shop.status;
    shop.status = status;
    await shop.save();

    // Trigger emails based on status change
    if (shop.User && shop.User.email) {
        if (oldStatus !== 'approved' && status === 'approved') {
            EmailService.sendShopApproved(shop.User.email).catch(console.error);
        } else if (oldStatus !== 'rejected' && status === 'rejected') {
            const reason = req.body.reason || "Application did not meet our current requirements.";
            EmailService.sendShopRejected(shop.User.email, reason).catch(console.error);
        }
    }

    res.json({ message: `Shop status updated to ${status}`, shop });
});

const verifyShop = catchAsync(async (req, res, next) => { 
    const { id } = req.params;
    const shop = await Shop.findByPk(id, { include: User });
    if (!shop) return next(new AppError('Shop not found', 404));

    shop.status = 'approved';
    await shop.save();

    // Trigger Approval Email
    if (shop.User && shop.User.email) {
        EmailService.sendShopApproved(shop.User.email).catch(console.error);
    }

    res.json({ message: 'Shop verified successfully', shop });
});

const rejectShop = catchAsync(async (req, res, next) => { 
    const { id } = req.params;
    const { reason } = req.body;
    
    const shop = await Shop.findByPk(id, { include: User });
    if (!shop) return next(new AppError('Shop not found', 404));

    shop.status = 'rejected';
    await shop.save();

    // Trigger Rejection Email
    if (shop.User && shop.User.email) {
        EmailService.sendShopRejected(shop.User.email, reason || "No specific reason provided.").catch(console.error);
    }

    res.json({ message: 'Shop rejected', shop });
});



// --- Category Management ---

const getAllCategories = catchAsync(async (req, res, next) => {
    const categories = await Category.findAll({
        order: [['name', 'ASC']]
    });
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
 
// --- Settlements ---

const getSettlements = catchAsync(async (req, res, next) => {
    const settlements = await Settlement.findAll({
        include: [{ model: Shop, attributes: ['name', 'id'] }],
        order: [['createdAt', 'DESC']]
    });
    console.log(`[DEBUG] getSettlements returning ${settlements.length} items`);
    res.json(settlements);
});

const updateSettlementStatus = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body; // 'completed', 'disputed'

    const validStatuses = ['pending', 'completed', 'failed', 'disputed'];
    if (!validStatuses.includes(status)) {
        return next(new AppError('Invalid status', 400));
    }

    const settlement = await Settlement.findByPk(id);
    if (!settlement) return next(new AppError('Settlement not found', 404));

    settlement.status = status;
    await settlement.save();
    res.json({ message: `Settlement status updated to ${status}`, settlement });
});

const triggerSettlementManually = catchAsync(async (req, res, next) => {
    const { shop_id, start_date, end_date } = req.body;
    const SettlementService = require('../services/SettlementService');

    let startDate, endDate;
    if (start_date && end_date) {
        startDate = new Date(start_date);
        endDate = new Date(end_date);
    } else {
        const range = SettlementService.getPreviousWeekRange();
        startDate = range.startDate;
        endDate = range.endDate;
    }

    if (shop_id) {
        const settlement = await SettlementService.calculateWeeklySettlement(shop_id, startDate, endDate);
        return res.json({ message: 'Settlement calculated', settlement });
    }

    const shops = await Shop.findAll({ where: { status: 'approved' } });
    const results = [];
    for (const shop of shops) {
        const s = await SettlementService.calculateWeeklySettlement(shop.id, startDate, endDate);
        if (s) results.push(s);
    }

    res.json({ message: `Processed ${shops.length} shops. Created ${results.length} settlements.`, results });
});

const getSettlementOrders = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const orders = await Order.findAll({
        where: { settlement_id: id },
        attributes: ['id', 'grand_total', 'createdAt', 'status'],
        order: [['createdAt', 'DESC']]
    });
    res.json(orders);
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
  reversePenalty,
  getAllCategories,
  createCategory,
  deleteCategory,
  getShopProducts,
  getShopOrders,
  getSettlements,
  updateSettlementStatus,
  triggerSettlementManually,
  getSettlementOrders
};
