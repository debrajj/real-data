require('dotenv').config();
const { connectDB } = require('../config/database');
const ThemeData = require('../models/ThemeData');
const MediaService = require('../services/mediaService');

async function downloadImages() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
    
    if (!shopDomain) {
      throw new Error('SHOPIFY_SHOP_DOMAIN not set in .env');
    }

    // Get latest theme data
    const themeData = await ThemeData.findOne({ shopDomain })
      .sort({ updatedAt: -1 });

    if (!themeData) {
      throw new Error(`No theme data found for ${shopDomain}`);
    }

    console.log(`📦 Found theme: ${themeData.themeName} (ID: ${themeData.themeId})`);

    // Download images
    const mediaService = new MediaService(shopDomain);
    const results = await mediaService.downloadAllImages(themeData);

    console.log('\n📊 Results:');
    console.log(`   Total images: ${results.total}`);
    console.log(`   ✅ Downloaded: ${results.success}`);
    console.log(`   ⏭️  Skipped (existing): ${results.skipped}`);
    console.log(`   ❌ Failed: ${results.failed}`);

    console.log('\n📸 Images:');
    results.images.forEach((img, i) => {
      console.log(`   ${i + 1}. ${img.filename} (${formatBytes(img.size)})`);
      console.log(`      CDN: ${img.cdnUrl || img.originalUrl}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

downloadImages();
