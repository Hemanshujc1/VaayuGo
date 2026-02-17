const Shop = require('../models/Shop');

const registerShop = async (req, res) => {
  try {
    const { name, category, location_address } = req.body;
    const owner_id = req.user.id; // From Auth Middleware

    // Check if user already has a shop? (Optional: 1 shop per user logic)
    const existingShop = await Shop.findOne({ where: { owner_id } });
    if (existingShop) {
      return res.status(400).json({ message: 'You already have a shop registered' });
    }

    const newShop = await Shop.create({
      owner_id,
      name,
      category,
      location_address,
      status: 'pending'
    });

    res.status(201).json({ message: 'Shop registered successfully. Waiting for Admin approval.', shop: newShop });
  } catch (error) {
    res.status(500).json({ message: 'Error registering shop', error });
  }
};

const getMyShop = async (req, res) => {
    try {
        const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
        if (!shop) return res.status(404).json({ message: 'Shop not found' });
        res.json(shop);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching shop', error });
    }
}

const getPublicShops = async (req, res) => {
    try {
        // Enforce visibility rule: Only Approved shops
        const shops = await Shop.findAll({ where: { status: 'approved' } });
        res.json(shops);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching shops', error });
    }
};

module.exports = { registerShop, getMyShop, getPublicShops };
