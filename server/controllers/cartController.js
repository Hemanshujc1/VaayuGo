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

    const Decimal = require('decimal.js');
    
    // 1. Calculate Base Order Value
    const subtotal_amount = new Decimal(items.reduce((sum, item) => sum + (item.price * item.quantity), 0));
    
    // Resolve dynamic discounts
    const discountData = await resolveDiscounts(location_id, shop_id, category, subtotal_amount.toNumber(), items);
    let shop_discount_amount = new Decimal(discountData.shop_discount_amount || 0);
    let platform_discount_amount = new Decimal(discountData.platform_discount_amount || 0);
    let product_discount_amount = new Decimal(discountData.product_discount_amount || 0);
    const applied_rules = discountData.applied_rules;

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
      validation = validateOrderAgainstRule(subtotal_amount.minus(product_discount_amount).toNumber(), rule);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    // 4. Derive Final Amounts
    const delivery_fee = new Decimal(validation.deliveryFee || 0);
    const extra_charge = validation.isSmallOrder ? new Decimal(validation.extraCharge || 0) : new Decimal(0);
    const commission_percent = new Decimal(rule.commission_percent || 0);
    
    // Calculate commission item by item
    let total_commission = new Decimal(0);
    if (discountData.itemBreakdown) {
      total_commission = discountData.itemBreakdown.reduce((sum, item) => {
          const base = new Decimal(item.gross).minus(item.product_discount).minus(item.shop_discount);
          return sum.plus(base.times(commission_percent.div(100)));
      }, new Decimal(0));
    } else {
        const commission_base = subtotal_amount.minus(shop_discount_amount).minus(product_discount_amount);
        total_commission = commission_base.times(commission_percent.div(100));
    }
    
    total_commission = total_commission.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    // Platform Revenue Protection Logic
    let platform_delivery_share = new Decimal(rule.vaayugo_delivery_share || 0);
    let platform_small_order_share = new Decimal(0);
    if (validation.isSmallOrder) {
        platform_small_order_share = new Decimal(rule.small_order_platform_share || 0);
    }

    // Free delivery override (sync with OrderService)
    if (validation.deliveryFee === 0) {
        platform_delivery_share = new Decimal(0);
        platform_small_order_share = new Decimal(0);
    }

    // Platform Net Revenue = (Commission) + (Delivery Platform Share) + (Extra Charges Platform small order) - (Platform Discount)
    let platform_net_revenue = total_commission
        .plus(platform_delivery_share)
        .plus(platform_small_order_share)
        .minus(platform_discount_amount);

    const min_revenue_threshold = new Decimal(rule.min_platform_revenue || 0);
    if (platform_net_revenue.lessThan(min_revenue_threshold)) {
        const shortfall = min_revenue_threshold.minus(platform_net_revenue);
        const adjusted_platform_discount = platform_discount_amount.minus(shortfall).greaterThan(0) 
            ? platform_discount_amount.minus(shortfall) 
            : new Decimal(0);
        
        platform_discount_amount = adjusted_platform_discount;
        
        // Final net revenue after adjustment
        platform_net_revenue = total_commission
            .plus(platform_delivery_share)
            .plus(platform_small_order_share)
            .minus(platform_discount_amount);
    }

    const final_payable_amount = subtotal_amount.minus(shop_discount_amount).minus(platform_discount_amount).minus(product_discount_amount);
    const shop_settlement_amount = subtotal_amount.minus(shop_discount_amount).minus(product_discount_amount).minus(total_commission).plus(validation.deliveryFee - platform_delivery_share.toNumber()).plus(validation.isSmallOrder ? (validation.extraCharge - platform_small_order_share.toNumber()) : 0);

    // 5. Integrate Customer Penalties
    let penalty_charges = new Decimal(0);
    if (req.user && req.user.id) {
      const { Penalty } = require('../models');
      const pendingPenalties = await Penalty.findAll({
        where: {
          target_type: 'customer',
          target_id: req.user.id,
          status: 'pending',
          is_reversed: false
        }
      });
      penalty_charges = pendingPenalties.reduce((sum, p) => sum.plus(new Decimal(p.amount)), new Decimal(0));
    }

    const total_payable = final_payable_amount.plus(delivery_fee).plus(extra_charge).plus(penalty_charges);

    res.status(200).json({
      subtotal_amount: subtotal_amount.toNumber(),
      shop_discount_amount: shop_discount_amount.toNumber(),
      product_discount_amount: product_discount_amount.toNumber(),
      platform_discount_amount: platform_discount_amount.toNumber(),
      final_payable_amount: final_payable_amount.toNumber(),
      delivery_fee: delivery_fee.toNumber(),
      extra_charge: extra_charge.toNumber(),
      penalty_charges: penalty_charges.toNumber(),
      is_small_order: validation.isSmallOrder,
      commission_amount: total_commission.toNumber(),
      shop_settlement_amount: shop_settlement_amount.toNumber(),
      total_payable: total_payable.toNumber(),
      applied_rules,
      min_order_value: rule.min_order_value,
      free_delivery_min_order: rule.free_delivery_min_order
    });

  } catch (error) {
    console.error("Cart Calculation Error:", error);
    res.status(500).json({ error: 'Server error during calculation' });
  }
};

module.exports = { calculateCart };
