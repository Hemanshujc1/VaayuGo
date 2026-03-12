const { Shop, Order, OrderRevenueLog, Category, ShopCategory, Settlement } = require('../models');
const { Op } = require('sequelize');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const ImageUploadService = require('../services/ImageUploadService');
const EmailService = require('../services/EmailService');
const Decimal = require('decimal.js');

const registerShop = catchAsync(async (req, res, next) => {
    const { name, category, location_address, categoryIds, opening_time, closing_time, closed_days, break_start, break_end } = req.body;
    const owner_id = req.user.id;

    if (!name || name.trim().length < 3 || name.trim().length > 100) {
        return next(new AppError('Shop name must be between 3 and 100 characters', 400));
    }
    if (!location_address || location_address.trim().length < 10 || location_address.trim().length > 255) {
        return next(new AppError('Shop address must be between 10 and 255 characters', 400));
    }

    const existingShop = await Shop.findOne({ where: { owner_id } });
    if (existingShop) {
      return next(new AppError('You already have a shop registered', 400));
    }

    const newShop = await Shop.create({
      owner_id,
      name,
      category: category || (categoryIds && categoryIds.length > 0 ? 'Multi' : 'General'),
      location_address,
      status: 'pending',
      opening_time,
      closing_time,
      closed_days: closed_days || [],
      break_start,
      break_end
    });

    if (categoryIds && Array.isArray(categoryIds)) {
        const associations = categoryIds.map(catId => ({
            shop_id: newShop.id,
            category_id: catId
        }));
        await ShopCategory.bulkCreate(associations);
    }

    // Phase 5: Trigger Admin Approval Request Email
    try {
        const admins = await require('../models/User').findAll({
            where: { role: 'admin', is_blocked: false },
            attributes: ['email']
        });
        
        const adminEmails = admins.map(a => a.email).filter(Boolean);
        
        if (adminEmails.length > 0) {
            const user = await require('../models/User').findByPk(owner_id);
            const shopDetails = {
                ...newShop.toJSON(),
                User: user ? user.toJSON() : null,
                phone: user ? user.mobile_number : "N/A"
            };
            
            EmailService.sendAdminApprovalRequest(adminEmails, shopDetails).catch(console.error);
        }
    } catch (emailErr) {
        console.error("Failed to trigger admin approval email for new shop:", emailErr);
    }

    res.status(201).json({ message: 'Shop registered successfully. Waiting for Admin approval.', shop: newShop });
});

const getMyShop = catchAsync(async (req, res, next) => {
    const shop = await Shop.findOne({ 
        where: { owner_id: req.user.id },
        include: [Category]
    });
    if (!shop) return next(new AppError('Shop not found', 404));
    res.json(shop);
});

const getPublicShops = catchAsync(async (req, res, next) => {
    const shops = await Shop.findAll({ 
        where: { status: 'approved' },
        include: [Category] 
    });
    res.json(shops);
});

const toggleShopStatus = catchAsync(async (req, res, next) => {
    const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
    if (!shop) return next(new AppError('Shop not found', 404));

    if (shop.status !== 'approved') {
         return next(new AppError('Only approved shops can open/close.', 400));
    }

    shop.is_open = !shop.is_open;
    await shop.save();

    res.json({ message: `Shop is now ${shop.is_open ? 'Open' : 'Closed'}`, is_open: shop.is_open });
});

const getMyShopAnalytics = catchAsync(async (req, res, next) => {
    const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
    if (!shop) return next(new AppError('Shop not found', 404));

    const orders = await Order.findAll({
        where: { shop_id: shop.id },
        include: [{ model: OrderRevenueLog }],
    });

    let shopGrossSale = new Decimal(0);
    let shopNetSale = new Decimal(0);
    let deductedCommission = new Decimal(0);
    let extraCharges = new Decimal(0);
    let deliveryRevenue = new Decimal(0);
    let totalShopDiscounts = new Decimal(0);
    let totalCodCollected = new Decimal(0);
    let vaayugoCharges = new Decimal(0);

    let completedOrders = 0;
    let cancelledOrders = 0;
    let failedOrders = 0;
    let smallOrdersCount = 0;

    for (const o of orders) {
        if (o.status === 'cancelled') cancelledOrders++;
        else if (o.status === 'failed') failedOrders++;
        else if (o.status === 'delivered') {
            completedOrders++;
            const log = o.OrderRevenueLog;
            if (log) {
                const subtotal = new Decimal(log.subtotal || 0);
                const productDiscount = new Decimal(log.product_discount_amount || 0);
                const shopDiscount = new Decimal(log.shop_discount_amount || 0);
                
                const gmv = subtotal.minus(productDiscount);
                shopGrossSale = shopGrossSale.plus(gmv);
                
                totalShopDiscounts = totalShopDiscounts.plus(shopDiscount);
                shopNetSale = shopNetSale.plus(gmv.minus(shopDiscount));
                
                deductedCommission = deductedCommission.plus(log.commission_deducted || 0);
                extraCharges = extraCharges.plus(log.shop_small_order_share || 0);
                deliveryRevenue = deliveryRevenue.plus(log.shop_delivery_share || 0);
                
                const platCharges = new Decimal(log.commission_deducted || 0)
                    .plus(log.platform_delivery_share || 0)
                    .plus(log.platform_small_order_share || 0);
                
                vaayugoCharges = vaayugoCharges.plus(platCharges);

                if (o.payment_method === 'cod') {
                    totalCodCollected = totalCodCollected.plus(o.grand_total || 0);
                }
                
                if (log.is_small_order) smallOrdersCount++;
            }
        }
    }

    const shopGrossRevenue = shopNetSale.plus(deliveryRevenue).plus(extraCharges);
    const potentialRevenue = shopGrossSale.plus(deliveryRevenue).plus(extraCharges);
    const shopNetRevenue = shopGrossRevenue.minus(deductedCommission);

    const round2 = (val) => val.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();

    const aov = completedOrders > 0 ? round2(shopNetSale.dividedBy(completedOrders)) : 0;

    res.json({
        shopGrossSale: round2(shopGrossSale),
        shopNetSale: round2(shopNetSale),
        deductedCommission: round2(deductedCommission),
        extraCharges: round2(extraCharges),
        deliveryRevenue: round2(deliveryRevenue),
        vaayugoCharges: round2(vaayugoCharges),
        shopGrossRevenue: round2(shopGrossRevenue),
        totalShopDiscounts: round2(totalShopDiscounts),
        potentialRevenue: round2(potentialRevenue),
        shopNetRevenue: round2(shopNetRevenue), // Payout
        totalCodCollected: round2(totalCodCollected),
        
        totalOrders: orders.length,
        completedOrders,
        cancelledOrders,
        failedOrders,
        smallOrdersCount,
        aov
    });
});

