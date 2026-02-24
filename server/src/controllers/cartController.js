const { getApplicableRule, validateOrderAgainstRule } = require('../services/RuleEngineService');
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
    const order_value = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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
      validation = validateOrderAgainstRule(order_value, rule);
    } catch (err) {
      // For Strict Mode blockages
      return res.status(400).json({ error: err.message });
    }

    // 4. Derive Final Amounts
    const delivery_fee = validation.deliveryFee;
    const commission_percent = Number(rule.commission_percent);
    const total_payable = order_value + delivery_fee;

    res.status(200).json({
      order_value,
      delivery_fee,
      is_small_order: validation.isSmallOrder,
      commission_percent,
      total_payable
    });

  } catch (error) {
    console.error("Cart Calculation Error:", error);
    res.status(500).json({ error: 'Server error during calculation' });
  }
};

module.exports = { calculateCart };
