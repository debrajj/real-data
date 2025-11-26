const express = require('express');
const router = express.Router();
const { Blog, Article } = require('../models/Blog');

/**
 * GET /api/blogs/:shopDomain
 * Get all blogs for a shop
 */
router.get('/:shopDomain', async (req, res) => {
  try {
    const { shopDomain } = req.params;

    const blogs = await Blog.find({ shopDomain })
      .sort({ created_at: -1 })
      .lean();

    res.json({
      success: true,
      count: blogs.length,
      blogs,
    });
  } catch (error) {
    console.error('❌ Error fetching blogs:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/blogs/:shopDomain/articles
 * Get all articles for a shop
 */
router.get('/:shopDomain/articles', async (req, res) => {
  try {
    const { shopDomain } = req.params;
    const { blogHandle, limit } = req.query;

    const query = { shopDomain };
    if (blogHandle) {
      query.blogHandle = blogHandle;
    }

    const articles = await Article.find(query)
      .sort({ published_at: -1 })
      .limit(parseInt(limit) || 50)
      .lean();

    res.json({
      success: true,
      count: articles.length,
      articles,
    });
  } catch (error) {
    console.error('❌ Error fetching articles:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
