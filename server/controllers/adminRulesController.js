const { DeliveryRule, Shop, Location } = require('../models/index');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// @desc    Get all delivery rules
// @route   GET /api/admin/delivery-rules
// @access  Private (Admin)
const getDeliveryRules = catchAsync(async (req, res, next) => {
    const rules = await DeliveryRule.findAll({
        include: [
            { model: Shop, attributes: ['id', 'name'] }
        ],
        order: [['createdAt', 'DESC']]
    });
    res.status(200).json(rules);
});

// @desc    Create a new delivery rule
// @route   POST /api/admin/delivery-rules
// @access  Private (Admin)
const createDeliveryRule = catchAsync(async (req, res, next) => {
    const { 
        location_id, category, shop_id,
        delivery_fee, shop_delivery_share, vaayugo_delivery_share,
        commission_percent, min_order_value, small_order_delivery_fee,
        is_active
    } = req.body;

    if (!location_id) return next(new AppError('Location ID is required', 400));
    
    if (Number(delivery_fee) < 0 || Number(shop_delivery_share) < 0 || Number(vaayugo_delivery_share) < 0) {
        return next(new AppError('Delivery fees and shares cannot be negative', 400));
    }

    const totalShare = Number(shop_delivery_share) + Number(vaayugo_delivery_share);
    if (Number(delivery_fee) !== totalShare) {
        return next(new AppError('Delivery fee must equal shop share + vaayugo share', 400));
    }

    if (commission_percent !== undefined && (Number(commission_percent) < 0 || Number(commission_percent) > 100)) {
        return next(new AppError('Commission percent must be between 0 and 100', 400));
    }

    if (small_order_delivery_fee !== null && small_order_delivery_fee !== undefined) {
        if (Number(small_order_delivery_fee) < Number(delivery_fee)) {
            return next(new AppError('Small order fee cannot be less than standard delivery fee', 400));
        }
    }

    const newRule = await DeliveryRule.create({
        location_id, category: category || null, shop_id: shop_id || null,
        delivery_fee, shop_delivery_share, vaayugo_delivery_share,
        commission_percent, min_order_value, small_order_delivery_fee,
        is_active
    });

    res.status(201).json({ message: 'Delivery rule created successfully', rule: newRule });
});

// @desc    Update a delivery rule
// @route   PUT /api/admin/delivery-rules/:id
// @access  Private (Admin)
const updateDeliveryRule = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const rule = await DeliveryRule.findByPk(id);

    if (!rule) {
        return next(new AppError('Delivery rule not found', 404));
    }

    const { 
        location_id, category, shop_id,
        delivery_fee, shop_delivery_share, vaayugo_delivery_share,
        commission_percent, min_order_value, small_order_delivery_fee,
        is_active
    } = req.body;

    if (Number(delivery_fee) < 0 || Number(shop_delivery_share) < 0 || Number(vaayugo_delivery_share) < 0) {
        return next(new AppError('Delivery fees and shares cannot be negative', 400));
    }

    const totalShare = Number(shop_delivery_share) + Number(vaayugo_delivery_share);
    if (Number(delivery_fee) !== totalShare) {
        return next(new AppError('Delivery fee must equal shop share + vaayugo share', 400));
    }

    if (commission_percent !== undefined && (Number(commission_percent) < 0 || Number(commission_percent) > 100)) {
        return next(new AppError('Commission percent must be between 0 and 100', 400));
    }

    if (small_order_delivery_fee !== null && small_order_delivery_fee !== undefined) {
        if (Number(small_order_delivery_fee) < Number(delivery_fee)) {
            return next(new AppError('Small order fee cannot be less than standard delivery fee', 400));
        }
    }

    await rule.update({
        location_id, category: category || null, shop_id: shop_id || null,
        delivery_fee, shop_delivery_share, vaayugo_delivery_share,
        commission_percent, min_order_value, small_order_delivery_fee,
        is_active: is_active !== undefined ? is_active : rule.is_active
    });

    res.status(200).json({ message: 'Delivery rule updated successfully', rule });
});

// @desc    Delete a delivery rule
// @route   DELETE /api/admin/delivery-rules/:id
// @access  Private (Admin)
const deleteDeliveryRule = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const rule = await DeliveryRule.findByPk(id);

    if (!rule) {
        return next(new AppError('Delivery rule not found', 404));
    }

    await rule.destroy();
    res.status(200).json({ message: 'Delivery rule deleted successfully' });
});

module.exports = {
    getDeliveryRules,
    createDeliveryRule,
    updateDeliveryRule,
    deleteDeliveryRule
};
