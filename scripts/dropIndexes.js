/**
 * Script to drop old unique indexes from ClientConfig collection
 * Run with: node scripts/dropIndexes.js
 */
const mongoose = require('mongoose');
require('dotenv').config();

async function dropIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    const db = mongoose.connection.db;
    // The config database is 'appconfig' and collection is 'clients'
    const configDb = mongoose.connection.client.db('appconfig');
    const collection = configDb.collection('clients');

    console.log('Current indexes:');
    const indexes = await collection.indexes();
    console.log(indexes.map(i => i.name));

    // Drop specific indexes that should no longer be unique
    const indexesToDrop = [
      'appName_1',
      'apiBaseUrl_1', 
      'adminApiBaseUrl_1',
      'storefrontToken_1',
      'adminShopToken_1'
    ];

    for (const indexName of indexesToDrop) {
      try {
        await collection.dropIndex(indexName);
        console.log(`✅ Dropped index: ${indexName}`);
      } catch (err) {
        if (err.code === 27) {
          console.log(`⚠️ Index not found: ${indexName}`);
        } else {
          console.error(`❌ Error dropping ${indexName}:`, err.message);
        }
      }
    }

    console.log('\nRemaining indexes:');
    const remainingIndexes = await collection.indexes();
    console.log(remainingIndexes.map(i => i.name));

    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

dropIndexes();
