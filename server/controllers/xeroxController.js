const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const FileService = require('../services/FileService');

const calculatePages = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload a file', 400));
  }

  const pageCount = await FileService.getPageCount(req.file, req.file.mimetype);
  
  res.json({
    success: true,
    pageCount,
    filename: req.file.originalname,
    mimetype: req.file.mimetype
  });
});

module.exports = {
  calculatePages
};
