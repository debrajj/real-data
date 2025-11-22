const express = require('express');
const router = express.Router();
const { syncProduct, syncAllProducts, getProducts, getProduct } = require('../services/productSync');

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
