const mongoose = require('mongoose');
require('dotenv').config();

async function checkServiceBlock() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const ThemeData = require('../models/ThemeData');
    const themeData = await ThemeData.findOne({ shopDomain: 'cmstestingg.myshopify.com' })
      .sort({ updatedAt: -1 })
      .lean();
    
    if (themeData) {
      console.log('\n=== CUSTOM SERVICE BLOCK ===\n');
      
      themeData.components.forEach((comp, index) => {
        if (comp.component === 'CustomServiceBlock') {
          console.log(`\nCustomServiceBlock #${index + 1}:`);
          console.log('Props:', JSON.stringify(comp.props, null, 2));
          
          if (comp.blocks && comp.blocks.length > 0) {
            console.log('\nBlocks:');
            comp.blocks.forEach((block, i) => {
              console.log(`\n  Block ${i + 1}:`, block.type);
              console.log('  Title:', block.settings.title);
              console.log('  Description:', block.settings.description);
              console.log('  Icon:', block.settings.icon);
              console.log('  All settings:', JSON.stringify(block.settings, null, 2));
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

checkServiceBlock();
