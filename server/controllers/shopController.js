const { Shop, Order, OrderRevenueLog, Category, ShopCategory } = require('../models');
const { Op } = require('sequelize');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const ImageUploadService = require('../services/ImageUploadService');

const registerShop = catchAsync(async (req, res, next) => {
    const { name, category, location_address, categoryIds } = req.body;
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
      status: 'pending'
    });

    if (categoryIds && Array.isArray(categoryIds)) {
        const associations = categoryIds.map(catId => ({
            shop_id: newShop.id,
            category_id: catId
        }));
        await ShopCategory.bulkCreate(associations);
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

    const ordersCount = await Order.count({ where: { shop_id: shop.id, status: 'delivered' } });
    
    const revenueLogs = await OrderRevenueLog.findAll({
        where: { shop_id: shop.id },
        include: [{
            model: Order,
            attributes: [],
            where: { status: 'delivered' }
        }],
        raw: true
    });

    let smallOrdersCount = 0;
    let revenueSum = 0;
    let grossSum = 0;
    let commSum = 0;
    let deliverySum = 0;

    revenueLogs.forEach(log => {
        if (log.is_small_order) smallOrdersCount++;
        revenueSum += Number(log.shop_final_earning || 0);
        grossSum += Number(log.order_value || 0);
        commSum += Number(log.commission_amount || 0);
        deliverySum += Number(log.shop_delivery_earned || 0);
    });
    
    res.json({
        ordersCount: ordersCount || 0,
        smallOrdersCount: smallOrdersCount || 0,
        netEarnings: revenueSum || 0,
        grossVolume: grossSum || 0,
        totalCommissionPaid: commSum || 0,
        deliveryEarnings: deliverySum || 0
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
    const { name, location_address, categoryIds } = req.body;

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

module.exports = { 
    registerShop, 
    getMyShop, 
    getPublicShops, 
    toggleShopStatus, 
    uploadShopImages, 
    deleteShopImage, 
    getMyShopAnalytics,
    updateShopProfile 
};
