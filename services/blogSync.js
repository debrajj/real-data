const ShopifyAPI = require('./shopifyAPI');
const Shop = require('../models/Shop');
const { getStoreModel, getClientKeyFromShopDomain } = require('../config/database');
const { blogSchema, articleSchema } = require('../models/schemas');

/**
 * Get Blog model for a specific store database
 */
async function getBlogModel(clientKey) {
  return getStoreModel(clientKey, 'Blog', blogSchema, 'blogs');
}

/**
 * Get Article model for a specific store database
 */
async function getArticleModel(clientKey) {
  return getStoreModel(clientKey, 'Article', articleSchema, 'articles');
}

/**
 * Sync all blogs and articles from Shopify
 */
async function syncAllBlogs(shopDomain, clientKey = null) {
  try {
    console.log(`🔄 Starting blog sync for ${shopDomain}`);
    
    // Get clientKey if not provided
    if (!clientKey) {
      clientKey = await getClientKeyFromShopDomain(shopDomain);
      if (!clientKey) {
        throw new Error(`No client found for shop: ${shopDomain}`);
      }
    }
    
    const shop = await Shop.findOne({ shopDomain });
    if (!shop) {
      throw new Error(`Shop not found: ${shopDomain}`);
    }

    const Blog = await getBlogModel(clientKey);
    const Article = await getArticleModel(clientKey);

    const shopifyAPI = new ShopifyAPI(shopDomain, shop.accessToken);
    const blogs = await shopifyAPI.getAllBlogs();
    
    console.log(`📝 Found ${blogs.length} blogs → saving to ${clientKey} database`);
    
    // Save blogs
    for (const blog of blogs) {
      await Blog.findOneAndUpdate(
        { shopDomain, blogId: blog.id.toString() },
        {
          shopDomain,
          blogId: blog.id.toString(),
          title: blog.title,
          handle: blog.handle,
          commentable: blog.commentable,
          feedburner: blog.feedburner,
          feedburner_location: blog.feedburner_location,
          created_at: blog.created_at,
          updated_at: blog.updated_at,
          tags: blog.tags,
          template_suffix: blog.template_suffix,
          admin_graphql_api_id: blog.admin_graphql_api_id,
        },
        { upsert: true, new: true }
      );
    }
    
    // Sync articles for each blog
    let totalArticles = 0;
    for (const blog of blogs) {
      const articles = await shopifyAPI.getBlogArticles(blog.id);
      console.log(`📄 Blog "${blog.title}": ${articles.length} articles`);
      
      for (const article of articles) {
        await Article.findOneAndUpdate(
          { shopDomain, articleId: article.id.toString() },
          {
            shopDomain,
            articleId: article.id.toString(),
            blogId: blog.id.toString(),
            blogHandle: blog.handle,
            blogTitle: blog.title,
            title: article.title,
            handle: article.handle,
            author: article.author,
            body_html: article.body_html,
            summary_html: article.summary_html,
            published_at: article.published_at,
            created_at: article.created_at,
            updated_at: article.updated_at,
            tags: article.tags,
            image: article.image,
            admin_graphql_api_id: article.admin_graphql_api_id,
          },
          { upsert: true, new: true }
        );
      }
      
      totalArticles += articles.length;
    }
    
    console.log(`✅ Synced ${blogs.length} blogs and ${totalArticles} articles`);
    
    return {
      blogsCount: blogs.length,
      articlesCount: totalArticles,
    };
  } catch (error) {
    console.error(`❌ Error syncing blogs:`, error);
    throw error;
  }
}

module.exports = {
  syncAllBlogs,
  getBlogModel,
  getArticleModel,
};
