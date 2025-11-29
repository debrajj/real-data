const mongoose = require('mongoose');
require('dotenv').config();

async function checkBanners() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const ThemeData = require('../models/ThemeData');
    const themeData = await ThemeData.findOne({ shopDomain: 'cmstestingg.myshopify.com' })
      .sort({ updatedAt: -1 })
      .lean();
    
    if (themeData) {
      console.log('\n=== ALL COMPONENTS ===\n');
      
      themeData.components.forEach((comp, index) => {
        console.log(`${index + 1}. ${comp.component || comp.type} (ID: ${comp.id})`);
        
        // Check for image URLs in props
        if (comp.props) {
          Object.keys(comp.props).forEach(key => {
            if (key.includes('image') && comp.props[key] && typeof comp.props[key] === 'string') {
              if (comp.props[key].includes('Aes_tHE_TIC')) {
                console.log(`   ⭐ FOUND: ${key} = ${comp.props[key]}`);
              }
            }
          });
        }
        
        // Check for image URLs in blocks
        if (comp.blocks) {
          comp.blocks.forEach((block, bIndex) => {
            if (block.settings) {
              Object.keys(block.settings).forEach(key => {
                if (key.includes('image') && block.settings[key] && typeof block.settings[key] === 'string') {
                  if (block.settings[key].includes('Aes_tHE_TIC')) {
                    console.log(`   ⭐ FOUND in block ${bIndex + 1}: ${key} = ${block.settings[key]}`);
                  }
                }
              });
            }
          });
        }
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkBanners();
