const ShopifyAPI = require('../services/shopifyAPI');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SHOP_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN;
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const THEME_ID = process.env.SHOPIFY_THEME_ID;

async function fetchEllaThemeCSS() {
  try {
    console.log('🎨 Fetching Ella theme CSS files...\n');
    
    const shopifyAPI = new ShopifyAPI(SHOP_DOMAIN, ACCESS_TOKEN);
    
    // Essential CSS files for Ella theme
    const cssFiles = [
      'assets/base.css',
      'assets/component-slider.css',
      'assets/component-spotlight-block.css',
      'assets/component-featured-collection.css',
      'assets/section-image-banner.css',
      'assets/component-product.css',
      'assets/component-product-card-marquee.css',
      'assets/component-tab.css',
      'assets/component-sticky-scrolling-banner.css',
      'assets/video-section.css',
      'assets/component-custom-service-block.css',
      'assets/component-instagram.css',
      'assets/component-card.css',
      'assets/component-price.css',
      'assets/component-badge.css',
      'assets/component-rte.css',
      'assets/animated.css',
      'assets/custom.css',
    ];
    
    const outputDir = path.join(__dirname, '../client/src/components/ella-theme');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    let combinedCSS = `/* Ella Theme CSS - Complete */
/* Theme: Ella by HaloThemes */
/* Auto-generated from Shopify theme assets */

:root {
  /* Ella Theme Colors */
  --color-primary: #232323;
  --color-secondary: #06bfe2;
  --color-text: #2b2b2b;
  --color-text-light: #969696;
  --color-background: #ffffff;
  --color-error: #06bfe2;
  --color-success: #01be98;
  
  /* Typography */
  --font-body: 'Poppins', sans-serif;
  --font-heading: 'Poppins', sans-serif;
  --font-size-base: 16px;
  --line-height-base: 26px;
}

`;
    
    for (const cssFile of cssFiles) {
      try {
        console.log(`📥 Fetching ${cssFile}...`);
        const asset = await shopifyAPI.getThemeAsset(THEME_ID, cssFile);
        
        if (asset && asset.value) {
          combinedCSS += `\n/* ========== ${cssFile} ========== */\n`;
          combinedCSS += asset.value;
          combinedCSS += '\n\n';
          console.log(`✅ ${cssFile}`);
        }
      } catch (error) {
        console.log(`⚠️  ${cssFile} not found`);
      }
    }
    
    // Save combined CSS
    const outputPath = path.join(outputDir, 'ella-complete.css');
    fs.writeFileSync(outputPath, combinedCSS);
    console.log(`\n✅ Saved complete Ella CSS to ${outputPath}`);
    console.log(`📦 File size: ${(combinedCSS.length / 1024).toFixed(2)} KB`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fetchEllaThemeCSS();
