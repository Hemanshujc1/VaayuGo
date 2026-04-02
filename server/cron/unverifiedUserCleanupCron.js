const cron = require('node-cron');
const { User, Shop } = require('../models');
const { Op } = require('sequelize');

const initUnverifiedUserCleanupCron = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      // 15 minutes ago
      const timeLimit = new Date(Date.now() - 15 * 60 * 1000);

      const unverifiedUsers = await User.findAll({
        where: {
          is_verified: false,
          createdAt: {
            [Op.lt]: timeLimit
          }
        }
      });

      if (unverifiedUsers.length > 0) {
        let deletedCount = 0;
        for (const user of unverifiedUsers) {
          // Find and delete associated shop if exists (just to be safe with db constraints)
          await Shop.destroy({ where: { owner_id: user.id } });
          // Delete user
          await user.destroy();
          deletedCount++;
        }
        console.log(`[Cron] Cleaned up ${deletedCount} unverified users older than 15 mins.`);
      }
    } catch (error) {
      console.error('[Cron] Error cleaning up unverified users:', error);
    }
  });
};

module.exports = initUnverifiedUserCleanupCron;
