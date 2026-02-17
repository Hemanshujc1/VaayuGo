const { connectDB, sequelize } = require('../config/db');
const User = require('./User');
const Shop = require('./Shop');
const Product = require('./Product');
const ServiceConfig = require('./ServiceConfig');
const DeliverySlot = require('./DeliverySlot');
const Order = require('./Order');
const OrderItem = require('./OrderItem');

// Defines relationships
User.hasOne(Shop, { foreignKey: 'owner_id' });
Shop.belongsTo(User, { foreignKey: 'owner_id' });

Shop.hasMany(Product, { foreignKey: 'shop_id' });
Product.belongsTo(Shop, { foreignKey: 'shop_id' });

Shop.hasOne(ServiceConfig, { foreignKey: 'shop_id' });
ServiceConfig.belongsTo(Shop, { foreignKey: 'shop_id' });

// Order relationships
User.hasMany(Order, { foreignKey: 'customer_id' });
Order.belongsTo(User, { foreignKey: 'customer_id' });

Shop.hasMany(Order, { foreignKey: 'shop_id' });
Order.belongsTo(Shop, { foreignKey: 'shop_id' });

Order.hasMany(OrderItem, { foreignKey: 'order_id' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

Product.hasMany(OrderItem, { foreignKey: 'product_id' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id' });

module.exports = {
  connectDB,
  sequelize,
  User,
  Shop,
  Product,
  ServiceConfig,
  DeliverySlot,
  Order,
  OrderItem
};
