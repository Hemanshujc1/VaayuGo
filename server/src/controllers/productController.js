const mult = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');
const csv = require('csv-parser');

const Product = require('../models/Product');
const Shop = require('../models/Shop');

const getMyProducts = async (req, res) => {
    try {
        const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
        if (!shop) return res.status(404).json({ message: 'Shop not found' });

        const products = await Product.findAll({ where: { shop_id: shop.id } });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products', error });
    }
};

const addProduct = async (req, res) => {
    try {
        const { name, price, description, image_url, is_available } = req.body;
        const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
        if (!shop) return res.status(404).json({ message: 'Shop not found' });

        const product = await Product.create({
            shop_id: shop.id,
            name,
            price,
            description,
            image_url,
            is_available: is_available !== undefined ? is_available : true,
            stock_quantity: req.body.stock_quantity || 0,
        });

        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error adding product', error });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
        if (!shop) return res.status(404).json({ message: 'Shop not found' });

        const product = await Product.findOne({ where: { id, shop_id: shop.id } });
        if (!product) return res.status(404).json({ message: 'Product not found' });

        await product.update(req.body);
        res.json({ message: 'Product updated', product });
    } catch (error) {
        res.status(500).json({ message: 'Error updating product', error });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
        if (!shop) return res.status(404).json({ message: 'Shop not found' });

        const product = await Product.findOne({ where: { id, shop_id: shop.id } });
        if (!product) return res.status(404).json({ message: 'Product not found' });

        await product.destroy();
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product', error });
    }
};

const storage = mult.memoryStorage();
const upload = mult({ 
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB for bulk uploads
}).fields([
    { name: 'images', maxCount: 2 },
    { name: 'csv', maxCount: 1 },
    { name: 'imagesZip', maxCount: 1 }
]);

const uploadProductImages = (req, res) => {
    upload(req, res, async (err) => {
        if (err) return res.status(400).json({ message: 'Upload error', error: err });

        try {
            const { id } = req.params;
            const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
            if (!shop) return res.status(404).json({ message: 'Shop not found' });

            const product = await Product.findOne({ where: { id, shop_id: shop.id } });
            if (!product) return res.status(404).json({ message: 'Product not found' });

            // Ensure Product images is array (handle legacy nulls/strings if any)
            let currentImages = [];
            if (Array.isArray(product.images)) {
                currentImages = product.images;
            } else if (typeof product.images === 'string') {
                 // Try parsing if stored as stringified JSON or treat as single item array if URL
                 try {
                    const parsed = JSON.parse(product.images);
                    currentImages = Array.isArray(parsed) ? parsed : [];
                 } catch (e) {
                    currentImages = product.images ? [product.images] : [];
                 }
            }

            // Check limit
            if (currentImages.length + req.files.length > 2) {
                return res.status(400).json({ 
                    message: `Limit reached. You can have max 2 images. Currently have ${currentImages.length}.` 
                });
            }

            const processedImages = [];
            const uploadDir = path.join(__dirname, `../../uploads/shops/${shop.id}/products/${product.id}`);

            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            for (const file of req.files) {
                const filename = `prod-${product.id}-${Date.now()}-${Math.round(Math.random() * 1000)}.webp`;
                const filepath = path.join(uploadDir, filename);

                // Compress to < 150KB
                // Strategy: Start with high quality, check size, reduce if needed.
                // Or use a pragmatic target quality/size. 
                // Sharp doesn't support "target size" directly easily without iteration.
                // We'll use a reasonable quality (70) and resize to reasonable max dimension (e.g. 800px) which usually fits 150KB for webp.
                
                let quality = 80;
                let buffer = await sharp(file.buffer)
                    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                    .webp({ quality })
                    .toBuffer();
                
                // Simple iterative compression if still too large (rare for 800px webp but possible)
                while (buffer.length > 150 * 1024 && quality > 10) {
                    quality -= 10;
                    buffer = await sharp(file.buffer)
                        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                        .webp({ quality })
                        .toBuffer();
                }

                fs.writeFileSync(filepath, buffer);
                processedImages.push(`/uploads/shops/${shop.id}/products/${product.id}/${filename}`);
            }

            // Update product
            const newImages = [...currentImages, ...processedImages];
            product.images = newImages;

            // Set primary image_url if not set
            if (!product.image_url && newImages.length > 0) {
                product.image_url = newImages[0];
            }

            await product.save();
            res.json({ message: 'Images uploaded', images: product.images, image_url: product.image_url });

        } catch (error) {
            res.status(500).json({ message: 'Error processing images', error });
        }
    });
};

const deleteProductImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { imageUrl } = req.body;
        
        const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
        if (!shop) return res.status(404).json({ message: 'Shop not found' });

        const product = await Product.findOne({ where: { id, shop_id: shop.id } });
        if (!product) return res.status(404).json({ message: 'Product not found' });

        let currentImages = Array.isArray(product.images) ? product.images : [];
        
        // Handle case where images might be stored differently or need parsing
        if (typeof product.images === 'string') {
             try {
                const parsed = JSON.parse(product.images);
                currentImages = Array.isArray(parsed) ? parsed : [];
             } catch (e) {
                currentImages = product.images ? [product.images] : [];
             }
        }

        if (!currentImages.includes(imageUrl)) {
            return res.status(404).json({ message: 'Image not found in product gallery' });
        }

        const updatedImages = currentImages.filter(img => img !== imageUrl);
        product.images = updatedImages;

        // Update primary image_url
        if (product.image_url === imageUrl) {
            product.image_url = updatedImages.length > 0 ? updatedImages[0] : null;
        }

        await product.save();

        // Delete file
        // Url: /uploads/shops/:shopId/products/:prodId/filename
        // Remove leading /uploads/shops/... to get relative path helper? 
        // Actually full path is known structure.
        
        // Determine file system path
        // url: /uploads/shops/1/products/5/abc.webp
        const relativePath = imageUrl.replace('/uploads', ''); 
        // File system path: .../server/uploads + relativePath
        const filePath = path.join(__dirname, '../../uploads', relativePath);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({ message: 'Image deleted', images: product.images, image_url: product.image_url });

    } catch (error) {
        res.status(500).json({ message: 'Error deleting image', error });
    }
};

const bulkUploadProducts = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) return res.status(400).json({ message: 'Upload error', error: err });
        
        const csvFile = req.files.find(f => f.fieldname === 'csv');
        const zipFile = req.files.find(f => f.fieldname === 'imagesZip');

        if (!csvFile || !zipFile) {
            return res.status(400).json({ message: 'Both CSV and ZIP files are required' });
        }

        let targetShopId;
        try {
            if (req.user.role === 'admin') {
                targetShopId = req.body.target_shop_id;
                if (!targetShopId) return res.status(400).json({ message: 'target_shop_id is required for admins' });
            } else {
                const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
                if (!shop) return res.status(404).json({ message: 'Shop not found' });
                targetShopId = shop.id;
            }

            const zip = new AdmZip(zipFile.buffer);
            const zipEntries = zip.getEntries();
            const imageMap = {};
            zipEntries.forEach(entry => {
                if (!entry.isDirectory) {
                    imageMap[entry.entryName] = entry.getData();
                }
            });

            const results = [];
            const errors = [];
            let successCount = 0;

            const stream = require('stream');
            const bufferStream = new stream.PassThrough();
            bufferStream.end(csvFile.buffer);

            const parseCsv = () => {
                return new Promise((resolve) => {
                    const rows = [];
                    bufferStream
                        .pipe(csv())
                        .on('data', (data) => rows.push(data))
                        .on('end', () => resolve(rows));
                });
            };

            const rows = await parseCsv();

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const rowNum = i + 1;
                const { 
                    'Product Name': name, 
                    'Price': price, 
                    'Stock Qty': stock_quantity, 
                    'Description': description,
                    'Image 1 Filename': img1,
                    'Image 2 Filename': img2
                } = row;

                if (!name || !price) {
                    errors.push(`Row ${rowNum}: Product Name and Price are required.`);
                    continue;
                }

                try {
                    const product = await Product.create({
                        shop_id: targetShopId,
                        name,
                        price: parseFloat(price),
                        description: description || '',
                        stock_quantity: parseInt(stock_quantity) || 0,
                        is_available: (parseInt(stock_quantity) || 0) > 0,
                        images: []
                    });

                    const processedImages = [];
                    const uploadDir = path.join(__dirname, `../../uploads/shops/${targetShopId}/products/${product.id}`);
                    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

                    const imagesToProcess = [img1, img2].filter(Boolean);
                    for (const imgName of imagesToProcess) {
                        const imgBuffer = imageMap[imgName];
                        if (!imgBuffer) {
                            errors.push(`Row ${rowNum}: Image ${imgName} not found in ZIP.`);
                            continue;
                        }

                        // Check size limit (150KB)
                        if (imgBuffer.length > 150 * 1024) {
                            // Try to compress
                            let quality = 70;
                            let compressed = await sharp(imgBuffer)
                                .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                                .webp({ quality })
                                .toBuffer();
                            
                            if (compressed.length > 150 * 1024) {
                                errors.push(`Row ${rowNum}: Image ${imgName} exceeds 150KB even after compression.`);
                                continue;
                            }
                            const filename = `prod-${product.id}-${Date.now()}-${Math.round(Math.random() * 1000)}.webp`;
                            fs.writeFileSync(path.join(uploadDir, filename), compressed);
                            processedImages.push(`/uploads/shops/${targetShopId}/products/${product.id}/${filename}`);
                        } else {
                            // Convert to webp anyway for consistency
                            const compressed = await sharp(imgBuffer)
                                .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                                .webp({ quality: 80 })
                                .toBuffer();
                            const filename = `prod-${product.id}-${Date.now()}-${Math.round(Math.random() * 1000)}.webp`;
                            fs.writeFileSync(path.join(uploadDir, filename), compressed);
                            processedImages.push(`/uploads/shops/${targetShopId}/products/${product.id}/${filename}`);
                        }
                    }

                    product.images = processedImages;
                    if (processedImages.length > 0) product.image_url = processedImages[0];
                    await product.save();
                    successCount++;

                } catch (rowErr) {
                    errors.push(`Row ${rowNum}: Internal error - ${rowErr.message}`);
                }
            }

            res.json({
                message: `Bulk upload completed. ${successCount} products added.`,
                successCount,
                errorCount: errors.length,
                errors
            });

        } catch (error) {
            res.status(500).json({ message: 'Error processing bulk upload', error: error.message });
        }
    });
};

module.exports = { getMyProducts, addProduct, updateProduct, deleteProduct, uploadProductImages, deleteProductImage, bulkUploadProducts };

