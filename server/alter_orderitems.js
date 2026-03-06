const { sequelize } = require('./config/db');

async function alterTable() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    await sequelize.query("ALTER TABLE OrderItems ADD COLUMN product_discount_type ENUM('PERCENTAGE', 'FLAT') DEFAULT NULL;");
    console.log('Added product_discount_type column');
    
    await sequelize.query("ALTER TABLE OrderItems ADD COLUMN product_discount_value FLOAT DEFAULT NULL;");
    console.log('Added product_discount_value column');
    
  } catch (error) {
    console.error('Unable to alter table:', error);
  } finally {
    await sequelize.close();
  }
}

alterTable();
