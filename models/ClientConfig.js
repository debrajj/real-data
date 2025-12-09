const mongoose = require('mongoose');

/**
 * ClientConfig Model
 * Stored in the main 'cmsdata' database under 'config' collection
 * This tracks all client databases and their configurations
 */
const clientConfigSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true,
    minlength: [2, 'Client name must be at least 2 characters'],
    maxlength: [50, 'Client name cannot exceed 50 characters'],
  },
  clientKey: {
    type: String,
    required: [true, 'Client key is required'],
    lowercase: true,
    trim: true,
    minlength: [3, 'Client key must be at least 3 characters'],
    maxlength: [50, 'Client key cannot exceed 50 characters'],
    match: [/^[a-z0-9-]+$/, 'Client key must contain only lowercase letters, numbers, and hyphens'],
  },
  environment: {
    type: String,
    enum: {
      values: ['production', 'development'],
      message: 'Environment must be either production or development'
    },
    required: [true, 'Environment is required'],
  },
  apiBaseUrl: {
    type: String,
    required: [true, 'API base URL is required'],
    // Not unique - same client can use same URL for dev/prod
    trim: true,
    match: [/^https?:\/\/.+/, 'API base URL must be a valid URL'],
  },
  adminApiBaseUrl: {
    type: String,
    required: [true, 'Admin API base URL is required'],
    // Not unique - same client can use same URL for dev/prod
    trim: true,
    match: [/^https?:\/\/.+/, 'Admin API base URL must be a valid URL'],
  },
  shopDomain: {
    type: String,
    trim: true,
    // Shopify store domain (e.g., mystore.myshopify.com)
    // Not unique - same client uses same shop for dev/prod
  },
  appName: {
    type: String,
    required: [true, 'App name is required'],
    // Not unique - same client can use same app name for dev/prod
    trim: true,
    minlength: [2, 'App name must be at least 2 characters'],
    maxlength: [50, 'App name cannot exceed 50 characters'],
  },
  storefrontToken: {
    type: String,
    required: [true, 'Storefront token is required'],
    // Not unique - same client uses same token for dev/prod
    trim: true,
    minlength: [10, 'Storefront token must be at least 10 characters'],
  },
  adminShopToken: {
    type: String,
    required: [true, 'Admin shop token is required'],
    // Not unique - same client uses same token for dev/prod
    trim: true,
    minlength: [10, 'Admin shop token must be at least 10 characters'],
  },
  primaryColor: {
    type: String,
    default: '#E91E63',
    match: [/^#[0-9A-Fa-f]{6}$/, 'Primary color must be a valid hex color code'],
  },
  bundleId: {
    type: String,
    required: [true, 'Bundle ID is required'],
    unique: true,
    trim: true,
    match: [/^[a-z0-9.]+$/, 'Bundle ID must contain only lowercase letters, numbers, and dots'],
  },
  packageName: {
    type: String,
    required: [true, 'Package name is required'],
    unique: true,
    trim: true,
    match: [/^[a-z0-9.]+$/, 'Package name must contain only lowercase letters, numbers, and dots'],
  },
  logoUrl: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'Logo URL must be a valid URL'],
  },
  databaseName: {
    type: String,
    required: true,
  },
  // Legacy field - no longer used in multi-database architecture
  collectionName: {
    type: String,
    default: 'default',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound unique index for clientKey + environment (main constraint)
// This ensures each client can have only one dev and one prod config
clientConfigSchema.index({ clientKey: 1, environment: 1 }, { unique: true });

// Only bundleId and packageName need to be globally unique (for app stores)
clientConfigSchema.index({ bundleId: 1 }, { unique: true });
clientConfigSchema.index({ packageName: 1 }, { unique: true });

// Other fields can be shared between dev/prod of the same client
// No unique indexes for: appName, apiBaseUrl, adminApiBaseUrl, storefrontToken, adminShopToken

// Update timestamp on save
clientConfigSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Store in 'clients' collection in the 'config' database
module.exports = mongoose.model('ClientConfig', clientConfigSchema, 'clients');