const uploadShopImages = catchAsync(async (req, res, next) => {
    const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
    if (!shop) return next(new AppError('Shop not found', 404));

    const currentImages = shop.images || [];
    if (!req.files || req.files.length === 0) {
        return next(new AppError('No images provided', 400));
    }
    
    if (currentImages.length + req.files.length > 5) {
        return next(new AppError(`You can only upload up to 5 images. You currently have ${currentImages.length} images.`, 400));
    }

    const processedImages = await ImageUploadService.processImages(req.files, `shop-${shop.id}`, 'shopimages', 800, 800);

    shop.images = [...currentImages, ...processedImages];
    
    if (!shop.image_url && shop.images.length > 0) {
        shop.image_url = shop.images[0];
    }

    await shop.save();

    res.json({ message: 'Images uploaded successfully', images: shop.images });
});

const deleteShopImage = catchAsync(async (req, res, next) => {
    const { imageUrl } = req.body;
    if (!imageUrl) return next(new AppError('Image URL is required', 400));

    const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
    if (!shop) return next(new AppError('Shop not found', 404));

    const currentImages = shop.images || [];
    if (!currentImages.includes(imageUrl)) {
        return next(new AppError('Image not found in shop gallery', 404));
    }

    const updatedImages = currentImages.filter(img => img !== imageUrl);
    shop.images = updatedImages;

    if (shop.image_url === imageUrl) {
        shop.image_url = updatedImages.length > 0 ? updatedImages[0] : null;
    }

    await shop.save();

    ImageUploadService.deleteImage(imageUrl, 'shopimages');

    res.json({ message: 'Image deleted successfully', images: shop.images, image_url: shop.image_url });
});

const updateShopProfile = catchAsync(async (req, res, next) => {
    const { name, location_address, categoryIds, opening_time, closing_time, closed_days, break_start, break_end } = req.body;

    if (name !== undefined && (name.trim().length < 3 || name.trim().length > 100)) {
        return next(new AppError('Shop name must be between 3 and 100 characters', 400));
    }
    if (location_address !== undefined && (location_address.trim().length < 10 || location_address.trim().length > 255)) {
        return next(new AppError('Shop address must be between 10 and 255 characters', 400));
    }

    const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
    if (!shop) return next(new AppError('Shop not found', 404));

    if (name) shop.name = name;
    if (location_address) shop.location_address = location_address;
    if (opening_time !== undefined) shop.opening_time = opening_time;
    if (closing_time !== undefined) shop.closing_time = closing_time;
    if (closed_days !== undefined) shop.closed_days = closed_days;
    if (break_start !== undefined) shop.break_start = break_start;
    if (break_end !== undefined) shop.break_end = break_end;
    
    await shop.save();

    if (categoryIds && Array.isArray(categoryIds)) {
        await ShopCategory.destroy({ where: { shop_id: shop.id } });
        const associations = categoryIds.map(catId => ({
            shop_id: shop.id,
            category_id: catId
        }));
        await ShopCategory.bulkCreate(associations);
    }

    res.json({ message: 'Profile updated successfully', shop });
});

const getSettlements = catchAsync(async (req, res, next) => {
    const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
    if (!shop) return next(new AppError('Shop not found', 404));

    const settlements = await Settlement.findAll({
        where: { shop_id: shop.id },
        order: [['createdAt', 'DESC']]
    });
    res.json(settlements);
});

const getSettlementOrders = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
    if (!shop) return next(new AppError('Shop not found', 404));

    const orders = await Order.findAll({
        where: { settlement_id: id, shop_id: shop.id },
        attributes: ['id', 'grand_total', 'createdAt', 'status'],
        order: [['createdAt', 'DESC']]
    });
    res.json(orders);
});

module.exports = { 
    registerShop, 
    getMyShop, 
    getPublicShops, 
    toggleShopStatus, 
    uploadShopImages, 
    deleteShopImage, 
    getMyShopAnalytics,
    updateShopProfile,
    getSettlements,
    getSettlementOrders
};
