const express = require('express');
const router = express.Router();
const { syncProduct, syncAllProducts, getProducts, getProduct, getProductModel } = require('../services/productSync');

/**
 * GET /api/products/client/:clientKey
 * Get all products for a client by clientKey (no shopDomain needed)
 */
router.get('/client/:clientKey', async (req, res) => {
  try {
    const { clientKey } = req.params;
    const { status, product_type, vendor, limit } = req.query;

    const Product = await getProductModel(clientKey);
    
    const query = {};
    if (status) query.status = status;
    if (product_type) query.product_type = product_type;
    if (vendor) query.vendor = vendor;

    const products = await Product.find(query)
      .select('-rawData')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) || 50)
      .lean();

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error('❌ Error fetching products by clientKey:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/products
 * Get products with optional collection filter or specific IDs
 */
router.get('/', async (req, res) => {
  try {
    const shopDomain = req.query.shop || process.env.SHOPIFY_SHOP_DOMAIN || 'cmstestingg.myshopify.com';
    const { status, product_type, vendor, limit, collection, ids } = req.query;

    const options = {
      status,
      product_type,
      vendor,
      limit: parseInt(limit) || 250,
    };

    // If specific product IDs are provided, use them
    if (ids) {
      options.ids = ids.split(',').map(id => id.trim());
    }
    // Otherwise, if collection filter is provided, add it
    else if (collection) {
      options.collection = collection;
    }

    const products = await getProducts(shopDomain, options);

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/products/:shopDomain
 * Get all products for a shop
 */
router.get('/:shopDomain', async (req, res) => {
  try {
    const { shopDomain } = req.params;
    const { status, product_type, vendor, limit } = req.query;

    const products = await getProducts(shopDomain, {
      status,
      product_type,
      vendor,
      limit: parseInt(limit) || 250,
    });

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/products/:shopDomain/:productId
 * Get single product
 */
router.get('/:shopDomain/:productId', async (req, res) => {
  try {
    const { shopDomain, productId } = req.params;

    const product = await getProduct(shopDomain, productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('❌ Error fetching product:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/products/:shopDomain/sync
 * Sync all products from Shopify
 */
router.post('/:shopDomain/sync', async (req, res) => {
  try {
    const { shopDomain } = req.params;

    // Start sync asynchronously
    syncAllProducts(shopDomain).catch(error => {
      console.error('❌ Error in background product sync:', error);
    });

    res.json({
      success: true,
      message: 'Product sync started',
    });
  } catch (error) {
    console.error('❌ Error starting product sync:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/products/:shopDomain/:productId/sync
 * Sync single product from Shopify
 */
router.post('/:shopDomain/:productId/sync', async (req, res) => {
  try {
    const { shopDomain, productId } = req.params;

    const product = await syncProduct(shopDomain, productId);

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('❌ Error syncing product:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;

/**
 * GET /api/collections/:shopDomain
 * Get all collections for a shop
 */
router.get('/collections/:shopDomain', async (req, res) => {
  try {
    const { shopDomain } = req.params;
    const ShopifyAPI = require('../services/shopifyAPI');
    
    const shopifyAPI = new ShopifyAPI(
      shopDomain,
      process.env.SHOPIFY_ACCESS_TOKEN
    );

    const collections = await shopifyAPI.getCollections();

    res.json({
      success: true,
      count: collections.length,
      collections,
    });
  } catch (error) {
    console.error('❌ Error fetching collections:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
