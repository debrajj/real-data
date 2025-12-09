/**
 * Session Routes - Login, Logout, Session Management
 * Dynamic multi-tenant authentication using Shopify credentials
 */
const express = require('express');
const router = express.Router();
const sessionService = require('../services/sessionService');
const ShopifyAPI = require('../services/shopifyAPI');
const ClientConfig = require('../models/ClientConfig');
const databaseService = require('../services/databaseService');
const { requireAuth } = require('../middleware/sessionAuth');
const { syncAllProducts } = require('../services/productSync');
const { syncAllCollections } = require('../services/collectionSync');
const { syncAllBlogs } = require('../services/blogSync');
const { handleThemeUpdate } = require('../services/themeSync');

/**
 * POST /api/session/login
 * Login with Shopify credentials - creates session and auto-syncs data
 * 
 * Body: {
 *   shopDomain: "mystore.myshopify.com",
 *   adminToken: "shpat_xxxxx",
 *   storefrontToken: "xxxxx"
 * }
 */
router.post('/login', async (req, res) => {
  try {
    let { shopDomain, adminToken, storefrontToken } = req.body;

    // Validate required fields
    if (!shopDomain || !adminToken || !storefrontToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: shopDomain, adminToken, storefrontToken',
      });
    }

    // Normalize shop domain
    shopDomain = shopDomain.trim().toLowerCase();
    if (!shopDomain.includes('.myshopify.com')) {
      shopDomain = `${shopDomain}.myshopify.com`;
    }

    console.log(`🔐 Login attempt for: ${shopDomain}`);

    // Validate credentials by fetching shop info
    const shopifyAPI = new ShopifyAPI(shopDomain, adminToken);
    let shopInfo;
    
    try {
      shopInfo = await shopifyAPI.getShopInfo();
      console.log(`✅ Credentials valid for: ${shopInfo.name}`);
    } catch (error) {
      console.error(`❌ Invalid credentials for ${shopDomain}:`, error.message);
      return res.status(401).json({
        success: false,
        error: 'Invalid Shopify credentials. Please check your Admin API token.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Check if client config exists
    let clientConfig = await ClientConfig.findOne({ shopDomain, isActive: true });
    let clientKey;
    let isNewClient = false;

    if (clientConfig) {
      // Existing client - update tokens
      clientKey = clientConfig.clientKey;
      clientConfig.adminShopToken = adminToken;
      clientConfig.storefrontToken = storefrontToken;
      await clientConfig.save();
      console.log(`📦 Existing client: ${clientKey}`);
    } else {
      // New client - create config and database
      isNewClient = true;
      clientKey = sessionService.generateClientKey(shopDomain);
      
      console.log(`📦 Creating new client: ${clientKey}`);
      
      // Create database for client
      await databaseService.createClientDatabase(clientKey);

      // Create client config
      clientConfig = await ClientConfig.create({
        clientName: shopInfo.name,
        clientKey,
        environment: 'production',
        shopDomain,
        apiBaseUrl: `https://${shopDomain}`,
        adminApiBaseUrl: `https://${shopDomain}/admin/api/2024-01`,
        appName: shopInfo.name,
        primaryColor: '#008060',
        bundleId: `com.${clientKey.replace(/-/g, '')}.app`,
        packageName: `com.${clientKey.replace(/-/g, '')}.app`,
        storefrontToken,
        adminShopToken: adminToken,
        databaseName: clientKey,
        isActive: true,
      });
    }

    // Create session
    const session = await sessionService.createSession({
      shopDomain,
      adminToken,
      storefrontToken,
      clientKey,
      shopInfo: {
        name: shopInfo.name,
        email: shopInfo.email,
        currency: shopInfo.currency,
        timezone: shopInfo.timezone,
      },
    });

    // Set session cookie
    res.cookie('session_token', session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    console.log(`✅ Session created for: ${shopDomain}`);

    // Return session info
    res.json({
      success: true,
      message: isNewClient ? 'New store connected successfully' : 'Login successful',
      session: {
        token: session.sessionToken,
        clientKey: session.clientKey,
        shopDomain: session.shopDomain,
        shopInfo: session.shopInfo,
        isNewClient,
      },
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error.message,
    });
  }
});

/**
 * POST /api/session/sync
 * Sync all Shopify data for current session
 */
router.post('/sync', requireAuth, async (req, res) => {
  try {
    const { clientKey, shopDomain, adminToken } = req;
    
    console.log(`🔄 Starting full sync for: ${shopDomain} → ${clientKey}`);

    const syncResults = {
      products: { success: false },
      collections: { success: false },
      blogs: { success: false },
      theme: { success: false },
    };

    // Sync Products
    try {
      const result = await syncAllProducts(shopDomain, clientKey);
      syncResults.products = { success: true, ...result };
      console.log(`✅ Products: ${result.synced}/${result.total}`);
    } catch (error) {
      syncResults.products.error = error.message;
      console.error('❌ Products sync failed:', error.message);
    }

    // Sync Collections
    try {
      const result = await syncAllCollections(shopDomain, clientKey);
      syncResults.collections = { success: true, ...result };
      console.log(`✅ Collections: ${result.synced}/${result.total}`);
    } catch (error) {
      syncResults.collections.error = error.message;
      console.error('❌ Collections sync failed:', error.message);
    }

    // Sync Blogs
    try {
      const result = await syncAllBlogs(shopDomain, clientKey);
      syncResults.blogs = { success: true, ...result };
      console.log(`✅ Blogs: ${result.blogsCount} blogs, ${result.articlesCount} articles`);
    } catch (error) {
      syncResults.blogs.error = error.message;
      console.error('❌ Blogs sync failed:', error.message);
    }

    // Sync Theme
    try {
      const result = await handleThemeUpdate(shopDomain, null, clientKey);
      syncResults.theme = { 
        success: true, 
        themeName: result.themeName,
        components: result.components?.length || 0,
      };
      console.log(`✅ Theme: ${result.themeName}`);
    } catch (error) {
      syncResults.theme.error = error.message;
      console.error('❌ Theme sync failed:', error.message);
    }

    res.json({
      success: true,
      message: 'Sync completed',
      syncResults,
    });

  } catch (error) {
    console.error('❌ Sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Sync failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/session/me
 * Get current session info
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { clientKey, shopDomain, session } = req;

    // Get client config
    const config = await ClientConfig.findOne({ clientKey, isActive: true })
      .select('-adminShopToken -storefrontToken')
      .lean();

    res.json({
      success: true,
      session: {
        clientKey,
        shopDomain,
        shopInfo: session.shopInfo,
        config: config ? {
          appName: config.appName,
          primaryColor: config.primaryColor,
          logoUrl: config.logoUrl,
          environment: config.environment,
        } : null,
      },
    });

  } catch (error) {
    console.error('❌ Session info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get session info',
    });
  }
});

/**
 * POST /api/session/logout
 * Logout and invalidate session
 */
router.post('/logout', async (req, res) => {
  try {
    const sessionToken = req.cookies?.session_token || 
                         req.headers.authorization?.replace('Bearer ', '') ||
                         req.headers['x-session-token'];

    if (sessionToken) {
      await sessionService.invalidateSession(sessionToken);
    }

    res.clearCookie('session_token');

    res.json({
      success: true,
      message: 'Logged out successfully',
    });

  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
    });
  }
});

