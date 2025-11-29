const mongoose = require('mongoose');
require('dotenv').config();

const { syncAllCollections } = require('../services/collectionSync');

async function main() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
    
    const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN || 'cmstestingg.myshopify.com';
    
    console.log(`🔄 Syncing collections for ${shopDomain}...`);
    const result = await syncAllCollections(shopDomain);
    
    console.log('\n✅ Collection sync complete!');
    console.log(`   Total: ${result.total}`);
    console.log(`   Synced: ${result.synced}`);
    console.log(`   Failed: ${result.failed}`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
