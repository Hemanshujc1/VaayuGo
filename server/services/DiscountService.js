const { DiscountRule } = require('../models');
const { Op } = require('sequelize');

// Fetch the best applicable discount(s) for a given cart configuration
async function resolveDiscounts(location_id, shop_id, category, subtotal_amount, items) {
    const productIds = items ? items.map(i => i.id) : [];

    // Collect possible target rules
    const rules = await DiscountRule.findAll({
        where: {
            is_active: true,
            valid_from: { [Op.or]: [{ [Op.lte]: new Date() }, { [Op.is]: null }] },
            valid_until: { [Op.or]: [{ [Op.gte]: new Date() }, { [Op.is]: null }] },
            [Op.or]: [
                { target_type: 'GLOBAL' },
                { target_type: 'LOCATION', target_id: location_id },
                { target_type: 'SHOP', target_id: shop_id },
                { target_type: 'PRODUCT', target_id: { [Op.in]: productIds } }
            ]
        }
    });

    let bestShopDiscount = null;
    let bestPlatformDiscount = null;

    let shop_discount_amount = 0;
    let platform_discount_amount = 0;

    for (const rule of rules) {
        // Check min order value against total cart abstract value
        if (rule.min_order_value && subtotal_amount < Number(rule.min_order_value)) {
            continue;
        }

        let runAmount = 0;
        let applicable_amount = subtotal_amount;
        
        // If it's a product-specific rule, the discount only applies to that product's line total
        if (rule.target_type === 'PRODUCT') {
            const item = items.find(i => i.id === rule.target_id);
            if (item) {
                applicable_amount = item.price * item.quantity;
            } else {
                continue; // Should not trigger due to Op.in, but safety first
            }
        }

        if (rule.type === 'FLAT') {
            runAmount = Number(rule.value);
            if (runAmount > applicable_amount) runAmount = applicable_amount; // Cap flat discount to item/cart value
        } else if (rule.type === 'PERCENTAGE') {
            runAmount = applicable_amount * (Number(rule.value) / 100);
            if (rule.max_discount_amount && runAmount > Number(rule.max_discount_amount)) {
                runAmount = Number(rule.max_discount_amount);
            }
        }

        if (rule.creator_type === 'SHOP') {
            if (!bestShopDiscount || runAmount > shop_discount_amount) {
                bestShopDiscount = rule;
                shop_discount_amount = runAmount;
            }
        } else if (rule.creator_type === 'ADMIN') {
            // Platform discount
            if (!bestPlatformDiscount || runAmount > platform_discount_amount) {
                bestPlatformDiscount = rule;
                platform_discount_amount = runAmount;
            }
        }
    }

    // Return the calculated splits and rule info
    return {
        shop_discount_amount,
        platform_discount_amount,
        applied_rules: {
            shop: bestShopDiscount ? { id: bestShopDiscount.id, name: bestShopDiscount.name } : null,
            platform: bestPlatformDiscount ? { id: bestPlatformDiscount.id, name: bestPlatformDiscount.name } : null
        }
    };
}

module.exports = { resolveDiscounts };
