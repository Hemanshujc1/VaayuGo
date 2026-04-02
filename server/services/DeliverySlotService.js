const { DeliverySlot, Shop } = require('../models/index');
const { Op } = require('sequelize');

class DeliverySlotService {
    static async getAvailableSlots(shopId = null) {
        let shop = null;
        if (shopId) {
            shop = await Shop.findByPk(shopId);
        }

        const now = new Date();
        const formatDate = (date) => date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
        
        // Add 30 mins buffer for today's cutoff
        const bufferDate = new Date(now.getTime() + 30 * 60000);
        const bufferedTime = bufferDate.getHours().toString().padStart(2, '0') + ':' + 
                             bufferDate.getMinutes().toString().padStart(2, '0') + ':' + 
                             bufferDate.getSeconds().toString().padStart(2, '0');

        const allActiveSlots = await DeliverySlot.findAll({
            where: { is_active: true },
            order: [['start_time', 'ASC']]
        });

        // Compute Dates
        const todayStr = formatDate(now);
        const nextDay = new Date(now.getTime() + 86400000);
        const tomorrowStr = formatDate(nextDay);
        
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayDayStr = daysOfWeek[now.getDay()];
        const tomorrowDayStr = daysOfWeek[nextDay.getDay()];

        let closedDays = [];
        let openTime = '00:00:00';
        let closeTime = '23:59:59';
        let bStart = null;
        let bEnd = null;

        if (shop) {
            closedDays = shop.closed_days || [];
            if (shop.opening_time) openTime = shop.opening_time + (shop.opening_time.length === 5 ? ':00' : '');
            if (shop.closing_time) closeTime = shop.closing_time + (shop.closing_time.length === 5 ? ':00' : '');
            if (shop.break_start) bStart = shop.break_start + (shop.break_start.length === 5 ? ':00' : '');
            if (shop.break_end) bEnd = shop.break_end + (shop.break_end.length === 5 ? ':00' : '');
        }

        const isSlotAvailable = (slot, dateLabel) => {
            if (dateLabel === 'Today') {
                if (closedDays.includes(todayDayStr)) return false;
                if (slot.cutoff_time <= bufferedTime) return false;
            } else { // Tomorrow
                if (closedDays.includes(tomorrowDayStr)) return false;
            }

            // Shop hours boundary tests
            if (slot.start_time < openTime) return false;
            if (slot.start_time >= closeTime) return false;
            if (bStart && bEnd && slot.start_time >= bStart && slot.start_time < bEnd) return false;
            
            return true;
        };

        const result = [];
        
        // Today Slots
        const todaySlots = allActiveSlots.filter(s => isSlotAvailable(s, 'Today')).map(s => ({
            ...s.toJSON(),
            date: todayStr,
            date_label: 'Today'
        }));
        result.push(...todaySlots);

        // Tomorrow Slots
        const tomorrowSlots = allActiveSlots.filter(s => isSlotAvailable(s, 'Tomorrow')).map(s => ({
            ...s.toJSON(),
            date: tomorrowStr,
            date_label: 'Tomorrow'
        }));
        result.push(...tomorrowSlots);

        // Standard fallback if no slots returned (shop completely off schedule etc)
        if (result.length === 0) {
            return allActiveSlots.map(s => ({
                ...s.toJSON(),
                date: tomorrowStr,
                date_label: 'Tomorrow'
            }));
        }

        return result;
    }

    static async getNextSlot(currentSlotId) {
        const currentSlot = await DeliverySlot.findByPk(currentSlotId);
        if (!currentSlot) return null;

        let nextSlot = await DeliverySlot.findOne({
            where: {
                is_active: true,
                start_time: { [Op.gt]: currentSlot.start_time }
            },
            order: [['start_time', 'ASC']]
        });

        if (!nextSlot) {
            nextSlot = await DeliverySlot.findOne({
                where: { is_active: true },
                order: [['start_time', 'ASC']]
            });
        }
        return nextSlot;
    }
}

module.exports = DeliverySlotService;
