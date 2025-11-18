const express = require('express');
const router = express.Router();
const { addSSEClient, removeSSEClient } = require('../services/changeStream');
const ThemeData = require('../models/ThemeData');

// SSE endpoint for realtime updates
router.get('/stream', (req, res) => {
  const shopDomain = req.query.shop || process.env.SHOPIFY_SHOP_DOMAIN;
  
  console.log(`📡 SSE client connected for shop: ${shopDomain}`);
  
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE connected' })}\n\n`);
  
  // Add client to the list
  const clientId = Date.now();
  addSSEClient(clientId, res, shopDomain);
  
  // Handle client disconnect
  req.on('close', () => {
    console.log(`📡 SSE client disconnected: ${clientId}`);
    removeSSEClient(clientId);
  });
});

// Get current theme data
router.get('/theme-data', async (req, res) => {
  try {
    const shopDomain = req.query.shop || process.env.SHOPIFY_SHOP_DOMAIN;
    
    const themeData = await ThemeData.findOne({ shopDomain })
      .sort({ updatedAt: -1 })
      .lean();
    
    if (!themeData) {
      return res.status(404).json({ error: 'No theme data found' });
    }
    
    res.json({
      success: true,
      data: themeData,
    });
  } catch (error) {
    console.error('❌ Error fetching theme data:', error);
    res.status(500).json({ error: 'Failed to fetch theme data' });
  }
});

// Manual sync trigger
router.post('/sync', async (req, res) => {
  try {
    const { shopDomain, themeId } = req.body;
    const { handleThemeUpdate } = require('../services/themeSync');
    
    await handleThemeUpdate(
      shopDomain || process.env.SHOPIFY_SHOP_DOMAIN,
      themeId
    );
    
    res.json({ success: true, message: 'Sync triggered' });
  } catch (error) {
    console.error('❌ Manual sync error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

module.exports = router;
