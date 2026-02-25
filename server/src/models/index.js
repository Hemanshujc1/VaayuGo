const { connectDB, sequelize } = require('../config/db');
const User = require('./User');
const Shop = require('./Shop');
const Product = require('./Product');
const ServiceConfig = require('./ServiceConfig');
const DeliverySlot = require('./DeliverySlot');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const DeliveryRule = require('./DeliveryRule');
const OrderRevenueLog = require('./OrderRevenueLog');
const Location = require('./Location');
const Penalty = require('./Penalty');
const Category = require('./Category');
const ShopCategory = require('./ShopCategory');

// Defines relationships
User.hasOne(Shop, { foreignKey: 'owner_id' });
Shop.belongsTo(User, { foreignKey: 'owner_id' });

User.hasMany(Penalty, { foreignKey: 'user_id', as: 'penalties' });
Penalty.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Penalty.belongsTo(User, { foreignKey: 'admin_id', as: 'admin' });

Shop.hasMany(Product, { foreignKey: 'shop_id' });
Product.belongsTo(Shop, { foreignKey: 'shop_id' });

// Many-to-Many Category Relationship
Shop.belongsToMany(Category, { through: ShopCategory, foreignKey: 'shop_id' });
Category.belongsToMany(Shop, { through: ShopCategory, foreignKey: 'category_id' });

Shop.hasOne(ServiceConfig, { foreignKey: 'shop_id' });
ServiceConfig.belongsTo(Shop, { foreignKey: 'shop_id' });

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

module.exports = {
  connectDB,
  sequelize,
  User,
  Shop,
  Product,
  ServiceConfig,
  DeliverySlot,
  Order,
  OrderItem,
  DeliveryRule,
  OrderRevenueLog,
  Location,
  Penalty,
  Category,
  ShopCategory
};
