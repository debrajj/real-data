const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { handleThemeUpdate } = require('../services/themeSync');

// Verify Shopify webhook
const verifyShopifyWebhook = (req, res, next) => {
  const hmac = req.get('X-Shopify-Hmac-Sha256');
  const body = req.body;
  
  if (!hmac) {
    console.warn('⚠️ No HMAC header found');
    return next(); // Allow in development
  }

  // Use webhook secret if available, otherwise fall back to API secret
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET || process.env.SHOPIFY_API_SECRET;
  
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body), 'utf8')
    .digest('base64');

  if (hash === hmac) {
    console.log('✅ Webhook verified');
    next();
  } else {
    console.error('❌ Webhook verification failed');
    console.error('Expected:', hash);
    console.error('Received:', hmac);
    res.status(401).send('Unauthorized');
  }
};

// Theme update webhook
router.post('/theme', express.json(), verifyShopifyWebhook, async (req, res) => {
  try {
    console.log('📥 Theme webhook received:', req.body);
    
    const themeId = req.body.id || req.body.theme_id;
    const shopDomain = req.get('X-Shopify-Shop-Domain') || process.env.SHOPIFY_SHOP_DOMAIN;
    
    console.log(`🔄 Processing theme update for shop: ${shopDomain}, theme: ${themeId}`);
    
    // Acknowledge webhook immediately
    res.status(200).send('Webhook received');
    
    // Process theme update asynchronously
    handleThemeUpdate(shopDomain, themeId).catch(error => {
      console.error('❌ Error processing theme update:', error);
    });
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).send('Internal server error');
  }
});

// Asset update webhook
router.post('/asset', express.json(), verifyShopifyWebhook, async (req, res) => {
  try {
    console.log('📥 Asset webhook received:', req.body);
    
    const themeId = req.body.theme_id;
    const shopDomain = req.get('X-Shopify-Shop-Domain') || process.env.SHOPIFY_SHOP_DOMAIN;
    
    // Only process settings_data.json changes
    if (req.body.key === 'config/settings_data.json') {
      console.log(`🔄 Settings data changed for theme: ${themeId}`);
      res.status(200).send('Webhook received');
      
      handleThemeUpdate(shopDomain, themeId).catch(error => {
        console.error('❌ Error processing asset update:', error);
      });
    } else {
      res.status(200).send('Ignored');
    }
    
  } catch (error) {
    console.error('❌ Asset webhook error:', error);
    res.status(500).send('Internal server error');
  }
});

module.exports = router;
