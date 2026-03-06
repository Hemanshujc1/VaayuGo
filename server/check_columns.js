const { sequelize } = require('./config/db');

async function check() {
  try {
    const res = await sequelize.query('DESCRIBE OrderItems');
    console.log(res[0]);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
check();
