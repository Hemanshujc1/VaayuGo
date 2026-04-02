const express = require('express');
const router = express.Router();
const xeroxController = require('../controllers/xeroxController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Assume authentication middleware exists, but for now keeping it simple as per project matches
// const { protect, authorize } = require('../middlewares/auth');

router.post('/calculate-pages', upload.single('file'), xeroxController.calculatePages);

// Xerox Configuration
router.get('/:shopId/xerox-config', xeroxController.getXeroxConfig);
router.post('/:shopId/xerox-config', xeroxController.updateXeroxConfig);
router.patch('/:shopId/toggle-xerox', xeroxController.toggleXeroxService);

// Binding Options
router.get('/:shopId/bindings', xeroxController.getBindingOptions);
router.post('/:shopId/bindings', xeroxController.addBindingOption);
router.put('/bindings/:id', xeroxController.updateBindingOption);
router.delete('/bindings/:id', xeroxController.deleteBindingOption);

module.exports = router;
