const { Product, Shop } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const ImageUploadService = require('../services/ImageUploadService');
const BulkUploadService = require('../services/BulkUploadService');

const getMyProducts = catchAsync(async (req, res, next) => {
    const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
    if (!shop) return next(new AppError('Shop not found', 404));

    const products = await Product.findAll({ where: { shop_id: shop.id } });
    res.json(products);
});

const addProduct = catchAsync(async (req, res, next) => {
    const { name, price, description, image_url, is_available } = req.body;
    
    if (!name || name.trim().length > 100) return next(new AppError('Product name must be 1-100 characters', 400));
    if (price === undefined || Number(price) < 0) return next(new AppError('Price must be 0 or greater', 400));
    if (description && description.length > 1000) return next(new AppError('Description must be under 1000 characters', 400));
    
    const stock_quantity = req.body.stock_quantity ? parseInt(req.body.stock_quantity, 10) : 0;
    if (stock_quantity < 0) return next(new AppError('Stock must be 0 or greater', 400));

    const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
    if (!shop) return next(new AppError('Shop not found', 404));

    const product = await Product.create({
        shop_id: shop.id,
        name,
        price,
        description,
        image_url,
        is_available: is_available !== undefined ? is_available : true,
        stock_quantity,
    });

    res.status(201).json(product);
});

const updateProduct = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { name, price, description } = req.body;

    if (name !== undefined && (name.trim() === '' || name.trim().length > 100)) return next(new AppError('Product name must be 1-100 characters', 400));
    if (price !== undefined && Number(price) < 0) return next(new AppError('Price must be 0 or greater', 400));
    if (description !== undefined && description.length > 1000) return next(new AppError('Description must be under 1000 characters', 400));
    if (req.body.stock_quantity !== undefined && parseInt(req.body.stock_quantity, 10) < 0) return next(new AppError('Stock must be 0 or greater', 400));

    const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
    if (!shop) return next(new AppError('Shop not found', 404));

    const product = await Product.findOne({ where: { id, shop_id: shop.id } });
    if (!product) return next(new AppError('Product not found', 404));

    await product.update(req.body);
    res.json({ message: 'Product updated', product });
});

const deleteProduct = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
    if (!shop) return next(new AppError('Shop not found', 404));

    const product = await Product.findOne({ where: { id, shop_id: shop.id } });
    if (!product) return next(new AppError('Product not found', 404));

    await product.destroy();
    res.json({ message: 'Product deleted' });
});

const uploadProductImages = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
    if (!shop) return next(new AppError('Shop not found', 404));

    const product = await Product.findOne({ where: { id, shop_id: shop.id } });
    if (!product) return next(new AppError('Product not found', 404));

    let currentImages = [];
    if (Array.isArray(product.images)) {
        currentImages = product.images;
    } else if (typeof product.images === 'string') {
         try {
            const parsed = JSON.parse(product.images);
            currentImages = Array.isArray(parsed) ? parsed : [];
         } catch (e) {
            currentImages = product.images ? [product.images] : [];
         }
    }

    // Since productRoutes now uses uploadProductBulk fields, files will be in req.files['images']
    const incomingImages = (req.files && req.files['images']) ? req.files['images'] : [];

    if (!incomingImages || incomingImages.length === 0) {
        return next(new AppError('No images provided', 400));
    }

    if (currentImages.length + incomingImages.length > 2) {
        return next(new AppError(`Limit reached. You can have max 2 images. Currently have ${currentImages.length}.`, 400));
    }

    const processedImages = await ImageUploadService.processImages(incomingImages, `prod-${product.id}`, `shops/${shop.id}/products/${product.id}`, 800, 800);

    const newImages = [...currentImages, ...processedImages];
    product.images = newImages;

    if (!product.image_url && newImages.length > 0) {
        product.image_url = newImages[0];
    }

    await product.save();
    res.json({ message: 'Images uploaded', images: product.images, image_url: product.image_url });
});

const deleteProductImage = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { imageUrl } = req.body;
    
    if (!imageUrl) return next(new AppError('Image URL is required', 400));

    const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
    if (!shop) return next(new AppError('Shop not found', 404));

    const product = await Product.findOne({ where: { id, shop_id: shop.id } });
    if (!product) return next(new AppError('Product not found', 404));

    let currentImages = Array.isArray(product.images) ? product.images : [];
    
    if (typeof product.images === 'string') {
         try {
            const parsed = JSON.parse(product.images);
            currentImages = Array.isArray(parsed) ? parsed : [];
         } catch (e) {
            currentImages = product.images ? [product.images] : [];
         }
    }

    if (!currentImages.includes(imageUrl)) {
        return next(new AppError('Image not found in product gallery', 404));
    }

    const updatedImages = currentImages.filter(img => img !== imageUrl);
    product.images = updatedImages;

    if (product.image_url === imageUrl) {
        product.image_url = updatedImages.length > 0 ? updatedImages[0] : null;
    }

    await product.save();

    ImageUploadService.deleteImage(imageUrl, `shops/${shop.id}/products/${product.id}`);

    res.json({ message: 'Image deleted', images: product.images, image_url: product.image_url });
});

const bulkUploadProducts = catchAsync(async (req, res, next) => {
    const csvFile = req.files && req.files['csv'] ? req.files['csv'][0] : null;
    const zipFile = req.files && req.files['imagesZip'] ? req.files['imagesZip'][0] : null;

    if (!csvFile || !zipFile) {
        return next(new AppError('Both CSV and ZIP files are required', 400));
    }

    let targetShopId;
    if (req.user.role === 'admin') {
        targetShopId = req.body.target_shop_id;
        if (!targetShopId) return next(new AppError('target_shop_id is required for admins', 400));
    } else {
        const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
        if (!shop) return next(new AppError('Shop not found', 404));
        targetShopId = shop.id;
    }

    const result = await BulkUploadService.processBulkUpload(targetShopId, csvFile, zipFile);
    
    res.json({
        message: `Bulk upload completed. ${result.successCount} products added.`,
        successCount: result.successCount,
        errorCount: result.errorCount,
        errors: result.errors
    });
});

module.exports = { getMyProducts, addProduct, updateProduct, deleteProduct, uploadProductImages, deleteProductImage, bulkUploadProducts };
