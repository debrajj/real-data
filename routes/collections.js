const express = require('express');
const router = express.Router();
const { syncAllCollections, getCollections } = require('../services/collectionSync');

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
