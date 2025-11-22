const axios = require('axios');
require('dotenv').config();

const SHOP_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN || 'cmstestingg.myshopify.com';
const THEME_ID = '153818169572'; // Your draft theme ID
const API_URL = 'http://localhost:3001'; // Change to your deployed URL if needed

async function syncTheme() {
  try {
    console.log(`🔄 Syncing theme ${THEME_ID} from ${SHOP_DOMAIN}...`);
    
    const response = await axios.post(`${API_URL}/api/sync`, {
      shopDomain: SHOP_DOMAIN,
      themeId: THEME_ID
    });
    
    console.log('✅ Sync completed:', response.data);
    console.log('\n📱 Check your app at http://localhost:3002');
    process.exit(0);
  } catch (error) {
    console.error('❌ Sync failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

syncTheme();
