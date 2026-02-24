const { DeliveryRule } = require("../models");

async function getApplicableRule(location_id, category = null, shop_id = null) {
  // Priority 1: Shop-Level Rule
  if (shop_id) {
    const shopRule = await DeliveryRule.findOne({
      where: { shop_id, is_active: true },
    });
    if (shopRule) return shopRule;
  }

  // Priority 2: Category-Level Rule
  if (category) {
    const categoryRule = await DeliveryRule.findOne({
      where: { location_id, category, shop_id: null, is_active: true },
    });
    if (categoryRule) return categoryRule;
  }

  // Priority 3: Location-Level Rule
  const locationRule = await DeliveryRule.findOne({
    where: { location_id, category: null, shop_id: null, is_active: true },
  });
  if (locationRule) return locationRule;

  throw new Error("No active delivery rule configured for this region.");
}

function validateOrderAgainstRule(orderValue, rule) {
  // If no minimum order is configured, return normal fee
  if (!rule.min_order_value || orderValue >= rule.min_order_value) {
    return {
      isValid: true,
      isSmallOrder: false,
      deliveryFee: Number(rule.delivery_fee),
    };
  }

  // Small order condition
  if (rule.small_order_delivery_fee) {
    // Flexible Mode: Apply higher delivery fee
    return {
      isValid: true,
      isSmallOrder: true,
      deliveryFee: Number(rule.small_order_delivery_fee),
    };
  } else {
    // Strict Mode: Block the order
    throw new Error(
      `Minimum order value of ₹${rule.min_order_value} is not satisfied.`
    );
  }
}

module.exports = { getApplicableRule, validateOrderAgainstRule };
