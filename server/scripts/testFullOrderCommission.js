const OrderService = require('../services/OrderService');
const { Product, Shop, User, Location, DeliveryRule } = require('../models');

async function testFullOrderCommission() {
    try {
        console.log('--- Testing Full Order Commission Flow ---');

        // 1. Setup Data
        const location = await Location.findOne({ where: { name: 'Central' } });
        if (!location) throw new Error('Central location not found');

        const shop = await Shop.findOne({ include: User });
        if (!shop) throw new Error('No shop found');

        // Force a rule with 10% commission for the shop/location
        await DeliveryRule.update({ commission_percent: 15 }, { where: { location_id: location.id } });
        console.log(`Updated Rule for Location ${location.id} to 15% commission.`);

        const product = await Product.findOne({ where: { shop_id: shop.id } });
        if (!product) throw new Error('No product found for shop');

        const customer = await User.findOne({ where: { role: 'customer' } });
        
        const orderData = {
            shop_id: shop.id,
            items: [{ id: product.id, quantity: 1 }],
            delivery_address: 'Test Address',
            category: 'General'
        };

        const order = await OrderService.createOrderTransaction(customer.id, orderData);
        console.log(`Order Created: ID ${order.id}`);

        // 2. Check OrderRevenueLog
        const { OrderRevenueLog } = require('../models');
        const log = await OrderRevenueLog.findOne({ where: { order_id: order.id } });

        console.log(`Log Data: Subtotal=${log.subtotal}, Commission=${log.commission_deducted}`);

        if (Number(log.commission_deducted) > 0) {
            console.log('✅ Success: Commission is non-zero in log.');
        } else {
            console.error('❌ Failure: Commission is zero in log.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

testFullOrderCommission();
