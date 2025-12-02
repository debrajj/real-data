const { fixImageUrlsInData } = require('../utils/imageUrlFixer');

/**
 * Middleware to fix image URLs in API responses
 */
const imageHandler = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    // Only process successful responses with data
    if (data && data.success && data.data) {
      data.data = fixImageUrlsInData(data.data);
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

module.exports = imageHandler;