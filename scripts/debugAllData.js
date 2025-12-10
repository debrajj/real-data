/**
 * Debug All Data
 * Check what data is stored in the database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, getClientDB } = require('../config/database');
const { themeDataSchema, productSchema, collectionSchema } = require('../models/schemas');
const ClientConfig = require('../models/ClientConfig');

async function debugAllData() {
  try {
    console.log('🔍 Debugging All Data...\n');

    // Connect to main database
    await connectDB();
    console.log('✅ Connected to main database\n');

    // List all client configs
    const configs = await ClientConfig.find().lean();
    console.log(`📋 Found ${configs.length} client configuration(s):`);
    configs.forEach(config => {
      console.log(`   - ${config.clientKey} (${config.environment})`);
      console.log(`     Shop: ${config.shopDomain || 'N/A'}`);
      console.log(`     Database: ${config.databaseName || config.clientKey}`);
    });

    if (configs.length === 0) {
      console.log('\n⚠️  No client configurations found!');
      console.log('   You need to login first to create a client configuration.');
      return;
    }

    // Check each client's database
    for (const config of configs) {
      const clientKey = config.clientKey;
      console.log(`\n${'='.repeat(50)}`);
      console.log(`📦 Checking data for: ${clientKey}`);
      console.log(`${'='.repeat(50)}`);

      try {
        const clientDB = await getClientDB(clientKey);
        
        // Get models
        const ThemeData = clientDB.model('ThemeData', themeDataSchema, 'themedatas');
        const Product = clientDB.model('Product', productSchema, 'products');
        const Collection = clientDB.model('Collection', collectionSchema, 'collections');

        // Count documents
        const themeCount = await ThemeData.countDocuments();
        const productCount = await Product.countDocuments();
        const collectionCount = await Collection.countDocuments();

        console.log(`\n📊 Data Counts:`);
        console.log(`   - Theme Data: ${themeCount}`);
        console.log(`   - Products: ${productCount}`);
        console.log(`   - Collections: ${collectionCount}`);

        if (themeCount > 0) {
          const theme = await ThemeData.findOne().sort({ version: -1 }).lean();
          console.log(`\n📋 Theme Info:`);
          console.log(`   - Version: ${theme.version}`);
          console.log(`   - Components: ${theme.components?.length || 0}`);
          if (theme.components?.length > 0) {
            console.log(`   - Component Types: ${theme.components.map(c => c.type).join(', ')}`);
          }
        }

        if (productCount > 0) {
          const products = await Product.find().limit(3).select('title productId').lean();
          console.log(`\n📋 Sample Products:`);
          products.forEach(p => console.log(`   - ${p.title} (${p.productId})`));
        }

      } catch (err) {
        console.log(`   ❌ Error accessing ${clientKey}: ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
    process.exit(0);
  }
}

debugAllData();
