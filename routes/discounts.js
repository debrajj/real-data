const express = require('express');
const router = express.Router();
const {
  createBOGODiscount,
  getDiscountByCode,
  applyDiscountToCart,
  incrementDiscountUsage,
  getActiveDiscounts,
  updateDiscount,
  deleteDiscount,
} = require('../services/discountService');

// Get all active discounts
router.get('/', async (req, res) => {
  try {
    const shopDomain = req.query.shop || process.env.SHOPIFY_SHOP_DOMAIN;
    const discounts = await getActiveDiscounts(shopDomain);
    
    res.json({
      success: true,
      count: discounts.length,
      discounts,
    });
  } catch (error) {
    console.error('❌ Error fetching discounts:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get discount by code
router.get('/:code', async (req, res) => {
  try {
    const shopDomain = req.query.shop || process.env.SHOPIFY_SHOP_DOMAIN;
    const { code } = req.params;
    
    const discount = await getDiscountByCode(shopDomain, code);
    
    if (!discount) {
      return res.status(404).json({
        success: false,
        error: 'Discount not found or expired',
      });
    }
    
    res.json({
      success: true,
      discount,
    });
  } catch (error) {
    console.error('❌ Error fetching discount:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Create BOGO discount
router.post('/bogo', express.json(), async (req, res) => {
  try {
    const shopDomain = req.body.shop || process.env.SHOPIFY_SHOP_DOMAIN;
    
    const discount = await createBOGODiscount(shopDomain, req.body);
    
    res.json({
      success: true,
      discount,
    });
  } catch (error) {
    console.error('❌ Error creating BOGO discount:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Create general discount (percentage, fixed amount, free shipping)
router.post('/create', express.json(), async (req, res) => {
  try {
    const shopDomain = req.body.shop || process.env.SHOPIFY_SHOP_DOMAIN;
    const { createGeneralDiscount } = require('../services/discountService');
    
    const discount = await createGeneralDiscount(shopDomain, req.body);
    
    res.json({
      success: true,
      discount,
    });
  } catch (error) {
    console.error('❌ Error creating discount:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Apply discount to cart
router.post('/apply', express.json(), async (req, res) => {
  try {
    const shopDomain = req.body.shop || process.env.SHOPIFY_SHOP_DOMAIN;
    const { code, cartItems } = req.body;
    
    if (!code || !cartItems) {
      return res.status(400).json({
        success: false,
        error: 'Code and cartItems are required',
      });
    }
    
    const result = await applyDiscountToCart(shopDomain, code, cartItems);
    
    res.json(result);
  } catch (error) {
    console.error('❌ Error applying discount:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Increment discount usage (called after successful checkout)
router.post('/:code/use', express.json(), async (req, res) => {
  try {
    const shopDomain = req.body.shop || process.env.SHOPIFY_SHOP_DOMAIN;
    const { code } = req.params;
    
    await incrementDiscountUsage(shopDomain, code);
    
    res.json({
      success: true,
      message: 'Discount usage incremented',
    });
  } catch (error) {
    console.error('❌ Error incrementing discount usage:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Update discount
router.put('/:code', express.json(), async (req, res) => {
  try {
    const shopDomain = req.body.shop || process.env.SHOPIFY_SHOP_DOMAIN;
    const { code } = req.params;
    
    const discount = await updateDiscount(shopDomain, code, req.body);
    
    res.json({
      success: true,
      discount,
    });
  } catch (error) {
    console.error('❌ Error updating discount:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete discount
router.delete('/:code', async (req, res) => {
  try {
    const shopDomain = req.query.shop || process.env.SHOPIFY_SHOP_DOMAIN;
    const { code } = req.params;
    
    await deleteDiscount(shopDomain, code);
    
    res.json({
      success: true,
      message: 'Discount deleted',
    });
  } catch (error) {
    console.error('❌ Error deleting discount:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;