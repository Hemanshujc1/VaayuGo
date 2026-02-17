const Product = require('../models/Product');
const Shop = require('../models/Shop');

const getMyProducts = async (req, res) => {
    try {
        const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
        if (!shop) return res.status(404).json({ message: 'Shop not found' });

        const products = await Product.findAll({ where: { shop_id: shop.id } });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products', error });
    }
};

const addProduct = async (req, res) => {
    try {
        const { name, price, description, image_url, is_available } = req.body;
        const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
        if (!shop) return res.status(404).json({ message: 'Shop not found' });

        const product = await Product.create({
            shop_id: shop.id,
            name,
            price,
            description,
            image_url,
            is_available: is_available !== undefined ? is_available : true,
            stock_quantity: req.body.stock_quantity || 0,
        });

        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error adding product', error });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
        if (!shop) return res.status(404).json({ message: 'Shop not found' });

        const product = await Product.findOne({ where: { id, shop_id: shop.id } });
        if (!product) return res.status(404).json({ message: 'Product not found' });

        await product.update(req.body);
        res.json({ message: 'Product updated', product });
    } catch (error) {
        res.status(500).json({ message: 'Error updating product', error });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
        if (!shop) return res.status(404).json({ message: 'Shop not found' });

        const product = await Product.findOne({ where: { id, shop_id: shop.id } });
        if (!product) return res.status(404).json({ message: 'Product not found' });

        await product.destroy();
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product', error });
    }
};

module.exports = { getMyProducts, addProduct, updateProduct, deleteProduct };
