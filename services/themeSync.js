const ShopifyAPI = require('./shopifyAPI');
const ThemeParser = require('./themeParser');
const ThemeData = require('../models/ThemeData');
const Shop = require('../models/Shop');
const MediaService = require('./mediaService');
const { fixImageUrlsInData } = require('../utils/imageUrlFixer');

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
    const templates = ['index', 'product', 'collection', 'page', 'blog', 'article'];
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
    
    // Fetch header-group.json
    console.log('📥 Fetching header-group.json...');
    let headerGroupData = null;
    try {
      const headerAsset = await shopifyAPI.getThemeAsset(activeThemeId, 'sections/header-group.json');
      if (headerAsset && headerAsset.value) {
        headerGroupData = JSON.parse(headerAsset.value);
        console.log('✅ Found header-group.json');
      }
    } catch (error) {
      console.log('⚠️ No header-group.json found');
    }
    
    // Fetch menu data
    let menuData = [];
    if (headerGroupData) {
      try {
        // Find the main_menu block
        const headerSection = headerGroupData.sections['deb8dcfc-6e5c-495d-ad01-12fa1389160b'];
        if (headerSection && headerSection.blocks) {
          const menuBlock = Object.values(headerSection.blocks).find(b => b.type === 'main_menu');
          if (menuBlock && menuBlock.settings && menuBlock.settings.menu) {
            const menuHandle = menuBlock.settings.menu;
            console.log(`📥 Fetching menu: ${menuHandle}...`);
            const menu = await shopifyAPI.getMenu(menuHandle);
            if (menu && menu.links) {
              menuData = menu.links.map(link => ({
                title: link.title,
                url: link.url
              }));
              console.log(`✅ Found ${menuData.length} menu items`);
            }
          }
        }
      } catch (error) {
        console.log('⚠️ Could not fetch menu data:', error.message);
      }
    }
    
    // Add header and footer if they exist in settings_data
    const globalSections = {};
    
    // Add header section with actual data
    console.log('📥 Adding header section...');
    const headerSection = headerGroupData?.sections['deb8dcfc-6e5c-495d-ad01-12fa1389160b'];
    const headerBlocks = headerSection?.blocks || {};
    
    const logoBlock = Object.values(headerBlocks).find(b => b.type === 'logo');
    const iconsBlock = Object.values(headerBlocks).find(b => b.type === 'header_icons');
    
    // Get shop info for store name
    let shopInfo = null;
    try {
      shopInfo = await shopifyAPI.getShopInfo();
      console.log('✅ Got shop info:', shopInfo?.name);
    } catch (error) {
      console.log('⚠️ Could not fetch shop info');
    }
    
    globalSections['header'] = {
      type: 'header',
      settings: {
        logo: logoBlock?.settings?.logo || null,
        logo_width: logoBlock?.settings?.logo_width || 145,
        logo_text: logoBlock?.settings?.logo_text || shopInfo?.name || shopDomain.split('.')[0],
        menu: menuData.length > 0 ? menuData : [
          { title: 'Home', url: '/' },
          { title: 'Party Decoration', url: '/collections/party-decoration' },
          { title: 'Return Gifts', url: '/collections/return-gifts' },
          { title: 'Soft Toys', url: '/collections/soft-toys' },
          { title: 'Stationery', url: '/collections/stationery' }
        ],
        // Header icons settings
        show_search: iconsBlock?.settings?.show_search !== false,
        show_customer: iconsBlock?.settings?.show_customer !== false,
        show_wishlist: iconsBlock?.settings?.show_wishlist !== false,
        show_cart: iconsBlock?.settings?.show_cart !== false,
        icons_width: iconsBlock?.settings?.icons_width || 24,
        bg_color: headerSection?.settings?.header_navigation_bg || '#ffffff'
      }
    };
    console.log('✅ Header section added with', menuData.length || 5, 'menu items');
    
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
        // Merge global sections (header/footer) with page sections
        const mergedSections = { ...globalSections, ...sections };
        
        // Create order with header first, content, then footer
        const headerKeys = Object.keys(globalSections).filter(k => 
          globalSections[k]?.type === 'header' || k.includes('header') || globalSections[k]?.type === 'announcement-bar'
        );
        const footerKeys = Object.keys(globalSections).filter(k => 
          globalSections[k]?.type === 'footer' || k.includes('footer')
        );
        const contentOrder = settingsData.templateOrders[templateName] || [];
        
        const pageOrder = [
          ...headerKeys,
          ...contentOrder.filter(k => !headerKeys.includes(k) && !footerKeys.includes(k)),
          ...footerKeys
        ];
        
        const templateData = {
          current: {
            sections: mergedSections,
            order: pageOrder
          }
        };
        const parsed = parser.parse(templateData);
        allPages[templateName] = {
          components: parsed.components,
          sections: mergedSections
        };
      }
    }

    // Fix image URLs for production
    const fixedComponents = fixImageUrlsInData(parsedData.components);
    const fixedPages = fixImageUrlsInData(allPages);
    const fixedTheme = fixImageUrlsInData(parsedData.theme);
    
    const themeDataDoc = {
      shopDomain,
      storeName: 'kidsszone',
      themeId: activeThemeId,
      themeName: settingsData.current?.name || 'Unknown',
      components: fixedComponents, // Home page components
      pages: fixedPages, // All page templates
      theme: fixedTheme, // Theme settings (colors, typography, etc.)
      rawData: {
        theme: fixedTheme,
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
    console.log(`📸 Theme images: ${imageResults.success} downloaded, ${imageResults.skipped} existing, ${imageResults.failed} failed`);
    
    // Download product images
    try {
      const productResults = await mediaService.downloadProductImages();
      console.log(`📸 Product images: ${productResults.success} new, ${productResults.skipped} existing, ${productResults.failed} failed`);
    } catch (error) {
      console.warn('⚠️ Could not download product images:', error.message);
    }
    
    // Download collection images
    try {
      const collectionResults = await mediaService.downloadCollectionImages();
      console.log(`📸 Collection images: ${collectionResults.success} new, ${collectionResults.skipped} existing, ${collectionResults.failed} failed`);
    } catch (error) {
      console.warn('⚠️ Could not download collection images:', error.message);
    }
    
    // Sync blogs and articles
    try {
      const { syncAllBlogs } = require('./blogSync');
      const blogResults = await syncAllBlogs(shopDomain);
      console.log(`📝 Blogs synced: ${blogResults.blogsCount} blogs, ${blogResults.articlesCount} articles`);
    } catch (error) {
      console.warn('⚠️ Could not sync blogs:', error.message);
    }
    
    // Sync custom pages (About Us, Contact Us, etc.)
    try {
      const { syncAllPages } = require('./pageSync');
      const pageResults = await syncAllPages(shopDomain);
      console.log(`📄 Pages synced: ${pageResults.total} pages`);
      
      // Add pages to theme data
      savedThemeData.customPages = pageResults.pages;
      await savedThemeData.save();
    } catch (error) {
      console.warn('⚠️ Could not sync pages:', error.message);
    }
    
    return savedThemeData;
  } catch (error) {
    console.error('❌ Theme sync error:', error);
    throw error;
  }
}

module.exports = { handleThemeUpdate };
