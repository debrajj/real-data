const express = require('express');
const router = express.Router();
const ClientConfig = require('../models/ClientConfig');
const databaseService = require('../services/databaseService');
const ShopifyAPI = require('../services/shopifyAPI');
const { handleThemeUpdate } = require('../services/themeSync');
const { syncAllProducts } = require('../services/productSync');
const { syncAllCollections } = require('../services/collectionSync');
const { syncAllBlogs } = require('../services/blogSync');
const Shop = require('../models/Shop');
const {
  successResponse,
  badRequestResponse,
  notFoundResponse,
  conflictResponse,
  serverErrorResponse,
} = require('../utils/responseFormatter');

/**
 * Helper function to extract shop domain from URL
 */
function extractShopDomain(url) {
  if (!url) return null;
  let domain = url.replace(/^https?:\/\//, '');
  domain = domain.split('/')[0];
  if (domain.includes('.myshopify.com')) {
    return domain;
  }
  return domain;
}

/**
 * Helper function to get shop domain - checks shopDomain field first, then URLs
 */
function getShopDomain(body) {
  // If shopDomain is provided directly, use it
  if (body.shopDomain) {
    let domain = body.shopDomain.replace(/^https?:\/\//, '').split('/')[0];
    if (!domain.includes('.myshopify.com')) {
      domain = domain + '.myshopify.com';
    }
    return domain;
  }
  
  // Try to extract from adminApiBaseUrl
  if (body.adminApiBaseUrl && body.adminApiBaseUrl.includes('.myshopify.com')) {
    return extractShopDomain(body.adminApiBaseUrl);
  }
  
  // Try to extract from apiBaseUrl
  if (body.apiBaseUrl && body.apiBaseUrl.includes('.myshopify.com')) {
    return extractShopDomain(body.apiBaseUrl);
  }
  
  return null;
}

/**
 * POST /api/config/sync
 * Create a new client configuration and auto-sync all Shopify data
 * 
 * This endpoint creates the client and automatically syncs:
 * - Shop info
 * - Products
 * - Collections
 * - Blogs & Articles
 * - Theme data
 * - Media
 */
router.post('/sync', async (req, res) => {
  try {
    const {
      clientName,
      clientKey,
      environment,
      apiBaseUrl,
      adminApiBaseUrl,
      appName,
      primaryColor = '#E91E63',
      bundleId,
      packageName,
      logoUrl,
      storefrontToken,
      adminShopToken,
    } = req.body;

    // Validate required fields
    const requiredFields = {
      clientName: 'Client name',
      clientKey: 'Client key', 
      environment: 'Environment',
      apiBaseUrl: 'API base URL',
      adminApiBaseUrl: 'Admin API base URL',
      appName: 'App name',
      bundleId: 'Bundle ID',
      packageName: 'Package name',
      storefrontToken: 'Storefront token',
      adminShopToken: 'Admin shop token'
    };

    const missingFields = [];
    for (const [field, label] of Object.entries(requiredFields)) {
      if (!req.body[field] || req.body[field].toString().trim() === '') {
        missingFields.push(label);
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json(
        badRequestResponse(req, `Missing required fields: ${missingFields.join(', ')}`)
      );
    }

    // Extract shop domain FIRST - can be provided directly or extracted from URLs
    const shopDomain = getShopDomain(req.body);
    if (!shopDomain) {
      return res.status(400).json(
        badRequestResponse(req, 'Could not determine shop domain. Please provide shopDomain (e.g., "mystore.myshopify.com") or use Shopify URLs for apiBaseUrl/adminApiBaseUrl')
      );
    }
    
    console.log(`🏪 Shop Domain: ${shopDomain}`);

    // Check if client already exists
    const existingConfig = await ClientConfig.findOne({ 
      clientKey: clientKey.toLowerCase().trim(), 
      environment 
    });

    let config;
    if (existingConfig) {
      console.log(`⚠️ Client already exists: ${clientKey} (${environment})`);
      config = existingConfig;
      // Update shopDomain if not set
      if (!config.shopDomain) {
        config.shopDomain = shopDomain;
        await config.save();
      }
    } else {
      // Create client database
      console.log(`📦 Creating client database for: ${clientKey}`);
      const result = await databaseService.createClientCollections(clientKey);

      // Create configuration
      config = new ClientConfig({
        clientName,
        clientKey,
        environment,
        apiBaseUrl,
        adminApiBaseUrl,
        shopDomain, // Store the Shopify domain
        appName,
        primaryColor,
        bundleId,
        packageName,
        logoUrl,
        storefrontToken,
        adminShopToken,
        databaseName: result.databaseName,
      });

      await config.save();
      console.log(`✅ Configuration created for: ${clientKey} (${environment})`);
    }

    // Create or update shop record (uses tokens from request)
    let shop = await Shop.findOne({ shopDomain });
    if (!shop) {
      shop = await Shop.create({
        shopDomain,
        accessToken: adminShopToken,
        storefrontToken: storefrontToken,
      });
    } else {
      shop.accessToken = adminShopToken;
      shop.storefrontToken = storefrontToken;
      await shop.save();
    }

    // Initialize Shopify API
    const shopifyAPI = new ShopifyAPI(shopDomain, adminShopToken);

    // Start syncing data
    const syncResults = {
      shopInfo: { success: false },
      products: { success: false, synced: 0, total: 0 },
      collections: { success: false, synced: 0, total: 0 },
      blogs: { success: false, blogsCount: 0, articlesCount: 0 },
      theme: { success: false },
    };

    // Sync Shop Info
    try {
      const shopInfo = await shopifyAPI.getShopInfo();
      shop.name = shopInfo.name;
      shop.email = shopInfo.email;
      shop.domain = shopInfo.domain;
      shop.currency = shopInfo.currency;
      shop.timezone = shopInfo.timezone;
      await shop.save();
      syncResults.shopInfo = { success: true, name: shopInfo.name };
    } catch (error) {
      console.error('❌ Failed to sync shop info:', error.message);
      syncResults.shopInfo.error = error.message;
    }

    // Sync Products (to store's own database)
    try {
      const productResults = await syncAllProducts(shopDomain, clientKey);
      syncResults.products = { 
        success: true, 
        synced: productResults.synced, 
        total: productResults.total,
        failed: productResults.failed 
      };
    } catch (error) {
      console.error('❌ Failed to sync products:', error.message);
      syncResults.products.error = error.message;
    }

    // Sync Collections (to store's own database)
    try {
      const collectionResults = await syncAllCollections(shopDomain, clientKey);
      syncResults.collections = { 
        success: true, 
        synced: collectionResults.synced, 
        total: collectionResults.total,
        failed: collectionResults.failed 
      };
    } catch (error) {
      console.error('❌ Failed to sync collections:', error.message);
      syncResults.collections.error = error.message;
    }

    // Sync Blogs & Articles (to store's own database)
    try {
      const blogResults = await syncAllBlogs(shopDomain, clientKey);
      syncResults.blogs = { 
        success: true, 
        blogsCount: blogResults.blogsCount, 
        articlesCount: blogResults.articlesCount 
      };
    } catch (error) {
      console.error('❌ Failed to sync blogs:', error.message);
      syncResults.blogs.error = error.message;
    }

    // Sync Theme Data (to store's own database, includes media)
    try {
      const themeData = await handleThemeUpdate(shopDomain, null, clientKey);
      syncResults.theme = { 
        success: true, 
        themeName: themeData.themeName,
        components: themeData.components.length,
        pages: Object.keys(themeData.pages || {}).length
      };
    } catch (error) {
      console.error('❌ Failed to sync theme:', error.message);
      syncResults.theme.error = error.message;
    }

    res.status(200).json(
      successResponse(
        req, 
        'Client configuration created and data synced successfully', 
        config._id,
        {
          config,
          syncResults,
          shopDomain
        }
      )
    );
  } catch (error) {
    console.error('❌ Error creating client with sync:', error);
    res.status(500).json(serverErrorResponse(req, error.message));
  }
});

/**
 * POST /api/config
 * Create a new client configuration
 * 
 * Flow:
 * 1. Validates all required fields
 * 2. Creates a new database for the client (named by clientKey)
 * 3. Initializes collections in the client database
 * 4. Saves the client configuration in the main 'cmsdata' database under 'config' collection
 * 5. Returns the created configuration
 */
router.post('/', async (req, res) => {
  try {
    const {
      clientName,
      clientKey,
      environment,
      apiBaseUrl,
      adminApiBaseUrl,
      appName,
      primaryColor = '#E91E63',
      bundleId,
      packageName,
      logoUrl,
      storefrontToken,
      adminShopToken,
    } = req.body;

    // Validate required fields
    const requiredFields = {
      clientName: 'Client name',
      clientKey: 'Client key', 
      environment: 'Environment',
      apiBaseUrl: 'API base URL',
      adminApiBaseUrl: 'Admin API base URL',
      appName: 'App name',
      bundleId: 'Bundle ID',
      packageName: 'Package name',
      storefrontToken: 'Storefront token',
      adminShopToken: 'Admin shop token'
    };

    const missingFields = [];
    for (const [field, label] of Object.entries(requiredFields)) {
      if (!req.body[field] || req.body[field].toString().trim() === '') {
        missingFields.push(label);
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json(
        badRequestResponse(req, `Missing required fields: ${missingFields.join(', ')}`)
      );
    }

    // Validate field formats
    const validations = [
      { field: 'clientKey', value: clientKey, regex: /^[a-z0-9-]{3,50}$/, message: 'Client key must be 3-50 characters with only lowercase letters, numbers, and hyphens' },
      { field: 'environment', value: environment, valid: ['development', 'production'].includes(environment), message: 'Environment must be either "development" or "production"' },
      { field: 'apiBaseUrl', value: apiBaseUrl, regex: /^https?:\/\/.+/, message: 'API base URL must be a valid URL' },
      { field: 'adminApiBaseUrl', value: adminApiBaseUrl, regex: /^https?:\/\/.+/, message: 'Admin API base URL must be a valid URL' },
      { field: 'bundleId', value: bundleId, regex: /^[a-z0-9.]+$/, message: 'Bundle ID must contain only lowercase letters, numbers, and dots' },
      { field: 'packageName', value: packageName, regex: /^[a-z0-9.]+$/, message: 'Package name must contain only lowercase letters, numbers, and dots' },
      { field: 'primaryColor', value: primaryColor, regex: /^#[0-9A-Fa-f]{6}$/, message: 'Primary color must be a valid hex color code' },
    ];

    if (logoUrl) {
      validations.push({ field: 'logoUrl', value: logoUrl, regex: /^https?:\/\/.+/, message: 'Logo URL must be a valid URL' });
    }

    for (const validation of validations) {
      if (validation.regex && !validation.regex.test(validation.value)) {
        return res.status(400).json(badRequestResponse(req, validation.message));
      }
      if (validation.hasOwnProperty('valid') && !validation.valid) {
        return res.status(400).json(badRequestResponse(req, validation.message));
      }
    }

    // First check for clientKey + environment combination
    const existingConfig = await ClientConfig.findOne({ 
      clientKey: clientKey.toLowerCase().trim(), 
      environment 
    });
    if (existingConfig) {
      return res.status(409).json(
        conflictResponse(req, `Configuration for client '${clientKey}' with environment '${environment}' already exists`)
      );
    }

    // Check for duplicates on unique fields across DIFFERENT clients only
    // Same client can share appName, URLs, and tokens between dev/prod environments
    const duplicateChecks = [
      { field: 'bundleId', value: bundleId.trim(), crossClient: true },
      { field: 'packageName', value: packageName.trim(), crossClient: true },
    ];

    for (const check of duplicateChecks) {
      // Only check for duplicates across different clients
      const existing = await ClientConfig.findOne({ 
        [check.field]: check.value,
        clientKey: { $ne: clientKey.toLowerCase().trim() }
      });
      if (existing) {
        return res.status(409).json(
          conflictResponse(req, `${check.field} '${check.value}' already exists for another client`)
        );
      }
    }

    console.log(`🔧 Creating configuration for client: ${clientKey} (${environment})`);

    // Create collection for the client (only once per clientKey)
    let databaseName, collectionName;
    const anyExistingConfig = await ClientConfig.findOne({ clientKey });
    
    if (anyExistingConfig) {
      // Use existing collection
      databaseName = anyExistingConfig.databaseName;
      collectionName = anyExistingConfig.collectionName;
      console.log(`📦 Using existing collection: ${collectionName}`);
    } else {
      // Create new collection
      const result = await databaseService.createClientCollections(clientKey);
      databaseName = result.databaseName;
      collectionName = result.collectionName;
    }

    // Try to extract shop domain for auto-sync
    const shopDomain = getShopDomain(req.body);

    // Create configuration
    const config = new ClientConfig({
      clientName,
      clientKey,
      environment,
      apiBaseUrl,
      adminApiBaseUrl,
      shopDomain, // Store shop domain if available
      appName,
      primaryColor,
      bundleId,
      packageName,
      logoUrl,
      storefrontToken,
      adminShopToken,
      databaseName,
      collectionName,
    });

    await config.save();

    console.log(`✅ Configuration created for: ${clientKey} (${environment})`);

    // Auto-sync Shopify data if shopDomain is available
    let syncResults = null;
    if (shopDomain) {
      console.log(`🔄 Auto-syncing Shopify data for ${shopDomain}...`);
      
      syncResults = {
        shopInfo: { success: false },
        products: { success: false },
        collections: { success: false },
        blogs: { success: false },
        theme: { success: false },
      };

      try {
        // Create or update shop record
        let shop = await Shop.findOne({ shopDomain });
        if (!shop) {
          shop = await Shop.create({
            shopDomain,
            accessToken: adminShopToken,
            storefrontToken: storefrontToken,
          });
        } else {
          shop.accessToken = adminShopToken;
          shop.storefrontToken = storefrontToken;
          await shop.save();
        }

        // Initialize Shopify API
        const shopifyAPI = new ShopifyAPI(shopDomain, adminShopToken);

        // Sync Shop Info
        try {
          const shopInfo = await shopifyAPI.getShopInfo();
          shop.name = shopInfo.name;
          shop.email = shopInfo.email;
          shop.domain = shopInfo.domain;
          shop.currency = shopInfo.currency;
          shop.timezone = shopInfo.timezone;
          await shop.save();
          syncResults.shopInfo = { success: true, name: shopInfo.name };
          console.log(`✅ Shop info synced: ${shopInfo.name}`);
        } catch (error) {
          console.error('❌ Failed to sync shop info:', error.message);
          syncResults.shopInfo.error = error.message;
        }

        // Sync Products
        try {
          const productResults = await syncAllProducts(shopDomain, clientKey);
          syncResults.products = { success: true, synced: productResults.synced, total: productResults.total };
          console.log(`✅ Products synced: ${productResults.synced}/${productResults.total}`);
        } catch (error) {
          console.error('❌ Failed to sync products:', error.message);
          syncResults.products.error = error.message;
        }

        // Sync Collections
        try {
          const collectionResults = await syncAllCollections(shopDomain, clientKey);
          syncResults.collections = { success: true, synced: collectionResults.synced, total: collectionResults.total };
          console.log(`✅ Collections synced: ${collectionResults.synced}/${collectionResults.total}`);
        } catch (error) {
          console.error('❌ Failed to sync collections:', error.message);
          syncResults.collections.error = error.message;
        }

        // Sync Blogs
        try {
          const blogResults = await syncAllBlogs(shopDomain, clientKey);
          syncResults.blogs = { success: true, blogsCount: blogResults.blogsCount, articlesCount: blogResults.articlesCount };
          console.log(`✅ Blogs synced: ${blogResults.blogsCount} blogs, ${blogResults.articlesCount} articles`);
        } catch (error) {
          console.error('❌ Failed to sync blogs:', error.message);
          syncResults.blogs.error = error.message;
        }

        // Sync Theme Data
        try {
          const themeData = await handleThemeUpdate(shopDomain, null, clientKey);
          syncResults.theme = { success: true, themeName: themeData.themeName, components: themeData.components?.length || 0 };
          console.log(`✅ Theme synced: ${themeData.themeName}`);
        } catch (error) {
          console.error('❌ Failed to sync theme:', error.message);
          syncResults.theme.error = error.message;
        }

      } catch (syncError) {
        console.error('❌ Auto-sync error:', syncError.message);
      }
    }

    res.status(200).json(
      successResponse(req, 'Client configuration created successfully', config._id, {
        shopDomain,
        syncResults
      })
    );
  } catch (error) {
    console.error('❌ Error creating client configuration:', error);
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      return res.status(409).json(
        conflictResponse(req, `${field} '${value}' already exists`)
      );
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json(
        badRequestResponse(req, validationErrors.join(', '))
      );
    }
    
    res.status(500).json(serverErrorResponse(req, error.message));
  }
});

/**
 * GET /api/config
 * Get all client configurations
 */
router.get('/', async (req, res) => {
  try {
    const { environment } = req.query;
    
    const query = {};
    if (environment) {
      query.environment = environment;
    }

    const configs = await ClientConfig.find(query)
      .select('-__v')
      .sort({ createdAt: -1 })
      .lean();

    res.json(
      successResponse(req, `Found ${configs.length} configuration(s)`, null, { 
        count: configs.length,
        data: configs 
      })
    );
  } catch (error) {
    console.error('❌ Error fetching configurations:', error);
    res.status(500).json(serverErrorResponse(req, error.message));
  }
});

/**
 * GET /api/config/stores/:clientKey/:environment
 * Get configuration by clientKey and environment
 */
router.get('/stores/:clientKey/:environment', async (req, res) => {
  try {
    const { clientKey, environment } = req.params;

    // Validate environment
    if (!['development', 'production'].includes(environment)) {
      return res.status(400).json(
        badRequestResponse(req, 'environment must be either "development" or "production"')
      );
    }

    const config = await ClientConfig.findOne({ clientKey, environment })
      .select('-__v')
      .lean();

    if (!config) {
      return res.status(404).json(
        notFoundResponse(req, `Configuration not found for client: ${clientKey} with environment: ${environment}`)
      );
    }

    res.json(
      successResponse(req, 'Configuration retrieved successfully', config._id, { data: config })
    );
  } catch (error) {
    console.error('❌ Error fetching configuration:', error);
    res.status(500).json(serverErrorResponse(req, error.message));
  }
});

/**
 * GET /api/config/stores/:clientKey
 * Get all configurations for a clientKey (both dev and prod)
 */
router.get('/stores/:clientKey', async (req, res) => {
  try {
    const { clientKey } = req.params;

    const configs = await ClientConfig.find({ clientKey })
      .select('-__v')
      .lean();

    if (!configs || configs.length === 0) {
      return res.status(404).json(
        notFoundResponse(req, `No configurations found for client: ${clientKey}`)
      );
    }

    res.json(
      successResponse(req, `Found ${configs.length} configuration(s) for ${clientKey}`, null, {
        count: configs.length,
        data: configs
      })
    );
  } catch (error) {
    console.error('❌ Error fetching configuration:', error);
    res.status(500).json(serverErrorResponse(req, error.message));
  }
});

/**
 * GET /api/config/:clientKey/:environment
 * Get configuration by clientKey and environment (legacy route)
 */
router.get('/:clientKey/:environment', async (req, res) => {
  try {
    const { clientKey, environment } = req.params;

    // Validate environment
    if (!['development', 'production'].includes(environment)) {
      return res.status(400).json(
        badRequestResponse(req, 'environment must be either "development" or "production"')
      );
    }

    const config = await ClientConfig.findOne({ clientKey, environment })
      .select('-__v')
      .lean();

    if (!config) {
      return res.status(404).json(
        notFoundResponse(req, `Configuration not found for client: ${clientKey} with environment: ${environment}`)
      );
    }

    res.json(
      successResponse(req, 'Configuration retrieved successfully', config._id, { data: config })
    );
  } catch (error) {
    console.error('❌ Error fetching configuration:', error);
    res.status(500).json(serverErrorResponse(req, error.message));
  }
});

/**
 * GET /api/config/:clientKey
 * Get all configurations for a clientKey (both dev and prod) (legacy route)
 */
router.get('/:clientKey', async (req, res) => {
  try {
    const { clientKey } = req.params;

    const configs = await ClientConfig.find({ clientKey })
      .select('-__v')
      .lean();

    if (!configs || configs.length === 0) {
      return res.status(404).json(
        notFoundResponse(req, `No configurations found for client: ${clientKey}`)
      );
    }

    res.json(
      successResponse(req, `Found ${configs.length} configuration(s) for ${clientKey}`, null, {
        count: configs.length,
        data: configs
      })
    );
  } catch (error) {
    console.error('❌ Error fetching configuration:', error);
    res.status(500).json(serverErrorResponse(req, error.message));
  }
});

/**
 * PUT /api/config/stores/:clientKey/:environment
 * Update client configuration
 */
router.put('/stores/:clientKey/:environment', async (req, res) => {
  try {
    const { clientKey, environment } = req.params;
    const updates = req.body;

    // Validate environment
    if (!['development', 'production'].includes(environment)) {
      return res.status(400).json({
        success: false,
        error: 'environment must be either "development" or "production"',
      });
    }

    // Don't allow updating clientKey, environment, or database fields
    delete updates.clientKey;
    delete updates.environment;
    delete updates.databaseName;
    delete updates.databaseUri;
    delete updates.createdAt;

    // Validate field formats if they're being updated
    if (updates.apiBaseUrl && !/^https?:\/\/.+/.test(updates.apiBaseUrl)) {
      return res.status(400).json({
        success: false,
        error: 'API base URL must be a valid URL',
      });
    }

    if (updates.adminApiBaseUrl && !/^https?:\/\/.+/.test(updates.adminApiBaseUrl)) {
      return res.status(400).json({
        success: false,
        error: 'Admin API base URL must be a valid URL',
      });
    }

    if (updates.bundleId && !/^[a-z0-9.]+$/.test(updates.bundleId)) {
      return res.status(400).json({
        success: false,
        error: 'Bundle ID must contain only lowercase letters, numbers, and dots',
      });
    }

    if (updates.packageName && !/^[a-z0-9.]+$/.test(updates.packageName)) {
      return res.status(400).json({
        success: false,
        error: 'Package name must contain only lowercase letters, numbers, and dots',
      });
    }

    if (updates.primaryColor && !/^#[0-9A-Fa-f]{6}$/.test(updates.primaryColor)) {
      return res.status(400).json({
        success: false,
        error: 'Primary color must be a valid hex color code',
      });
    }

    if (updates.logoUrl && !/^https?:\/\/.+/.test(updates.logoUrl)) {
      return res.status(400).json({
        success: false,
        error: 'Logo URL must be a valid URL',
      });
    }

    // Check for duplicates on unique fields being updated
    const uniqueFields = ['appName', 'bundleId', 'packageName', 'apiBaseUrl', 'adminApiBaseUrl', 'storefrontToken', 'adminShopToken'];
    
    for (const field of uniqueFields) {
      if (updates[field]) {
        const existing = await ClientConfig.findOne({ 
          [field]: updates[field].toString().trim(),
          $nor: [{ clientKey, environment }] // Exclude current document
        });
        if (existing) {
          return res.status(409).json({
            success: false,
            error: `${field} '${updates[field]}' already exists`,
          });
        }
      }
    }

    const config = await ClientConfig.findOneAndUpdate(
      { clientKey, environment },
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).select('-databaseUri');

    if (!config) {
      return res.status(404).json({
        success: false,
        error: `Configuration not found for client: ${clientKey} with environment: ${environment}`,
      });
    }

    console.log(`✅ Configuration updated for: ${clientKey} (${environment})`);

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      data: config,
    });
  } catch (error) {
    console.error('❌ Error updating configuration:', error);
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        error: `${field} already exists`,
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/config/stores/:clientKey/:environment
 * Delete client configuration (soft delete - set isActive to false)
 */
router.delete('/stores/:clientKey/:environment', async (req, res) => {
  try {
    const { clientKey, environment } = req.params;
    const { permanent } = req.query;

    // Validate environment
    if (!['development', 'production'].includes(environment)) {
      return res.status(400).json({
        success: false,
        error: 'environment must be either "development" or "production"',
      });
    }

    if (permanent === 'true') {
      // Permanent delete
      const config = await ClientConfig.findOneAndDelete({ clientKey, environment });
      
      if (!config) {
        return res.status(404).json({
          success: false,
          error: `Configuration not found for client: ${clientKey} with environment: ${environment}`,
        });
      }

      // Check if this was the last config for this client
      const remainingConfigs = await ClientConfig.countDocuments({ clientKey });
      if (remainingConfigs === 0) {
        // Optionally delete the collection for this client
        // await databaseService.deleteClientCollection(clientKey);
        console.log(`⚠️ No more configs for ${clientKey}, but collection remains`);
      }

      console.log(`🗑️ Configuration permanently deleted for: ${clientKey} (${environment})`);

      res.json({
        success: true,
        message: 'Configuration permanently deleted',
      });
    } else {
      // Soft delete
      const config = await ClientConfig.findOneAndUpdate(
        { clientKey, environment },
        { isActive: false, updatedAt: Date.now() },
        { new: true }
      ).select('-databaseUri');

      if (!config) {
        return res.status(404).json({
          success: false,
          error: `Configuration not found for client: ${clientKey} with environment: ${environment}`,
        });
      }

      console.log(`🔒 Configuration deactivated for: ${clientKey} (${environment})`);

      res.json({
        success: true,
        message: 'Configuration deactivated',
        data: config,
      });
    }
  } catch (error) {
    console.error('❌ Error deleting configuration:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/config/:clientKey/:environment/activate
 * Activate a deactivated configuration
 */
router.post('/:clientKey/:environment/activate', async (req, res) => {
  try {
    const { clientKey, environment } = req.params;

    // Validate environment
    if (!['development', 'production'].includes(environment)) {
      return res.status(400).json({
        success: false,
        error: 'environment must be either "development" or "production"',
      });
    }

    const config = await ClientConfig.findOneAndUpdate(
      { clientKey, environment },
      { isActive: true, updatedAt: Date.now() },
      { new: true }
    ).select('-databaseUri');

    if (!config) {
      return res.status(404).json({
        success: false,
        error: `Configuration not found for client: ${clientKey} with environment: ${environment}`,
      });
    }

    console.log(`✅ Configuration activated for: ${clientKey} (${environment})`);

    res.json({
      success: true,
      message: 'Configuration activated',
      data: config,
    });
  } catch (error) {
    console.error('❌ Error activating configuration:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
