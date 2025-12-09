import { shopifyApi, ApiVersion, BillingInterval } from '@shopify/shopify-api';
import { shopifyApp } from '@shopify/shopify-app-express';
import { MongoDBSessionStorage } from '@shopify/shopify-app-session-storage-mongodb';
import dotenv from 'dotenv';
dotenv.config();

// Initialize MongoDB Session Storage for Shopify OAuth tokens
const storage = new MongoDBSessionStorage(
  new URL(process.env.MONGODB_URI),
  process.env.DB_NAME || 'appmint_db',
);

const shopify = shopifyApp({
  api: {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    scopes: (process.env.SCOPES || 'read_products,write_products').split(','),
    hostName: process.env.HOST?.replace(/https:\/\//, ''),
    apiVersion: ApiVersion.January24,
    isEmbeddedApp: true,
  },
  auth: {
    path: '/api/auth',
    callbackPath: '/api/auth/callback',
  },
  webhooks: {
    path: '/api/webhooks',
  },
  sessionStorage: storage,
});

export default shopify;