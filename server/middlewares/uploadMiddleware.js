const multer = require('multer');
const path = require('path');
const AppError = require('../utils/AppError');

// ============================================
// 1. DISK STORAGE (For generic files like Xerox docs)
// ============================================
const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const diskFileFilter = (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, DOC, and Images are allowed.'));
    }
};

const diskUpload = multer({ 
    storage: diskStorage,
    fileFilter: diskFileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ============================================
// 2. MEMORY STORAGE (For Sharp processing: Images, Products, Zips)
// ============================================
const memoryStorage = multer.memoryStorage();

const memoryFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || 
        file.mimetype === 'text/csv' || 
        file.mimetype === 'application/zip' || 
        file.mimetype === 'application/x-zip-compressed' ||
        file.mimetype === 'application/vnd.ms-excel') {
        cb(null, true);
    } else {
        cb(new AppError('Format not supported! Please upload images, CSV, or ZIP files only.', 400), false);
    }
};

const memoryUpload = multer({
    storage: memoryStorage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max input to handle high volume zips
    fileFilter: memoryFileFilter
});

// Exports
module.exports = diskUpload; // Keep default export for backwards compatibility
module.exports.uploadShopImages = memoryUpload.array('images', 5);
module.exports.uploadProductBulk = memoryUpload.fields([
    { name: 'images', maxCount: 2 },
    { name: 'csv', maxCount: 1 },
    { name: 'imagesZip', maxCount: 1 }
]);
