const cron = require('node-cron');
const { Shop } = require('../models');
const SettlementService = require('../services/SettlementService');

/**
 * Weekly Settlement Cron
 * Runs every Monday at 2:00 AM
 */
const initSettlementCron = () => {
  // schedule: '0 2 * * 1' -> 2:00 AM on Monday
  cron.schedule('0 2 * * 1', async () => {
    console.log('[SettlementCron] Starting weekly settlement calculation...');
    
    try {
      const { startDate, endDate } = SettlementService.getPreviousWeekRange();
      console.log(`[SettlementCron] Period: ${startDate.toISOString()} to ${endDate.toISOString()}`);

      const shops = await Shop.findAll({ where: { is_active: true } });
      
      for (const shop of shops) {
        console.log(`[SettlementCron] Processing shop: ${shop.name} (ID: ${shop.id})`);
        const settlement = await SettlementService.calculateWeeklySettlement(shop.id, startDate, endDate);
        
        if (settlement) {
          console.log(`[SettlementCron] Settlement created for ${shop.name}: ID ${settlement.id}, Payout: ${settlement.net_payout}`);
        } else {
          console.log(`[SettlementCron] No orders found for ${shop.name} in this period.`);
        }
      }
      
      console.log('[SettlementCron] Weekly settlement calculation completed.');
    } catch (error) {
      console.error('[SettlementCron] Error during calculation:', error);
    }
  });
};

module.exports = initSettlementCron;
