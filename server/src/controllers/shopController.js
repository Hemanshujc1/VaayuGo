const { Shop, Order, OrderRevenueLog } = require('../models');
const { Op } = require('sequelize');

const registerShop = async (req, res) => {
  try {
    const { name, category, location_address } = req.body;
    const owner_id = req.user.id; // From Auth Middleware

    // Check if user already has a shop? (Optional: 1 shop per user logic)
    const existingShop = await Shop.findOne({ where: { owner_id } });
    if (existingShop) {
      return res.status(400).json({ message: 'You already have a shop registered' });
    }

    const newShop = await Shop.create({
      owner_id,
      name,
      category,
      location_address,
      status: 'pending'
    });

    res.status(201).json({ message: 'Shop registered successfully. Waiting for Admin approval.', shop: newShop });
  } catch (error) {
    res.status(500).json({ message: 'Error registering shop', error });
  }
};

const getMyShop = async (req, res) => {
    try {
        const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
        if (!shop) return res.status(404).json({ message: 'Shop not found' });
        res.json(shop);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching shop', error });
    }
}

const getPublicShops = async (req, res) => {
    try {
        // Enforce visibility rule: Only Approved shops
        const shops = await Shop.findAll({ where: { status: 'approved' } });
        res.json(shops);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching shops', error });
    }
};

const toggleShopStatus = async (req, res) => {
    try {
        const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
        if (!shop) return res.status(404).json({ message: 'Shop not found' });

        if (shop.status !== 'approved') {
             return res.status(400).json({ message: 'Only approved shops can open/close.' });
        }

        shop.is_open = !shop.is_open;
        await shop.save();

        res.json({ message: `Shop is now ${shop.is_open ? 'Open' : 'Closed'}`, is_open: shop.is_open });
    } catch (error) {
        res.status(500).json({ message: 'Error toggling shop status', error });
    }
};

const getMyShopAnalytics = async (req, res) => {
    try {
        const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
        if (!shop) return res.status(404).json({ message: 'Shop not found' });

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

    } catch (error) {
        res.status(500).json({ message: 'Error fetching shop analytics', error });
    }
};

const mult = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Multer Storage (Memory for processing with Sharp)
const storage = mult.memoryStorage();
const upload = mult({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max input, will compress later
}).array('images', 5); // Max 5 images

const uploadShopImages = (req, res) => {
    upload(req, res, async (err) => {
        if (err) return res.status(400).json({ message: 'Upload error', error: err });
        
        try {
            const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
            if (!shop) return res.status(404).json({ message: 'Shop not found' });

            const currentImages = shop.images || [];
            if (currentImages.length + req.files.length > 5) {
                return res.status(400).json({ 
                    message: `You can only upload up to 5 images. You currently have ${currentImages.length} images.` 
                });
            }

            const processedImages = [];
            const uploadDir = path.join(__dirname, '../../uploads/shopimages');

            // Ensure dir exists
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            for (const file of req.files) {
                const filename = `shop-${shop.id}-${Date.now()}-${Math.round(Math.random() * 1000)}.webp`;
                const filepath = path.join(uploadDir, filename);

                await sharp(file.buffer)
                    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                    .webp({ quality: 80 }) // WebP compression
                    .toFile(filepath);
                
                // Check size (sanity check, usually < 100KB with these settings)
                const stats = fs.statSync(filepath);
                if (stats.size > 450 * 1024) {
                     // Re-compress if strict limit needed (rarely needed with WebP 800px)
                     // console.warn('Image still > 450KB', filename);
                }

                processedImages.push(`/uploads/shopimages/${filename}`);
            }

            // Update Shop model
            // Append to existing
            
            // let currentImages = shop.images || []; // Already defined above
            // if (currentImages.length + processedImages.length > 5) ... // Check already done


            shop.images = [...currentImages, ...processedImages];
            
            // If no primary image, set first one
            if (!shop.image_url && shop.images.length > 0) {
                shop.image_url = shop.images[0];
            }

            await shop.save();

            res.json({ message: 'Images uploaded successfully', images: shop.images });

        } catch (error) {
             res.status(500).json({ message: 'Error processing images', error });
        }
    });
};

const deleteShopImage = async (req, res) => {
    try {
        const { imageUrl } = req.body;
        if (!imageUrl) return res.status(400).json({ message: 'Image URL is required' });

        const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
        if (!shop) return res.status(404).json({ message: 'Shop not found' });

        const currentImages = shop.images || [];
        if (!currentImages.includes(imageUrl)) {
            return res.status(404).json({ message: 'Image not found in shop gallery' });
        }

        // Remove from array
        const updatedImages = currentImages.filter(img => img !== imageUrl);
        shop.images = updatedImages;

        // If deleted image was primary, set new primary
        if (shop.image_url === imageUrl) {
            shop.image_url = updatedImages.length > 0 ? updatedImages[0] : null;
        }

        await shop.save();

        // Attempt to delete file from disk
        // imageUrl: /uploads/shopimages/filename.webp
        const relativePath = imageUrl.replace('/uploads/shopimages/', '');
        const filePath = path.join(__dirname, '../../uploads/shopimages', relativePath);
        
        fs.unlink(filePath, (err) => {
            if (err) console.error("Failed to delete local file:", err);
            else console.log("Deleted local file:", filePath);
        });

        res.json({ message: 'Image deleted successfully', images: shop.images, image_url: shop.image_url });

    } catch (error) {
        res.status(500).json({ message: 'Error deleting image', error });
    }
};

module.exports = { registerShop, getMyShop, getPublicShops, toggleShopStatus, uploadShopImages, deleteShopImage, getMyShopAnalytics };
