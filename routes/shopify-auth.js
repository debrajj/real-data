/**
 * Shopify OAuth Routes for Public App Store
 * Handles OAuth flow, session management, and app installation
 */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const ClientConfig = require('../models/ClientConfig');

// Environment variables
const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const APP_URL = process.env.APP_URL || process.env.HOST || 'https://your-app.netlify.app';
const SCOPES = process.env.SHOPIFY_SCOPES || 'read_products,write_products,read_themes,write_themes,read_content,write_content,read_price_rules,write_price_rules';

/**
 * Generate a random nonce for OAuth state
 */
function generateNonce() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Verify HMAC signature from Shopify
 */
function verifyHmac(query) {
  const { hmac, ...params } = query;
  if (!hmac) return false;
  
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  const generatedHmac = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(sortedParams)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(hmac, 'hex'),
    Buffer.from(generatedHmac, 'hex')
  );
}

/**
 * GET /shopify/auth
 * Start OAuth flow - redirect to Shopify authorization
 */
router.get('/auth', (req, res) => {
  const { shop } = req.query;
  
  if (!shop) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing shop parameter' 
    });
  }
  
  // Validate shop domain format
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
  if (!shopRegex.test(shop)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid shop domain format' 
    });
  }
  
  const nonce = generateNonce();
  const redirectUri = `${APP_URL}/api/shopify/callback`;
  
  // Store nonce in session/cookie for verification (in production, use Redis/DB)
  res.cookie('shopify_nonce', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600000 // 10 minutes
  });
  
  const authUrl = `https://${shop}/admin/oauth/authorize?` +
    `client_id=${SHOPIFY_API_KEY}&` +
    `scope=${SCOPES}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `state=${nonce}`;
  
  res.redirect(authUrl);
});

/**
 * GET /shopify/callback
 * OAuth callback - exchange code for access token
 */
router.get('/callback', async (req, res) => {
  const { shop, code, state, hmac } = req.query;
  const storedNonce = req.cookies?.shopify_nonce;
  
  // Verify state/nonce
  if (!storedNonce || state !== storedNonce) {
    return res.status(403).json({ 
      success: false, 
      error: 'Invalid state parameter' 
    });
  }
  
  // Verify HMAC
  if (!verifyHmac(req.query)) {
    return res.status(403).json({ 
      success: false, 
      error: 'Invalid HMAC signature' 
    });
  }
  
  try {
    // Exchange code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: SHOPIFY_API_KEY,
        client_secret: SHOPIFY_API_SECRET,
        code
      })
    });
    
    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }
    
    const { access_token, scope } = await tokenResponse.json();
    
    // Get shop info
    const shopResponse = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: { 'X-Shopify-Access-Token': access_token }
    });
    
    const shopData = await shopResponse.json();
    const shopInfo = shopData.shop;
    
    // Generate client key from shop domain
    const clientKey = shop.replace('.myshopify.com', '').toLowerCase();
    
    // Save or update client config
    const configData = {
      clientName: shopInfo.name,
      clientKey: clientKey,
      shopDomain: shop,
      appName: shopInfo.name,
      environment: 'production',
      apiBaseUrl: `https://${shop}`,
      adminApiBaseUrl: `https://${shop}/admin/api/2024-01`,
      adminShopToken: access_token,
      storefrontToken: '', // Will be set up separately
      primaryColor: '#008060', // Shopify green default
      bundleId: `com.${clientKey.replace(/-/g, '')}.app`,
      packageName: `com.${clientKey.replace(/-/g, '')}.app`,
      logoUrl: '',
      isActive: true,
      installedAt: new Date(),
      scopes: scope
    };
    
    // Upsert config
    await ClientConfig.findOneAndUpdate(
      { shopDomain: shop, environment: 'production' },
      { $set: configData },
      { upsert: true, new: true }
    );
    
    // Clear nonce cookie
    res.clearCookie('shopify_nonce');
    
    // Redirect to app dashboard (embedded in Shopify admin)
    const redirectUrl = `https://${shop}/admin/apps/${SHOPIFY_API_KEY}`;
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'OAuth failed',
      message: error.message 
    });
  }
});

/**
 * GET /shopify/verify
 * Verify if a shop has installed the app
 */
router.get('/verify', async (req, res) => {
  const { shop } = req.query;
  
  if (!shop) {
    return res.status(400).json({ success: false, error: 'Missing shop parameter' });
  }
  
  try {
    const config = await ClientConfig.findOne({ 
      shopDomain: shop, 
      isActive: true 
    });
    
    if (config) {
      res.json({ 
        success: true, 
        installed: true,
        clientKey: config.clientKey,
        appName: config.appName
      });
    } else {
      res.json({ 
        success: true, 
        installed: false 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /shopify/uninstall
 * Webhook handler for app uninstallation
 */
router.post('/uninstall', async (req, res) => {
  const hmac = req.headers['x-shopify-hmac-sha256'];
  const shop = req.headers['x-shopify-shop-domain'];
  
  // Verify webhook HMAC
  const generatedHmac = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(JSON.stringify(req.body))
    .digest('base64');
  
  if (hmac !== generatedHmac) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }
  
  try {
    // Mark config as inactive
    await ClientConfig.findOneAndUpdate(
      { shopDomain: shop },
      { $set: { isActive: false, uninstalledAt: new Date() } }
    );
    
    console.log(`App uninstalled from ${shop}`);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Uninstall webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /shopify/session
 * Get current session info for embedded app
 */
router.get('/session', async (req, res) => {
  const shop = req.query.shop || req.headers['x-shopify-shop-domain'];
  
  if (!shop) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing shop parameter' 
    });
  }
  
  try {
    const config = await ClientConfig.findOne({ 
      shopDomain: shop, 
      isActive: true 
    }).lean();
    
    if (!config) {
      return res.json({ 
        success: false, 
        installed: false,
        redirectUrl: `/api/shopify/auth?shop=${shop}`
      });
    }
    
    res.json({
      success: true,
      installed: true,
      session: {
        shop: config.shopDomain,
        clientKey: config.clientKey,
        appName: config.appName,
        primaryColor: config.primaryColor,
        logoUrl: config.logoUrl
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
