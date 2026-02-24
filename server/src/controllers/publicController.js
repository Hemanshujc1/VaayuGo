const Shop = require('../models/Shop');
const Product = require('../models/Product');
const User = require('../models/User'); // Import User
const Location = require('../models/Location');
const { Op } = require('sequelize');

const getAllShops = async (req, res) => {
    try {
        const shops = await Shop.findAll({ 
            where: { status: 'approved' },
            include: [{
                model: User,
                attributes: ['id', 'is_blocked'],
            }],
            attributes: ['id', 'name', 'category', 'location_address', 'image_url', 'rating', 'delivery_rating', 'is_open'] 
        });
        res.json(shops);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching shops', error });
    }
};

const getShopDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const shop = await Shop.findOne({ 
            where: { id, status: 'approved' },
            include: [
                {
                    model: Product,
                    where: { is_available: true },
                    required: false 
                },
                {
                    model: User,
                    attributes: ['id', 'is_blocked'],
                    where: { is_blocked: false } // Ensure owner is not blocked
                }
            ]
        });

        if (!shop) return res.status(404).json({ message: 'Shop not found' });
        res.json(shop);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching shop details', error });
    }
};

const searchShops = async (req, res) => {
    try {
        const { query } = req.query;
        const shops = await Shop.findAll({
            where: {
                status: 'approved',
                [Op.or]: [
                    { name: { [Op.like]: `%${query}%` } },
                    { category: { [Op.like]: `%${query}%` } }
                ]
            },
            include: [{
                model: User,
                attributes: ['id', 'is_blocked'],
                where: { is_blocked: false } // Only show result if owner is NOT blocked
            }]
        });
        res.json(shops);
    } catch (error) {
        res.status(500).json({ message: 'Search failed', error });
    }
};

const getAllLocations = async (req, res) => {
    try {
        const locations = await Location.findAll();
        res.json(locations);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching locations', error });
    }
};

module.exports = { getAllShops, getShopDetails, searchShops, getAllLocations };
