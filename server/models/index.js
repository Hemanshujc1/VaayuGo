const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'vaayugo',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const db = {};

const User = require("./User")(sequelize, DataTypes);
const Shop = require("./Shop")(sequelize, DataTypes);
const Product = require("./Product")(sequelize, DataTypes);
const Order = require("./Order")(sequelize, DataTypes);
const OrderItem = require("./OrderItem")(sequelize, DataTypes);
const Config = require("./Config")(sequelize, DataTypes);
const Penalty = require("./Penalty")(sequelize, DataTypes);

// Associations

// User has one Role -- STRIPPED (Using Enum)

// User (Shopkeeper) has one Shop
User.hasOne(Shop, { foreignKey: "owner_id", onDelete: 'CASCADE' });
Shop.belongsTo(User, { foreignKey: "owner_id", onDelete: 'CASCADE' });

// Shop has many Products
Shop.hasMany(Product, { foreignKey: "shop_id", onDelete: 'CASCADE' });
Product.belongsTo(Shop, { foreignKey: "shop_id", onDelete: 'CASCADE' });

// User (Customer) has many Orders
User.hasMany(Order, { foreignKey: "customer_id", onDelete: 'CASCADE' });
Order.belongsTo(User, { foreignKey: "customer_id", onDelete: 'CASCADE' });

// Shop has many Orders
Shop.hasMany(Order, { foreignKey: "shop_id", onDelete: 'CASCADE' });
Order.belongsTo(Shop, { foreignKey: "shop_id", onDelete: 'CASCADE' });

// Order has many Items
Order.hasMany(OrderItem, { foreignKey: "order_id", onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: "order_id", onDelete: 'CASCADE' });

// Product in Order Items
Product.hasMany(OrderItem, { foreignKey: "product_id", onDelete: 'CASCADE' });
OrderItem.belongsTo(Product, { foreignKey: "product_id", onDelete: 'CASCADE' });

// Shop has many Penalties
Shop.hasMany(Penalty, { foreignKey: "shop_id", onDelete: 'CASCADE' });
Penalty.belongsTo(Shop, { foreignKey: "shop_id", onDelete: 'CASCADE' });

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.User = User;
db.Shop = Shop;
db.Product = Product;
db.Order = Order;
db.OrderItem = OrderItem;
db.Config = Config;
db.Penalty = Penalty;
db.Location = require("./Location")(sequelize, DataTypes);
db.ServiceConfig = require("./ServiceConfig")(sequelize, DataTypes);

const Location = db.Location;
const ServiceConfig = db.ServiceConfig;

// Location has many ServiceConfigs
Location.hasMany(ServiceConfig, { foreignKey: "location_id" });
ServiceConfig.belongsTo(Location, { foreignKey: "location_id" });

module.exports = db;
