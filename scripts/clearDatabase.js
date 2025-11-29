const mongoose = require('mongoose');
require('dotenv').config();

async function clearDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log(`\n📋 Found ${collections.length} collections`);
    
    // Drop each collection
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`🗑️  Dropping collection: ${collectionName}`);
      await db.dropCollection(collectionName);
    }
    
    console.log('\n✅ All collections cleared!');
    console.log('💡 Run "node scripts/syncNewTheme.js" to resync data');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

clearDatabase();
