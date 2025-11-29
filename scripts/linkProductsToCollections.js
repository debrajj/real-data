const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const Product = require('../models/Product');
const Collection = require('../models/Collection');

async function linkProductsToCollections() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');
    
    const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN || 'cmstestingg.myshopify.com';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    
    // Get all collections
    const collections = await Collection.find({ shopDomain });
    console.log(`📚 Found ${collections.length} collections\n`);
    
    let totalLinked = 0;
    
    for (const collection of collections) {
      console.log(`🔗 Processing collection: ${collection.title} (${collection.handle})`);
      
      try {
        // Fetch products in this collection from Shopify
        const response = await axios.get(
          `https://${shopDomain}/admin/api/2024-01/collections/${collection.collectionId}/products.json`,
          {
            headers: { 'X-Shopify-Access-Token': accessToken },
            params: { limit: 250 }
          }
        );
        
        const products = response.data.products || [];
        console.log(`   Found ${products.length} products`);
        
        // Update each product in MongoDB
        for (const shopifyProduct of products) {
          const result = await Product.findOneAndUpdate(
            { 
              shopDomain, 
              productId: shopifyProduct.id.toString() 
            },
            { 
              $addToSet: { collections: collection.collectionId }
            },
            { new: true }
          );
          
          if (result) {
            totalLinked++;
          }
        }
        
        console.log(`   ✅ Linked ${products.length} products\n`);
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`);
      }
    }
    
    console.log(`\n✅ Complete! Linked ${totalLinked} product-collection relationships`);
    
    // Show stationery products
    console.log('\n📚 Products in Stationery collection:');
    const stationeryCollection = collections.find(c => c.handle === 'stationery');
    if (stationeryCollection) {
      const stationeryProducts = await Product.find({
        shopDomain,
        collections: stationeryCollection.collectionId
      }).select('title productId');
      
      stationeryProducts.forEach((p, i) => {
        console.log(`${i+1}. ${p.title.substring(0, 70)}`);
        console.log(`   ID: ${p.productId}`);
      });
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

linkProductsToCollections();
