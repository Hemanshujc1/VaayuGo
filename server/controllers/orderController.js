const { Order, OrderItem, Product, Shop } = require('../models');

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private (Customer)
const createOrder = async (req, res, next) => {
  try {
    const { items, total_amount, delivery_fee, delivery_address, shop_id, delivery_type } = req.body;

    if (!items || items.length === 0) {
      res.status(400);
      throw new Error('No items in order');
    }

    // verify shop exists
    const shop = await Shop.findByPk(shop_id);
    if (!shop) {
      res.status(404);
      throw new Error('Shop not found');
    }

    // Create Order
    const order = await Order.create({
      customer_id: req.user.id,
      shop_id,
      total_amount,
      delivery_fee,
      delivery_address,
      delivery_type: delivery_type || 'instant', // Default to instant if not provided
      status: 'pending',
    });

    // Create Order Items
    // In a real app, we should check stock here and decrement it transactionally
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      price: item.price,
      // Xerox/Print specific fields
      file_url: item.file_url,
      print_type: item.print_type,
      print_sides: item.print_sides,
      binding_type: item.binding_type
    }));

    await OrderItem.bulkCreate(orderItems);

    res.status(201).json({
      message: 'Order placed successfully',
      order_id: order.id,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/my-orders
// @access  Private (Customer)
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      where: { customer_id: req.user.id },
      include: [
        { model: Shop, attributes: ['name', 'image_url'] },
        { model: OrderItem, include: [Product] }
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Get shop orders
// @route   GET /api/orders/shop-orders
// @access  Private (Shopkeeper)
const getShopOrders = async (req, res, next) => {
  try {
    // First find the shop owned by user
    const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
    if (!shop) {
      res.status(404);
      throw new Error('Shop not found');
    }

    const orders = await Order.findAll({
      where: { shop_id: shop.id },
      include: [
        { model: OrderItem, include: [Product] }
        // We could include User (Customer) info here too if we associated it properly in getMyOrders
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private (Shopkeeper)
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    // Verify ownership (optional but recommended)
    // const shop = await Shop.findOne({ where: { owner_id: req.user.id } });
    // if (order.shop_id !== shop.id) ...

    order.status = status;
    await order.save();

    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getShopOrders,
  updateOrderStatus,
};
