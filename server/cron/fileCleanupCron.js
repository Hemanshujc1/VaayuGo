const { Order, OrderItem, XeroxDocument } = require('../models');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { Op } = require('sequelize');

const cleanOrphanedFiles = async () => {
    try {
        console.log('[CRON] Starting Document Cleanup...');
        const uploadsDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadsDir)) return;

        let deletedCount = 0;
        const nowMs = Date.now();
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
        const FIVE_MINUTES = 5 * 60 * 1000;

        // 1. Delete abandoned XeroxDocuments (5 minutes rule)
        const fiveMinsAgo = new Date(nowMs - FIVE_MINUTES);
        const abandonedDocs = await XeroxDocument.findAll({
            where: {
                status: 'uploaded',
                createdAt: { [Op.lt]: fiveMinsAgo }
            }
        });

        for (const doc of abandonedDocs) {
            const filename = doc.file_url.split('/').pop();
            if (filename) {
                const filePath = path.join(uploadsDir, filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            await doc.destroy();
            deletedCount++;
            console.log(`[CLEANUP] Deleted abandoned 5-min xerox document: ${filename}`);
        }

        // 2. Original Fallback: Delete any physical file over 24 hrs old just to be safe
        const files = fs.readdirSync(uploadsDir);
        for (const file of files) {
            if (file === '.gitkeep' || file === 'xerox-icon.png') continue;

            const filePath = path.join(uploadsDir, file);
            const stats = fs.statSync(filePath);

            if (nowMs - stats.mtimeMs > TWENTY_FOUR_HOURS) {
                const activeOrdersUsingFile = await OrderItem.count({
                    where: { file_url: { [Op.like]: `%${file}` } },
                    include: [{
                        model: Order,
                        where: { status: { [Op.in]: ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery'] } }
                    }]
                });

                if (activeOrdersUsingFile === 0) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                    console.log(`[CLEANUP] Deleted orphaned physical file: ${file}`);
                }
            }
        }
        
        console.log(`[CRON] Document Cleanup complete. Deleted ${deletedCount} total files.`);
    } catch (err) {
        console.error('[CRON] Error during file cleanup:', err);
    }
};

const initFileCleanupCron = () => {
    // Run every 5 minutes
    cron.schedule('*/5 * * * *', cleanOrphanedFiles);
};

module.exports = initFileCleanupCron;
