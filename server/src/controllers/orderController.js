const { sequelize, Order, OrderItem, Product, ServiceConfig, Shop, User } = require('../models/index');

const createOrder = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { shop_id, items, delivery_address } = req.body;
        const customer_id = req.user.id;

        // 1. Fetch Shop and Config
        const shop = await Shop.findByPk(shop_id);
        if (!shop) throw new Error('Shop not found');

        const config = await ServiceConfig.findOne({ where: { shop_id } }) || 
                       await ServiceConfig.findOne({ where: { shop_id: null } }); // Global fallback

        // Default fees if no config
        const delivery_fee = config ? config.delivery_fee : 10;
        const platform_fee = 2; // Fixed for now

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

        // 3. Min Order Value Check
        if (config && items_total < config.min_order_value) {
            throw new Error(`Minimum order value is ₹${config.min_order_value}`);
        }

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
            include: [{ model: OrderItem, include: [Product] }, { model: User, attributes: ['name', 'mobile_number', 'email'] }], // Include customer details
            order: [['createdAt', 'DESC']]
        });
        res.json(orders);
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
