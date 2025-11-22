const Media = require('../models/Media');

/**
 * Replace shopify:// URLs with CDN URLs in theme data
 */
class UrlReplacer {
  constructor(shopDomain) {
    this.shopDomain = shopDomain;
    this.mediaMap = null;
  }

  /**
   * Load media mapping from database
   */
  async loadMediaMap() {
    const media = await Media.find({ shopDomain: this.shopDomain })
      .select('originalUrl cdnUrl')
      .lean();
    
    this.mediaMap = new Map();
    media.forEach(m => {
      this.mediaMap.set(m.originalUrl, m.cdnUrl);
    });
    
    console.log(`📋 Loaded ${this.mediaMap.size} media URL mappings`);
  }

  /**
   * Convert shopify:// URL to CDN URL
   */
  convertUrl(url) {
    if (!url || typeof url !== 'string') return url;
    
    // Check if we have a mapping
    if (this.mediaMap && this.mediaMap.has(url)) {
      return this.mediaMap.get(url);
    }
    
    // Fallback conversion for shopify:// URLs
    if (url.startsWith('shopify://shop_images/')) {
      const filename = url.replace('shopify://shop_images/', '');
      return `https://${this.shopDomain}/cdn/shop/files/${filename}`;
    }
    
    if (url.startsWith('shopify://files/videos/')) {
      const filename = url.replace('shopify://files/videos/', '');
      return `https://${this.shopDomain}/cdn/shop/files/${filename}`;
    }
    
    if (url.startsWith('shopify://files/')) {
      const filename = url.replace('shopify://files/', '');
      return `https://${this.shopDomain}/cdn/shop/files/${filename}`;
    }
    
    return url;
  }

  /**
   * Recursively replace URLs in an object
   */
  replaceUrlsInObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.replaceUrlsInObject(item));
    }
    
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && (value.startsWith('shopify://') || value.includes('cdn.shopify.com'))) {
        result[key] = this.convertUrl(value);
      } else if (typeof value === 'object') {
        result[key] = this.replaceUrlsInObject(value);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  /**
   * Replace all URLs in theme data
   */
  async replaceUrls(themeData) {
    // Load media mappings if not already loaded
    if (!this.mediaMap) {
      await this.loadMediaMap();
    }
    
    // Deep clone and replace URLs
    const replaced = this.replaceUrlsInObject(JSON.parse(JSON.stringify(themeData)));
    
    return replaced;
  }
}

module.exports = UrlReplacer;
