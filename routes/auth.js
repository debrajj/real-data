const express = require('express');
const router = express.Router();
const ThemeData = require('../models/ThemeData');
const Media = require('../models/Media');
const { Blog, Article } = require('../models/Blog');
const Product = require('../models/Product');
const Collection = require('../models/Collection');

// Get all data for kidsszone
router.get('/kidsszone', async (req, res) => {
  try {
    const shopDomain = 'cmstestingg.myshopify.com';
    const storeName = 'kidsszone';
    
    // Get theme data
    const themeData = await ThemeData.findOne({ shopDomain })
      .sort({ updatedAt: -1 })
      .allowDiskUse(true)
      .lean();
    
    // Get media
    const media = await Media.find({ shopDomain })
      .select('-data')
      .limit(100)
      .lean();
    
    // Get blogs and articles
    const blogs = await Blog.find({ shopDomain }).lean();
    const articles = await Article.find({ shopDomain })
      .sort({ published_at: -1 })
      .allowDiskUse(true)
      .limit(50)
      .lean();
    
    // Get products
    const products = await Product.find({ shopDomain })
      .limit(100)
      .lean();
    
    // Get collections
    const collections = await Collection.find({ shopDomain })
      .lean();
    
    // Replace URLs
    const UrlReplacer = require('../services/urlReplacer');
    const urlReplacer = new UrlReplacer(shopDomain);
    const replacedThemeData = themeData ? await urlReplacer.replaceUrls(themeData) : null;
    
    // Build response
    const response = {
      success: true,
      store: storeName,
      shopDomain: shopDomain,
      data: {
        theme: replacedThemeData ? {
          id: replacedThemeData._id,
          themeId: replacedThemeData.themeId,
          themeName: replacedThemeData.themeName,
          version: replacedThemeData.version,
          components: replacedThemeData.components,
          pages: replacedThemeData.pages,
          theme: replacedThemeData.theme,
          customPages: replacedThemeData.customPages || [],
          updatedAt: replacedThemeData.updatedAt
        } : null,
        media: media.map(m => ({
          id: m._id,
          filename: m.filename,
          originalUrl: m.originalUrl,
          cdnUrl: m.cdnUrl,
          url: `/api/media/${shopDomain}/image/${m._id}`,
          contentType: m.contentType,
          size: m.size,
          width: m.width,
          height: m.height,
          alt: m.alt
        })),
        blogs: blogs.map(b => ({
          id: b._id,
          blogId: b.blogId,
          handle: b.handle,
          title: b.title,
          articleCount: b.articleCount
        })),
        articles: articles.map(a => ({
          id: a._id,
          articleId: a.articleId,
          blogId: a.blogId,
          title: a.title,
          handle: a.handle,
          author: a.author,
          image: a.image,
          summary: a.summary_html,
          content: a.body_html,
          published_at: a.published_at,
          tags: a.tags
        })),
        products: products.map(p => ({
          id: p._id,
          productId: p.productId,
          title: p.title,
          handle: p.handle,
          vendor: p.vendor,
          productType: p.product_type,
          price: p.variants?.[0]?.price,
          compareAtPrice: p.variants?.[0]?.compare_at_price,
          images: p.images,
          tags: p.tags,
          status: p.status
        })),
        collections: collections.map(c => ({
          id: c._id,
          collectionId: c.collectionId,
          title: c.title,
          handle: c.handle,
          description: c.description,
          image: c.image,
          productsCount: c.products_count
        }))
      },
      meta: {
        totalComponents: replacedThemeData?.components?.length || 0,
        totalPages: Object.keys(replacedThemeData?.pages || {}).length,
        totalMedia: media.length,
        totalBlogs: blogs.length,
        totalArticles: articles.length,
        totalProducts: products.length,
        totalCollections: collections.length,
        lastSync: replacedThemeData?.updatedAt
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('❌ Error fetching kidsszone data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch data',
      message: error.message
    });
  }
});

module.exports = router;
