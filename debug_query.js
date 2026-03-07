const { Shop, User, Category, ShopCategory } = require('./server/models/index');
const { Op } = require('sequelize');

async function debugQuery() {
    try {
        const page = 1;
        const limit = 10;
        const search = '';
        const status = '';
        const category_id = '';
        const sort = 'newest';

        const offset = (page - 1) * limit;
        
        const where = {};
        if (status) where.status = status;
        
        const include = [
            { model: User, attributes: ['id', 'username', 'email', 'name'] },
            { 
                model: Category, 
                attributes: ['id', 'name'],
                through: { attributes: [] }
            }
        ];

        if (search) {
            where[Op.or] = [
                { name: { [Op.substring]: search } },
                { '$User.username$': { [Op.substring]: search } },
                { '$User.email$': { [Op.substring]: search } }
            ];
        }

        if (category_id) {
            include.push({
                model: Category,
                where: { id: category_id },
                attributes: [],
                through: { attributes: [] }
            });
        }

        let order = [['createdAt', 'DESC']];
        if (sort === 'oldest') order = [['createdAt', 'ASC']];
        if (sort === 'name_asc') order = [['name', 'ASC']];
        if (sort === 'name_desc') order = [['name', 'DESC']];

        console.log('Running findAndCountAll...');
        const result = await Shop.findAndCountAll({
            where,
            include,
            order,
            limit: parseInt(limit),
            offset: parseInt(offset),
            distinct: true
        });

        console.log('Success! Count:', result.count);
    } catch (err) {
        console.error('FAILED:', err);
    } finally {
        process.exit();
    }
}

debugQuery();
