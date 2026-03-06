const { DeliverySlot } = require('../models/index');
const { Op } = require('sequelize');

class DeliverySlotService {
    /**
     * Fetches available slots for today or tomorrow.
     * Logic: If a slot's cutoff_time has passed for today, it might be available for tomorrow.
     * However, PRD implies "cutoff for current day".
     */
    static async getAvailableSlots() {
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                          now.getMinutes().toString().padStart(2, '0') + ':' + 
                          now.getSeconds().toString().padStart(2, '0');

        // Buffer: 30 minutes
        const bufferMinutes = 30;
        const bufferDate = new Date(now.getTime() + bufferMinutes * 60000);
        const bufferedTime = bufferDate.getHours().toString().padStart(2, '0') + ':' + 
                             bufferDate.getMinutes().toString().padStart(2, '0') + ':' + 
                             bufferDate.getSeconds().toString().padStart(2, '0');

        // Find slots where cutoff_time > bufferedTime
        const slots = await DeliverySlot.findAll({
            where: {
                is_active: true,
                cutoff_time: {
                    [Op.gt]: bufferedTime
                }
            },
            order: [['start_time', 'ASC']]
        });

        // If no slots left today, return slots for tomorrow (all active slots)
        if (slots.length === 0) {
            return await DeliverySlot.findAll({
                where: { is_active: true },
                order: [['start_time', 'ASC']]
            });
        }

        return slots;
    }

    static async getNextSlot(currentSlotId) {
        const currentSlot = await DeliverySlot.findByPk(currentSlotId);
        if (!currentSlot) return null;

        // Find the next slot chronologically
        let nextSlot = await DeliverySlot.findOne({
            where: {
                is_active: true,
                start_time: {
                    [Op.gt]: currentSlot.start_time
                }
            },
            order: [['start_time', 'ASC']]
        });

        // If no more slots today, return the first slot of the day
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
