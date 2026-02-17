module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define('OrderItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    price: { // Price at the time of purchase (snapshot)
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    // Xerox/Printing related fields
    file_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    print_type: {
      type: DataTypes.ENUM('bw', 'color'),
      allowNull: true
    },
    print_sides: {
      type: DataTypes.ENUM('single', 'double'),
      allowNull: true
    },
    binding_type: {
      type: DataTypes.STRING, // e.g., 'spiral', 'hardcover', 'softcover', 'none'
      allowNull: true
    }
  }, {
    timestamps: true
  });

  return OrderItem;
};
