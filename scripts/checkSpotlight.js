const mongoose = require('mongoose');
require('dotenv').config();

async function checkSpotlight() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const ThemeData = require('../models/ThemeData');
    const themeData = await ThemeData.findOne({ shopDomain: 'cmstestingg.myshopify.com' })
      .sort({ updatedAt: -1 })
      .lean();
    
    if (themeData) {
      console.log('\n=== SPOTLIGHT BLOCKS ===\n');
      
      themeData.components.forEach((comp, index) => {
        if (comp.component === 'SpotlightBlock') {
          console.log(`\nSpotlight #${index + 1}:`);
          console.log('Props:', JSON.stringify(comp.props, null, 2));
          console.log('\nBlocks:');
          comp.blocks?.forEach((block, i) => {
            console.log(`\n  Block ${i + 1}:`, block.type);
            console.log('  Settings:', JSON.stringify(block.settings, null, 2));
          });
          console.log('\n---');
        }
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSpotlight();
