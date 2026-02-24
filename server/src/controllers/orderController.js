const { sequelize, Order, OrderItem, Product, Shop, User, OrderRevenueLog, Location } = require('../models/index');
const { getApplicableRule, validateOrderAgainstRule } = require('../services/RuleEngineService');

const createOrder = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { shop_id, items, delivery_address, category } = req.body;
        const customer_id = req.user.id;

        // 1. Fetch Shop and Owner details
        const shop = await Shop.findByPk(shop_id, { include: User });
        if (!shop || !shop.User) throw new Error('Shop or Shop Owner not found');

        const location_name = shop.User.location;
        if (!location_name) throw new Error('Shop does not have a registered delivery zone');
        
        // Resolve location ID manually
        const loc = await Location.findOne({ where: { name: location_name } });
        if (!loc) throw new Error(`Delivery zone '${location_name}' is not recognized.`);
        const location_id = loc.id;

        // 2. Validate Items & Calculate Total
        let items_total = 0;
        const orderItemsData = [];

        for (const item of items) {
            let product = null;
            let price = 0;

            if (item.is_xerox) {
                // For Xerox/Custom items, we trust the frontend price (MVP) or re-calc logic could go here
                price = item.price;
                items_total += price * item.quantity;
                
                orderItemsData.push({
                    product_id: null,
                    quantity: item.quantity,
                    price_at_time: price,
                    name: item.name || "Xerox Document",
                    file_url: item.file_url,
                    options: item.options
                });
            } else {
                // Standard Product
                product = await Product.findByPk(item.id);
                if (!product) throw new Error(`Product ${item.id} not found`);
                
                price = product.price;
                items_total += price * item.quantity;

                orderItemsData.push({
                    product_id: product.id,
                    quantity: item.quantity,
                    price_at_time: price,
                    name: product.name
                });
            }
        }

        // 3. Rule Engine Validation & Splits
        const rule = await getApplicableRule(location_id, category || null, shop_id);
        const validation = validateOrderAgainstRule(items_total, rule);

        const delivery_fee = validation.deliveryFee;
        const commissionAmount = items_total * (rule.commission_percent / 100);

        let shop_delivery_earned = Number(rule.shop_delivery_share);
        let vaayugo_delivery_earned = Number(rule.vaayugo_delivery_share);

        if (validation.isSmallOrder) {
            const totalNormalDelivery = shop_delivery_earned + vaayugo_delivery_earned;
            if (totalNormalDelivery > 0) {
                const shopRatio = shop_delivery_earned / totalNormalDelivery;
                shop_delivery_earned = Number(rule.small_order_delivery_fee) * shopRatio;
                vaayugo_delivery_earned = Number(rule.small_order_delivery_fee) * (1 - shopRatio);
            } else {
                shop_delivery_earned = Number(rule.small_order_delivery_fee) * 0.5;
                vaayugo_delivery_earned = Number(rule.small_order_delivery_fee) * 0.5;
            }
        }

        const shop_final_earning = (items_total - commissionAmount) + shop_delivery_earned;
        const vaayugo_final_earning = commissionAmount + vaayugo_delivery_earned;

        const platform_fee = 0; // Removing fixed fee, moving to commission based
        const grand_total = items_total + delivery_fee + platform_fee;

        // 4. Create Order
        const order = await Order.create({
            customer_id,
            shop_id,
            items_total,
            delivery_fee,
            platform_fee,
            grand_total,
            delivery_address,
            status: 'pending'
        }, { transaction });

        // 5. Create Order Items
        const itemsToCreate = orderItemsData.map(item => ({ ...item, order_id: order.id }));
        await OrderItem.bulkCreate(itemsToCreate, { transaction });

        // 6. Create Revenue Log
        await OrderRevenueLog.create({
            order_id: order.id,
            shop_id: shop_id,
            order_value: items_total,
            is_small_order: validation.isSmallOrder,
            applied_delivery_fee: delivery_fee,
            applied_min_order_value: rule.min_order_value,
            commission_amount: commissionAmount,
            shop_delivery_earned: shop_delivery_earned,
            vaayugo_delivery_earned: vaayugo_delivery_earned,
            shop_final_earning: shop_final_earning,
            vaayugo_final_earning: vaayugo_final_earning
        }, { transaction });

        await transaction.commit();
        res.status(201).json({ message: 'Order created successfully', orderId: order.id });

    } catch (error) {
        await transaction.rollback();
        res.status(400).json({ message: error.message || 'Order creation failed' });
    }
};

const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { customer_id: req.user.id },
            include: [
                { model: Shop, attributes: ['name'] },
                { model: OrderItem, include: [Product] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders', error });
    }
};

const getShopOrders = async (req, res) => {
    try {
        // Ensure user owns the shop
        const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
        if (!shop) return res.status(404).json({ message: 'Shop not found' });

        const orders = await Order.findAll({
            where: { shop_id: shop.id },
            include: [
                { model: OrderItem, include: [Product] }, 
                { model: User, attributes: ['name', 'mobile_number', 'email'] },
                { model: OrderRevenueLog }
            ],
            order: [['createdAt', 'DESC']]
        });
        
        // Also compute summary for Shop Dashboard Cards
        let smallOrdersCount = 0;
        orders.forEach(o => {
            if (o.OrderRevenueLog && o.OrderRevenueLog.is_small_order) {
                smallOrdersCount++;
            }
        });

        res.json({ orders, smallOrdersCount });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching shop orders', error });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const order = await Order.findByPk(id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Verify shop ownership
        const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
        if (!shop || shop.id !== order.shop_id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        order.status = status;
        await order.save();
        res.json({ message: 'Order status updated', order });
    } catch (error) {
        res.status(500).json({ message: 'Error updating order', error });
    }
};

const rateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { shop_rating, delivery_rating } = req.body;

        const order = await Order.findByPk(id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (order.customer_id !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized. You can only rate your own orders.' });
        }

        if (order.status !== 'delivered') {
            return res.status(400).json({ message: 'You can only rate orders that have been delivered.' });
        }

        if (order.is_rated) {
            return res.status(400).json({ message: 'You have already rated this order.' });
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
    } catch (error) {
        res.status(500).json({ message: 'Error submitting rating', error });
    }
};

module.exports = { createOrder, getMyOrders, getShopOrders, updateOrderStatus, rateOrder };
