const { Product, Shop, DiscountRule, User, Location } = require('../models');
const { resolveDiscounts } = require('../services/DiscountService');

async function testProductDiscount() {
    try {
        console.log('--- Testing Product Discount Calculation ---');

        // 1. Setup Test Data
        const [user] = await User.findOrCreate({ 
            where: { email: 'test_owner@test.com' }, 
            defaults: { 
                name: 'Test Owner',
                mobile_number: '1234567890',
                address: '123 Test St',
                password: 'password', 
                role: 'shopkeeper', 
                location: 'Test Zone' 
            } 
        });
        const [location] = await Location.findOrCreate({ where: { name: 'Test Zone' } });
        
        const shop = await Shop.create({
            name: 'Test Discount Shop ' + Date.now(),
            owner_id: user.id,
            status: 'approved',
            location_address: 'Test Zone',
            category: 'General',
            is_open: true
        });

        const product = await Product.create({
            shop_id: shop.id,
            name: 'Test Product',
            price: 70.0,
            is_available: true,
            stock_quantity: 10
        });

        const discount = await DiscountRule.create({
            name: 'Test Product Discount',
            type: 'FLAT',
            value: 7.0,
            creator_type: 'SHOP',
            creator_id: user.id,
            target_type: 'PRODUCT',
            target_id: product.id,
            is_active: true
        });

        console.log(`Created Product: ₹${product.price}`);
        console.log(`Created Discount: ₹${discount.value} (FLAT)`);

        // 2. Test resolveDiscounts
        const items = [{ id: product.id, price: product.price, quantity: 1 }];
        const discountData = await resolveDiscounts(location.id, shop.id, 'General', 70.0, items);

        console.log('Discount Data:', discountData);

        if (discountData.product_discount_amount === 7.0) {
            console.log('✅ Success: Product discount amount is correct (₹7.0)');
        } else {
            console.error(`❌ Failure: Expected ₹7.0, got ₹${discountData.product_discount_amount}`);
        }

        // 3. Final Calculation Check (Logic in controller)
        const subtotal = 70.0;
        const shop_discount = discountData.shop_discount_amount;
        const platform_discount = discountData.platform_discount_amount;
        const product_discount = discountData.product_discount_amount;
        const final_payable = Math.max(0, subtotal - shop_discount - platform_discount - product_discount);

        console.log(`Final Payable Calculation: ${subtotal} - ${shop_discount} - ${platform_discount} - ${product_discount} = ${final_payable}`);

        if (final_payable === 63.0) {
            console.log('✅ Success: Final payable amount is correct (₹63.0)');
        } else {
            console.error(`❌ Failure: Expected ₹63.0, got ₹${final_payable}`);
        }

        // Cleanup
        await discount.destroy();
        await product.destroy();
        await shop.destroy();

        console.log('--- Test Complete ---');
        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

testProductDiscount();
