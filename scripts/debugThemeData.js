/**
 * Debug Theme Data
 * Check what theme components are stored in the database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, getClientDB } = require('../config/database');
const { themeDataSchema } = require('../models/schemas');

async function debugThemeData() {
  try {
    console.log('🔍 Debugging Theme Data...\n');

    // Connect to main database
    await connectDB();
    console.log('✅ Connected to main database\n');

    // Get client key from args or use default
    const clientKey = process.argv[2] || 'kidsszone';
    console.log(`📦 Checking theme data for clientKey: ${clientKey}\n`);

    // Connect to client database
    const clientDB = await getClientDB(clientKey);
    console.log(`✅ Connected to ${clientKey} database\n`);

    // Get ThemeData model
    const ThemeData = clientDB.model('ThemeData', themeDataSchema, 'themedatas');

    // Find theme data
    const themeData = await ThemeData.findOne({}).sort({ version: -1 }).lean();

    if (!themeData) {
      console.log('❌ No theme data found in database');
      return;
    }

    console.log('📊 Theme Data Found:');
    console.log(`   - Shop Domain: ${themeData.shopDomain}`);
    console.log(`   - Theme ID: ${themeData.themeId}`);
    console.log(`   - Theme Name: ${themeData.themeName}`);
    console.log(`   - Version: ${themeData.version}`);
    console.log(`   - Updated At: ${themeData.updatedAt}`);
    console.log(`   - Components Count: ${themeData.components?.length || 0}`);
    console.log(`   - Pages Count: ${Object.keys(themeData.pages || {}).length}`);

    if (themeData.components?.length > 0) {
      console.log('\n📋 Components:');
      themeData.components.forEach((comp, i) => {
        console.log(`   ${i + 1}. Type: ${comp.type}, ID: ${comp.id}`);
        console.log(`      Props: ${JSON.stringify(Object.keys(comp.props || {}))}`);
        console.log(`      Blocks: ${comp.blocks?.length || 0}`);
      });
    } else {
      console.log('\n⚠️  No components found in theme data!');
      console.log('\n📋 Raw Data Keys:', Object.keys(themeData.rawData || {}));
      if (themeData.rawData?.original?.current) {
        console.log('📋 Sections in rawData:', Object.keys(themeData.rawData.original.current.sections || {}));
        console.log('📋 Order in rawData:', themeData.rawData.original.current.order);
      }
    }

    if (themeData.pages && Object.keys(themeData.pages).length > 0) {
      console.log('\n📄 Pages:');
      Object.entries(themeData.pages).forEach(([pageName, pageData]) => {
        console.log(`   - ${pageName}: ${pageData.components?.length || 0} components`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
    process.exit(0);
  }
}

debugThemeData();
