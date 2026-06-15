const express = require('express');
const cors = require('cors');
const { connectDB, closeDB } = require('./config/db');
const customerRoutes = require('./routes/customerRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const aiRoutes = require('./routes/aiRoutes');
const { errorHandler } = require('./middleware/errorHandler');
const seed = require('./seed');
const Order = require('./models/Order');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Establish Mongoose DB Connection
connectDB().then(async () => {
  // Run seed initially to ensure data exists
  await seed();
});

// Routes
app.use('/api/customers', customerRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/ai', aiRoutes);

// Helper endpoint to fetch raw orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ orderDate: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seed endpoint
app.post('/api/seed', async (req, res) => {
  try {
    await seed();
    res.json({ message: 'Database reset and seeded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'CRM Backend Server' });
});

// Error handling middleware
app.use(errorHandler);

// Start listening
const server = app.listen(PORT, () => {
  console.log(`CRM Backend running on port ${PORT}`);
});

// Handle graceful shutdowns
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received. Closing servers...');
  server.close(async () => {
    await closeDB();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received. Closing servers...');
  server.close(async () => {
    await closeDB();
    process.exit(0);
  });
});
