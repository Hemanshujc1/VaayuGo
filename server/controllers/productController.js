const { Product, Shop } = require('../models');

// @desc    Get all products for a shop
// @route   GET /api/products/shop/:shopId
// @access  Public
const getProductsByShop = async (req, res, next) => {
  try {
    const products = await Product.findAll({
      where: { shop_id: req.params.shopId },
    });
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

// @desc    Get my shop's products
// @route   GET /api/products/my-products
// @access  Private (Shopkeeper only)
const getMyProducts = async (req, res, next) => {
  try {
    // First find the user's shop
    const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
    if (!shop) {
      res.status(404);
      throw new Error('Shop not found');
    }

    const products = await Product.findAll({
      where: { shop_id: shop.id },
    });
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

// @desc    Add a product
// @route   POST /api/products
// @access  Private (Shopkeeper only)
const addProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, image_url } = req.body;

    const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
    if (!shop) {
      res.status(404);
      throw new Error('Shop not found. Create a shop first.');
    }

    const product = await Product.create({
      shop_id: shop.id,
      name,
      description,
      price,
      stock,
      image_url,
    });

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (Shopkeeper only)
const updateProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, image_url } = req.body;
    const productId = req.params.id;

    const product = await Product.findByPk(productId);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    // Verify ownership
    const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
    if (!shop || product.shop_id !== shop.id) {
      res.status(403);
      throw new Error('Not authorized to update this product');
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.stock = stock || product.stock;
    product.image_url = image_url || product.image_url;

    await product.save();
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Shopkeeper only)
const deleteProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;

    const product = await Product.findByPk(productId);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    // Verify ownership
    const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
    if (!shop || product.shop_id !== shop.id) {
      res.status(403);
      throw new Error('Not authorized to delete this product');
    }

    await product.destroy();
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProductsByShop,
  getMyProducts,
  addProduct,
  updateProduct,
  deleteProduct,
};
