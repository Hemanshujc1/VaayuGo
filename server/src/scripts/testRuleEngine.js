const { getApplicableRule } = require('../services/RuleEngineService');
const { Shop, Category, ShopCategory, DeliveryRule, Location } = require('../models');

async function testRuleEngine() {
    try {
        console.log('--- Rule Engine Multi-Category Test ---');
        
        // 1. Create a test shop, location, and categories
        const [location] = await Location.findOrCreate({ where: { name: 'Test Zone' } });
        const [cat1] = await Category.findOrCreate({ where: { name: 'Cat1' } });
        const [cat2] = await Category.findOrCreate({ where: { name: 'Cat2' } });
        
        const shop = await Shop.create({
            name: 'Test Multi Shop',
            owner_id: 1, // Assume user 1 exists or use a safe id
            status: 'approved',
            location_address: 'Test Zone',
            category: 'Multi' // Legacy fallback
        });
        
        // Associate with both categories
        await ShopCategory.bulkCreate([
            { shop_id: shop.id, category_id: cat1.id },
            { shop_id: shop.id, category_id: cat2.id }
        ]);
        
        // 2. Create a rule for Cat2
        await DeliveryRule.create({
            location_id: location.id,
            category: 'Cat2',
            delivery_fee: 99,
            min_order_value: 500,
            is_active: true
        });
        
        console.log(`Checking rule for shop ${shop.id} in location ${location.id}...`);
        
        // 3. Test lookup WITHOUT specifying category (should find Cat2 rule)
        const rule = await getApplicableRule(location.id, null, shop.id);
        console.log('Found Rule:', rule ? { category: rule.category, fee: rule.delivery_fee } : 'None');
        
        if (rule && rule.category === 'Cat2' && rule.delivery_fee == 99) {
            console.log('✅ Success: Correct category rule found via shop association!');
        } else {
            console.error('❌ Failure: Expected Cat2 rule not found.');
        }

        // Cleanup
        await shop.destroy(); // Cascade or manual cleanup if needed
        console.log('--- Test Complete ---');
        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

testRuleEngine();
