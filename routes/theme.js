const express = require('express');
const router = express.Router();
const { handleThemeUpdate } = require('../services/themeSync');
const ThemeData = require('../models/ThemeData');
const { fixImageUrlsInData } = require('../utils/imageUrlFixer');

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
    
    const themeData = await ThemeData.findOne({ shopDomain })
      .sort({ version: -1 })
      .allowDiskUse(true)
      .lean();
    
    if (!themeData) {
      return res.status(404).json({
        success: false,
        error: 'No theme data found'
      });
    }
    
    // Enrich with products and collections
    const Product = require('../models/Product');
    const Collection = require('../models/Collection');
    
    const products = await Product.find({ shopDomain })
      .select('-rawData')
      .allowDiskUse(true)
      .lean();
    
    const collections = await Collection.find({ shopDomain })
      .select('-rawData')
      .allowDiskUse(true)
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
    });
    
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
    
    const themeData = await ThemeData.findOne({ shopDomain })
      .sort({ version: -1 })
      .allowDiskUse(true)
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
