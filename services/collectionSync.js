const ShopifyAPI = require('./shopifyAPI');
const Collection = require('../models/Collection');
const Shop = require('../models/Shop');

/**
 * Sync all collections from Shopify
 */
async function syncAllCollections(shopDomain) {
  try {
    console.log(`🔄 Starting collection sync for ${shopDomain}`);
    
    const shop = await Shop.findOne({ shopDomain });
    if (!shop) {
      throw new Error(`Shop not found: ${shopDomain}`);
    }

    const shopifyAPI = new ShopifyAPI(shopDomain, shop.accessToken);
    
    // Get both custom and smart collections
    const customCollections = await shopifyAPI.getCollections();
    
    // Also get smart collections
    let smartCollections = [];
    try {
      const response = await require('axios').get(
        `https://${shopDomain}/admin/api/2024-01/smart_collections.json`,
        {
          headers: { 'X-Shopify-Access-Token': shop.accessToken },
          params: { limit: 250 },
        }
      );
      smartCollections = response.data.smart_collections || [];
    } catch (error) {
      console.warn('⚠️ Could not fetch smart collections:', error.message);
    }
    
    const allCollections = [...customCollections, ...smartCollections];
    console.log(`📦 Found ${allCollections.length} collections`);
    
    let synced = 0;
    let failed = 0;
    
    for (const collectionData of allCollections) {
      try {
        await saveCollection(shopDomain, collectionData);
        synced++;
      } catch (error) {
        console.error(`❌ Failed to save collection ${collectionData.id}:`, error);
        failed++;
      }
    }
    
    console.log(`✅ Collection sync complete: ${synced} synced, ${failed} failed`);
    
    return { synced, failed, total: allCollections.length };
  } catch (error) {
    console.error(`❌ Error syncing collections:`, error);
    throw error;
  }
}

/**
 * Save collection to MongoDB
 */
async function saveCollection(shopDomain, collectionData) {
  const collectionDoc = {
    shopDomain,
    collectionId: collectionData.id.toString(),
    title: collectionData.title,
    handle: collectionData.handle,
    body_html: collectionData.body_html,
    published_at: collectionData.published_at,
    updated_at: collectionData.updated_at,
    sort_order: collectionData.sort_order,
    template_suffix: collectionData.template_suffix,
    published_scope: collectionData.published_scope,
    image: collectionData.image,
    rawData: collectionData,
  };

  const savedCollection = await Collection.findOneAndUpdate(
    { shopDomain, collectionId: collectionData.id.toString() },
    collectionDoc,
    { upsert: true, new: true }
  );

  return savedCollection;
}

/**
 * Get all collections for a shop
 */
async function getCollections(shopDomain, options = {}) {
  const query = { shopDomain };
  
  const collections = await Collection.find(query)
    .select('-rawData')
    .sort({ createdAt: -1 })
    .allowDiskUse(true)
    .limit(options.limit || 250)
    .lean();

  return collections;
}

module.exports = {
  syncAllCollections,
  saveCollection,
  getCollections,
};
