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
    
    let smallOrdersCount = 0;
    orders.forEach(o => {
        if (o.OrderRevenueLog && o.OrderRevenueLog.is_small_order) {
            smallOrdersCount++;
        }
    });

    res.json({ orders, smallOrdersCount });
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

module.exports = { createOrder, getMyOrders, getShopOrders, updateOrderStatus, rateOrder };
