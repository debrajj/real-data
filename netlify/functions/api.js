const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { connectDB } = require('../../config/database');
const webhookRoutes = require('../../routes/webhooks');
const sseRoutes = require('../../routes/sse');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3002',
    'https://realx-dara.netlify.app',
    /https:\/\/.*--realx-dara\.netlify\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
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

// Routes
app.use('/webhooks', webhookRoutes);
app.use('/api', sseRoutes);

// Wrap with serverless
const handler = serverless(app);

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  await connectToDatabase();
  return handler(event, context);
};
