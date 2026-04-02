const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const BindingOption = sequelize.define('BindingOption', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  shop_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Shops',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  price_type: {
    type: DataTypes.ENUM('per_document', 'per_page'),
    allowNull: false,
    defaultValue: 'per_document'
  }
}, {
  timestamps: true,
  underscored: true
});

module.exports = BindingOption;
