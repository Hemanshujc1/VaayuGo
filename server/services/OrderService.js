const { sequelize, Order, OrderItem, Product, Shop, User, OrderRevenueLog, Location } = require('../models/index');
const { getApplicableRule, validateOrderAgainstRule } = require('../services/RuleEngineService');
const { resolveDiscounts } = require('../services/DiscountService');
const AppError = require('../utils/AppError');
const Decimal = require('decimal.js');

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
            let subtotal_amount = new Decimal(0);
            const orderItemsData = [];

            const rule = await getApplicableRule(location_id, category || null, shop_id);
            const commission_rate = new Decimal(rule.commission_percent || 0).dividedBy(100);

            let total_commission = new Decimal(0);

            for (const item of items) {
                let product = null;
                let price = new Decimal(0);

                if (item.is_xerox) {
                    price = new Decimal(item.price || 0);
                    const item_gross = price.times(item.quantity);
                    subtotal_amount = subtotal_amount.plus(item_gross);
                    
                    orderItemsData.push({
                        product_id: null,
                        quantity: item.quantity,
                        price_at_time: price.toNumber(),
                        name: item.name || "Xerox Document",
                        file_url: item.file_url,
                        options: item.options
                    });
                } else {
                    product = await Product.findByPk(item.id);
                    if (!product) throw new AppError(`Product ${item.id} not found`, 404);
                    
                    price = new Decimal(product.price);
                    const item_gross = price.times(item.quantity);
                    subtotal_amount = subtotal_amount.plus(item_gross);

                    orderItemsData.push({
                        product_id: product.id,
                        quantity: item.quantity,
                        price_at_time: price.toNumber(),
                        name: product.name
                    });
                }
            }

            // 3. Resolve Discounts (needed for commission and min order check)
            // Pass enriched items (with price and id) for discount calculation
            const enrichedItems = items.map(item => {
                const product = orderItemsData.find(oid => oid.product_id === (item.id || item.product_id) || (item.is_xerox && oid.name === item.name));
                return {
                    ...item,
                    price: product ? product.price_at_time : 0
                };
            });

            const discountData = await resolveDiscounts(location_id, shop_id, category, subtotal_amount.toNumber(), enrichedItems);
            
            const shop_discount_amount = new Decimal(discountData.shop_discount_amount || 0);
            const platform_discount_amount = new Decimal(discountData.platform_discount_amount || 0);
            const product_discount_amount = new Decimal(discountData.product_discount_amount || 0);

            // 4. Rule Engine Validation & Splits
            // Use subtotal minus product discounts for min order check
            const validation = validateOrderAgainstRule(subtotal_amount.minus(product_discount_amount).toNumber(), rule);

            // Calculate commission item by item
            if (discountData.itemBreakdown) {
                total_commission = discountData.itemBreakdown.reduce((sum, item) => {
                    const base = item.gross - item.product_discount - item.shop_discount;
                    return sum.plus(new Decimal(base).times(commission_rate));
                }, new Decimal(0));
            } else {
                total_commission = subtotal_amount.minus(product_discount_amount).minus(shop_discount_amount).times(commission_rate);
            }
            
            // Ensure precision
            total_commission = new Decimal(total_commission.toDecimalPlaces(2, Decimal.ROUND_HALF_UP));

            const net_item_total = subtotal_amount.minus(shop_discount_amount).minus(platform_discount_amount).minus(product_discount_amount);
            
            // Format splits as strict Decimals
            let platform_delivery_share = new Decimal(rule.vaayugo_delivery_share || 0);
            let shop_delivery_share = new Decimal(rule.shop_delivery_share || 0);
            const applied_delivery_fee = platform_delivery_share.plus(shop_delivery_share);

            let small_order_fee_applied = new Decimal(0);
            let platform_small_order_share = new Decimal(0);
            let shop_small_order_share = new Decimal(0);

            if (validation.isSmallOrder) {
                small_order_fee_applied = new Decimal(rule.small_order_delivery_fee || 0);
                platform_small_order_share = new Decimal(rule.small_order_platform_share || 0);
                shop_small_order_share = new Decimal(rule.small_order_shop_share || 0);
            }

            // Calculations based on EXACT sheet formulas
            // Shop Net Settlement = (Shop Gross Sale) - (Total Shop Discounts) - (Commission Deducted) + (Delivery Revenue Shop Share) + (Extra Charges Shop small order)
            const shop_final_settlement = subtotal_amount
                .minus(shop_discount_amount)
                .minus(total_commission)
                .plus(shop_delivery_share)
                .plus(shop_small_order_share);

            // Platform Net Revenue = (Commission) + (Delivery Platform Share) + (Extra Charges Platform small order) - (Platform Discount)
            const platform_net_revenue = total_commission
                .plus(platform_delivery_share)
                .plus(platform_small_order_share)
                .minus(platform_discount_amount);

            // Total Customer Pays = subtotal - shop_discount - platform_discount + normal_delivery_fee + small_order_fee
            const total_payable = subtotal_amount
                .minus(shop_discount_amount)
                .minus(platform_discount_amount)
                .minus(product_discount_amount)
                .plus(applied_delivery_fee)
                .plus(small_order_fee_applied);

            // Round to precisely 2 decimals
            const round2 = (d) => d.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();

            // 4. Create Order
            const order = await Order.create({
                customer_id,
                shop_id,
                items_total: round2(subtotal_amount),
                subtotal_amount: round2(subtotal_amount),
                shop_discount_amount: round2(shop_discount_amount),
                platform_discount_amount: round2(platform_discount_amount),
                product_discount_amount: round2(product_discount_amount),
                final_payable_amount: round2(total_payable),
                commission_rate: rule.commission_percent,
                commission_amount: round2(total_commission),
                shop_settlement_amount: round2(shop_final_settlement),
                delivery_fee: round2(applied_delivery_fee.plus(small_order_fee_applied)), // what customer pays total for delivery
                platform_fee: 0,
                grand_total: round2(total_payable),
                delivery_address,
                status: 'pending'
            }, { transaction });

            // 5. Create Order Items
            const itemsToCreate = orderItemsData.map(item => ({ ...item, order_id: order.id }));
            await OrderItem.bulkCreate(itemsToCreate, { transaction });

            // 6. Create Revenue Log (exact exact fields)
            await OrderRevenueLog.create({
                order_id: order.id,
                shop_id: shop_id,
                
                subtotal: round2(subtotal_amount),
                shop_discount_amount: round2(shop_discount_amount),
                platform_discount_amount: round2(platform_discount_amount),
                product_discount_amount: round2(product_discount_amount),
                net_item_total: round2(net_item_total),
                
                applied_delivery_fee: round2(applied_delivery_fee),
                platform_delivery_share: round2(platform_delivery_share),
                shop_delivery_share: round2(shop_delivery_share),
                
                is_small_order: validation.isSmallOrder,
                small_order_fee_applied: round2(small_order_fee_applied),
                platform_small_order_share: round2(platform_small_order_share),
                shop_small_order_share: round2(shop_small_order_share),
                
                commission_deducted: round2(total_commission),
                shop_final_settlement: round2(shop_final_settlement),
                platform_net_revenue: round2(platform_net_revenue)
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
