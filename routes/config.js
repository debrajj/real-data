const express = require('express');
const router = express.Router();
const ClientConfig = require('../models/ClientConfig');
const databaseService = require('../services/databaseService');

/**
 * POST /api/config
 * Create a new client configuration
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
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    // Validate field formats
    const validations = [
      { field: 'clientKey', value: clientKey, regex: /^[a-z0-9-]{3,30}$/, message: 'Client key must be 3-30 characters with only lowercase letters, numbers, and hyphens' },
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
        return res.status(400).json({
          success: false,
          error: validation.message,
        });
      }
      if (validation.hasOwnProperty('valid') && !validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.message,
        });
      }
    }

    // Check for duplicates across all unique fields
    const duplicateChecks = [
      { field: 'clientKey', value: clientKey.toLowerCase().trim() },
      { field: 'appName', value: appName.trim() },
      { field: 'bundleId', value: bundleId.trim() },
      { field: 'packageName', value: packageName.trim() },
      { field: 'apiBaseUrl', value: apiBaseUrl.trim() },
      { field: 'adminApiBaseUrl', value: adminApiBaseUrl.trim() },
      { field: 'storefrontToken', value: storefrontToken.trim() },
      { field: 'adminShopToken', value: adminShopToken.trim() },
    ];

    for (const check of duplicateChecks) {
      const existing = await ClientConfig.findOne({ [check.field]: check.value });
      if (existing) {
        return res.status(409).json({
          success: false,
          error: `${check.field} '${check.value}' already exists`,
        });
      }
    }

    // Additional check for clientKey + environment combination
    const existingConfig = await ClientConfig.findOne({ clientKey: clientKey.toLowerCase().trim(), environment });
    if (existingConfig) {
      return res.status(409).json({
        success: false,
        error: `Configuration for client '${clientKey}' with environment '${environment}' already exists`,
      });
    }

    console.log(`🔧 Creating configuration for client: ${clientKey} (${environment})`);

    // Create database for the client (only once per clientKey)
    let databaseName, databaseUri;
    const anyExistingConfig = await ClientConfig.findOne({ clientKey });
    
    if (anyExistingConfig) {
      // Use existing database
      databaseName = anyExistingConfig.databaseName;
      databaseUri = anyExistingConfig.databaseUri;
      console.log(`📦 Using existing database: ${databaseName}`);
    } else {
      // Create new database
      const dbResult = await databaseService.createClientDatabase(clientKey);
      databaseName = dbResult.databaseName;
      databaseUri = dbResult.databaseUri;
      
      // Initialize collections
      await databaseService.initializeCollections(clientKey);
    }

    // Create configuration
    const config = new ClientConfig({
      clientName,
      clientKey,
      environment,
      apiBaseUrl,
      adminApiBaseUrl,
      appName,
      primaryColor,
      bundleId,
      packageName,
      logoUrl,
      storefrontToken,
      adminShopToken,
      databaseName,
      databaseUri,
    });

    await config.save();

    console.log(`✅ Configuration created for: ${clientKey} (${environment})`);

    res.status(201).json({
      success: true,
      message: 'Client configuration created successfully',
      data: {
        clientName: config.clientName,
        clientKey: config.clientKey,
        environment: config.environment,
        apiBaseUrl: config.apiBaseUrl,
        adminApiBaseUrl: config.adminApiBaseUrl,
        appName: config.appName,
        primaryColor: config.primaryColor,
        bundleId: config.bundleId,
        packageName: config.packageName,
        logoUrl: config.logoUrl,
        storefrontToken: config.storefrontToken,
        adminShopToken: config.adminShopToken,
        databaseName: config.databaseName,
        isActive: config.isActive,
        createdAt: config.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Error creating client configuration:', error);
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      return res.status(409).json({
        success: false,
        error: `${field} '${value}' already exists`,
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: validationErrors.join(', '),
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
    });
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
      .select('-databaseUri')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: configs.length,
      data: configs,
    });
  } catch (error) {
    console.error('❌ Error fetching configurations:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/config/:clientKey/:environment
 * Get configuration by clientKey and environment
 */
router.get('/:clientKey/:environment', async (req, res) => {
  try {
    const { clientKey, environment } = req.params;

    // Validate environment
    if (!['development', 'production'].includes(environment)) {
      return res.status(400).json({
        success: false,
        error: 'environment must be either "development" or "production"',
      });
    }

    const config = await ClientConfig.findOne({ clientKey, environment })
      .select('-databaseUri')
      .lean();

    if (!config) {
      return res.status(404).json({
        success: false,
        error: `Configuration not found for client: ${clientKey} with environment: ${environment}`,
      });
    }

    res.json({
      clientName: config.clientName,
      clientKey: config.clientKey,
      apiBaseUrl: config.apiBaseUrl,
      adminApiBaseUrl: config.adminApiBaseUrl,
      appName: config.appName,
      primaryColor: config.primaryColor,
      bundleId: config.bundleId,
      packageName: config.packageName,
      logoUrl: config.logoUrl,
      environment: config.environment,
      storefrontToken: config.storefrontToken,
      adminShopToken: config.adminShopToken,
    });
  } catch (error) {
    console.error('❌ Error fetching configuration:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/config/:clientKey
 * Get all configurations for a clientKey (both dev and prod)
 */
router.get('/:clientKey', async (req, res) => {
  try {
    const { clientKey } = req.params;

    const configs = await ClientConfig.find({ clientKey })
      .select('-databaseUri')
      .lean();

    if (!configs || configs.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No configurations found for client: ${clientKey}`,
      });
    }

    res.json({
      success: true,
      data: configs,
    });
  } catch (error) {
    console.error('❌ Error fetching configuration:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/config/:clientKey/:environment
 * Update client configuration
 */
router.put('/:clientKey/:environment', async (req, res) => {
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
 * DELETE /api/config/:clientKey/:environment
 * Delete client configuration (soft delete - set isActive to false)
 */
router.delete('/:clientKey/:environment', async (req, res) => {
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
        // Close database connection if no configs remain
        await databaseService.closeConnection(clientKey);
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
