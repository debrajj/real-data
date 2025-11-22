const ShopifyAPI = require('./shopifyAPI');
const ThemeParser = require('./themeParser');
const ThemeData = require('../models/ThemeData');
const Shop = require('../models/Shop');
const MediaService = require('./mediaService');

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
    
    // Get theme ID - prioritize: provided > env variable > active theme
    let activeThemeId = themeId || process.env.SHOPIFY_THEME_ID;
    if (!activeThemeId) {
      const activeTheme = await shopifyAPI.getActiveTheme();
      activeThemeId = activeTheme.id.toString();
      console.log(`📌 Active theme ID: ${activeThemeId}`);
    } else {
      console.log(`📌 Using theme ID: ${activeThemeId}`);
    }

    // Fetch settings_data.json
    console.log('📥 Fetching settings_data.json...');
    const settingsData = await shopifyAPI.getSettingsData(activeThemeId);
    
    if (!settingsData) {
      throw new Error('Failed to fetch settings_data.json');
    }

    // Fetch all page templates
    console.log('📥 Fetching page templates...');
    const templates = ['index', 'product', 'collection', 'page', 'blog', 'article', 'cart'];
    const allSections = {};
    const allOrders = {};
    
    for (const templateName of templates) {
      const template = await shopifyAPI.getTemplateData(activeThemeId, templateName);
      if (template && template.sections) {
        console.log(`✅ Found ${Object.keys(template.sections).length} sections in ${templateName} template`);
        allSections[templateName] = template.sections;
        allOrders[templateName] = template.order || [];
      }
    }
    
    // Add header and footer if they exist in settings_data
    const globalSections = {};
    if (settingsData.current?.sections) {
      // Look for header and footer in global sections
      Object.entries(settingsData.current.sections).forEach(([key, section]) => {
        if (section.type === 'header' || section.type === 'footer' || 
            section.type === 'announcement-bar' || key.includes('header') || key.includes('footer')) {
          globalSections[key] = section;
        }
      });
    }
    
    // Debug: Log what we're merging
    console.log('🔍 Index sections:', Object.keys(allSections.index || {}));
    console.log('🔍 Index order:', allOrders.index);
    console.log('🔍 settingsData keys:', Object.keys(settingsData || {}));
    console.log('🔍 settingsData.current exists?', !!settingsData.current);
    
    // Merge all template sections into settings data (prioritize index/home page)
    if (!settingsData.current) {
      settingsData.current = {};
    }
    
    // Merge sections
    const existingSections = settingsData.current.sections || {};
    const indexSections = allSections.index || {};
    
    console.log('🔍 existingSections:', Object.keys(existingSections));
    console.log('🔍 indexSections:', Object.keys(indexSections));
    console.log('🔍 globalSections:', Object.keys(globalSections));
    
    // Create merged sections object
    const mergedSections = Object.assign({}, globalSections, existingSections, indexSections);
    
    // Create proper order with header first, then content, then footer
    const headerKeys = Object.keys(globalSections || {}).filter(k => 
      globalSections[k]?.type === 'header' || k.includes('header') || globalSections[k]?.type === 'announcement-bar'
    );
    const footerKeys = Object.keys(globalSections || {}).filter(k => 
      globalSections[k]?.type === 'footer' || k.includes('footer')
    );
    const contentOrder = allOrders.index || [];
    
    const mergedOrder = [
      ...headerKeys,
      ...contentOrder.filter(k => !headerKeys.includes(k) && !footerKeys.includes(k)),
      ...footerKeys
    ];
    
    // Create a NEW current object instead of modifying the existing one
    settingsData.current = {
      ...settingsData.current,
      sections: mergedSections,
      order: mergedOrder
    };
    
    console.log('🔍 Final sections:', Object.keys(settingsData.current.sections || {}));
    console.log('🔍 Final order:', settingsData.current.order);
    
    // Store all page templates for reference
    settingsData.templates = allSections;
    settingsData.templateOrders = allOrders;

    // Parse theme data
    console.log('🔧 Parsing theme data...');
    console.log('🔍 Sections to parse:', Object.keys(settingsData.current?.sections || {}));
    console.log('🔍 Order to parse:', settingsData.current?.order);
    const parser = new ThemeParser();
    const parsedData = parser.parse(settingsData);
    console.log('🔍 Parsed components:', parsedData.components.length);

    // Save to MongoDB
    console.log('💾 Saving to MongoDB...');
    const existingThemeData = await ThemeData.findOne({ 
      shopDomain, 
      themeId: activeThemeId 
    });

    // Parse all page templates
    const allPages = {};
    if (settingsData.templates) {
      for (const [templateName, sections] of Object.entries(settingsData.templates)) {
        const templateData = {
          current: {
            sections: sections,
            order: settingsData.templateOrders[templateName] || []
          }
        };
        const parsed = parser.parse(templateData);
        allPages[templateName] = {
          components: parsed.components,
          sections: sections
        };
      }
    }

    const themeDataDoc = {
      shopDomain,
      themeId: activeThemeId,
      themeName: settingsData.current?.name || 'Unknown',
      components: parsedData.components, // Home page components
      pages: allPages, // All page templates
      theme: parsedData.theme, // Theme settings (colors, typography, etc.)
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
    
    // Download and store images
    console.log('📸 Starting image download...');
    const mediaService = new MediaService(shopDomain);
    const imageResults = await mediaService.downloadAllImages(savedThemeData);
    console.log(`📸 Images: ${imageResults.success} downloaded, ${imageResults.skipped} existing, ${imageResults.failed} failed`);
    
    return savedThemeData;
  } catch (error) {
    console.error('❌ Theme sync error:', error);
    throw error;
  }
}

module.exports = { handleThemeUpdate };
