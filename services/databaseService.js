const mongoose = require('mongoose');
const { getClientDB, getStoreModel } = require('../config/database');

/**
 * DatabaseService - Multi-Database Architecture
 * 
 * Structure:
 * MongoDB Server
 * ├── config (database)
 * │   └── clients (collection with all client configs)
 * │   └── shops (collection with shop info)
 * ├── store1 (database)
 * │   ├── products (collection)
 * │   ├── collections (collection)
 * │   ├── blogs (collection)
 * │   └── ...
 * ├── store2 (database)
 * │   ├── products (collection)
 * │   └── ...
 * └── myspoon (database)
 *     ├── products (collection)
 *     └── ...
 */
class DatabaseService {
  constructor() {
    // Collections that go in each store database
    this.storeCollections = [
      'products',
      'collections', 
      'blogs',
      'articles',
      'themedatas',
      'media',
      'discounts',
      'webhookevents'
    ];
  }

  /**
   * Create database and collections for a store
   */
  async createClientDatabase(clientKey) {
    try {
      console.log(`📦 Creating database for: ${clientKey}`);
      
      const clientDB = await getClientDB(clientKey);
      
      // Create collections in the store database
      for (const col of this.storeCollections) {
        try {
          await clientDB.db.createCollection(col);
          console.log(`  ✓ Created: ${col}`);
        } catch (e) {
          if (e.code !== 48) console.log(`  ⚠ ${col}: ${e.message}`);
        }
      }
      
      console.log(`✅ Database ready: ${clientKey}`);
      return { databaseName: clientKey, collections: this.storeCollections };
    } catch (error) {
      console.error(`❌ Error creating ${clientKey}:`, error);
      throw error;
    }
  }

  // Alias for backward compatibility
  async createClientCollections(clientKey) {
    return this.createClientDatabase(clientKey);
  }

  /**
   * Get model for a store's collection
   */
  async getModel(clientKey, modelName, schema, collectionName) {
    return getStoreModel(clientKey, modelName, schema, collectionName || modelName.toLowerCase() + 's');
  }

  /**
   * Delete store database
   */
  async deleteClientDatabase(clientKey) {
    try {
      const clientDB = await getClientDB(clientKey);
      await clientDB.db.dropDatabase();
      console.log(`🗑️ Deleted database: ${clientKey}`);
      return true;
    } catch (error) {
      console.error(`❌ Error deleting ${clientKey}:`, error);
      throw error;
    }
  }

  async deleteClientCollections(clientKey) {
    return this.deleteClientDatabase(clientKey);
  }

  /**
   * List all store databases
   */
  async listStoreDatabases() {
    const ClientConfig = require('../models/ClientConfig');
    const configs = await ClientConfig.find({}).distinct('clientKey');
    return configs;
  }
}

module.exports = new DatabaseService();
