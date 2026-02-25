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
    user_id: {
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
      type: DataTypes.ENUM("pending", "paid", "deducted"),
      defaultValue: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Penalty;
