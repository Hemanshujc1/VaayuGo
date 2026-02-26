const express = require('express');
const upload = require('../middlewares/uploadMiddleware');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/upload', authenticateToken, authorizeRole(['customer', 'shopkeeper', 'admin']), upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ message: 'File uploaded', fileUrl });
});

module.exports = router;
