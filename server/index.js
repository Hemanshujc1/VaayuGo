const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { connectDB, sequelize } = require('./src/models/index'); // Import from models/index to ensure associations are loaded

dotenv.config();

const app = express();
const PORT = process.env.APP_PORT || 3001;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false })); // Allow serving static files
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));


const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const shopRoutes = require('./src/routes/shopRoutes');
const productRoutes = require('./src/routes/productRoutes');
const publicRoutes = require('./src/routes/publicRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');
const contactRoutes = require('./src/routes/contactRoutes');


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

// Basic Route
app.get('/', (req, res) => {
  res.send('VaayuGo Backend is Running');
});

// Sync Database (Force: false to prevent data loss)
// In development, you might use { force: true } or { alter: true } initially to update schema, but be careful.
sequelize.sync({ alter: true }).then(() => {
  console.log('Database Synced');
}).catch((err) => {
  console.error('Database Sync Error:', err);
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
