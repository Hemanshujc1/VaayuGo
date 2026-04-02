const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');

const { connectDB, sequelize } = require('./models/index'); // Import from models/index to ensure associations are loaded
const AppError = require('./utils/AppError');
const globalErrorHandler = require('./middlewares/errorHandler');
dotenv.config();

const app = express();
const PORT = process.env.APP_PORT || 3001;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false })); // Allow serving static files
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const shopRoutes = require('./routes/shopRoutes');
const productRoutes = require('./routes/productRoutes');
const publicRoutes = require('./routes/publicRoutes');
const orderRoutes = require('./routes/orderRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const contactRoutes = require('./routes/contactRoutes');
const cartRoutes = require('./routes/cartRoutes');
const discountRoutes = require('./routes/discountRoutes');
const xeroxRoutes = require('./routes/xeroxRoutes');
const initSettlementCron = require('./cron/settlementCron');
const initShopStatusCron = require('./cron/shopStatusCron');
const initFileCleanupCron = require('./cron/fileCleanupCron');
const initUnverifiedUserCleanupCron = require('./cron/unverifiedUserCleanupCron');

// Database Connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/files', uploadRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/xerox', xeroxRoutes);

// Basic Route
app.get('/', (req, res) => {
  res.send('VaayuGo Backend is Running');
});

// Unknown route handler
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handling Middleware
app.use(globalErrorHandler);

// Sync Database (Force: false to prevent data loss)
// In development, you might use { force: true } or { alter: true } initially to update schema, but be careful.
sequelize.sync()
  .then(async () => {
    console.log('Database Synced');
    try {
      await sequelize.query('ALTER TABLE Orders ADD COLUMN delivery_date DATE;');
      console.log('Database Schema Patched: Added delivery_date to Orders');
    } catch (err) {
      // Ignore if the column already exists
      if (err.parent && err.parent.code === 'ER_DUP_FIELDNAME') {
        console.log('Database Schema Patch Skipped: delivery_date already exists');
      } else {
        console.error('Database Schema Patch Error:', err.message);
      }
    }
  }).catch((err) => {
    console.error('Database Sync Error:', err);
  });

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Initialize Cron Jobs
  initSettlementCron();
  initShopStatusCron();
  initFileCleanupCron();
  initUnverifiedUserCleanupCron();
});
