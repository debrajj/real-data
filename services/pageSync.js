const ShopifyAPI = require('./shopifyAPI');
const Shop = require('../models/Shop');

/**
 * Sync all pages from Shopify
 */
async function syncAllPages(shopDomain) {
  try {
    console.log(`🔄 Starting pages sync for ${shopDomain}`);
    
    const shop = await Shop.findOne({ shopDomain });
    if (!shop) {
      throw new Error(`Shop not found: ${shopDomain}`);
    }

    const shopifyAPI = new ShopifyAPI(shopDomain, shop.accessToken);
    const pages = await shopifyAPI.getAllPages();
    
    console.log(`📄 Found ${pages.length} pages`);
    
    return {
      pages,
      total: pages.length,
    };
  } catch (error) {
    console.error(`❌ Error syncing pages:`, error);
    throw error;
  }
}

module.exports = {
  syncAllPages,
};
