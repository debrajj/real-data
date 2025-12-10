/**
 * Register Shopify Webhooks
 * Run this script to set up automatic theme sync when themes are published
 */

require('dotenv').config();
const axios = require('axios');

const SHOPIFY_SHOP_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const WEBHOOK_BASE_URL = process.env.WEBHOOK_BASE_URL || process.env.API_BASE_URL;

if (!SHOPIFY_SHOP_DOMAIN || !SHOPIFY_ACCESS_TOKEN) {
  console.error('❌ Missing SHOPIFY_SHOP_DOMAIN or SHOPIFY_ACCESS_TOKEN in .env');
  process.exit(1);
}

if (!WEBHOOK_BASE_URL) {
  console.error('❌ Missing WEBHOOK_BASE_URL in .env (your public server URL)');
  console.error('   Example: https://your-app.netlify.app or https://your-app.vercel.app');
  process.exit(1);
}

const shopifyAPI = axios.create({
  baseURL: `https://${SHOPIFY_SHOP_DOMAIN}/admin/api/2024-01`,
  headers: {
    'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
    'Content-Type': 'application/json',
  },
});

// Webhooks to register for theme sync
const webhooksToRegister = [
  { topic: 'themes/publish', address: `${WEBHOOK_BASE_URL}/api/webhooks/theme` },
  { topic: 'themes/update', address: `${WEBHOOK_BASE_URL}/api/webhooks/theme` },
];

async function listWebhooks() {
  try {
    const response = await shopifyAPI.get('/webhooks.json');
    return response.data.webhooks || [];
  } catch (error) {
    console.error('❌ Error listing webhooks:', error.response?.data || error.message);
    return [];
  }
}

async function deleteWebhook(id) {
  try {
    await shopifyAPI.delete(`/webhooks/${id}.json`);
    console.log(`🗑️  Deleted webhook ${id}`);
  } catch (error) {
    console.error(`❌ Error deleting webhook ${id}:`, error.response?.data || error.message);
  }
}

async function createWebhook(topic, address) {
  try {
    const response = await shopifyAPI.post('/webhooks.json', {
      webhook: {
        topic,
        address,
        format: 'json',
      },
    });
    console.log(`✅ Created webhook: ${topic} -> ${address}`);
    return response.data.webhook;
  } catch (error) {
    if (error.response?.status === 422) {
      console.log(`⚠️  Webhook ${topic} already exists or address is invalid`);
    } else {
      console.error(`❌ Error creating webhook ${topic}:`, error.response?.data || error.message);
    }
    return null;
  }
}

async function main() {
  console.log('🔧 Shopify Webhook Registration\n');
  console.log(`Shop: ${SHOPIFY_SHOP_DOMAIN}`);
  console.log(`Webhook URL: ${WEBHOOK_BASE_URL}\n`);

  // List existing webhooks
  console.log('📋 Existing webhooks:');
  const existingWebhooks = await listWebhooks();
  
  if (existingWebhooks.length === 0) {
    console.log('   (none)\n');
  } else {
    existingWebhooks.forEach(wh => {
      console.log(`   - ${wh.topic}: ${wh.address}`);
    });
    console.log('');
  }

  // Check for --clean flag to remove old webhooks
  if (process.argv.includes('--clean')) {
    console.log('🧹 Cleaning old webhooks...');
    for (const wh of existingWebhooks) {
      await deleteWebhook(wh.id);
    }
    console.log('');
  }

  // Register new webhooks
  console.log('📝 Registering webhooks...');
  for (const { topic, address } of webhooksToRegister) {
    // Check if already exists
    const existing = existingWebhooks.find(wh => wh.topic === topic && wh.address === address);
    if (existing) {
      console.log(`⏭️  Skipping ${topic} (already registered)`);
      continue;
    }
    await createWebhook(topic, address);
  }

  console.log('\n✅ Done!');
  console.log('\nNow when you publish a theme in Shopify, it will automatically sync to your app.');
}

main().catch(console.error);
