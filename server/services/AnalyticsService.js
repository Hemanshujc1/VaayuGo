const { sequelize, Shop, User, Order, OrderRevenueLog } = require('../models/index');

class AnalyticsService {
    static async getPlatformMetrics() {
        const totalUsers = await User.count({ where: { role: 'customer' } });
        const totalShops = await Shop.count({ where: { status: 'approved' } });
        const totalOrders = await Order.count({ where: { status: 'delivered' } });

        const orderRevLogMetrics = await OrderRevenueLog.findAll({
            include: [{
                model: Order,
                attributes: [],
                where: { status: 'delivered' }
            }],
            attributes: [
                [sequelize.fn('SUM', sequelize.col('subtotal')), 'gmv'],
                [sequelize.fn('SUM', sequelize.col('shop_discount')), 'totalShopDiscount'],
                [sequelize.fn('SUM', sequelize.col('platform_discount')), 'totalPlatformDiscount'],
                [sequelize.fn('SUM', sequelize.col('commission_amount')), 'totalCommission'],
                [sequelize.fn('SUM', sequelize.col('net_platform_revenue')), 'netPlatformRevenue'],
                [sequelize.fn('SUM', sequelize.col('applied_delivery_fee')), 'totalDeliveryRevenue'],
                [sequelize.fn('SUM', sequelize.col('vaayugo_delivery_earned')), 'totalVaayugoDeliveryShare'],
            ],
            raw: true
        });
        const orderRevMetrics = orderRevLogMetrics[0] || {};

        // Calculate decompositions via JavaScript to avoid SQLite Dialect GROUP BY Prefix issues
        const rawLogs = await OrderRevenueLog.findAll({
            include: [
                {
                    model: Order,
                    where: { status: 'delivered' }
                },
                {
                    model: Shop,
                    include: [{ model: User }]
                }
            ]
        });

        const shopMap = {};
        const categoryMap = {};
        const locationMap = {};
        const dayMap = {};

        rawLogs.forEach(log => {
            const revenue = Number(log.vaayugo_final_earning || 0);
            const shopName = log.Shop?.name || 'Unknown';
            const category = log.Shop?.category || 'General';
            const location = log.Shop?.User?.location || 'Unknown';
            const dateStr = new Date(log.createdAt).toISOString().split('T')[0];

            shopMap[shopName] = (shopMap[shopName] || 0) + revenue;
            categoryMap[category] = (categoryMap[category] || 0) + revenue;
            locationMap[location] = (locationMap[location] || 0) + revenue;
            dayMap[dateStr] = (dayMap[dateStr] || 0) + revenue;
        });

        const revenueByShop = Object.entries(shopMap)
            .map(([shopName, revenue]) => ({ shopName, revenue: revenue.toFixed(2) }))
            .sort((a, b) => b.revenue - a.revenue).slice(0, 10);
            
        const revenueByCategory = Object.entries(categoryMap)
            .map(([category, revenue]) => ({ category, revenue: revenue.toFixed(2) }))
            .sort((a, b) => b.revenue - a.revenue);
            
        const revenueByLocation = Object.entries(locationMap)
            .map(([location, revenue]) => ({ location, revenue: revenue.toFixed(2) }))
            .sort((a, b) => b.revenue - a.revenue);

        const revenueByDay = Object.entries(dayMap)
            .map(([date, revenue]) => ({ date, revenue: revenue.toFixed(2) }))
            .sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 30);

        return {
            users: totalUsers,
            shops: totalShops,
            orders: totalOrders,
            gmv: orderRevMetrics.gmv || 0,
            totalShopDiscount: orderRevMetrics.totalShopDiscount || 0,
            totalPlatformDiscount: orderRevMetrics.totalPlatformDiscount || 0,
            totalCommission: orderRevMetrics.totalCommission || 0,
            netPlatformRevenue: orderRevMetrics.netPlatformRevenue || 0,
            totalDeliveryRevenue: orderRevMetrics.totalDeliveryRevenue || 0,
            totalVaayugoDeliveryShare: orderRevMetrics.totalVaayugoDeliveryShare || 0,
            totalVaayugoRevenue: (Number(orderRevMetrics.netPlatformRevenue) || 0) + (Number(orderRevMetrics.totalVaayugoDeliveryShare) || 0),
            avgOrderValue: totalOrders > 0 ? ((orderRevMetrics.gmv || 0) / totalOrders).toFixed(2) : 0,
            revenuePerOrder: totalOrders > 0 ? (((Number(orderRevMetrics.netPlatformRevenue) || 0) + (Number(orderRevMetrics.totalVaayugoDeliveryShare) || 0)) / totalOrders).toFixed(2) : 0,
            revenueByShop,
            revenueByCategory,
            revenueByLocation,
            revenueByDay
        };
    }
}

module.exports = AnalyticsService;
