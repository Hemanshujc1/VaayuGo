const { getApplicableRule, validateOrderAgainstRule } = require('../services/RuleEngineService');
const { resolveDiscounts } = require('../services/DiscountService');
const { Location, Shop, User } = require('../models');

// @desc    Calculate Cart Return Order Value details
// @route   POST /api/cart/calculate
// @access  Public or Private
const calculateCart = async (req, res, next) => {
  try {
    const { items, category, shop_id } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in cart' });
    }

    if (!shop_id) {
       return res.status(400).json({ error: 'shop_id is required' });
    }

    // Resolve location from Shop Owner's profile
    const shop = await Shop.findByPk(shop_id, { include: User });
    if (!shop || !shop.User) {
      return res.status(404).json({ error: 'Shop details or Shop Owner not found' });
    }
    
    const location_name = shop.User.location;

    // Resolve location ID manually since users/shops only store the string
    const loc = await Location.findOne({ where: { name: location_name } });
    if (!loc) {
      return res.status(400).json({ error: `Delivery zone '${location_name}' is not recognized.` });
    }
    const location_id = loc.id;

    // 1. Calculate Base Order Value
    const subtotal_amount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Resolve dynamic discounts
    const discountData = await resolveDiscounts(location_id, shop_id, category, subtotal_amount, items);
    const shop_discount_amount = discountData.shop_discount_amount;
    const platform_discount_amount = discountData.platform_discount_amount;
    const applied_rules = discountData.applied_rules;

    const final_payable_amount = Math.max(0, subtotal_amount - shop_discount_amount - platform_discount_amount);

    // 2. Fetch Applicable Rule
    let rule;
    try {
      rule = await getApplicableRule(location_id, category, shop_id);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    // 3. Validate Order Value Against Rule
    let validation;
    try {
      validation = validateOrderAgainstRule(subtotal_amount, rule);
    } catch (err) {
      // For Strict Mode blockages
      return res.status(400).json({ error: err.message });
    }

    // 4. Derive Final Amounts
    const delivery_fee = validation.deliveryFee;
    const commission_percent = Number(rule.commission_percent);
    
    // Revenue calculations
    const commission_base = subtotal_amount - shop_discount_amount;
    const commission_amount = commission_base * (commission_percent / 100);
    const shop_settlement_amount = (subtotal_amount - shop_discount_amount) - commission_amount;

    const total_payable = final_payable_amount + delivery_fee;

    res.status(200).json({
      subtotal_amount,
      shop_discount_amount,
      platform_discount_amount,
      final_payable_amount,
      delivery_fee,
      is_small_order: validation.isSmallOrder,
      commission_percent,
      commission_amount,
      shop_settlement_amount,
      total_payable,
      applied_rules
    });

  } catch (error) {
    console.error("Cart Calculation Error:", error);
    res.status(500).json({ error: 'Server error during calculation' });
  }
};

module.exports = { calculateCart };
