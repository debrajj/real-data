require('dotenv').config();
const { connectDB } = require('../config/database');
const Media = require('../models/Media');

async function viewMedia() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
    
    if (!shopDomain) {
      throw new Error('SHOPIFY_SHOP_DOMAIN not set in .env');
    }

    const media = await Media.find({ shopDomain })
      .select('-data')
      .sort({ createdAt: -1 });

    console.log(`\n📸 Found ${media.length} images for ${shopDomain}\n`);

    media.forEach((img, i) => {
      console.log(`${i + 1}. ${img.filename}`);
      console.log(`   ID: ${img._id}`);
      console.log(`   Size: ${formatBytes(img.size)}`);
      console.log(`   Type: ${img.contentType}`);
      console.log(`   CDN URL: ${img.cdnUrl}`);
      console.log(`   Original: ${img.originalUrl}`);
      console.log(`   Created: ${img.createdAt.toLocaleString()}`);
      console.log('');
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

viewMedia();
