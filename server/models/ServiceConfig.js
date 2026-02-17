module.exports = (sequelize, DataTypes) => {
  const ServiceConfig = sequelize.define('ServiceConfig', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('grocery', 'food', 'medical', 'xerox', 'other'),
      allowNull: false
    },
    min_order_type: {
      type: DataTypes.ENUM('fixed', 'range'),
      defaultValue: 'fixed'
    },
    min_order_value: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    min_order_range_min: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    min_order_range_max: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    delivery_tiers_instant: {
      type: DataTypes.JSON, // Array of { min_km, max_km, price }
      allowNull: true
    },
    delivery_tiers_scheduled: {
      type: DataTypes.JSON, // Array of { min_km, max_km, price }
      allowNull: true
    },
    commission_rate: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    }
  }, {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['location_id', 'category']
      }
    ]
  });

  return ServiceConfig;
};
