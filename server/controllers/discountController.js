const { DiscountRule, Shop, Location } = require('../models');

// @desc    Create a new discount rule
// @route   POST /api/discounts
// @access  Private (Admin or Shopkeeper)
const createDiscount = async (req, res) => {
    try {
        const { name, type, value, max_discount_amount, min_order_value, target_type, target_id, valid_from, valid_until } = req.body;
        
        let creator_type = 'CUSTOMER';
        if (req.user.role === 'admin') creator_type = 'ADMIN';
        if (req.user.role === 'shopkeeper') creator_type = 'SHOP';

        if (creator_type === 'CUSTOMER') {
            return res.status(403).json({ message: 'Unauthorized to create discounts' });
        }

        // --- Value Validations ---
        if (!name || name.trim().length < 3 || name.trim().length > 50) {
            return res.status(400).json({ message: 'Discount name must be between 3 and 50 characters' });
        }

        if (Number(value) <= 0) {
            return res.status(400).json({ message: 'Discount value must be greater than zero' });
        }

        if (type === 'PERCENTAGE' && Number(value) > 100) {
            return res.status(400).json({ message: 'Percentage discount cannot exceed 100%' });
        }

        if (max_discount_amount && Number(max_discount_amount) < 0) {
            return res.status(400).json({ message: 'Max discount amount cannot be negative' });
        }

        if (min_order_value && Number(min_order_value) < 0) {
            return res.status(400).json({ message: 'Minimum order value cannot be negative' });
        }

        if (valid_from && valid_until && new Date(valid_from) >= new Date(valid_until)) {
            return res.status(400).json({ message: 'Valid until date must be after valid from date' });
        }
        // -------------------------

        // Shopkeeper constraints
        if (creator_type === 'SHOP') {
            const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
            if (!shop) return res.status(404).json({ message: 'Shop not found' });
            
            // A shop can only create discounts for itself or its specific products
            if (target_type !== 'SHOP' && target_type !== 'PRODUCT') {
                return res.status(400).json({ message: 'Shops can only create SHOP or PRODUCT level discounts' });
            }
            
            // If targeting SHOP, it must be their own shop
            if (target_type === 'SHOP' && Number(target_id) !== shop.id) {
                return res.status(403).json({ message: 'Cannot create discount for another shop' });
            }
        }

        const rule = await DiscountRule.create({
            name,
            type,
            value,
            max_discount_amount: max_discount_amount || null,
            min_order_value: min_order_value || null,
            creator_type,
            creator_id: req.user.id,
            target_type,
            target_id: target_id || null,
            valid_from: valid_from || null,
            valid_until: valid_until || null,
            is_active: true
        });

        res.status(201).json({ message: 'Discount rule created successfully', rule });
    } catch (error) {
        console.error("Create discount error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get discount rules based on role
// @route   GET /api/discounts
// @access  Private (Admin or Shopkeeper)
const getDiscounts = async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            // Admin sees all discounts
            const rules = await DiscountRule.findAll({ order: [['createdAt', 'DESC']] });
            return res.json(rules);
        } else if (req.user.role === 'shopkeeper') {
            // Shopkeeper sees only their own discounts
            const rules = await DiscountRule.findAll({
                where: { creator_type: 'SHOP', creator_id: req.user.id },
                order: [['createdAt', 'DESC']]
            });
            return res.json(rules);
        } else {
            return res.status(403).json({ message: 'Unauthorized' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Toggle discount active state
// @route   PUT /api/discounts/:id/toggle
// @access  Private
const toggleDiscount = async (req, res) => {
    try {
        const rule = await DiscountRule.findByPk(req.params.id);
        if (!rule) return res.status(404).json({ message: 'Discount rule not found' });

        // Admin can toggle any, Shop can only toggle their own
        if (req.user.role !== 'admin' && (rule.creator_type !== 'SHOP' || rule.creator_id !== req.user.id)) {
            return res.status(403).json({ message: 'Unauthorized to modify this rule' });
        }

        rule.is_active = !rule.is_active;
        await rule.save();
        res.json({ message: `Discount ${rule.is_active ? 'activated' : 'deactivated'}`, rule });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete a discount rule
// @route   DELETE /api/discounts/:id
// @access  Private
const deleteDiscount = async (req, res) => {
    try {
        const rule = await DiscountRule.findByPk(req.params.id);
        if (!rule) return res.status(404).json({ message: 'Discount rule not found' });

        if (req.user.role !== 'admin' && (rule.creator_type !== 'SHOP' || rule.creator_id !== req.user.id)) {
            return res.status(403).json({ message: 'Unauthorized to delete this rule' });
        }

        await rule.destroy();
        res.json({ message: 'Discount rule deleted securely' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update a discount rule
// @route   PUT /api/discounts/:id
// @access  Private (Admin or Shopkeeper)
const editDiscount = async (req, res) => {
    try {
        const rule = await DiscountRule.findByPk(req.params.id);
        if (!rule) return res.status(404).json({ message: 'Discount rule not found' });

        if (req.user.role !== 'admin' && (rule.creator_type !== 'SHOP' || rule.creator_id !== req.user.id)) {
            return res.status(403).json({ message: 'Unauthorized to modify this rule' });
        }

        const { name, type, value, max_discount_amount, min_order_value, valid_from, valid_until } = req.body;

        if (name !== undefined && (name.trim().length < 3 || name.trim().length > 50)) {
            return res.status(400).json({ message: 'Discount name must be between 3 and 50 characters' });
        }
        if (Number(value) <= 0) {
            return res.status(400).json({ message: 'Discount value must be greater than zero' });
        }
        if (type === 'PERCENTAGE' && Number(value) > 100) {
            return res.status(400).json({ message: 'Percentage discount cannot exceed 100%' });
        }
        if (valid_from && valid_until && new Date(valid_from) >= new Date(valid_until)) {
            return res.status(400).json({ message: 'Valid until date must be after valid from date' });
        }

        await rule.update({
            name,
            type,
            value,
            max_discount_amount: max_discount_amount || null,
            min_order_value: min_order_value || null,
            valid_from: valid_from || null,
            valid_until: valid_until || null
        });

        res.json({ message: 'Discount rule updated successfully', rule });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    createDiscount,
    getDiscounts,
    toggleDiscount,
    deleteDiscount,
    editDiscount
};
