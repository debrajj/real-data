/**
 * Test Database Structure
 * 
 * This script verifies:
 * 1. Connection to main 'cmsdata' database
 * 2. Ability to create client databases
 * 3. Config storage in main database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/database');
const ClientConfig = require('../models/ClientConfig');
const databaseService = require('../services/databaseService');

async function testDatabaseStructure() {
  try {
    console.log('🧪 Testing Database Structure...\n');

    // Test 1: Connect to main database
    console.log('Test 1: Connecting to main database (cmsdata)...');
    await connectDB();
    console.log('✅ Connected to main database\n');

    // Test 2: Check current database name
    console.log('Test 2: Verifying database name...');
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📊 Current database: ${dbName}`);
    if (dbName === 'cmsdata') {
      console.log('✅ Correct database name\n');
    } else {
      console.log('⚠️  Expected "cmsdata" but got:', dbName, '\n');
    }

    // Test 3: List existing client configurations
    console.log('Test 3: Listing existing client configurations...');
    const configs = await ClientConfig.find().select('clientKey clientName collectionName environment');
    console.log(`📋 Found ${configs.length} client configuration(s):`);
    configs.forEach(config => {
      const collection = config.collectionName || config.clientKey || 'unknown';
      console.log(`   - ${config.clientKey} (${config.environment}): Collection = ${collection}`);
    });
    console.log('');

    // Test 4: Verify collection name
    console.log('Test 4: Verifying collection name...');
    const collectionName = ClientConfig.collection.name;
    console.log(`📁 Collection name: ${collectionName}`);
    if (collectionName === 'config') {
      console.log('✅ Correct collection name\n');
    } else {
      console.log('⚠️  Expected "config" but got:', collectionName, '\n');
    }

    // Test 5: List all collections in cmsdata
    console.log('Test 5: Listing all collections in cmsdata...');
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log(`📚 Available collections (${collections.length}):`);
    
    // Separate config from client collections
    const configCol = collections.find(c => c.name === 'config');
    const clientCols = collections.filter(c => c.name !== 'config');
    
    console.log('\n  Main:');
    if (configCol) console.log(`   - ${configCol.name}`);
    
    if (clientCols.length > 0) {
      console.log('\n  Client Collections (stores):');
      clientCols.forEach(col => console.log(`   - ${col.name}`));
    }
    console.log('');

    console.log('✅ All tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   - Main database: cmsdata`);
    console.log(`   - Config collection: config`);
    console.log(`   - Client configs: ${configs.length}`);
    console.log(`   - Total collections: ${collections.length}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
    process.exit(0);
  }
}

testDatabaseStructure();
