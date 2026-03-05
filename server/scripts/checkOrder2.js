const { OrderRevenueLog } = require('../models');

async function checkLog() {
    const log = await OrderRevenueLog.findOne({ where: { order_id: 2 }});
    console.log(JSON.stringify(log, null, 2));
    process.exit(0);
}

checkLog();
