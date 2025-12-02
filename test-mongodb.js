const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('🔄 Testing MongoDB connection...');
    console.log('URI:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully!');
    
    // Test database operations
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('📁 Available collections:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
  }
}

testConnection();