/**
 * Image URL fixer for production issues
 */

/**
 * Fix Shopify CDN image URLs for production
 */
const fixImageUrl = (url, shopDomain = 'cmstestingg.myshopify.com') => {
  if (!url || typeof url !== 'string') return url;
  
  // Handle shopify:// URLs
  if (url.startsWith('shopify://shop_images/')) {
    const filename = url.replace('shopify://shop_images/', '');
    const shopName = shopDomain.split('.')[0];
    return `https://${shopName}.myshopify.com/cdn/shop/files/${filename}?v=${Math.floor(Date.now() / 1000)}`;
  }
  
  if (url.startsWith('shopify://files/')) {
    const filename = url.replace('shopify://files/', '');
    const shopName = shopDomain.split('.')[0];
    return `https://${shopName}.myshopify.com/cdn/shop/files/${filename}?v=${Math.floor(Date.now() / 1000)}`;
  }
  
  // Handle Shopify CDN URLs
  if (url.includes('cdn.shopify.com') || url.includes('.myshopify.com/cdn/')) {
    // Remove problematic query parameters
    let cleanUrl = url.split('?')[0];
    
    // Ensure HTTPS
    if (cleanUrl.startsWith('http://')) {
      cleanUrl = cleanUrl.replace('http://', 'https://');
    }
    
    // Add cache-busting parameter for production
    return `${cleanUrl}?v=${Math.floor(Date.now() / 1000)}`;
  }
  
  return url;
};

/**
 * Recursively fix image URLs in theme data
 */
const fixImageUrlsInData = (data, shopDomain = 'cmstestingg.myshopify.com') => {
  if (!data || typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(item => fixImageUrlsInData(item, shopDomain));
  }
  
  const result = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' && (
      key.includes('image') || 
      key.includes('logo') || 
      key.includes('banner') ||
      key.includes('photo') ||
      key.includes('picture') ||
      value.includes('cdn.shopify.com') ||
      value.startsWith('shopify://')
    )) {
      result[key] = fixImageUrl(value, shopDomain);
    } else if (typeof value === 'object') {
      result[key] = fixImageUrlsInData(value, shopDomain);
    } else {
      result[key] = value;
    }
  }
  
  return result;
};

module.exports = {
  fixImageUrl,
  fixImageUrlsInData
};