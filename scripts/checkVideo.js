const mongoose = require('mongoose');
require('dotenv').config();

async function checkVideo() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const ThemeData = require('../models/ThemeData');
    const themeData = await ThemeData.findOne({ shopDomain: 'cmstestingg.myshopify.com' })
      .sort({ updatedAt: -1 })
      .lean();
    
    if (themeData) {
      console.log('\n=== VIDEO SECTIONS ===\n');
      
      themeData.components.forEach((comp, index) => {
        if (comp.component === 'VideoBlock' || comp.component === 'Video' || comp.type?.includes('video')) {
          console.log(`\n${comp.component || comp.type} #${index + 1}:`);
          console.log('Props:', JSON.stringify(comp.props, null, 2));
          
          if (comp.blocks && comp.blocks.length > 0) {
            console.log('\nBlocks:');
            comp.blocks.forEach((block, i) => {
              console.log(`\n  Block ${i + 1}:`, block.type);
              console.log('  Settings:', JSON.stringify(block.settings, null, 2));
            });
          }
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

checkVideo();
