const express = require('express');
const router = express.Router();
const { handleThemeUpdate } = require('../services/themeSync');
const { fixImageUrlsInData } = require('../utils/imageUrlFixer');
const { getStoreModel, getClientKeyFromShopDomain } = require('../config/database');
const { themeDataSchema, productSchema, collectionSchema } = require('../models/schemas');

/**
 * GET /api/theme/client/:clientKey
 * Get theme data by clientKey (no shopDomain needed)
 */
router.get('/client/:clientKey', async (req, res) => {
  try {
    const { clientKey } = req.params;
    console.log(`📦 Fetching theme data for clientKey: ${clientKey}`);
    
    const ThemeData = await getStoreModel(clientKey, 'ThemeData', themeDataSchema, 'themedatas');
    const Product = await getStoreModel(clientKey, 'Product', productSchema, 'products');
    const Collection = await getStoreModel(clientKey, 'Collection', collectionSchema, 'collections');
    
    // Get the most recently updated theme (which should be the active one after sync)
    const themeData = await ThemeData.findOne({})
      .sort({ updatedAt: -1 })
      .lean();
    
    console.log(`📦 ThemeData found: ${!!themeData}, components: ${themeData?.components?.length || 0}`);
    if (themeData?.components?.length > 0) {
      console.log(`📦 Component types: ${themeData.components.map(c => c.type).join(', ')}`);
    }
    
    const products = await Product.find({})
      .select('-rawData')
      .limit(50)
      .lean();
    
    const collections = await Collection.find({})
      .select('-rawData')
      .limit(50)
      .lean();
    
    console.log(`📦 Products: ${products.length}, Collections: ${collections.length}`);
    
    res.json({
      success: true,
      data: {
        theme: themeData,
        products,
        collections,
        counts: {
          products: products.length,
          collections: collections.length,
          hasTheme: !!themeData
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching theme data by clientKey:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/theme/sync
 * Manually trigger theme sync
 */
router.post('/sync', async (req, res) => {
  try {
    const shopDomain = req.body.shopDomain || process.env.SHOPIFY_SHOP_DOMAIN || 'cmstestingg.myshopify.com';
    const themeId = req.body.themeId || process.env.SHOPIFY_THEME_ID;
    
    console.log(`🔄 Manual theme sync requested for ${shopDomain}`);
    
    const result = await handleThemeUpdate(shopDomain, themeId);
    
    res.json({
      success: true,
      message: 'Theme synced successfully',
      version: result.version,
      components: result.components.length,
      themeId: result.themeId
    });
  } catch (error) {
    console.error('❌ Theme sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/theme/data
 * Get current theme data
 */
router.get('/data', async (req, res) => {
  try {
    const shopDomain = req.query.shopDomain || process.env.SHOPIFY_SHOP_DOMAIN || 'cmstestingg.myshopify.com';
    
    // Get clientKey from shopDomain
    const clientKey = await getClientKeyFromShopDomain(shopDomain);
    if (!clientKey) {
      return res.status(404).json({
        success: false,
        error: `No client found for shop: ${shopDomain}`
      });
    }
    
    // Get models for this store's database
    const ThemeData = await getStoreModel(clientKey, 'ThemeData', themeDataSchema, 'themedatas');
    const Product = await getStoreModel(clientKey, 'Product', productSchema, 'products');
    const Collection = await getStoreModel(clientKey, 'Collection', collectionSchema, 'collections');
    
    const themeData = await ThemeData.findOne({ shopDomain })
      .sort({ version: -1 })
      .lean();
    
    if (!themeData) {
      return res.status(404).json({
        success: false,
        error: 'No theme data found'
      });
    }
    
    const products = await Product.find({ shopDomain })
      .select('-rawData')
      .lean();
    
    const collections = await Collection.find({ shopDomain })
      .select('-rawData')
      .lean();
    
    // Add products to collections
    const enrichedCollections = collections.map(collection => ({
      ...collection,
      products: products.filter(p => 
        p.collections?.some(c => c.id === collection.id || c.handle === collection.handle)
      )
    }));
    
    // Fix image URLs before sending response
    const responseData = fixImageUrlsInData({
      ...themeData,
      products,
      collections: enrichedCollections
    }, shopDomain);
    
    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('❌ Error fetching theme data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/theme/status
 * Get theme sync status
 */
router.get('/status', async (req, res) => {
  try {
    const shopDomain = req.query.shopDomain || process.env.SHOPIFY_SHOP_DOMAIN || 'cmstestingg.myshopify.com';
    
    // Get clientKey from shopDomain
    const clientKey = await getClientKeyFromShopDomain(shopDomain);
    if (!clientKey) {
      return res.json({
        success: true,
        synced: false,
        message: `No client found for shop: ${shopDomain}`
      });
    }
    
    const ThemeData = await getStoreModel(clientKey, 'ThemeData', themeDataSchema, 'themedatas');
    
    const themeData = await ThemeData.findOne({ shopDomain })
      .sort({ version: -1 })
      .select('version updatedAt themeId themeName components')
      .lean();
    
    if (!themeData) {
      return res.json({
        success: true,
        synced: false,
        message: 'No theme data found'
      });
    }
    
    res.json({
      success: true,
      synced: true,
      version: themeData.version,
      lastSync: themeData.updatedAt,
      themeId: themeData.themeId,
      themeName: themeData.themeName,
      componentsCount: themeData.components?.length || 0
    });
  } catch (error) {
    console.error('❌ Error fetching theme status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
