const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Penalty = sequelize.define(
  "Penalty",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    target_type: {
      type: DataTypes.ENUM('customer', 'shopkeeper'),
      allowNull: false,
    },
    target_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'applied', 'reversed'),
      defaultValue: 'pending',
    },
    is_reversed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    reference_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    applied_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Penalty;
