const mongoose = require('mongoose');
require('dotenv').config();

async function checkHeader() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const ThemeData = require('../models/ThemeData');
    const themeData = await ThemeData.findOne({ shopDomain: 'cmstestingg.myshopify.com' })
      .sort({ updatedAt: -1 })
      .lean();
    
    if (themeData) {
      console.log('\n=== HEADER/MENU SECTIONS ===\n');
      
      themeData.components.forEach((comp, index) => {
        if (comp.component === 'Header' || comp.type?.includes('header') || comp.type?.includes('announcement')) {
          console.log(`\n${index + 1}. ${comp.component || comp.type} (ID: ${comp.id})`);
          console.log('Props:', JSON.stringify(comp.props, null, 2));
          
          if (comp.blocks && comp.blocks.length > 0) {
            console.log('\nBlocks:', comp.blocks.length);
            comp.blocks.forEach((block, i) => {
              console.log(`\n  Block ${i + 1}:`, block.type);
              console.log('  Settings:', JSON.stringify(block.settings, null, 2));
            });
          }
          console.log('\n---');
        }
      });
      
      // Also check raw data for header
      if (themeData.rawData && themeData.rawData.original && themeData.rawData.original.current) {
        const sections = themeData.rawData.original.current.sections;
        console.log('\n=== RAW HEADER DATA ===\n');
        Object.keys(sections).forEach(key => {
          if (key.includes('header') || sections[key].type === 'header') {
            console.log(`\nSection: ${key}`);
            console.log('Type:', sections[key].type);
            console.log('Settings:', JSON.stringify(sections[key].settings, null, 2));
          }
        });
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkHeader();
