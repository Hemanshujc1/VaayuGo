const { OrderRevenueLog } = require('../models');

async function checkCommissionData() {
    try {
        const logs = await OrderRevenueLog.findAll({
            limit: 10,
            order: [['createdAt', 'DESC']]
        });

        console.log('--- Checking Last 10 OrderRevenueLog ---');
        logs.forEach(log => {
            console.log(`Order ID: ${log.order_id}, Subtotal: ${log.subtotal}, Commission: ${log.commission_deducted}`);
        });

        const totalCommission = await OrderRevenueLog.sum('commission_deducted');
        console.log(`\nTotal Commission in DB: ${totalCommission}`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkCommissionData();
