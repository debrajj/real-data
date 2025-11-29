const cron = require('node-cron');
const mongoose = require('mongoose');
require('dotenv').config();

const { handleThemeUpdate } = require('../services/themeSync');

async function autoSync() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔄 Auto-syncing theme...');
    
    const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN || 'cmstestingg.myshopify.com';
    const themeId = process.env.SHOPIFY_THEME_ID;
    
    await handleThemeUpdate(shopDomain, themeId);
    console.log('✅ Auto-sync completed');
  } catch (error) {
    console.error('❌ Auto-sync failed:', error.message);
  }
}

// Run every 5 minutes
cron.schedule('*/5 * * * *', () => {
  console.log('⏰ Running scheduled theme sync...');
  autoSync();
});

console.log('🚀 Auto-sync scheduler started (every 5 minutes)');
console.log('Press Ctrl+C to stop');

// Run once on startup
autoSync();
