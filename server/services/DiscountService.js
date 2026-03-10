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

    let total_shop_discount = 0;
    let total_platform_discount = 0;
    let total_product_discount = 0;

    // 1. Calculate Product-Specific Discounts First
    let itemBreakdown = items.map(item => {
        const itemGross = item.price * item.quantity;
        return {
            id: item.id || item.product_id,
            price: item.price,
            quantity: item.quantity,
            gross: itemGross,
            product_discount: 0,
            product_discount_type: null,
            product_discount_value: null,
            shop_discount: 0,
            platform_discount: 0,
            net_after_product: itemGross
        };
    });

    for (const rule of rules.filter(r => r.target_type === 'PRODUCT')) {
        for (let breakdown of itemBreakdown.filter(i => i.id === rule.target_id || rule.target_id === null)) {
            let runAmount = 0;
            if (rule.type === 'FLAT') {
                runAmount = Number(rule.value) * breakdown.quantity;
                if (rule.max_discount_amount && runAmount > Number(rule.max_discount_amount)) {
                    runAmount = Number(rule.max_discount_amount);
                }
                if (runAmount > breakdown.gross) runAmount = breakdown.gross;
            } else if (rule.type === 'PERCENTAGE') {
                runAmount = breakdown.gross * (Number(rule.value) / 100);
                if (rule.max_discount_amount && runAmount > Number(rule.max_discount_amount)) {
                    runAmount = Number(rule.max_discount_amount);
                }
            }
            breakdown.product_discount += runAmount;
            
            // Only capture rule details if a discount is actually applied
            if (runAmount > 0) {
                breakdown.product_discount_type = rule.type;
                breakdown.product_discount_value = Number(rule.value);
            }

            breakdown.net_after_product = breakdown.gross - breakdown.product_discount;
            total_product_discount += runAmount;
        }
    }

    // 2. Determine Best Shop Discount
    const newSubtotalAfterProductDiscounts = itemBreakdown.reduce((sum, item) => sum + item.net_after_product, 0);

    for (const rule of rules.filter(r => r.creator_type === 'SHOP' && r.target_type !== 'PRODUCT')) {
        if (rule.min_order_value && subtotal_amount < Number(rule.min_order_value)) continue;

        let runAmount = 0;
        if (rule.type === 'FLAT') {
            runAmount = Number(rule.value);
            if (runAmount > newSubtotalAfterProductDiscounts) runAmount = newSubtotalAfterProductDiscounts;
        } else if (rule.type === 'PERCENTAGE') {
            runAmount = newSubtotalAfterProductDiscounts * (Number(rule.value) / 100);
            if (rule.max_discount_amount && runAmount > Number(rule.max_discount_amount)) {
                runAmount = Number(rule.max_discount_amount);
            }
        }

        if (!bestShopDiscount || runAmount > total_shop_discount) {
            bestShopDiscount = rule;
            total_shop_discount = runAmount;
        }
    }

    // Distribute best shop discount proportionally
    if (bestShopDiscount && newSubtotalAfterProductDiscounts > 0) {
        let distributedShopDiscount = 0;
        for (let i = 0; i < itemBreakdown.length; i++) {
            const breakdown = itemBreakdown[i];
            const weight = breakdown.net_after_product / newSubtotalAfterProductDiscounts;
            
            if (i === itemBreakdown.length - 1) {
                // Last item gets the remainder to avoid rounding issues
                breakdown.shop_discount = Number((total_shop_discount - distributedShopDiscount).toFixed(2));
            } else {
                const itemDisc = Number((total_shop_discount * weight).toFixed(2));
                breakdown.shop_discount = itemDisc;
                distributedShopDiscount += itemDisc;
            }
        }
    }

    // 3. Determine Best Platform Discount
    const newSubtotalAfterShopDiscounts = newSubtotalAfterProductDiscounts - total_shop_discount;

    for (const rule of rules.filter(r => r.creator_type === 'ADMIN')) {
        if (rule.min_order_value && subtotal_amount < Number(rule.min_order_value)) continue;

        let runAmount = 0;
        if (rule.type === 'FLAT') {
            runAmount = Number(rule.value);
            if (runAmount > newSubtotalAfterShopDiscounts) runAmount = newSubtotalAfterShopDiscounts;
        } else if (rule.type === 'PERCENTAGE') {
            runAmount = newSubtotalAfterShopDiscounts * (Number(rule.value) / 100);
            if (rule.max_discount_amount && runAmount > Number(rule.max_discount_amount)) {
                runAmount = Number(rule.max_discount_amount);
            }
        }

        if (!bestPlatformDiscount || runAmount > total_platform_discount) {
            bestPlatformDiscount = rule;
            total_platform_discount = runAmount;
        }
    }

     // Distribute best platform discount proportionally
     if (bestPlatformDiscount && newSubtotalAfterShopDiscounts > 0) {
        let distributedPlatformDiscount = 0;
        for (let i = 0; i < itemBreakdown.length; i++) {
            const breakdown = itemBreakdown[i];
            const netBeforePlat = breakdown.net_after_product - breakdown.shop_discount;
            const weight = netBeforePlat / newSubtotalAfterShopDiscounts;
            
            if (i === itemBreakdown.length - 1) {
                breakdown.platform_discount = Number((total_platform_discount - distributedPlatformDiscount).toFixed(2));
            } else {
                const itemDisc = Number((total_platform_discount * weight).toFixed(2));
                breakdown.platform_discount = itemDisc;
                distributedPlatformDiscount += itemDisc;
            }
        }
    }

    // Final calculations for breakdown
    for (const breakdown of itemBreakdown) {
        breakdown.final_net = breakdown.gross - breakdown.product_discount - breakdown.shop_discount - breakdown.platform_discount;
    }

    return {
        shop_discount_amount: total_shop_discount,
        platform_discount_amount: total_platform_discount,
        product_discount_amount: total_product_discount,
        itemBreakdown: itemBreakdown, // The new precise array
        applied_rules: {
            shop: bestShopDiscount ? { id: bestShopDiscount.id, name: bestShopDiscount.name } : null,
            platform: bestPlatformDiscount ? { id: bestPlatformDiscount.id, name: bestPlatformDiscount.name } : null
        }
    };
}

module.exports = { resolveDiscounts };
