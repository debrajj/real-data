require('dotenv').config();
const { connectDB } = require('../config/database');
const { syncAllProducts } = require('../services/productSync');

async function syncProducts() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
    
    if (!shopDomain) {
      throw new Error('SHOPIFY_SHOP_DOMAIN not set in .env');
    }

    console.log(`🔄 Starting product sync for ${shopDomain}...`);
    
    const result = await syncAllProducts(shopDomain);

    console.log('\n📊 Sync Results:');
    console.log(`   Total: ${result.total}`);
    console.log(`   ✅ Synced: ${result.synced}`);
    console.log(`   ❌ Failed: ${result.failed}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

syncProducts();
