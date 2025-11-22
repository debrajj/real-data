require('dotenv').config();
const { connectDB } = require('../config/database');
const Product = require('../models/Product');

async function viewProducts() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
    
    if (!shopDomain) {
      throw new Error('SHOPIFY_SHOP_DOMAIN not set in .env');
    }

    const products = await Product.find({ shopDomain })
      .select('-rawData')
      .sort({ createdAt: -1 })
      .limit(50);

    console.log(`\n🏷️ Found ${products.length} products for ${shopDomain}\n`);

    products.forEach((product, i) => {
      console.log(`${i + 1}. ${product.title}`);
      console.log(`   ID: ${product.productId}`);
      console.log(`   Handle: ${product.handle}`);
      console.log(`   Status: ${product.status}`);
      console.log(`   Vendor: ${product.vendor}`);
      console.log(`   Type: ${product.product_type}`);
      console.log(`   Variants: ${product.variants.length}`);
      console.log(`   Images: ${product.images.length}`);
      if (product.variants.length > 0) {
        console.log(`   Price: $${product.variants[0].price}`);
      }
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

viewProducts();
