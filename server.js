const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');
const { connectDB } = require('./config/database');
const webhookRoutes = require('./routes/webhooks');
const sseRoutes = require('./routes/sse');
const mediaRoutes = require('./routes/media');
const productsRoutes = require('./routes/products');
const collectionsRoutes = require('./routes/collections');
const blogsRoutes = require('./routes/blogs');
const discountsRoutes = require('./routes/discounts');
const authRoutes = require('./routes/auth');
const themeRoutes = require('./routes/theme');
const configRoutes = require('./routes/config');
const seedRoutes = require('./routes/seed');
const shopifyAuthRoutes = require('./routes/shopify-auth');
const sessionRoutes = require('./routes/session');

const { initializeChangeStream } = require('./services/changeStream');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for API
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Shopify-Shop-Domain']
}));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.raw({ type: 'application/json' }));

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// API Routes
app.use('/webhooks', webhookRoutes);
app.use('/api', sseRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/blogs', blogsRoutes);
app.use('/api/discounts', discountsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/theme', themeRoutes);
app.use('/api/config', configRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/shopify', shopifyAuthRoutes);
app.use('/api/session', sessionRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Shopify CMS API Server',
    version: '1.0.0',
    endpoints: {
      config: '/api/config',
      products: '/api/products',
      collections: '/api/collections',
      blogs: '/api/blogs',
      theme: '/api/theme',
      media: '/api/media',
      discounts: '/api/discounts',
      webhooks: '/webhooks',
      sse: '/api/stream'
    }
  });
});

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api') || req.path.startsWith('/webhooks')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

// 404 handler for unknown API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    console.log('✅ MongoDB connected');

    // Initialize change stream
    initializeChangeStream();
    console.log('✅ Change stream initialized');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Webhook endpoint: ${process.env.HOST}/webhooks/theme`);
      console.log(`📊 SSE endpoint: ${process.env.HOST}/api/stream`);
      console.log(`📋 API docs: ${process.env.HOST}/`);
    });
  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
};

startServer();
