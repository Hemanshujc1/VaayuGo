module.exports = (sequelize, DataTypes) => {
  const Config = sequelize.define('Config', {
    key: {
      type: DataTypes.STRING,
      primaryKey: true,
      // e.g., 'delivery_fee_instant', 'max_delivery_time_mins'
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING
    }
  }, {
    timestamps: false
  });

  return Config;
};