/**
 * GET /api/session/validate
 * Validate session token (for frontend to check auth status)
 */
router.get('/validate', async (req, res) => {
  try {
    const sessionToken = req.cookies?.session_token || 
                         req.headers.authorization?.replace('Bearer ', '') ||
                         req.query.token;

    if (!sessionToken) {
      return res.json({
        success: true,
        valid: false,
        reason: 'No session token',
      });
    }

    const session = await sessionService.validateSession(sessionToken);

    if (!session) {
      return res.json({
        success: true,
        valid: false,
        reason: 'Invalid or expired session',
      });
    }

    res.json({
      success: true,
      valid: true,
      session: {
        clientKey: session.clientKey,
        shopDomain: session.shopDomain,
        shopInfo: session.shopInfo,
      },
    });

  } catch (error) {
    console.error('❌ Validate error:', error);
    res.status(500).json({
      success: false,
      error: 'Validation failed',
    });
  }
});

/**
 * PUT /api/session/config
 * Update client configuration (branding, etc.)
 */
router.put('/config', requireAuth, async (req, res) => {
  try {
    const { clientKey } = req;
    const { appName, primaryColor, logoUrl } = req.body;

    const updates = {};
    if (appName) updates.appName = appName;
    if (primaryColor) updates.primaryColor = primaryColor;
    if (logoUrl) updates.logoUrl = logoUrl;

    const config = await ClientConfig.findOneAndUpdate(
      { clientKey, isActive: true },
      { ...updates, updatedAt: Date.now() },
      { new: true }
    ).select('-adminShopToken -storefrontToken');

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found',
      });
    }

    res.json({
      success: true,
      message: 'Configuration updated',
      config,
    });

  } catch (error) {
    console.error('❌ Config update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update configuration',
    });
  }
});

module.exports = router;
