const ShopifyAPI = require('./shopifyAPI');
const ThemeParser = require('./themeParser');
const ThemeData = require('../models/ThemeData');
const Shop = require('../models/Shop');

async function handleThemeUpdate(shopDomain, themeId) {
  try {
    console.log(`🔄 Starting theme sync for ${shopDomain}, theme: ${themeId}`);
    
    // Get or create shop record
    let shop = await Shop.findOne({ shopDomain });
    if (!shop) {
      shop = await Shop.create({
        shopDomain,
        accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
        themeId,
      });
    }

    // Initialize Shopify API
    const shopifyAPI = new ShopifyAPI(shopDomain, shop.accessToken);
    
    // Get theme ID if not provided
    let activeThemeId = themeId;
    if (!activeThemeId) {
      const activeTheme = await shopifyAPI.getActiveTheme();
      activeThemeId = activeTheme.id.toString();
      console.log(`📌 Active theme ID: ${activeThemeId}`);
    }

    // Fetch settings_data.json
    console.log('📥 Fetching settings_data.json...');
    const settingsData = await shopifyAPI.getSettingsData(activeThemeId);
    
    if (!settingsData) {
      throw new Error('Failed to fetch settings_data.json');
    }

    // Fetch index template (home page sections)
    console.log('📥 Fetching index template...');
    const indexTemplate = await shopifyAPI.getTemplateData(activeThemeId, 'index');
    
    // Merge template sections into settings data
    if (indexTemplate && indexTemplate.sections) {
      console.log('✅ Found sections in index template');
      settingsData.current = settingsData.current || {};
      settingsData.current.sections = {
        ...settingsData.current.sections,
        ...indexTemplate.sections
      };
      settingsData.current.order = indexTemplate.order || [];
    }

    // Parse theme data
    console.log('🔧 Parsing theme data...');
    const parser = new ThemeParser();
    const parsedData = parser.parse(settingsData);

    // Save to MongoDB
    console.log('💾 Saving to MongoDB...');
    const existingThemeData = await ThemeData.findOne({ 
      shopDomain, 
      themeId: activeThemeId 
    });

    const themeDataDoc = {
      shopDomain,
      themeId: activeThemeId,
      themeName: settingsData.current?.name || 'Unknown',
      components: parsedData.components,
      rawData: {
        theme: parsedData.theme,
        original: settingsData,
      },
      version: existingThemeData ? existingThemeData.version + 1 : 1,
    };

    const savedThemeData = await ThemeData.findOneAndUpdate(
      { shopDomain, themeId: activeThemeId },
      themeDataDoc,
      { upsert: true, new: true }
    );

    // Update shop last sync
    await Shop.findOneAndUpdate(
      { shopDomain },
      { lastSync: new Date(), themeId: activeThemeId }
    );

    console.log(`✅ Theme sync completed. Version: ${savedThemeData.version}`);
    console.log(`📊 Components: ${parsedData.components.length}`);
    
    return savedThemeData;
  } catch (error) {
    console.error('❌ Theme sync error:', error);
    throw error;
  }
}

module.exports = { handleThemeUpdate };
