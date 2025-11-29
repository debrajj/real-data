const mongoose = require('mongoose');
require('dotenv').config();

async function checkBannerDetail() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const ThemeData = require('../models/ThemeData');
    const themeData = await ThemeData.findOne({ shopDomain: 'cmstestingg.myshopify.com' })
      .sort({ updatedAt: -1 })
      .lean();
    
    if (themeData) {
      const banner = themeData.components.find(c => c.id === '16372307037a2f3f93');
      
      if (banner) {
        console.log('\n=== BANNER WITH Aes_tHE_TIC IMAGE ===\n');
        console.log('Component:', banner.component);
        console.log('Type:', banner.type);
        console.log('\nProps:', JSON.stringify(banner.props, null, 2));
        console.log('\nBlocks:');
        banner.blocks?.forEach((block, i) => {
          console.log(`\n  Block ${i + 1}:`, block.type);
          console.log('  Settings:', JSON.stringify(block.settings, null, 2));
        });
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkBannerDetail();
