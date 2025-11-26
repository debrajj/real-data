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
   * Convert shopify:// URL to CDN URL or proper Shopify URL
   */
  convertUrl(url) {
    if (!url || typeof url !== 'string') return url;
    
    // Check if we have a mapping
    if (this.mediaMap && this.mediaMap.has(url)) {
      return this.mediaMap.get(url);
    }
    
    // Handle collection URLs
    if (url.startsWith('shopify://collections/')) {
      const handle = url.replace('shopify://collections/', '');
      return `https://${this.shopDomain}/collections/${handle}`;
    }
    
    // Handle product URLs
    if (url.startsWith('shopify://products/')) {
      const handle = url.replace('shopify://products/', '');
      return `https://${this.shopDomain}/products/${handle}`;
    }
    
    // Handle page URLs
    if (url.startsWith('shopify://pages/')) {
      const handle = url.replace('shopify://pages/', '');
      return `https://${this.shopDomain}/pages/${handle}`;
    }
    
    // Handle blog URLs
    if (url.startsWith('shopify://blogs/')) {
      const path = url.replace('shopify://blogs/', '');
      return `https://${this.shopDomain}/blogs/${path}`;
    }
    
    // Fallback conversion for shopify:// image URLs
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
      } else if (typeof value === 'string' && key === 'collection' && value && !value.startsWith('http')) {
        // Convert collection handle to URL and add collection data placeholder
        result[key] = value;
        result[`${key}_url`] = `https://${this.shopDomain}/collections/${value}`;
        result[`${key}_handle`] = value; // Keep handle for reference
      } else if (typeof value === 'string' && key === 'product' && value && !value.startsWith('http')) {
        // Convert product handle to URL and add product data placeholder
        result[key] = value;
        result[`${key}_url`] = `https://${this.shopDomain}/products/${value}`;
        result[`${key}_handle`] = value; // Keep handle for reference
      } else if (typeof value === 'object') {
        result[key] = this.replaceUrlsInObject(value);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  /**
   * Enrich theme data with collection and product information
   */
  async enrichWithCollectionData(obj, collectionsMap, productsMap) {
    if (!obj || typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
      return Promise.all(obj.map(item => this.enrichWithCollectionData(item, collectionsMap, productsMap)));
    }
    
    const result = { ...obj };
    
    // If this object has a collection handle, add collection data
    if (result.collection && typeof result.collection === 'string' && collectionsMap.has(result.collection)) {
      const collectionData = collectionsMap.get(result.collection);
      result.collection_data = {
        title: collectionData.title,
        handle: collectionData.handle,
        image: collectionData.image,
        url: `https://${this.shopDomain}/collections/${collectionData.handle}`,
      };
    }
    
    // If this object has a product handle, add product data
    if (result.product && typeof result.product === 'string' && productsMap.has(result.product)) {
      const productData = productsMap.get(result.product);
      result.product_data = {
        title: productData.title,
        handle: productData.handle,
        image: productData.image,
        url: `https://${this.shopDomain}/products/${productData.handle}`,
      };
    }
    
    // Recursively process nested objects
    for (const [key, value] of Object.entries(result)) {
      if (typeof value === 'object' && value !== null) {
        result[key] = await this.enrichWithCollectionData(value, collectionsMap, productsMap);
      }
    }
    
    return result;
  }

  /**
   * Replace all URLs in theme data and enrich with collection/product data
   */
  async replaceUrls(themeData) {
    // Load media mappings if not already loaded
    if (!this.mediaMap) {
      await this.loadMediaMap();
    }
    
    // Deep clone and replace URLs
    let replaced = this.replaceUrlsInObject(JSON.parse(JSON.stringify(themeData)));
    
    // Load collections and products for enrichment
    try {
      const Collection = require('../models/Collection');
      const Product = require('../models/Product');
      
      const collections = await Collection.find({ shopDomain: this.shopDomain })
        .select('title handle image')
        .lean();
      
      const products = await Product.find({ shopDomain: this.shopDomain })
        .select('title handle image')
        .lean();
      
      // Create maps for quick lookup
      const collectionsMap = new Map(collections.map(c => [c.handle, c]));
      const productsMap = new Map(products.map(p => [p.handle, p]));
      
      // Enrich with collection and product data
      replaced = await this.enrichWithCollectionData(replaced, collectionsMap, productsMap);
      
      console.log(`📋 Enriched with ${collectionsMap.size} collections and ${productsMap.size} products`);
    } catch (error) {
      console.warn('⚠️ Could not enrich with collection/product data:', error.message);
    }
    
    return replaced;
  }
}

module.exports = UrlReplacer;
