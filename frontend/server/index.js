import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { readFileSync } from 'fs';
import { join } from 'path';
import serveStatic from 'serve-static';
import shopify from './shopify.js';
import connectDB from './db.js';
import AppConfig from './models/AppConfig.js';

dotenv.config();
const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT, 10) || 3000;

// Connect to MongoDB
connectDB();

const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: {} })
);

// All endpoints after this point will require an active Shopify session
app.use('/api/*', shopify.validateAuthenticatedSession());

app.use(express.json());
app.use(cors());

// --- API ROUTES ---

// GET Configuration for the current Shop
app.get('/api/config', async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const shop = session.shop;

    // Find all configs (Dev & Prod) for this shop
    const configs = await AppConfig.find({ shop });

    // Return in the format expected by the frontend
    res.status(200).json({ success: true, data: configs });
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// POST/UPDATE Configuration
app.post('/api/config', async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const shop = session.shop;
    const payload = req.body;

    // Ensure we are updating the correct environment for this shop
    const { environment, ...updates } = payload;

    if (!environment) {
      return res.status(400).json({ success: false, error: 'Environment is required' });
    }

    const config = await AppConfig.findOneAndUpdate(
      { shop, environment },
      { 
        $set: {
          ...updates,
          shop, // Enforce shop from session
          environment 
        } 
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, data: config });
  } catch (error) {
    console.error('Error saving config:', error);
    res.status(500).json({ success: false, error: error.message || 'Server Error' });
  }
});

// Serve frontend in production (if built)
const STATIC_PATH =
  process.env.NODE_ENV === 'production'
    ? join(process.cwd(), '../client/dist')
    : join(process.cwd(), '../client');

app.use(serveStatic(STATIC_PATH, { index: false }));

app.use('/*', shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set('Content-Type', 'text/html')
    .send(readFileSync(join(STATIC_PATH, 'index.html')));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});