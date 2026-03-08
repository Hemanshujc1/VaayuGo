const { Settlement, OrderRevenueLog, Order, Shop, sequelize } = require('../models');
const { Op } = require('sequelize');
const Decimal = require('decimal.js');
const AppError = require('../utils/AppError');

class SettlementService {
  /**
   * Calculates and creates a settlement for a specific shop and date range.
   * @param {number} shopId 
   * @param {Date} startDate 
   * @param {Date} endDate 
   */
  static async calculateWeeklySettlement(shopId, startDate, endDate) {
    const transaction = await sequelize.transaction();
    try {
      // 1. Fetch all delivered orders with their revenue logs that haven't been settled yet
      const logs = await OrderRevenueLog.findAll({
        where: {
          shop_id: shopId,
          settlement_id: null,
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        },
        include: [{
          model: Order,
          where: { status: 'delivered' },
          attributes: ['id', 'grand_total', 'payment_method']
        }],
        transaction
      });

      if (logs.length === 0) {
        await transaction.rollback();
        return null;
      }

      let totalOrders = logs.length;
      let totalCodCollected = new Decimal(0);
      let totalOnlineCollected = new Decimal(0);
      let commissionTotal = new Decimal(0);
      let platformDiscountTotal = new Decimal(0);
      let netPayout = new Decimal(0); // Positive means VaayuGo pays Shop, Negative means Shop pays VaayuGo

      for (const log of logs) {
        const order = log.Order;
        const commission = new Decimal(log.commission_deducted || 0);
        const platformDiscount = new Decimal(log.platform_discount_amount || 0);
        const platformDeliveryShare = new Decimal(log.platform_delivery_share || 0);
        const platformSmallOrderShare = new Decimal(log.platform_small_order_share || 0);
        const shopFinalSettlement = new Decimal(log.shop_final_settlement || 0);
        
        const platformFees = platformDeliveryShare.plus(platformSmallOrderShare);
        
        commissionTotal = commissionTotal.plus(commission);
        platformDiscountTotal = platformDiscountTotal.plus(platformDiscount);

        if (order.payment_method === 'cod') {
          const grandTotal = new Decimal(order.grand_total || 0);
          totalCodCollected = totalCodCollected.plus(grandTotal);
          
          // Net Payable to VaayuGo = (Commission + Platform Fees) - Platform Discounts
          const netToPlatform = commission.plus(platformFees).minus(platformDiscount);
          
          // Convert to our "payout" perspective: netPayout += (-netToPlatform)
          // i.e., VaayuGo pays Shop a negative amount (Shop pays VaayuGo)
          netPayout = netPayout.minus(netToPlatform);
        } else {
          // Online Payment
          const grandTotal = new Decimal(order.grand_total || 0);
          totalOnlineCollected = totalOnlineCollected.plus(grandTotal);
          
          // Net Payable to Shopkeeper = Shop Net Revenue (which is log.shop_final_settlement)
          netPayout = netPayout.plus(shopFinalSettlement);
        }
      }

      // 2. Fetch pending penalties for this shop
      const { Penalty } = require('../models');
      const pendingPenalties = await Penalty.findAll({
        where: {
          target_type: 'shopkeeper',
          target_id: shopId,
          status: 'pending',
          is_reversed: false
        },
        transaction
      });

      let totalPenaltyDeduction = new Decimal(0);
      pendingPenalties.forEach(p => {
        totalPenaltyDeduction = totalPenaltyDeduction.plus(p.amount);
      });

      // Apply penalties to net payout
      netPayout = netPayout.minus(totalPenaltyDeduction);

      // 3. Create the Settlement record
      const settlement = await Settlement.create({
        shop_id: shopId,
        start_date: startDate,
        end_date: endDate,
        total_orders: totalOrders,
        total_cod_collected: totalCodCollected.toNumber(),
        total_online_collected: totalOnlineCollected.toNumber(),
        commission_total: commissionTotal.toNumber(),
        platform_discount_total: platformDiscountTotal.toNumber(),
        penalty_total: totalPenaltyDeduction.toNumber(), // Ensure this field exists or add it
        net_payout: netPayout.toNumber(),
        status: 'pending'
      }, { transaction });

      // 4. Mark the penalties as applied
      if (pendingPenalties.length > 0) {
        await Penalty.update(
          { 
            status: 'applied', 
            applied_at: new Date(), 
            reference_id: settlement.id.toString() 
          },
          { 
            where: { id: { [Op.in]: pendingPenalties.map(p => p.id) } },
            transaction 
          }
        );
      }

      // 5. Mark the logs and orders as settled
      await OrderRevenueLog.update(
        { settlement_id: settlement.id },
        { 
          where: { 
            id: { [Op.in]: logs.map(l => l.id) } 
          },
          transaction
        }
      );

      await Order.update(
        { settlement_id: settlement.id },
        {
          where: {
            id: { [Op.in]: logs.map(l => l.order_id) }
          },
          transaction
        }
      );

      await transaction.commit();
      return settlement;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Helper to get the previous week's date range (Mon 00:00 to Sun 23:59)
   */
  static getPreviousWeekRange() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday
    
    // Find last Monday
    const lastMonday = new Date(now);
    const diffToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + 7;
    lastMonday.setDate(now.getDate() - diffToMonday);
    lastMonday.setHours(0, 0, 0, 0);

    // Find last Sunday
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    lastSunday.setHours(23, 59, 59, 999);

    return { startDate: lastMonday, endDate: lastSunday };
  }
}

module.exports = SettlementService;
