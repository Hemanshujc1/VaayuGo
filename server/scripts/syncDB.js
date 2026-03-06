const { sequelize } = require('../models/index');

const syncDB = async () => {
  try {
    console.log('Syncing database with alter: true...');
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error syncing database:', error);
    process.exit(1);
  }
};

syncDB();
