const { sequelize, Shop, Category, ShopCategory } = require('../models');

async function migrate() {
    try {
        console.log('Starting category migration...');
        
        // 1. Get unique category strings from existing shops
        const shops = await Shop.findAll();
        const uniqueCatStrings = [...new Set(shops.map(s => s.category).filter(Boolean))];
        
        console.log(`Found ${uniqueCatStrings.length} unique category strings:`, uniqueCatStrings);

        // 2. Ensure these exist in the Category table
        for (const catName of uniqueCatStrings) {
            await Category.findOrCreate({ where: { name: catName } });
        }

        // 3. Map shops to categories in the junction table
        let count = 0;
        for (const shop of shops) {
            if (shop.category) {
                const category = await Category.findOne({ where: { name: shop.category } });
                if (category) {
                    await ShopCategory.findOrCreate({
                        where: {
                            shop_id: shop.id,
                            category_id: category.id
                        }
                    });
                    count++;
                }
            }
        }

        console.log(`Migration complete! Associated ${count} shops with their legacy categories.`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
