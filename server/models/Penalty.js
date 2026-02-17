module.exports = (sequelize, DataTypes) => {
  const Penalty = sequelize.define('Penalty', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('unpaid', 'paid', 'waived'),
      defaultValue: 'unpaid'
    },
    shop_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    order_id: { // Optional, link to specific order
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    timestamps: true
  });

  return Penalty;
};
