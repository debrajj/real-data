/**
 * Validation utilities for client configuration
 */

const ClientConfig = require('../models/ClientConfig');

/**
 * Validate client configuration data
 */
const validateClientConfig = (data) => {
  const errors = [];

  // Required fields validation
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

  for (const [field, label] of Object.entries(requiredFields)) {
    if (!data[field] || data[field].toString().trim() === '') {
      errors.push(`${label} is required`);
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Format validations
  const validations = [
    {
      field: 'clientName',
      value: data.clientName,
      test: (val) => val.length >= 2 && val.length <= 50,
      message: 'Client name must be 2-50 characters'
    },
    {
      field: 'clientKey',
      value: data.clientKey,
      test: (val) => /^[a-z0-9-]{3,30}$/.test(val),
      message: 'Client key must be 3-30 characters with only lowercase letters, numbers, and hyphens'
    },
    {
      field: 'environment',
      value: data.environment,
      test: (val) => ['development', 'production'].includes(val),
      message: 'Environment must be either "development" or "production"'
    },
    {
      field: 'apiBaseUrl',
      value: data.apiBaseUrl,
      test: (val) => /^https?:\/\/.+/.test(val),
      message: 'API base URL must be a valid URL'
    },
    {
      field: 'adminApiBaseUrl',
      value: data.adminApiBaseUrl,
      test: (val) => /^https?:\/\/.+/.test(val),
      message: 'Admin API base URL must be a valid URL'
    },
    {
      field: 'appName',
      value: data.appName,
      test: (val) => val.length >= 2 && val.length <= 50,
      message: 'App name must be 2-50 characters'
    },
    {
      field: 'bundleId',
      value: data.bundleId,
      test: (val) => /^[a-z0-9.]+$/.test(val),
      message: 'Bundle ID must contain only lowercase letters, numbers, and dots'
    },
    {
      field: 'packageName',
      value: data.packageName,
      test: (val) => /^[a-z0-9.]+$/.test(val),
      message: 'Package name must contain only lowercase letters, numbers, and dots'
    },
    {
      field: 'storefrontToken',
      value: data.storefrontToken,
      test: (val) => val.length >= 10,
      message: 'Storefront token must be at least 10 characters'
    },
    {
      field: 'adminShopToken',
      value: data.adminShopToken,
      test: (val) => val.length >= 10,
      message: 'Admin shop token must be at least 10 characters'
    },
    {
      field: 'primaryColor',
      value: data.primaryColor || '#E91E63',
      test: (val) => /^#[0-9A-Fa-f]{6}$/.test(val),
      message: 'Primary color must be a valid hex color code'
    }
  ];

  // Optional logoUrl validation
  if (data.logoUrl) {
    validations.push({
      field: 'logoUrl',
      value: data.logoUrl,
      test: (val) => /^https?:\/\/.+/.test(val),
      message: 'Logo URL must be a valid URL'
    });
  }

  for (const validation of validations) {
    if (!validation.test(validation.value)) {
      errors.push(validation.message);
    }
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Check for duplicate values across unique fields
 */
const checkDuplicates = async (data, excludeConfig = null) => {
  const duplicateChecks = [
    { field: 'clientKey', value: data.clientKey?.toLowerCase().trim() },
    { field: 'appName', value: data.appName?.trim() },
    { field: 'bundleId', value: data.bundleId?.trim() },
    { field: 'packageName', value: data.packageName?.trim() },
    { field: 'apiBaseUrl', value: data.apiBaseUrl?.trim() },
    { field: 'adminApiBaseUrl', value: data.adminApiBaseUrl?.trim() },
    { field: 'storefrontToken', value: data.storefrontToken?.trim() },
    { field: 'adminShopToken', value: data.adminShopToken?.trim() },
  ];

  for (const check of duplicateChecks) {
    if (!check.value) continue;

    const query = { [check.field]: check.value };
    
    // Exclude current config when updating
    if (excludeConfig) {
      query.$nor = [{ clientKey: excludeConfig.clientKey, environment: excludeConfig.environment }];
    }

    const existing = await ClientConfig.findOne(query);
    if (existing) {
      return {
        isDuplicate: true,
        field: check.field,
        value: check.value
      };
    }
  }

  return { isDuplicate: false };
};

module.exports = {
  validateClientConfig,
  checkDuplicates
};