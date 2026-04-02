const { XeroxConfiguration, BindingOption, Shop } = require('../models');
const { PDFDocument } = require('pdf-lib');

exports.getXeroxConfig = async (req, res) => {
  try {
    const { shopId } = req.params;
    let config = await XeroxConfiguration.findOne({ where: { shop_id: shopId } });
    
    // If no config exists, return default/empty or null
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateXeroxConfig = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { bw_single_price, bw_double_price, color_single_price, color_double_price } = req.body;

    let config = await XeroxConfiguration.findOne({ where: { shop_id: shopId } });

    if (config) {
      await config.update({
        bw_single_price,
        bw_double_price,
        color_single_price,
        color_double_price
      });
    } else {
      config = await XeroxConfiguration.create({
        shop_id: shopId,
        bw_single_price,
        bw_double_price,
        color_single_price,
        color_double_price
      });
    }

    res.status(200).json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleXeroxService = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { is_enabled } = req.body;

    const shop = await Shop.findByPk(shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    await shop.update({ is_xerox_enabled: is_enabled });

    res.status(200).json({ success: true, message: `Xerox service ${is_enabled ? 'enabled' : 'disabled'}`, data: { is_xerox_enabled: is_enabled } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Binding Options
exports.getBindingOptions = async (req, res) => {
  try {
    const { shopId } = req.params;
    const bindings = await BindingOption.findAll({ where: { shop_id: shopId } });
    res.status(200).json({ success: true, data: bindings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addBindingOption = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { name, price, price_type } = req.body;

    const binding = await BindingOption.create({
      shop_id: shopId,
      name,
      price,
      price_type
    });

    res.status(201).json({ success: true, data: binding });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateBindingOption = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, price_type } = req.body;

    const binding = await BindingOption.findByPk(id);
    if (!binding) {
      return res.status(404).json({ success: false, message: 'Binding option not found' });
    }

    await binding.update({ name, price, price_type });

    res.status(200).json({ success: true, data: binding });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteBindingOption = async (req, res) => {
  try {
    const { id } = req.params;

    const binding = await BindingOption.findByPk(id);
    if (!binding) {
      return res.status(404).json({ success: false, message: 'Binding option not found' });
    }

    await binding.destroy();

    res.status(200).json({ success: true, message: 'Binding option deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.calculatePages = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    let pageCount = 1;
    
    if (req.file.mimetype === 'application/pdf') {
      try {
        const pdfDoc = await PDFDocument.load(req.file.buffer);
        pageCount = pdfDoc.getPageCount();
      } catch (e) {
        console.error('PDF parsing error', e);
      }
    }

    res.status(200).json({ success: true, pageCount });
  } catch (error) {
    console.error('Error calculating pages:', error);
    // Still return 1 as fallback so frontend doesn't break
    res.status(200).json({ success: true, pageCount: 1 });
  }
};
