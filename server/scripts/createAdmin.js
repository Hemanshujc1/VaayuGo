const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { Sequelize, DataTypes } = require('sequelize');

// Initialize Sequelize (Copy config from models/index.js if needed, or simple connection)
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER, 
  process.env.DB_PASSWORD, 
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
  }
);

const User = require('../models/User')(sequelize, DataTypes);

const createAdmin = async () => {
  try {
    const adminEmail = 'admin@vaayugo.com';
    const password = 'admin123'; // Hardcoded initial password
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists.');
      process.exit(0);
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create Admin
    await User.create({
      username: 'SuperAdmin',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      is_blocked: false
    });

    console.log('✅ Admin user created successfully!');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${password}`);
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
};

// Run script
createAdmin();
