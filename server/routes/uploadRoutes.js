const express = require('express');
const fs = require('fs');
const path = require('path');
const upload = require('../middlewares/uploadMiddleware');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');

const router = express.Router();

const { XeroxDocument } = require('../models');

router.post('/upload', authenticateToken, authorizeRole(['customer', 'shopkeeper', 'admin']), upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    try {
        await XeroxDocument.create({
            file_url: fileUrl,
            status: 'uploaded'
        });
        res.json({ message: 'File uploaded', fileUrl });
    } catch (error) {
        console.error('Failed to log document upload:', error);
        res.status(500).json({ message: 'Failed to process file upload' });
    }
});

router.delete('/delete', authenticateToken, authorizeRole(['customer', 'shopkeeper', 'admin']), (req, res) => {
    const { fileUrl } = req.body;
    if (!fileUrl) {
        return res.status(400).json({ message: 'No fileUrl provided' });
    }

    try {
        const filename = fileUrl.split('/').pop();
        if (!filename) {
            return res.status(400).json({ message: 'Invalid fileUrl' });
        }

        const filePath = path.join(__dirname, '../uploads', filename);

        const normalizedPath = path.normalize(filePath);
        const uploadsDir = path.normalize(path.join(__dirname, '../uploads'));
        if (!normalizedPath.startsWith(uploadsDir)) {
            return res.status(403).json({ message: 'Forbidden path' });
        }

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return res.json({ message: 'File deleted successfully' });
        } else {
            // Even if not found on disk, we can consider it a success if it's already gone
            return res.json({ message: 'File already deleted or not found' });
        }
    } catch (error) {
        console.error('File deletion error:', error);
        return res.status(500).json({ message: 'Failed to delete file' });
    }
});

module.exports = router;
