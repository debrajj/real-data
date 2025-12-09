const express = require('express');
const router = express.Router();
const { syncAllCollections, getCollections, getCollectionModel } = require('../services/collectionSync');

/**
 * GET /api/collections/client/:clientKey
 * Get all collections for a client by clientKey (no shopDomain needed)
 */
router.get('/client/:clientKey', async (req, res) => {
  try {
    const { clientKey } = req.params;
    const { limit } = req.query;

    const Collection = await getCollectionModel(clientKey);
    
    const collections = await Collection.find({})
      .select('-rawData')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) || 50)
      .lean();

    res.json({
      success: true,
      count: collections.length,
      collections,
    });
  } catch (error) {
    console.error('❌ Error fetching collections by clientKey:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/collections/:shopDomain
 * Get all collections for a shop
 */
router.get('/:shopDomain', async (req, res) => {
  try {
    const { shopDomain } = req.params;
    const { limit } = req.query;

    const collections = await getCollections(shopDomain, {
      limit: parseInt(limit) || 250,
    });

    res.json({
      success: true,
      count: collections.length,
      collections,
    });
  } catch (error) {
    console.error('❌ Error fetching collections:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/collections/:shopDomain/sync
 * Sync all collections from Shopify
 */
router.post('/:shopDomain/sync', async (req, res) => {
  try {
    const { shopDomain } = req.params;

    // Start sync asynchronously
    syncAllCollections(shopDomain).catch(error => {
      console.error('❌ Error in background collection sync:', error);
    });

    res.json({
      success: true,
      message: 'Collection sync started',
    });
  } catch (error) {
    console.error('❌ Error starting collection sync:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
