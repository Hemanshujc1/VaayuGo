const { DeliveryRule, Location } = require('../models');

async function checkRules() {
    try {
        const rules = await DeliveryRule.findAll({
            include: [{ model: Location }]
        });

        console.log('--- Checking All DeliveryRules ---');
        rules.forEach(rule => {
            console.log(`ID: ${rule.id}, Location: ${rule.Location?.name}, Category: ${rule.category}, ShopID: ${rule.shop_id}, Comm %: ${rule.commission_percent}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkRules();
