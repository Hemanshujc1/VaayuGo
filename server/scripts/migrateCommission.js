const { OrderRevenueLog, Order, Shop, User, Location, DeliveryRule, Category, ShopCategory } = require('../models');
const Decimal = require('decimal.js');

async function migrateCommission() {
    try {
        console.log('--- Starting Commission Migration ---');

        const logs = await OrderRevenueLog.findAll({
            include: [{ model: Order }]
        });

        console.log(`Found ${logs.length} revenue logs to process.`);

        for (const log of logs) {
            // Calculate commission: (Subtotal - Product Discount - Shop Discount) * commission_rate
            const subtotal = new Decimal(log.subtotal || 0);
            const prodDisc = new Decimal(log.product_discount_amount || 0);
            const shopDisc = new Decimal(log.shop_discount_amount || 0);
            
            // For existing data, we'll try to determine the commission rate from history or default to 10%
            // Since commission_rate wasn't stored in Order previously for some, we check the rule engine logic
            let commissionPercent = 10; // Default fallback

            // Try to find the order which might have commission_rate if it's a newer order
            if (log.Order && log.Order.commission_rate) {
                commissionPercent = log.Order.commission_rate;
            }

            const commissionRate = new Decimal(commissionPercent).dividedBy(100);
            const recalculatedCommission = subtotal.minus(prodDisc).minus(shopDisc).times(commissionRate);
            
            const round2 = (d) => d.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();

            log.commission_deducted = round2(recalculatedCommission);
            
            // Also update the final settlement if it was zero or wrong
            // Shop Final Settlement = (Subtotal - Shop Discount - Commission) + Shop Delivery Share + Shop Small Order Share
            const shopDel = new Decimal(log.shop_delivery_share || 0);
            const shopSmall = new Decimal(log.shop_small_order_share || 0);
            
            log.shop_final_settlement = round2(subtotal.minus(shopDisc).minus(recalculatedCommission).plus(shopDel).plus(shopSmall));
            
            // Platform Net Revenue = Commission + Platform Delivery Share + Platform Small Order Share - Platform Discount
            const platDel = new Decimal(log.platform_delivery_share || 0);
            const platSmall = new Decimal(log.platform_small_order_share || 0);
            const platDisc = new Decimal(log.platform_discount_amount || 0);
            
            log.platform_net_revenue = round2(recalculatedCommission.plus(platDel).plus(platSmall).minus(platDisc));

            await log.save();
            console.log(`Updated Order ${log.order_id}: Commission Reset to ${log.commission_deducted}`);
        }

        console.log('--- Migration Complete ---');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrateCommission();
