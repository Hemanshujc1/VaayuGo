const { Order, OrderItem, Product, Shop, User, OrderRevenueLog } = require('../models/index');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const OrderService = require('../services/OrderService');

const createOrder = catchAsync(async (req, res, next) => {
    const order = await OrderService.createOrderTransaction(req.user.id, req.body);
    res.status(201).json({ message: 'Order created successfully', orderId: order.id });
});

const getMyOrders = catchAsync(async (req, res, next) => {
    const orders = await Order.findAll({
        where: { customer_id: req.user.id },
        include: [
            { model: Shop, attributes: ['name'] },
            { model: OrderItem, include: [Product] }
        ],
        order: [['createdAt', 'DESC']]
    });
    res.json(orders);
});

const Decimal = require('decimal.js');

const getShopOrders = catchAsync(async (req, res, next) => {
    const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
    if (!shop) return next(new AppError('Shop not found', 404));

    const orders = await Order.findAll({
        where: { shop_id: shop.id },
        include: [
            { model: OrderItem, include: [Product] }, 
            { model: User, attributes: ['name', 'mobile_number', 'email'] },
            { model: OrderRevenueLog }
        ],
        order: [['createdAt', 'DESC']]
    });
    
    let shopGrossSale = new Decimal(0);
    let shopNetSale = new Decimal(0);
    let deductedCommission = new Decimal(0);
    let extraCharges = new Decimal(0);
    let deliveryRevenue = new Decimal(0);
    let totalShopDiscounts = new Decimal(0);

    let smallOrdersCount = 0;
    let completedOrders = 0;
    let cancelledOrders = 0;
    let failedOrders = 0;

    for (const o of orders) {
        if (o.status === 'cancelled') cancelledOrders++;
        else if (o.status === 'failed') failedOrders++;
        else if (o.status === 'delivered') {
            completedOrders++;
            const log = o.OrderRevenueLog;
            if (log) {
                const subtotal = new Decimal(log.subtotal || 0);
                const productDiscount = new Decimal(log.product_discount_amount || 0);
                const shopDiscount = new Decimal(log.shop_discount_amount || 0);
                
                const gmv = subtotal.minus(productDiscount);
                shopGrossSale = shopGrossSale.plus(gmv);
                
                totalShopDiscounts = totalShopDiscounts.plus(shopDiscount);
                shopNetSale = shopNetSale.plus(gmv.minus(shopDiscount));
                
                deductedCommission = deductedCommission.plus(log.commission_deducted || 0);
                extraCharges = extraCharges.plus(log.shop_small_order_share || 0);
                deliveryRevenue = deliveryRevenue.plus(log.shop_delivery_share || 0);
                
                if (log.is_small_order) smallOrdersCount++;
            }
        }
    }

    const shopGrossRevenue = shopNetSale.plus(deliveryRevenue).plus(extraCharges);
    const potentialRevenue = shopGrossSale.plus(deliveryRevenue).plus(extraCharges);
    const shopNetRevenue = shopGrossRevenue.minus(deductedCommission);

    const round2 = (val) => val.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();

    const aov = completedOrders > 0 ? round2(shopNetSale.dividedBy(completedOrders)) : 0;

    const metrics = {
        shopGrossSale: round2(shopGrossSale),
        shopNetSale: round2(shopNetSale),
        deductedCommission: round2(deductedCommission),
        extraCharges: round2(extraCharges),
        deliveryRevenue: round2(deliveryRevenue),
        shopGrossRevenue: round2(shopGrossRevenue),
        totalShopDiscounts: round2(totalShopDiscounts),
        potentialRevenue: round2(potentialRevenue),
        shopNetRevenue: round2(shopNetRevenue), // Payout
        
        totalOrders: orders.length,
        completedOrders,
        cancelledOrders,
        failedOrders,
        smallOrdersCount,
        aov
    };

    res.json({ orders, metrics });
});


const updateOrderStatus = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const order = await OrderService.transitionState(id, req.user, req.body);
    res.json({ message: `Order status updated to ${order.status}`, order });
});

const rateOrder = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { shop_rating, delivery_rating } = req.body;

    const order = await Order.findByPk(id);
    if (!order) return next(new AppError('Order not found', 404));

    if (order.customer_id !== req.user.id) {
        return next(new AppError('Unauthorized. You can only rate your own orders.', 403));
    }

    if (order.status !== 'delivered') {
        return next(new AppError('You can only rate orders that have been delivered.', 400));
    }

    if (order.is_rated) {
        return next(new AppError('You have already rated this order.', 400));
    }

    order.shop_rating = shop_rating;
    order.delivery_rating = delivery_rating;
    order.is_rated = true;
    await order.save();

    // Calculate new average shop rating and delivery rating
    const shop = await Shop.findByPk(order.shop_id);
    if (shop) {
        const ratedOrders = await Order.findAll({
            where: { shop_id: shop.id, is_rated: true }
        });

        if (ratedOrders.length > 0) {
            const totalRating = ratedOrders.reduce((acc, curr) => acc + curr.shop_rating, 0);
            const avgRating = totalRating / ratedOrders.length;
            shop.rating = avgRating;

            const totalDeliveryRating = ratedOrders.reduce((acc, curr) => acc + curr.delivery_rating, 0);
            const avgDeliveryRating = totalDeliveryRating / ratedOrders.length;
            shop.delivery_rating = avgDeliveryRating;
            
            await shop.save();
        }
    }

    res.json({ message: 'Rating submitted successfully', order });
});

const getOrderById = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
        include: [
            { model: Shop, attributes: ['id', 'name', 'location_address'] },
            { model: User, attributes: ['id', 'name', 'mobile_number', 'email', 'address'] },
            { model: OrderItem, include: [{ model: Product, attributes: ['id', 'name', 'image_url'] }] },
            { model: OrderRevenueLog }
        ]
    });

    if (!order) {
        return next(new AppError('Order not found', 404));
    }

    // Role-Based Access Control
    if (req.user.role === 'customer' && order.customer_id !== req.user.id) {
        return next(new AppError('Unauthorized: You can only view your own orders', 403));
    }

    if (req.user.role === 'shopkeeper') {
        const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
        if (!shop || order.shop_id !== shop.id) {
            return next(new AppError('Unauthorized: You can only view orders for your shop', 403));
        }
    }

    // Admins can view any order, so no extra check needed if role is 'admin' OR 'super_admin'

    res.json(order);
});

module.exports = { createOrder, getMyOrders, getShopOrders, updateOrderStatus, rateOrder, getOrderById };
