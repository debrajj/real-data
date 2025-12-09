const axios = require('axios');
const path = require('path');
const { getStoreModel, getClientKeyFromShopDomain } = require('../config/database');
const { mediaSchema, productSchema, collectionSchema } = require('../models/schemas');

class MediaService {
  constructor(shopDomain, clientKey = null) {
    this.shopDomain = shopDomain;
    this.clientKey = clientKey;
  }

  /**
   * Get Media model for the store database
   */
  async getMediaModel() {
    if (!this.clientKey) {
      this.clientKey = await getClientKeyFromShopDomain(this.shopDomain);
      if (!this.clientKey) {
        throw new Error(`No client found for shop: ${this.shopDomain}`);
      }
    }
    return getStoreModel(this.clientKey, 'Media', mediaSchema, 'media');
  }

  /**
   * Get Product model for the store database
   */
  async getProductModel() {
    if (!this.clientKey) {
      this.clientKey = await getClientKeyFromShopDomain(this.shopDomain);
    }
    return getStoreModel(this.clientKey, 'Product', productSchema, 'products');
  }

  /**
   * Get Collection model for the store database
   */
  async getCollectionModel() {
    if (!this.clientKey) {
      this.clientKey = await getClientKeyFromShopDomain(this.shopDomain);
    }
    return getStoreModel(this.clientKey, 'Collection', collectionSchema, 'collections');
  }

  /**
   * Convert shopify:// URL to CDN URL
   */
  convertShopifyUrl(url) {
    if (url.startsWith('shopify://shop_images/')) {
      const filename = url.replace('shopify://shop_images/', '');
      return `https://${this.shopDomain}/cdn/shop/files/${filename}`;
    }
    return url;
  }

