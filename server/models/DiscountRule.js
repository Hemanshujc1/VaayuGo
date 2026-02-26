const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DiscountRule = sequelize.define('DiscountRule', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('PERCENTAGE', 'FLAT'),
        allowNull: false
    },
    value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    max_discount_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    min_order_value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    creator_type: {
        type: DataTypes.ENUM('ADMIN', 'SHOP'),
        allowNull: false
    },
    creator_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    target_type: {
        type: DataTypes.ENUM('GLOBAL', 'LOCATION', 'CATEGORY', 'SHOP', 'PRODUCT'),
        allowNull: false,
        defaultValue: 'GLOBAL'
    },
    target_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    valid_from: {
        type: DataTypes.DATE,
        allowNull: true
    },
    valid_until: {
        type: DataTypes.DATE,
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'discount_rules',
    timestamps: true,
    indexes: [
        { fields: ['target_type', 'target_id'] },
        { fields: ['creator_id', 'creator_type'] },
        { fields: ['is_active'] }
    ]
});

module.exports = DiscountRule;
