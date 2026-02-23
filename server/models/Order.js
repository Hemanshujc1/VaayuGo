module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    delivery_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed', 'cancelled'),
      defaultValue: 'pending'
    },
    delivery_type: {
      type: DataTypes.ENUM('instant', 'scheduled'),
      defaultValue: 'instant'
    },
    delivery_address: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    // Optional: Special instructions
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    timestamps: true
  });

  return Order;
};
