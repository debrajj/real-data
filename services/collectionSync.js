const ShopifyAPI = require('./shopifyAPI');
const Shop = require('../models/Shop');
const { getStoreModel, getClientKeyFromShopDomain } = require('../config/database');
const { collectionSchema } = require('../models/schemas');

/**
 * Get Collection model for a specific store database
 */
async function getCollectionModel(clientKey) {
  return getStoreModel(clientKey, 'Collection', collectionSchema, 'collections');
}

/**
 * Sync all collections from Shopify
 */
async function syncAllCollections(shopDomain, clientKey = null) {
  try {
    console.log(`🔄 Starting collection sync for ${shopDomain}`);
    
    // Get clientKey if not provided
    if (!clientKey) {
      clientKey = await getClientKeyFromShopDomain(shopDomain);
      if (!clientKey) {
        throw new Error(`No client found for shop: ${shopDomain}`);
      }
    }
    
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
    console.log(`📦 Found ${allCollections.length} collections → saving to ${clientKey} database`);
    
    let synced = 0;
    let failed = 0;
    
    for (const collectionData of allCollections) {
      try {
        await saveCollection(shopDomain, collectionData, clientKey);
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
 * Save collection to store database
 */
async function saveCollection(shopDomain, collectionData, clientKey = null) {
  if (!clientKey) {
    clientKey = await getClientKeyFromShopDomain(shopDomain);
    if (!clientKey) {
      throw new Error(`No client found for shop: ${shopDomain}`);
    }
  }
  
  const Collection = await getCollectionModel(clientKey);
  
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
async function getCollections(shopDomain, options = {}, clientKey = null) {
  if (!clientKey) {
    clientKey = await getClientKeyFromShopDomain(shopDomain);
    if (!clientKey) {
      throw new Error(`No client found for shop: ${shopDomain}`);
    }
  }
  
  const Collection = await getCollectionModel(clientKey);
  const query = { shopDomain };
  
  const collections = await Collection.find(query)
    .select('-rawData')
    .sort({ createdAt: -1 })
    .limit(options.limit || 250)
    .lean();

  return collections;
}

module.exports = {
  syncAllCollections,
  saveCollection,
  getCollections,
  getCollectionModel,
};
