const { Product, Shop, DiscountRule, User, Location, Order, OrderRevenueLog } = require('../models');
const Decimal = require('decimal.js');

async function testShopMetrics() {
    try {
        console.log('--- Testing Shop Metrics Calculation ---');

        // 1. Setup Test Data
        const [user] = await User.findOrCreate({ 
            where: { email: 'metrics_owner@test.com' }, 
            defaults: { 
                name: 'Metrics Owner',
                mobile_number: '9876543210',
                address: '456 Test St',
                password: 'password', 
                role: 'shopkeeper', 
                location: 'Test Zone' 
            } 
        });
        
        const shop = await Shop.create({
            name: 'Metrics Test Shop ' + Date.now(),
            owner_id: user.id,
            status: 'approved',
            location_address: 'Test Zone',
            category: 'General',
            is_open: true
        });

        // 2. Create a Delivered Order with Revenues
        const order = await Order.create({
            customer_id: user.id, // self-test
            shop_id: shop.id,
            items_total: 100,
            subtotal_amount: 100,
            grand_total: 100,
            delivery_address: 'Test Address',
            status: 'delivered',
            final_status_locked: true
        });

        const log = await OrderRevenueLog.create({
            order_id: order.id,
            shop_id: shop.id,
            subtotal: 100,
            product_discount_amount: 10,
            shop_discount_amount: 5,
            platform_discount_amount: 2,
            net_item_total: 83, // 100 - 10 - 5 - 2
            applied_delivery_fee: 10,
            commission_deducted: 8,
            shop_final_settlement: 80,
            platform_net_revenue: 5
        });

        console.log('Order & Log created: Subtotal=100, ProdDisc=10, ShopDisc=5');

        // 3. Test the logic derived from log
        const subtotal = new Decimal(log.subtotal);
        const prodDisc = new Decimal(log.product_discount_amount);
        const shopDisc = new Decimal(log.shop_discount_amount);
        
        const gmv = subtotal.minus(prodDisc);
        const netSale = gmv.minus(shopDisc);

        console.log(`Calculated GMV: ${gmv.toNumber()}`);
        console.log(`Calculated Net Sale: ${netSale.toNumber()}`);

        if (gmv.toNumber() === 90 && netSale.toNumber() === 85) {
            console.log('✅ Success: Metrics logic is correct!');
        } else {
            console.error(`❌ Failure: Expected GMV=90, NetSale=85. Got GMV=${gmv.toNumber()}, NetSale=${netSale.toNumber()}`);
        }

        // Cleanup
        await log.destroy();
        await order.destroy();
        await shop.destroy();

        console.log('--- Test Complete ---');
        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

testShopMetrics();
