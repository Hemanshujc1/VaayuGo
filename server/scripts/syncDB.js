const db = require('../models');

async function syncDatabase() {
  try {
    console.log('Authenticating...');
    await db.sequelize.authenticate();
    console.log('Connection has been established successfully.');

    console.log('Syncing Database...');
    // Using force: true to drop and recreate tables (ensure fresh start)
    // Warning: This deletes data, but since we are just starting, it's fine.
    await db.sequelize.sync({ force: true });
    console.log('All models were synchronized successfully.');
    
    // List tables to confirm
    const [results] = await db.sequelize.query("SHOW TABLES");
    console.log('Tables in database:', results);

  } catch (error) {
    console.error('Unable to connect to the database:', error);
  } finally {
    await db.sequelize.close();
  }
}

syncDatabase();
