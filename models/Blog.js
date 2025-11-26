const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  blogId: {
    type: String,
    required: true,
  },
  shopDomain: {
    type: String,
    required: true,
    index: true,
  },
  title: String,
  handle: String,
  commentable: String,
  feedburner: String,
  feedburner_location: String,
  created_at: Date,
  updated_at: Date,
  tags: String,
  template_suffix: String,
  admin_graphql_api_id: String,
}, {
  timestamps: true,
});

blogSchema.index({ shopDomain: 1, blogId: 1 }, { unique: true });

const articleSchema = new mongoose.Schema({
  articleId: {
    type: String,
    required: true,
  },
  shopDomain: {
    type: String,
    required: true,
    index: true,
  },
  blogId: String,
  blogHandle: String,
  blogTitle: String,
  title: String,
  handle: String,
  author: String,
  body_html: String,
  summary_html: String,
  published_at: Date,
  created_at: Date,
  updated_at: Date,
  tags: String,
  image: {
    src: String,
    alt: String,
    width: Number,
    height: Number,
  },
  admin_graphql_api_id: String,
}, {
  timestamps: true,
});

articleSchema.index({ shopDomain: 1, articleId: 1 }, { unique: true });

const Blog = mongoose.model('Blog', blogSchema);
const Article = mongoose.model('Article', articleSchema);

module.exports = { Blog, Article };
