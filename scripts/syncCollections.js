require('dotenv').config();
const { connectDB } = require('../config/database');
const { syncAllCollections } = require('../services/collectionSync');

const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN || 'cmstestingg.myshopify.com';

async function main() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');
    
    console.log(`🔄 Syncing collections for ${shopDomain}...`);
    const result = await syncAllCollections(shopDomain);
    
    console.log('\n📊 Sync Results:');
    console.log(`   Total: ${result.total}`);
    console.log(`   Synced: ${result.synced}`);
    console.log(`   Failed: ${result.failed}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
