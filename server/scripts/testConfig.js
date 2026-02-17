const db = require('../models');

async function test() {
  try {
    console.log('Connecting to DB...');
    await db.sequelize.authenticate();
    console.log('Connected.');
    
    console.log('Syncing...');
    await db.sequelize.sync();
    console.log('Synced.');

    console.log('Querying Config...');
    const configs = await db.Config.findAll();
    console.log('Configs:', JSON.stringify(configs, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

test();