  /**
   * Download and store image from URL
   */
  async downloadAndStore(imageUrl, metadata = {}) {
    try {
      const Media = await this.getMediaModel();
      
      // Convert shopify:// URLs to CDN URLs
      const cdnUrl = this.convertShopifyUrl(imageUrl);
      
      // Check if already exists (by CDN URL)
      const existing = await Media.findOne({
        shopDomain: this.shopDomain,
        cdnUrl: cdnUrl,
      });

      if (existing) {
        console.log(`✅ Image already stored: ${cdnUrl}`);
        return existing;
      }

      console.log(`📥 Downloading image: ${cdnUrl}`);
      
      // Download image
      const response = await axios.get(cdnUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });

      const buffer = Buffer.from(response.data);
      const contentType = response.headers['content-type'] || 'image/jpeg';
      const filename = this.extractFilename(cdnUrl);

      // Create media document - store CDN URL as both originalUrl and cdnUrl
      const media = new Media({
        shopDomain: this.shopDomain,
        originalUrl: imageUrl, // Keep the shopify:// URL for reference
        cdnUrl: cdnUrl, // Store the actual CDN URL
        filename,
        contentType,
        size: buffer.length,
        data: buffer,
        width: metadata.width,
        height: metadata.height,
        alt: metadata.alt,
        usedIn: metadata.usedIn ? [metadata.usedIn] : [],
      });

      await media.save();
      console.log(`✅ Image stored: ${filename} (${this.formatBytes(buffer.length)})`);
      
      return media;
    } catch (error) {
      console.error(`❌ Failed to download image ${imageUrl}:`, error.message);
      return null;
    }
  }

  /**
   * Extract all image URLs from theme data
   */
  extractImageUrls(themeData) {
    const imageUrls = new Set();
    const imageMetadata = {};

    // Extract from components
    if (themeData.components) {
      themeData.components.forEach(component => {
        this.extractFromObject(component, imageUrls, imageMetadata, {
          themeId: themeData.themeId,
          sectionId: component.id,
        });
      });
    }

    // Extract from pages
    if (themeData.pages) {
      Object.entries(themeData.pages).forEach(([pageName, pageData]) => {
        if (pageData.components) {
          pageData.components.forEach(component => {
            this.extractFromObject(component, imageUrls, imageMetadata, {
              themeId: themeData.themeId,
              sectionId: component.id,
              page: pageName,
            });
          });
        }
      });
    }

    // Extract from raw data
    if (themeData.rawData) {
      this.extractFromObject(themeData.rawData, imageUrls, imageMetadata, {
        themeId: themeData.themeId,
      });
    }

    return { urls: Array.from(imageUrls), metadata: imageMetadata };
  }

  /**
   * Recursively extract image URLs from object
   */
  extractFromObject(obj, urlSet, metadata, context) {
    if (!obj || typeof obj !== 'object') return;

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Check if it's an image URL
        if (this.isImageUrl(value)) {
          urlSet.add(value);
          if (!metadata[value]) {
            metadata[value] = {
              usedIn: context,
              alt: obj.alt || obj.image_alt || '',
            };
          }
        }
      } else if (typeof value === 'object') {
        this.extractFromObject(value, urlSet, metadata, context);
      }
    }
  }

  /**
   * Check if URL is an image or video
   */
  isImageUrl(url) {
    if (typeof url !== 'string') return false;
    
    // Check for Shopify internal URLs
    if (url.startsWith('shopify://shop_images/') || url.startsWith('shopify://shop_videos/')) {
      return true;
    }
    
    // Check for Shopify CDN URLs
    if (url.includes('cdn.shopify.com') || url.includes('.myshopify.com/cdn/')) {
      return true;
    }

    // Check for common image and video extensions
    const mediaExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.mp4', '.webm', '.mov', '.avi'];
    return mediaExtensions.some(ext => url.toLowerCase().includes(ext));
  }

  /**
   * Extract filename from URL
   */
  extractFilename(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = path.basename(pathname);
      return filename || 'image.jpg';
    } catch {
      return 'image.jpg';
    }
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Download all images from theme data
   */
  async downloadAllImages(themeData) {
    const { urls, metadata } = this.extractImageUrls(themeData);
    console.log(`📸 Found ${urls.length} images to download`);

    const results = {
      total: urls.length,
      success: 0,
      failed: 0,
      skipped: 0,
      images: [],
    };

    for (const url of urls) {
      const meta = metadata[url] || {};
      const media = await this.downloadAndStore(url, meta);
      
      if (media) {
        if (media.createdAt === media.updatedAt) {
          results.success++;
        } else {
          results.skipped++;
        }
        results.images.push({
          id: media._id,
          filename: media.filename,
          originalUrl: media.originalUrl,
          size: media.size,
        });
      } else {
        results.failed++;
      }
    }

    console.log(`📊 Download complete: ${results.success} new, ${results.skipped} existing, ${results.failed} failed`);
    return results;
  }

  /**
   * Get all media for shop as JSON
   */
  async getAllMedia(options = {}) {
    const Media = await this.getMediaModel();
    const query = { shopDomain: this.shopDomain };
    
    const media = await Media.find(query)
      .select('-data') // Exclude binary data
      .sort({ createdAt: -1 })
      .limit(options.limit || 100);

    return media.map(m => ({
      id: m._id,
      filename: m.filename,
      originalUrl: m.originalUrl,
      cdnUrl: m.cdnUrl, // Include CDN URL in JSON
      contentType: m.contentType,
      size: m.size,
      width: m.width,
      height: m.height,
      alt: m.alt,
      usedIn: m.usedIn,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));
  }

  /**
   * Get media by ID with binary data
   */
  async getMediaById(mediaId) {
    const Media = await this.getMediaModel();
    return await Media.findById(mediaId);
  }

  /**
   * Download all product images
   */
  async downloadProductImages() {
    try {
      const Product = await this.getProductModel();
      const products = await Product.find({ shopDomain: this.shopDomain }).lean();
      
      console.log(`📦 Processing ${products.length} products for images`);
      
      const results = { success: 0, failed: 0, skipped: 0 };
      
      for (const product of products) {
        // Download main product image
        if (product.image && product.image.src) {
          const media = await this.downloadAndStore(product.image.src, {
            alt: product.image.alt || product.title,
            width: product.image.width,
            height: product.image.height,
            usedIn: { type: 'product', id: product.productId, title: product.title },
          });
          
          if (media) {
            media.createdAt === media.updatedAt ? results.success++ : results.skipped++;
          } else {
            results.failed++;
          }
        }
        
        // Download all product images
        if (product.images && Array.isArray(product.images)) {
          for (const img of product.images) {
            if (img.src) {
              const media = await this.downloadAndStore(img.src, {
                alt: img.alt || product.title,
                width: img.width,
                height: img.height,
                usedIn: { type: 'product', id: product.productId, title: product.title },
              });
              
              if (media) {
                media.createdAt === media.updatedAt ? results.success++ : results.skipped++;
              } else {
                results.failed++;
              }
            }
          }
        }
      }
      
      console.log(`📸 Product images: ${results.success} new, ${results.skipped} existing, ${results.failed} failed`);
      return results;
    } catch (error) {
      console.error('❌ Error downloading product images:', error);
      throw error;
    }
  }

  /**
   * Download all collection images
   */
  async downloadCollectionImages() {
    try {
      const Collection = await this.getCollectionModel();
      const collections = await Collection.find({ shopDomain: this.shopDomain }).lean();
      
      console.log(`📚 Processing ${collections.length} collections for images`);
      
      const results = { success: 0, failed: 0, skipped: 0 };
      
      for (const collection of collections) {
        if (collection.image && collection.image.src) {
          const media = await this.downloadAndStore(collection.image.src, {
            alt: collection.image.alt || collection.title,
            width: collection.image.width,
            height: collection.image.height,
            usedIn: { type: 'collection', id: collection.collectionId, title: collection.title },
          });
          
          if (media) {
            media.createdAt === media.updatedAt ? results.success++ : results.skipped++;
          } else {
            results.failed++;
          }
        }
      }
      
      console.log(`📸 Collection images: ${results.success} new, ${results.skipped} existing, ${results.failed} failed`);
      return results;
    } catch (error) {
      console.error('❌ Error downloading collection images:', error);
      throw error;
    }
  }
}

module.exports = MediaService;
