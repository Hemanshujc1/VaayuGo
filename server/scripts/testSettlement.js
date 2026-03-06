const { Shop, Order, OrderRevenueLog, sequelize, Settlement } = require('../models');
const SettlementService = require('../services/SettlementService');
const Decimal = require('decimal.js');

const testSettlements = async () => {
  try {
    console.log('--- Starting Settlement Logic Test ---');

    // 1. Cleanup or find a test shop
    const shop = await Shop.findOne();
    if (!shop) {
      console.error('No shop found. Please seed some data first.');
      process.exit(1);
    }
    console.log(`Testing with Shop: ${shop.name} (ID: ${shop.id})`);

    // 1.5 Cleanup: Delete all existing unsettled logs for this shop to ensure a clean test
    await OrderRevenueLog.destroy({ where: { shop_id: shop.id, settlement_id: null } });
    console.log('Deleted existing unsettled logs for this shop.');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
    const endDate = new Date();

    // 2. Create mock orders and revenue logs
    // Case A: COD Order
    const codOrder = await Order.create({
      customer_id: 1, 
      shop_id: shop.id,
      grand_total: 1000,
      payment_method: 'cod',
      status: 'delivered',
      delivery_address: 'Test Address'
    });

    await OrderRevenueLog.create({
      order_id: codOrder.id,
      shop_id: shop.id,
      subtotal: 1000,
      commission_deducted: 100, // 10%
      platform_discount_amount: 50,
      platform_delivery_share: 30,
      shop_delivery_share: 20,
      shop_final_settlement: 850, // (1000 - 100 commission + 20 delivery share - 50 plat discount? wait no)
      // Shop entitlement in COD (Scenario C logic): 
      // Collected 1000. 
      // Owes 100 commission + 20 delivery platform share? No, delivery share is already paid to shop if they delivered?
      // Let's use the formula from SettlementService:
      // netToPlatform = (Commission + Platform Fees) - Platform Discounts
      // netToPlatform = (100 + 30) - 50 = 80.
      // So shop owes VaayuGo 80.
    });

    // Case B: Online Order
    const onlineOrder = await Order.create({
      customer_id: 1,
      shop_id: shop.id,
      grand_total: 500,
      payment_method: 'online',
      status: 'delivered',
      delivery_address: 'Test Address'
    });

    await OrderRevenueLog.create({
      order_id: onlineOrder.id,
      shop_id: shop.id,
      subtotal: 500,
      commission_deducted: 50,
      platform_discount_amount: 0,
      platform_delivery_share: 15,
      shop_delivery_share: 10,
      shop_final_settlement: 460, // (500 - 50 commission + 10 delivery share)
    });

    console.log('Mock data created. Calculating settlement...');

    // 3. Run Settlement Calculation
    const settlement = await SettlementService.calculateWeeklySettlement(shop.id, startDate, endDate);

    if (settlement) {
      console.log('--- Settlement Result ---');
      console.log(`Total Orders: ${settlement.total_orders}`);
      console.log(`COD Collected: ${settlement.total_cod_collected}`);
      console.log(`Online Collected: ${settlement.total_online_collected}`);
      console.log(`Commission Total: ${settlement.commission_total}`);
      console.log(`Platform Discount Total: ${settlement.platform_discount_total}`);
      console.log(`NET PAYOUT: ${settlement.net_payout}`);

      // Verification Logic
      // COD Math: (100 commission + 30 plat delivery fee) - 50 plat discount = 80 (Shop owes)
      // i.e., netPayout should be -80 for this order.
      // Online Math: shop_final_settlement = 460 (VaayuGo pays shop)
      // Total Payout = 460 - 80 = 380.
      
      if (Math.abs(settlement.net_payout - 380) < 0.01) {
        console.log('✅ Math Verification Passed! Net Payout is correct.');
      } else {
        console.error(`❌ Math Verification Failed! Expected 380, got ${settlement.net_payout}`);
      }
    } else {
      console.log('No settlement generated.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error during test:', error);
    process.exit(1);
  }
};

testSettlements();
