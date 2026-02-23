const { User, Shop, Order, sequelize } = require('../src/models');

async function testAdmin() {
    try {
        console.log("Checking DB connection...");
        await sequelize.authenticate();
        console.log("DB Connected.");

        console.log("Checking for Admin User...");
        const admin = await User.findOne({ where: { role: 'admin' } });
        
        if (!admin) {
            console.error("NO ADMIN USER FOUND!");
        } else {
            console.log(`Found Admin: ${admin.username} (${admin.email})`);
        }

        console.log("Testing Analytics Query Logic...");
        try {
            const totalUsers = await User.count({ where: { role: 'customer' } });
            console.log("Users Count:", totalUsers);
            
            const totalShops = await Shop.count({ where: { status: 'approved' } });
            console.log("Shops Count:", totalShops);
            
            const totalOrders = await Order.count();
            console.log("Orders Count:", totalOrders);

            const revenueData = await Order.findAll({
                attributes: [
                    [sequelize.fn('SUM', sequelize.col('platform_fee')), 'totalPlatformFee'],
                    [sequelize.fn('SUM', sequelize.col('grand_total')), 'totalGrossVolume']
                ],
                raw: true
            });
            console.log("Revenue Data:", revenueData);
        } catch (dbErr) {
            console.error("DB Query Failed:", dbErr);
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await sequelize.close();
    }
}

testAdmin();
