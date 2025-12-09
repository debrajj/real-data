const mongoose = require('mongoose');

// Store database connections
const connections = {};

// Store models per database
const models = {};

/**
 * Get MongoDB base URI without database name
 */
const getBaseURI = () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }
  // Remove database name from URI (everything between last / and ?)
  return uri.replace(/\/[^/?]+(\?|$)/, '/$1');
};

/**
 * Connect to the config database (main connection)
 * This database stores: clients, shops
 * Note: Using 'appconfig' instead of 'config' because 'config' is reserved in MongoDB
 */
const connectDB = async () => {
  try {
    const baseURI = getBaseURI();
    const configURI = baseURI.replace(/\/(\?|$)/, '/appconfig$1');
    
    console.log('🔌 Connecting to appconfig database...');
    
    await mongoose.connect(configURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    connections['appconfig'] = mongoose.connection;
    
    console.log('✅ MongoDB connected to database: appconfig');
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
};

/**
 * Get or create connection to a store database
 * Each store (clientKey) gets its own database
 */
const getClientDB = async (clientKey) => {
  if (!clientKey) {
    throw new Error('clientKey is required');
  }

  // Return existing connection if available
  if (connections[clientKey] && connections[clientKey].readyState === 1) {
    return connections[clientKey];
  }

  try {
    const baseURI = getBaseURI();
    const clientURI = baseURI.replace(/\/(\?|$)/, `/${clientKey}$1`);
    
    console.log(`🔌 Connecting to ${clientKey} database...`);
    
    const connection = mongoose.createConnection(clientURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    // Wait for connection to be ready
    await connection.asPromise();
    
    connections[clientKey] = connection;
    models[clientKey] = {};
    
    console.log(`✅ Connected to database: ${clientKey}`);
    
    return connection;
  } catch (error) {
    console.error(`❌ Error connecting to ${clientKey}:`, error.message);
    throw error;
  }
};

/**
 * Get config database connection
 */
const getConfigDB = () => {
  return connections['appconfig'] || mongoose.connection;
};

/**
 * Get or create a model for a specific store database
 */
const getStoreModel = async (clientKey, modelName, schema, collectionName) => {
  const connection = await getClientDB(clientKey);
  
  // Initialize models cache for this client if needed
  if (!models[clientKey]) {
    models[clientKey] = {};
  }
  
  // Return cached model if exists
  if (models[clientKey][modelName]) {
    return models[clientKey][modelName];
  }
  
  // Create and cache the model
  const model = connection.model(modelName, schema, collectionName);
  models[clientKey][modelName] = model;
  
  return model;
};

/**
 * Close all connections
 */
const closeAllConnections = async () => {
  for (const [key, conn] of Object.entries(connections)) {
    if (conn && conn.close) {
      await conn.close();
      console.log(`🔌 Closed ${key} connection`);
    }
  }
  // Clear caches
  Object.keys(connections).forEach(key => delete connections[key]);
  Object.keys(models).forEach(key => delete models[key]);
};

/**
 * Get clientKey from shopDomain
 */
const getClientKeyFromShopDomain = async (shopDomain) => {
  const ClientConfig = require('../models/ClientConfig');
  
  // Find client config that matches this shop domain
  const config = await ClientConfig.findOne({
    $or: [
      { shopDomain: shopDomain },
      { shopDomain: { $regex: shopDomain.replace('.myshopify.com', ''), $options: 'i' } },
      { apiBaseUrl: { $regex: shopDomain, $options: 'i' } },
      { adminApiBaseUrl: { $regex: shopDomain, $options: 'i' } }
    ]
  });
  
  return config ? config.clientKey : null;
};

module.exports = { 
  connectDB, 
  getClientDB, 
  getConfigDB, 
  getStoreModel,
  getClientKeyFromShopDomain,
  closeAllConnections 
};
