const axios = require('axios');
require('dotenv').config();

const SHOP_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const THEME_ID = process.env.SHOPIFY_THEME_ID;

async function listThemeAssets() {
  try {
    console.log('📋 Listing all theme assets...\n');
    
    const response = await axios.get(
      `https://${SHOP_DOMAIN}/admin/api/2024-01/themes/${THEME_ID}/assets.json`,
      {
        headers: {
          'X-Shopify-Access-Token': ACCESS_TOKEN,
        },
      }
    );
    
    const assets = response.data.assets;
    
    // Group by type
    const cssFiles = assets.filter(a => a.key.endsWith('.css'));
    const jsFiles = assets.filter(a => a.key.endsWith('.js'));
    const liquidFiles = assets.filter(a => a.key.endsWith('.liquid'));
    
    console.log(`📄 CSS Files (${cssFiles.length}):`);
    cssFiles.forEach(a => console.log(`  - ${a.key}`));
    
    console.log(`\n📜 JavaScript Files (${jsFiles.length}):`);
    jsFiles.slice(0, 10).forEach(a => console.log(`  - ${a.key}`));
    if (jsFiles.length > 10) console.log(`  ... and ${jsFiles.length - 10} more`);
    
    console.log(`\n🧩 Liquid Templates (${liquidFiles.length}):`);
    liquidFiles.slice(0, 15).forEach(a => console.log(`  - ${a.key}`));
    if (liquidFiles.length > 15) console.log(`  ... and ${liquidFiles.length - 15} more`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listThemeAssets();
