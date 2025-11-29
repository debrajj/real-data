const ShopifyAPI = require('../services/shopifyAPI');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SHOP_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const THEME_ID = process.env.SHOPIFY_THEME_ID;

async function fetchThemeAssets() {
  try {
    console.log('🎨 Fetching Ella theme assets...');
    
    const shopifyAPI = new ShopifyAPI(SHOP_DOMAIN, ACCESS_TOKEN);
    
    // Common CSS files in Shopify themes
    const cssFiles = [
      'assets/base.css',
      'assets/component-card.css',
      'assets/component-price.css',
      'assets/section-main-product.css',
      'assets/section-featured-product.css',
      'assets/component-slider.css',
      'assets/component-slideshow.css',
      'assets/section-image-banner.css',
      'assets/section-collection-list.css',
      'assets/section-featured-collection.css',
      'assets/component-product-card.css',
      'assets/theme.css',
      'assets/global.css',
    ];
    
    const outputDir = path.join(__dirname, '../client/src/components/ella-theme');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    let combinedCSS = '/* Ella Theme CSS - Auto-generated */\n\n';
    
    for (const cssFile of cssFiles) {
      try {
        console.log(`📥 Fetching ${cssFile}...`);
        const asset = await shopifyAPI.getThemeAsset(THEME_ID, cssFile);
        
        if (asset && asset.value) {
          combinedCSS += `\n/* ========== ${cssFile} ========== */\n`;
          combinedCSS += asset.value;
          combinedCSS += '\n\n';
          console.log(`✅ Fetched ${cssFile}`);
        }
      } catch (error) {
        console.log(`⚠️  ${cssFile} not found, skipping...`);
      }
    }
    
    // Save combined CSS
    const outputPath = path.join(outputDir, 'ella-theme.css');
    fs.writeFileSync(outputPath, combinedCSS);
    console.log(`\n✅ Saved combined CSS to ${outputPath}`);
    
    // Also fetch theme.liquid to understand the structure
    try {
      console.log('\n📥 Fetching theme.liquid...');
      const themeLiquid = await shopifyAPI.getThemeAsset(THEME_ID, 'layout/theme.liquid');
      if (themeLiquid && themeLiquid.value) {
        fs.writeFileSync(path.join(outputDir, 'theme.liquid'), themeLiquid.value);
        console.log('✅ Saved theme.liquid');
      }
    } catch (error) {
      console.log('⚠️  Could not fetch theme.liquid');
    }
    
    console.log('\n🎉 Theme assets fetched successfully!');
    console.log(`📁 Files saved to: ${outputDir}`);
    
  } catch (error) {
    console.error('❌ Error fetching theme assets:', error.message);
    process.exit(1);
  }
}

fetchThemeAssets();
