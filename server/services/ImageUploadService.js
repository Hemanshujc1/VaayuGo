const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

class ImageUploadService {
    /**
     * Processes muliple multer file buffers into WebP images via Sharp and saves to local disk.
     * @param {Array} files Array of multer file objects
     * @param {String} prefix Prefix for the filename (e.g. 'shop-12', 'product-15')
     * @param {String} dirName Directory inside the 'uploads/' folder 
     * @param {Number} width Max width
     * @param {Number} height Max height
     * @returns {Array<String>} Array of local path URIs (e.g. '/uploads/shopimages/filename.webp')
     */
    static async processImages(files, prefix, dirName, width = 800, height = 800) {
        if (!files || files.length === 0) return [];
        
        const processedImages = [];
        const uploadDir = path.join(__dirname, `../../uploads/${dirName}`);

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        for (const file of files) {
            // Check if file is an image buffer (ignoring CSV/ZIP for processing)
            if (!file.mimetype || !file.mimetype.startsWith('image/')) continue;

            const filename = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}.webp`;
            const filepath = path.join(uploadDir, filename);

            await sharp(file.buffer)
                .resize(width, height, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 80 })
                .toFile(filepath);

            processedImages.push(`/uploads/${dirName}/${filename}`);
        }
        return processedImages;
    }

    /**
     * Deletes a local image from disk asynchronously
     * @param {String} imageUrl Raw URI (e.g. '/uploads/shopimages/file.webp')
     * @param {String} dirName Directory inside 'uploads/'
     */
    static deleteImage(imageUrl, dirName) {
        if (!imageUrl) return;
        const relativePath = imageUrl.replace(`/uploads/${dirName}/`, '');
        const filePath = path.join(__dirname, `../../uploads/${dirName}`, relativePath);
        
        fs.unlink(filePath, (err) => {
            if (err) console.error("Failed to delete local file:", err.message);
        });
    }
}

module.exports = ImageUploadService;
