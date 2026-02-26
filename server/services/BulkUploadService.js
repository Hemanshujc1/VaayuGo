const AdmZip = require('adm-zip');
const csv = require('csv-parser');
const stream = require('stream');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { Product } = require('../models');

class BulkUploadService {
    static async parseCsvBuffer(bufferStream) {
        return new Promise((resolve, reject) => {
            const rows = [];
            bufferStream
                .pipe(csv())
                .on('data', (data) => rows.push(data))
                .on('end', () => resolve(rows))
                .on('error', (err) => reject(err));
        });
    }

    static async processBulkUpload(targetShopId, csvFile, zipFile) {
        const zip = new AdmZip(zipFile.buffer);
        const zipEntries = zip.getEntries();
        const imageMap = {};
        
        zipEntries.forEach(entry => {
            if (!entry.isDirectory) {
                imageMap[entry.entryName] = entry.getData();
            }
        });

        const errors = [];
        let successCount = 0;

        const bufferStream = new stream.PassThrough();
        bufferStream.end(csvFile.buffer);

        const rows = await this.parseCsvBuffer(bufferStream);

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
                const stock = parseInt(stock_quantity) || 0;
                const product = await Product.create({
                    shop_id: targetShopId,
                    name,
                    price: parseFloat(price),
                    description: description || '',
                    stock_quantity: stock,
                    is_available: stock > 0,
                    images: []
                });

                const processedImages = [];
                const uploadDir = path.join(__dirname, `../../uploads/shops/${targetShopId}/products/${product.id}`);
                
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                const imagesToProcess = [img1, img2].filter(Boolean);
                
                for (const imgName of imagesToProcess) {
                    const imgBuffer = imageMap[imgName];
                    if (!imgBuffer) {
                        errors.push(`Row ${rowNum}: Image ${imgName} not found in ZIP.`);
                        continue;
                    }

                    // Strict sizing rules
                    let buffer = imgBuffer;
                    let quality = 80;

                    // Convert and compress to WebP
                    buffer = await sharp(buffer)
                        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                        .webp({ quality })
                        .toBuffer();

                    // Ensure < 150KB
                    while (buffer.length > 150 * 1024 && quality > 10) {
                        quality -= 10;
                        buffer = await sharp(imgBuffer)
                            .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                            .webp({ quality })
                            .toBuffer();
                    }

                    if (buffer.length > 150 * 1024) {
                        errors.push(`Row ${rowNum}: Image ${imgName} exceeds 150KB even after compression.`);
                        continue;
                    }

                    const filename = `prod-${product.id}-${Date.now()}-${Math.round(Math.random() * 1000)}.webp`;
                    fs.writeFileSync(path.join(uploadDir, filename), buffer);
                    processedImages.push(`/uploads/shops/${targetShopId}/products/${product.id}/${filename}`);
                }

                product.images = processedImages;
                if (processedImages.length > 0) product.image_url = processedImages[0];
                
                await product.save();
                successCount++;

            } catch (rowErr) {
                errors.push(`Row ${rowNum}: Internal error - ${rowErr.message}`);
            }
        }

        return { successCount, errorCount: errors.length, errors };
    }
}

module.exports = BulkUploadService;
