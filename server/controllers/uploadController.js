const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads/print');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter (PDF only)
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

// Multer upload instance
const upload = multer({
  storage: storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB limit
  fileFilter: fileFilter,
});

// @desc    Upload file
// @route   POST /api/upload
// @access  Public (or Private if you prefer)
const uploadFile = (req, res) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('Please upload a file');
    }

    // Construct URL (assuming server runs on localhost:5001 or process.env.BASE_URL)
    const baseUrl = process.env.BASE_URL || 'http://localhost:5001';
    const fileUrl = `${baseUrl}/uploads/print/${req.file.filename}`;

    res.status(200).json({
      message: 'File uploaded successfully',
      fileUrl: fileUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  upload,
  uploadFile,
};
