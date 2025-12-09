const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const { connectDB } = require('../../config/database');
const webhookRoutes = require('../../routes/webhooks');
const sseRoutes = require('../../routes/sse');
const mediaRoutes = require('../../routes/media');
const productsRoutes = require('../../routes/products');
const collectionsRoutes = require('../../routes/collections');
const blogsRoutes = require('../../routes/blogs');
const discountsRoutes = require('../../routes/discounts');
const authRoutes = require('../../routes/auth');
const themeRoutes = require('../../routes/theme');
const configRoutes = require('../../routes/config');
const shopifyAuthRoutes = require('../../routes/shopify-auth');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3002',
    /https:\/\/.*\.netlify\.app$/,
    /https:\/\/.*\.myshopify\.com$/,
    'https://admin.shopify.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Shopify-Shop-Domain', 'X-Shopify-Hmac-Sha256']
}));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.raw({ type: 'application/json' }));

// Connect to MongoDB once
let isConnected = false;
const connectToDatabase = async () => {
  if (isConnected) return;
  await connectDB();
  isConnected = true;
};

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'Shopify Theme Sync Server Running on Netlify',
    timestamp: new Date().toISOString(),
    env: {
      hasMongoUri: !!process.env.MONGODB_URI,
      hasShopifyKey: !!process.env.SHOPIFY_API_KEY,
      hasShopifyToken: !!process.env.SHOPIFY_ACCESS_TOKEN,
      shopDomain: process.env.SHOPIFY_SHOP_DOMAIN
    }
  });
});

// Routes - handle both with and without /.netlify/functions/api prefix
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
app.use('/api/shopify', shopifyAuthRoutes);
app.use('/.netlify/functions/api/webhooks', webhookRoutes);
app.use('/.netlify/functions/api/api', sseRoutes);
app.use('/.netlify/functions/api/api/media', mediaRoutes);
app.use('/.netlify/functions/api/api/products', productsRoutes);
app.use('/.netlify/functions/api/api/collections', collectionsRoutes);
app.use('/.netlify/functions/api/api/blogs', blogsRoutes);
app.use('/.netlify/functions/api/api/discounts', discountsRoutes);
app.use('/.netlify/functions/api/api/auth', authRoutes);
app.use('/.netlify/functions/api/api/theme', themeRoutes);
app.use('/.netlify/functions/api/api/config', configRoutes);
app.use('/.netlify/functions/api/api/shopify', shopifyAuthRoutes);

// Wrap with serverless
const handler = serverless(app, {
  basePath: '/.netlify/functions/api'
});

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    await connectToDatabase();
  } catch (error) {
    console.error('Database connection error:', error);
  }
  
  return handler(event, context);
};
