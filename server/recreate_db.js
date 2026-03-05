const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDB() {
  try {
    console.log('Connecting to MySQL server...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
    
    console.log(`Creating database '${process.env.DB_NAME}' if it doesn't exist...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
    console.log('Database operation successful.');
    
    await connection.end();

    console.log('Importing Sequelize models and syncing schema...');
    // We import models *after* creating the DB so Sequelize can connect to it.
    const { sequelize } = require('./models/index');
    
    await sequelize.sync({ force: true });
    console.log('All tables created and synced successfully.');

  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    process.exit(0);
  }
}

initDB();
