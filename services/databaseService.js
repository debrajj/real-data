const mongoose = require('mongoose');

class DatabaseService {
  constructor() {
    this.connections = new Map();
  }

  /**
   * Create a new database for a client
   */
  async createClientDatabase(clientKey) {
    try {
      const baseUri = process.env.MONGODB_URI;
      
      // Extract base URI without database name
      // MongoDB URI format: mongodb+srv://user:pass@host/database?options
      // Change the prefix here or remove it entirely
      const dbName = clientKey; // No prefix - just use clientKey as database name
      // OR use a different prefix:
      // const dbName = `client_${clientKey}`;
      // const dbName = `app_${clientKey}`;
      
      // Split by '/' and replace the database name (last part before query params)
      const uriBeforeDb = baseUri.substring(0, baseUri.lastIndexOf('/'));
      const queryParams = baseUri.includes('?') ? baseUri.substring(baseUri.indexOf('?')) : '';
      const clientDbUri = `${uriBeforeDb}/${dbName}${queryParams}`;

      console.log(`📦 Creating database: ${dbName}`);

      // Create connection to the new database
      const connection = mongoose.createConnection(clientDbUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      // Wait for connection to be ready
      await connection.asPromise();

      // Store connection
      this.connections.set(clientKey, connection);

      console.log(`✅ Database created: ${dbName}`);

      return {
        databaseName: dbName,
        databaseUri: clientDbUri,
        connection,
      };
    } catch (error) {
      console.error(`❌ Error creating database for ${clientKey}:`, error);
      throw error;
    }
  }

  /**
   * Get connection for a client
   */
  getConnection(clientKey) {
    return this.connections.get(clientKey);
  }

  /**
   * Close connection for a client
   */
  async closeConnection(clientKey) {
    const connection = this.connections.get(clientKey);
    if (connection) {
      await connection.close();
      this.connections.delete(clientKey);
      console.log(`🔌 Closed connection for: ${clientKey}`);
    }
  }

  /**
   * Initialize collections for a new client database
   */
  async initializeCollections(clientKey) {
    const connection = this.getConnection(clientKey);
    if (!connection) {
      throw new Error(`No connection found for client: ${clientKey}`);
    }

    // Create collections with schemas
    const collections = [
      'products',
      'collections',
      'media',
      'themedata',
      'blogs',
      'articles',
      'discounts',
      'shops',
    ];

    for (const collectionName of collections) {
      await connection.createCollection(collectionName);
      console.log(`  ✓ Created collection: ${collectionName}`);
    }

    return collections;
  }

  /**
   * Check if database exists
   */
  async databaseExists(clientKey) {
    try {
      const connection = this.getConnection(clientKey);
      if (!connection) return false;

      const admin = connection.db.admin();
      const databases = await admin.listDatabases();
      const dbName = clientKey; // Match the naming in createClientDatabase
      
      return databases.databases.some(db => db.name === dbName);
    } catch (error) {
      return false;
    }
  }
}

module.exports = new DatabaseService();
