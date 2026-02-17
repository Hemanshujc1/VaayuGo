const { sequelize } = require('./src/models/index');

const resetDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected...');
        
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { raw: true });
        await sequelize.sync({ force: true });
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { raw: true });

        console.log('Database Force Synced (All data wiped).');
        process.exit(0);
    } catch (error) {
        console.error('Error resetting DB:', error);
        process.exit(1);
    }
};

resetDB();
