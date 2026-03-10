const cron = require('node-cron');
const { Shop } = require('../models');
const { Op } = require('sequelize');

/**
 * Automatically update shop is_open status based on business hours and closed days.
 * Runs every minute.
 */
const updateShopStatuses = async () => {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[now.getDay()];
    
    // Get current time in HH:mm format (local time)
    const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

    try {
        const approvedShops = await Shop.findAll({
            where: {
                status: 'approved',
                opening_time: { [Op.ne]: null },
                closing_time: { [Op.ne]: null }
            }
        });

        for (const shop of approvedShops) {
            const isClosedDay = (shop.closed_days || []).includes(currentDay);
            let shouldBeOpen = !isClosedDay;

            if (shouldBeOpen && shop.opening_time && shop.closing_time) {
                const isOpenTime = currentTime >= shop.opening_time && currentTime <= shop.closing_time;
                
                // Add Break Time Logic
                let isBreakTime = false;
                if (shop.break_start && shop.break_end) {
                    isBreakTime = currentTime >= shop.break_start && currentTime <= shop.break_end;
                }
                
                shouldBeOpen = isOpenTime && !isBreakTime;
            } else if (!shop.opening_time || !shop.closing_time) {
                // If no timings set, fallback to manual or always open? 
                // Let's assume manual if no timings for now, but keeping it as is.
                shouldBeOpen = shop.is_open; 
            }

            if (shop.is_open !== shouldBeOpen) {
                shop.is_open = shouldBeOpen;
                await shop.save();
                console.log(`[ShopStatusCron] Shop "${shop.name}" (ID: ${shop.id}) updated to ${shouldBeOpen ? 'Open' : 'Closed'}`);
            }
        }
    } catch (error) {
        console.error('[ShopStatusCron] Error updating shop statuses:', error);
    }
};

const initShopStatusCron = () => {
    // schedule: '* * * * *' -> every minute
    cron.schedule('* * * * *', updateShopStatuses);
    
    // Trigger once on startup to sync immediately
    updateShopStatuses();
};

module.exports = initShopStatusCron;
