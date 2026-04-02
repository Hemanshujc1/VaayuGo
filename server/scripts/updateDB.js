const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../models');

async function updateDatabase() {
    try {
        console.log("Authenticating with the database...");
        await sequelize.authenticate();
        console.log("Authentication successful.");

        console.log("Synchronizing database tables (alter: true)...");
        // alter: true will check the current state of the database and then perform the necessary changes in the table to make it match the model.
        await sequelize.sync({ alter: true });
        
        console.log("Database tables updated successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error updating database:", error);
        process.exit(1);
    }
}

updateDatabase();
