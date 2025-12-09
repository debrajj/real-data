import mongoose from 'mongoose';

const appConfigSchema = new mongoose.Schema({
  shop: { type: String, required: true }, // Shopify domain
  clientName: { type: String, required: true },
  clientKey: { type: String, required: true },
  
  // App Details
  appName: { type: String, default: 'My App' },
  primaryColor: { type: String, default: '#E91E63' },
  logoUrl: { type: String, default: '' },
  
  // Tech Details
  bundleId: { type: String, default: '' },
  packageName: { type: String, default: '' },
  
  // Environment (Dev/Prod)
  environment: { type: String, required: true, enum: ['Development', 'Production'] },
  
  // API Config
  apiBaseUrl: { type: String, default: '' },
  adminApiBaseUrl: { type: String, default: '' },
  
  // Secrets (In a real app, these should be encrypted)
  storefrontToken: { type: String, default: '' },
  adminShopToken: { type: String, default: '' },
  
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Ensure a shop can only have one config per environment
appConfigSchema.index({ shop: 1, environment: 1 }, { unique: true });

const AppConfig = mongoose.model('AppConfig', appConfigSchema);

export default AppConfig;