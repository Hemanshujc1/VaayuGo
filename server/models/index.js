const { connectDB, sequelize } = require('../config/db');
const User = require('./User');
const Shop = require('./Shop');
const Product = require('./Product');
const DeliverySlot = require('./DeliverySlot');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const DeliveryRule = require('./DeliveryRule');
const OrderRevenueLog = require('./OrderRevenueLog');
const Location = require('./Location');
const Penalty = require('./Penalty');
const Category = require('./Category');
const ShopCategory = require('./ShopCategory');
const DiscountRule = require('./DiscountRule');
const Settlement = require('./Settlement');

// Defines relationships
User.hasOne(Shop, { foreignKey: 'owner_id' });
Shop.belongsTo(User, { foreignKey: 'owner_id' });

// Penalty relationships - Generic association to User (as customer) or Shop (as shopkeeper)
// For simplicity in Sequelize, we'll keep the association to User for customers
// and maybe add one for Shop if needed, but often we can just fetch manually
// given target_type logic.
Penalty.belongsTo(User, { foreignKey: 'admin_id', as: 'admin' });
// We can't easily do conditional belongsTo in Sequelize without polymorphic associations
// but we'll keep a reference to User if target_type is customer.
Penalty.belongsTo(User, { foreignKey: 'target_id', as: 'user', constraints: false });
Penalty.belongsTo(Shop, { foreignKey: 'target_id', as: 'shop', constraints: false });

Shop.hasMany(Product, { foreignKey: 'shop_id' });
Product.belongsTo(Shop, { foreignKey: 'shop_id' });

// Many-to-Many Category Relationship
Shop.belongsToMany(Category, { through: ShopCategory, foreignKey: 'shop_id' });
Category.belongsToMany(Shop, { through: ShopCategory, foreignKey: 'category_id' });

// DeliveryRule relationships
Shop.hasMany(DeliveryRule, { foreignKey: 'shop_id', onDelete: 'CASCADE' });
DeliveryRule.belongsTo(Shop, { foreignKey: 'shop_id', onDelete: 'CASCADE' });

Location.hasMany(DeliveryRule, { foreignKey: 'location_id', onDelete: 'CASCADE' });
DeliveryRule.belongsTo(Location, { foreignKey: 'location_id', onDelete: 'CASCADE' });

// Order relationships
User.hasMany(Order, { foreignKey: 'customer_id' });
Order.belongsTo(User, { foreignKey: 'customer_id' });

Shop.hasMany(Order, { foreignKey: 'shop_id' });
Order.belongsTo(Shop, { foreignKey: 'shop_id' });

Order.hasMany(OrderItem, { foreignKey: 'order_id' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

Product.hasMany(OrderItem, { foreignKey: 'product_id' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id' });

// OrderRevenueLog relationships
Order.hasOne(OrderRevenueLog, { foreignKey: 'order_id', onDelete: 'CASCADE' });
OrderRevenueLog.belongsTo(Order, { foreignKey: 'order_id', onDelete: 'CASCADE' });

Shop.hasMany(OrderRevenueLog, { foreignKey: 'shop_id', onDelete: 'CASCADE' });
OrderRevenueLog.belongsTo(Shop, { foreignKey: 'shop_id', onDelete: 'CASCADE' });

// Order-DeliverySlot relationships
Order.belongsTo(DeliverySlot, { foreignKey: 'delivery_slot_id' });
DeliverySlot.hasMany(Order, { foreignKey: 'delivery_slot_id' });

// Settlement relationships
Shop.hasMany(Settlement, { foreignKey: 'shop_id' });
Settlement.belongsTo(Shop, { foreignKey: 'shop_id' });

Settlement.hasMany(OrderRevenueLog, { foreignKey: 'settlement_id' });
OrderRevenueLog.belongsTo(Settlement, { foreignKey: 'settlement_id' });

Order.belongsTo(Settlement, { foreignKey: 'settlement_id' });
Settlement.hasMany(Order, { foreignKey: 'settlement_id' });

module.exports = {
  connectDB,
  sequelize,
  User,
  Shop,
  Product,
  DeliverySlot,
  Order,
  OrderItem,
  DeliveryRule,
  OrderRevenueLog,
  Location,
  Penalty,
  Category,
  ShopCategory,
  DiscountRule,
  Settlement
};
