/**
 * Image URL fixer for production issues
 */

/**
 * Fix Shopify CDN image URLs for production
 */
const fixImageUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  
  // Handle Shopify CDN URLs
  if (url.includes('cdn.shopify.com')) {
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
const fixImageUrlsInData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(item => fixImageUrlsInData(item));
  }
  
  const result = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' && (
      key.includes('image') || 
      key.includes('logo') || 
      key.includes('banner') ||
      key.includes('photo') ||
      key.includes('picture') ||
      value.includes('cdn.shopify.com')
    )) {
      result[key] = fixImageUrl(value);
    } else if (typeof value === 'object') {
      result[key] = fixImageUrlsInData(value);
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