const mongoose = require('mongoose');

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
    unique: true,
    lowercase: true,
    trim: true,
    minlength: [3, 'Client key must be at least 3 characters'],
    maxlength: [30, 'Client key cannot exceed 30 characters'],
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
    unique: true,
    trim: true,
    match: [/^https?:\/\/.+/, 'API base URL must be a valid URL'],
  },
  adminApiBaseUrl: {
    type: String,
    required: [true, 'Admin API base URL is required'],
    unique: true,
    trim: true,
    match: [/^https?:\/\/.+/, 'Admin API base URL must be a valid URL'],
  },
  appName: {
    type: String,
    required: [true, 'App name is required'],
    unique: true,
    trim: true,
    minlength: [2, 'App name must be at least 2 characters'],
    maxlength: [50, 'App name cannot exceed 50 characters'],
  },
  storefrontToken: {
    type: String,
    required: [true, 'Storefront token is required'],
    unique: true,
    trim: true,
    minlength: [10, 'Storefront token must be at least 10 characters'],
  },
  adminShopToken: {
    type: String,
    required: [true, 'Admin shop token is required'],
    unique: true,
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
  databaseUri: {
    type: String,
    required: true,
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

// Compound unique index for clientKey + environment
clientConfigSchema.index({ clientKey: 1, environment: 1 }, { unique: true });

// Additional unique indexes for critical fields
clientConfigSchema.index({ appName: 1 }, { unique: true });
clientConfigSchema.index({ bundleId: 1 }, { unique: true });
clientConfigSchema.index({ packageName: 1 }, { unique: true });
clientConfigSchema.index({ apiBaseUrl: 1 }, { unique: true });
clientConfigSchema.index({ adminApiBaseUrl: 1 }, { unique: true });
clientConfigSchema.index({ storefrontToken: 1 }, { unique: true });
clientConfigSchema.index({ adminShopToken: 1 }, { unique: true });

// Update timestamp on save
clientConfigSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ClientConfig', clientConfigSchema);
