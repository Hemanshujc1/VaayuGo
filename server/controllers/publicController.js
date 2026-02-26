const Shop = require('../models/Shop');
const Product = require('../models/Product');
const User = require('../models/User'); // Import User
const Location = require('../models/Location');
const Category = require('../models/Category');
const DeliverySlot = require('../models/DeliverySlot');
const { Op } = require('sequelize');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const getAllShops = catchAsync(async (req, res, next) => {
    const shops = await Shop.findAll({ 
        where: { status: 'approved' },
        include: [
            {
                model: User,
                attributes: ['id', 'is_blocked'],
            },
            {
                model: Category,
                attributes: ['id', 'name']
            }
        ],
        attributes: ['id', 'name', 'category', 'location_address', 'image_url', 'rating', 'delivery_rating', 'is_open'] 
    });
    res.json(shops);
});

const getShopDetails = catchAsync(async (req, res, next) => {
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
                where: { is_blocked: false } 
            },
            {
                model: Category,
                attributes: ['id', 'name']
            }
        ]
    });

    if (!shop) return next(new AppError('Shop not found', 404));
    res.json(shop);
});

const searchShops = catchAsync(async (req, res, next) => {
    const { query } = req.query;
    const shops = await Shop.findAll({
        where: {
            status: 'approved',
            [Op.or]: [
                { name: { [Op.like]: `%${query}%` } },
                { category: { [Op.like]: `%${query}%` } }
            ]
        },
        include: [
            {
                model: User,
                attributes: ['id', 'is_blocked'],
                where: { is_blocked: false } 
            },
            {
                model: Category,
                attributes: ['id', 'name']
            }
        ]
    });
    res.json(shops);
});

const getAllLocations = catchAsync(async (req, res, next) => {
    const locations = await Location.findAll();
    res.json(locations);
});

const getAllCategories = catchAsync(async (req, res, next) => {
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    res.json(categories);
});

const getDeliverySlots = catchAsync(async (req, res, next) => {
    const slots = await DeliverySlot.findAll({ order: [['start_time', 'ASC']] });
    res.json(slots);
});

module.exports = { getAllShops, getShopDetails, searchShops, getAllLocations, getAllCategories, getDeliverySlots };
