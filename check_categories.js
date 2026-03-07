const { Category } = require('./server/models');

async function checkCategories() {
    try {
        const categories = await Category.findAll();
        console.log('Categories:', categories.map(c => c.toJSON()));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkCategories();
