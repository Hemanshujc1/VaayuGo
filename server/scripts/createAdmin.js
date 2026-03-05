const bcrypt = require('bcryptjs');
const { User, Location, sequelize } = require('../models');

async function createAdmin() {
  try {
    // Ensure database is connected
    await sequelize.authenticate();
    console.log('Database connected.');

    const adminEmail = 'admin@vaayugo.com';
    const adminPassword = 'admin@123';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    if (existingAdmin) {
      console.log(`Admin with email ${adminEmail} already exists.`);
      process.exit(0);
    }

    // Ensure at least one location exists if needed, or just use a default string
    // In User model, location is just a string. 
    // But cartController looks it up in Location model.
    // Let's ensure 'Central' exists in Location table too.
    const [location, created] = await Location.findOrCreate({
      where: { name: 'Central' }
    });
    if (created) console.log("Created 'Central' location.");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    await User.create({
      name: 'System Admin',
      email: adminEmail,
      password: hashedPassword,
      mobile_number: '0000000000',
      address: 'Global HQ',
      location: 'Central',
      role: 'admin'
    });

    console.log('====================================');
    console.log('Admin User Created Successfully!');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('====================================');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
