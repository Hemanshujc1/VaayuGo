module.exports = (sequelize, DataTypes) => {
  const Shop = sequelize.define('Shop', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('grocery', 'food', 'medical', 'xerox', 'other'),
      allowNull: false
    },
    location_address: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    region: {
      type: DataTypes.STRING,
      allowNull: true, // Optional for now, admin can set it
      defaultValue: 'Unassigned'
    },
    // For MVP, we can store simple lat/lng logic later or just string location
    is_open: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'suspended', 'rejected'),
      defaultValue: 'pending'
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    image_url: {
      type: DataTypes.STRING
    }
  }, {
    timestamps: true
  });

  return Shop;
};
