const { DeliveryRule, Shop, Location } = require('../models/index');

// @desc    Get all delivery rules
// @route   GET /api/admin/delivery-rules
// @access  Private (Admin)
const getDeliveryRules = async (req, res) => {
    try {
        const rules = await DeliveryRule.findAll({
            include: [
                { model: Shop, attributes: ['id', 'name'] }
                // { model: Location, attributes: ['id', 'name'] } // If Location model gets added to src/models/index.js later
            ],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(rules);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching delivery rules', error: error.message });
    }
};

// @desc    Create a new delivery rule
// @route   POST /api/admin/delivery-rules
// @access  Private (Admin)
const createDeliveryRule = async (req, res) => {
    try {
        const { 
            location_id, category, shop_id,
            delivery_fee, shop_delivery_share, vaayugo_delivery_share,
            commission_percent, min_order_value, small_order_delivery_fee,
            is_active
        } = req.body;

        // Validation
        if (!location_id) return res.status(400).json({ message: 'Location ID is required' });
        
        const totalShare = Number(shop_delivery_share) + Number(vaayugo_delivery_share);
        if (Number(delivery_fee) !== totalShare) {
            return res.status(400).json({ message: 'Delivery fee must equal shop share + vaayugo share' });
        }

        if (small_order_delivery_fee !== null && small_order_delivery_fee !== undefined) {
            if (Number(small_order_delivery_fee) < Number(delivery_fee)) {
                return res.status(400).json({ message: 'Small order fee cannot be less than standard delivery fee' });
            }
        }

        const newRule = await DeliveryRule.create({
            location_id, category: category || null, shop_id: shop_id || null,
            delivery_fee, shop_delivery_share, vaayugo_delivery_share,
            commission_percent, min_order_value, small_order_delivery_fee,
            is_active
        });

        res.status(201).json({ message: 'Delivery rule created successfully', rule: newRule });
    } catch (error) {
        res.status(400).json({ message: 'Error creating delivery rule', error: error.message });
    }
};

// @desc    Update a delivery rule
// @route   PUT /api/admin/delivery-rules/:id
// @access  Private (Admin)
const updateDeliveryRule = async (req, res) => {
    try {
        const { id } = req.params;
        const rule = await DeliveryRule.findByPk(id);

        if (!rule) {
            return res.status(404).json({ message: 'Delivery rule not found' });
        }

        const { 
            location_id, category, shop_id,
            delivery_fee, shop_delivery_share, vaayugo_delivery_share,
            commission_percent, min_order_value, small_order_delivery_fee,
            is_active
        } = req.body;

        // Validation
        const totalShare = Number(shop_delivery_share) + Number(vaayugo_delivery_share);
        if (Number(delivery_fee) !== totalShare) {
            return res.status(400).json({ message: 'Delivery fee must equal shop share + vaayugo share' });
        }

        if (small_order_delivery_fee !== null && small_order_delivery_fee !== undefined) {
            if (Number(small_order_delivery_fee) < Number(delivery_fee)) {
                return res.status(400).json({ message: 'Small order fee cannot be less than standard delivery fee' });
            }
        }

        await rule.update({
            location_id, category: category || null, shop_id: shop_id || null,
            delivery_fee, shop_delivery_share, vaayugo_delivery_share,
            commission_percent, min_order_value, small_order_delivery_fee,
            is_active: is_active !== undefined ? is_active : rule.is_active
        });

        res.status(200).json({ message: 'Delivery rule updated successfully', rule });
    } catch (error) {
        res.status(400).json({ message: 'Error updating delivery rule', error: error.message });
    }
};

// @desc    Delete a delivery rule
// @route   DELETE /api/admin/delivery-rules/:id
// @access  Private (Admin)
const deleteDeliveryRule = async (req, res) => {
    try {
        const { id } = req.params;
        const rule = await DeliveryRule.findByPk(id);

        if (!rule) {
            return res.status(404).json({ message: 'Delivery rule not found' });
        }

        await rule.destroy();
        res.status(200).json({ message: 'Delivery rule deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting delivery rule', error: error.message });
    }
};

module.exports = {
    getDeliveryRules,
    createDeliveryRule,
    updateDeliveryRule,
    deleteDeliveryRule
};
