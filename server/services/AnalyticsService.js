const { sequelize, Shop, User, Order, OrderRevenueLog } = require('../models/index');
const Decimal = require('decimal.js');

class AnalyticsService {
    static async getPlatformMetrics() {
        const totalUsers = await User.count({ where: { role: 'customer' } });
        const totalShops = await Shop.count();
        const activeShops = await Shop.count({ where: { status: 'approved' } });
        
        const allOrders = await Order.findAll({
            include: [{ model: OrderRevenueLog }]
        });
        
        const totalOrders = allOrders.length;
        
        let completedOrders = 0;
        let cancelledOrders = 0;
        let failedOrders = 0;

        let gmv = new Decimal(0);
        let netGmv = new Decimal(0);
        let totalCommission = new Decimal(0);
        let extraCharges = new Decimal(0);
        let deliveryRevenue = new Decimal(0);
        let platformDiscount = new Decimal(0);
        let smallOrderCount = 0;

        for (const order of allOrders) {
            if (order.status === 'cancelled') cancelledOrders++;
            else if (order.status === 'failed') failedOrders++;
            else if (order.status === 'delivered') {
                completedOrders++;
                const log = order.OrderRevenueLog;
                if (log) {
                    const subtotal = new Decimal(log.subtotal || 0);
                    const prodDisc = new Decimal(log.product_discount_amount || 0);
                    const shopDisc = new Decimal(log.shop_discount_amount || 0);
                    const platDisc = new Decimal(log.platform_discount_amount || 0);

                    gmv = gmv.plus(subtotal.minus(prodDisc));
                    netGmv = netGmv.plus(subtotal.minus(prodDisc).minus(shopDisc).minus(platDisc));
                    
                    totalCommission = totalCommission.plus(log.commission_deducted || 0);
                    extraCharges = extraCharges.plus(log.platform_small_order_share || 0);
                    deliveryRevenue = deliveryRevenue.plus(log.platform_delivery_share || 0);
                    platformDiscount = platformDiscount.plus(log.platform_discount_amount || 0);
                    
                    if (log.is_small_order) smallOrderCount++;
                }
            }
        }

        const grossRevenue = totalCommission.plus(deliveryRevenue).plus(extraCharges);
        const netRevenue = grossRevenue.minus(platformDiscount);
        
        const round2 = (val) => val.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();

        const aov = completedOrders > 0 ? round2(netGmv.dividedBy(completedOrders)) : 0;

        // JS Decomposition for top charts
        const rawLogs = await OrderRevenueLog.findAll({
            include: [
                { model: Order, where: { status: 'delivered' } },
                { model: Shop, include: [{ model: User }] }
            ]
        });

        const shopMap = {};
        const categoryMap = {};
        const locationMap = {};
        const dayMap = {};

        rawLogs.forEach(log => {
            const revenue = Number(log.platform_net_revenue || 0);
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
            totalShops: totalShops,
            activeShops: activeShops,
            
            totalOrders: totalOrders,
            completedOrders: completedOrders,
            cancelledOrders: cancelledOrders,
            failedOrders: failedOrders,
            smallOrderCount: smallOrderCount,

            gmv: round2(gmv),
            netGmv: round2(netGmv),
            totalCommission: round2(totalCommission),
            extraCharges: round2(extraCharges),
            deliveryRevenue: round2(deliveryRevenue),
            grossRevenue: round2(grossRevenue),
            platformDiscount: round2(platformDiscount),
            netRevenue: round2(netRevenue),
            
            aov: aov,

            revenueByShop,
            revenueByCategory,
            revenueByLocation,
            revenueByDay
        };
    }
}

module.exports = AnalyticsService;
