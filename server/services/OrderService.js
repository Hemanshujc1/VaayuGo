const { sequelize, Order, OrderItem, Product, Shop, User, OrderRevenueLog, Location } = require('../models/index');
const { getApplicableRule, validateOrderAgainstRule } = require('../services/RuleEngineService');
const { resolveDiscounts } = require('../services/DiscountService');
const AppError = require('../utils/AppError');

class OrderService {
    static async createOrderTransaction(customer_id, data) {
        const { shop_id, items, delivery_address, category } = data;

        const transaction = await sequelize.transaction();
        try {
            // 1. Fetch Shop and Owner details
            const shop = await Shop.findByPk(shop_id, { include: User });
            if (!shop || !shop.User) throw new AppError('Shop or Shop Owner not found', 404);

            const location_name = shop.User.location;
            if (!location_name) throw new AppError('Shop does not have a registered delivery zone', 400);
            
            // Resolve location ID manually
            const loc = await Location.findOne({ where: { name: location_name } });
            if (!loc) throw new AppError(`Delivery zone '${location_name}' is not recognized.`, 400);
            const location_id = loc.id;

            // 2. Validate Items & Calculate Total
            let items_total = 0;
            const orderItemsData = [];

            for (const item of items) {
                let product = null;
                let price = 0;

                if (item.is_xerox) {
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
                    product = await Product.findByPk(item.id);
                    if (!product) throw new AppError(`Product ${item.id} not found`, 404);
                    
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
            const subtotal_amount = items_total;
            
            const discountData = await resolveDiscounts(location_id, shop_id, category, subtotal_amount, items);
            const shop_discount_amount = discountData.shop_discount_amount;
            const platform_discount_amount = discountData.platform_discount_amount;

            const final_payable_amount = Math.max(0, subtotal_amount - shop_discount_amount - platform_discount_amount);
            const commission_base = subtotal_amount - shop_discount_amount;
            const commissionAmount = commission_base * (rule.commission_percent / 100);
            const shop_settlement_amount = (subtotal_amount - shop_discount_amount) - commissionAmount;

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

            const shop_final_earning = shop_settlement_amount + shop_delivery_earned;
            const vaayugo_final_earning = commissionAmount + vaayugo_delivery_earned;

            const platform_fee = 0;
            const grand_total = final_payable_amount + delivery_fee + platform_fee;

            // 4. Create Order
            const order = await Order.create({
                customer_id,
                shop_id,
                items_total,
                subtotal_amount,
                shop_discount_amount,
                platform_discount_amount,
                final_payable_amount,
                commission_rate: rule.commission_percent,
                commission_amount: commissionAmount,
                shop_settlement_amount,
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
            return order;

        } catch (error) {
            await transaction.rollback();
            throw error; // Let the global error handler catch it
        }
    }

    static async transitionState(order_id, userContext, updateData) {
        const { status, delivery_otp, failure_reason, cancel_reason } = updateData;
        const { id: userId, role } = userContext;

        const order = await Order.findByPk(order_id);
        if (!order) throw new AppError('Order not found', 404);

        if (order.final_status_locked) {
            throw new AppError('Order status is locked and cannot be changed.', 403);
        }

        const shop = await Shop.findOne({ where: { owner_id: userId } });
        const isShopOwner = shop && shop.id === order.shop_id;
        const isCustomer = order.customer_id === userId;
        const isAdmin = role === 'admin';

        if (!isShopOwner && !isCustomer && !isAdmin) {
            throw new AppError('Unauthorized to update this order', 403);
        }

        const validStatuses = ['pending', 'accepted', 'out_for_delivery', 'delivered', 'failed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
        }

        if (status === 'accepted' && order.status !== 'pending') {
            throw new AppError('Can only accept pending orders.', 400);
        }

        if (status === 'out_for_delivery') {
            if (order.status !== 'accepted') {
                throw new AppError('Order must be accepted before being out for delivery.', 400);
            }
            order.delivery_otp = Math.floor(1000 + Math.random() * 9000).toString();
        }

        if (status === 'delivered') {
            if (order.status !== 'out_for_delivery') {
                throw new AppError('Order must be out for delivery to be delivered.', 400);
            }
            if (!delivery_otp || String(delivery_otp) !== String(order.delivery_otp)) {
                throw new AppError('Invalid or missing Delivery OTP.', 400);
            }
            order.delivered_at = new Date();
            order.final_status_locked = true;
        }

        if (status === 'failed') {
            if (order.status !== 'out_for_delivery') {
                throw new AppError('Only orders out for delivery can be marked as failed.', 400);
            }
            if (!failure_reason) {
                throw new AppError('A failure reason is required.', 400);
            }
            order.failure_reason = failure_reason;
            order.failed_at = new Date();
            order.final_status_locked = true;
        }

        if (status === 'cancelled') {
            if (!cancel_reason) {
                throw new AppError('Cancellation reason is required.', 400);
            }

            if (isCustomer) {
                const orderAgeMinutes = (Date.now() - new Date(order.createdAt).getTime()) / 60000;
                if (orderAgeMinutes > 10) {
                    throw new AppError('Customers can only cancel within 10 minutes of placing the order.', 400);
                }
                order.cancelled_by = 'customer';
            } else if (isShopOwner) {
                order.cancelled_by = 'shop';
            } else if (isAdmin) {
                order.cancelled_by = 'admin';
            }

            order.cancel_reason = cancel_reason;
            order.cancelled_at = new Date();
            order.final_status_locked = true;
        }

        order.status = status;
        await order.save();
        return order;
    }
}

module.exports = OrderService;
