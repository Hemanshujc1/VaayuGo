const mysql = require('mysql2/promise');
const { sequelize } = require('../models');
require('dotenv').config();

async function initializeDatabase() {
    try {
        const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

        console.log(`Connecting to MySQL server at ${DB_HOST}...`);
        const connection = await mysql.createConnection({
            host: DB_HOST,
            user: DB_USER,
            password: DB_PASSWORD
        });

        console.log(`Ensuring database "${DB_NAME}" exists...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
        await connection.end();
        console.log(`Database "${DB_NAME}" is ready.`);

        console.log("Authenticating with the database via Sequelize...");
        await sequelize.authenticate();
        console.log("Authentication successful.");

        console.log("Synchronizing database tables (this will DROP existing tables)...");
        // force: true will drop all tables and recreate them based on the models
        await sequelize.sync({ force: true });
        
        console.log("Database tables created successfully.");
        
        console.log("Database initialized completely.");
        process.exit(0);
    } catch (error) {
        console.error("Error initializing database:", error);
        process.exit(1);
    }
}

initializeDatabase(); 

