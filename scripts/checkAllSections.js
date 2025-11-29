const mongoose = require('mongoose');
require('dotenv').config();

async function checkAllSections() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const ThemeData = require('../models/ThemeData');
    const themeData = await ThemeData.findOne({ shopDomain: 'cmstestingg.myshopify.com' })
      .sort({ updatedAt: -1 })
      .lean();
    
    if (themeData && themeData.rawData && themeData.rawData.original && themeData.rawData.original.current) {
      const sections = themeData.rawData.original.current.sections;
      const order = themeData.rawData.original.current.order;
      
      console.log('\n=== ALL SECTIONS IN RAW DATA ===\n');
      console.log('Order:', order);
      console.log('\nSections:');
      
      Object.keys(sections).forEach(key => {
        console.log(`\n${key}:`);
        console.log('  Type:', sections[key].type);
        if (sections[key].type === 'header' || key.includes('header')) {
          console.log('  FULL DATA:', JSON.stringify(sections[key], null, 2));
        }
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkAllSections();
