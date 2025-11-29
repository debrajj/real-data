const Discount = require('../models/Discount');
const ShopifyAPI = require('./shopifyAPI');

// Helper to get Shopify API instance
function getShopifyAPI(shopDomain) {
  return new ShopifyAPI(
    shopDomain || process.env.SHOPIFY_SHOP_DOMAIN,
    process.env.SHOPIFY_ACCESS_TOKEN
  );
}

/**
 * Create a BOGO discount
 */
async function createBOGODiscount(shopDomain, discountData) {
  try {
    const {
      code,
      title,
      description,
      method = 'CODE',
      bogoSettings = {},
      applicableProducts = [],
      applicableCollections = [],
      minimumRequirement = 'NONE',
      minimumPurchaseAmount,
      minimumQuantity,
      customerEligibility = 'ALL',
      customerSegments = [],
      specificCustomers = [],
      usageLimit,
      oncePerCustomer = false,
      combinations = {},
      salesChannels = ['online_store'],
      startsAt,
      startTime,
      endsAt,
      endTime,
      createInShopify = true,
    } = discountData;

    const {
      buyQuantity = 1,
      getQuantity = 1,
      getDiscount = 100,
      discountType = 'FREE',
      maxUsesPerOrder,
      applyToAll = false,
    } = bogoSettings;

    let shopifyPriceRuleId = null;
    let shopifyDiscountCodeId = null;

    // Create in Shopify first
    if (createInShopify) {
      try {
        const shopifyAPI = getShopifyAPI(shopDomain);
        const productIds = applicableProducts.map(p => p.productId).filter(id => id);
        const shouldApplyToAll = applyToAll || productIds.length === 0;

        const shopifyResult = await shopifyAPI.createPriceRule({
          code: code.toUpperCase(),
          title: title,
          value: getDiscount,
          valueType: 'percentage',
          targetType: 'line_item',
          targetSelection: shouldApplyToAll ? 'all' : 'entitled',
          allocationMethod: 'across',
          entitledProductIds: shouldApplyToAll ? [] : productIds,
          startsAt: startsAt,
          endsAt: endsAt,
          usageLimit: usageLimit,
          oncePerCustomer: oncePerCustomer
        });

        shopifyPriceRuleId = shopifyResult.priceRule.id;
        shopifyDiscountCodeId = shopifyResult.discountCode.id;

        console.log(`✅ BOGO discount created in Shopify: ${code} (Price Rule ID: ${shopifyPriceRuleId})`);
      } catch (shopifyError) {
        console.error('⚠️ Could not create in Shopify:', shopifyError.message);
        console.log('💾 Saving to database only...');
      }
    }

    // Create discount in database
    const discount = new Discount({
      shopDomain,
      code: code.toUpperCase(),
      type: 'BOGO',
      title,
      description,
      method,
      bogoSettings: {
        buyQuantity,
        getQuantity,
        getDiscount,
        discountType,
        applicableProducts,
        applicableCollections,
        applyToAll,
        maxUsesPerOrder,
      },
      minimumRequirement,
      minimumPurchaseAmount,
      minimumQuantity,
      customerEligibility,
      customerSegments,
      specificCustomers,
      usageLimit,
      oncePerCustomer,
      combinations: {
        productDiscounts: combinations.productDiscounts || false,
        orderDiscounts: combinations.orderDiscounts || false,
        shippingDiscounts: combinations.shippingDiscounts || false,
      },
      salesChannels,
      startsAt: startsAt ? new Date(startsAt) : undefined,
      startTime,
      endsAt: endsAt ? new Date(endsAt) : undefined,
      endTime,
      active: true,
      shopifyPriceRuleId: shopifyPriceRuleId ? shopifyPriceRuleId.toString() : undefined,
      shopifyDiscountCodeId: shopifyDiscountCodeId ? shopifyDiscountCodeId.toString() : undefined,
    });

    await discount.save();
    console.log(`✅ BOGO discount saved to database: ${code}`);

    return discount;
  } catch (error) {
    console.error('❌ Error creating BOGO discount:', error);
    throw error;
  }
}

/**
 * Get discount by code
 */
async function getDiscountByCode(shopDomain, code) {
  try {
    const discount = await Discount.findOne({
      shopDomain,
      code: code.toUpperCase(),
    });

    if (!discount) {
      return null;
    }

    // Check if discount is valid
    if (!discount.isValid()) {
      return null;
    }

    return discount;
  } catch (error) {
    console.error('❌ Error fetching discount:', error);
    throw error;
  }
}

/**
 * Apply discount to cart
 */
async function applyDiscountToCart(shopDomain, code, cartItems) {
  try {
    const discount = await getDiscountByCode(shopDomain, code);

    if (!discount) {
      return {
        success: false,
        error: 'Invalid or expired discount code',
      };
    }

    // Check minimum requirements
    const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    if (discount.minimumPurchaseAmount && cartTotal < discount.minimumPurchaseAmount) {
      return {
        success: false,
        error: `Minimum purchase amount of $${discount.minimumPurchaseAmount} required`,
      };
    }

    if (discount.minimumQuantity && cartQuantity < discount.minimumQuantity) {
      return {
        success: false,
        error: `Minimum ${discount.minimumQuantity} items required`,
      };
    }

    // Apply discount based on type
    let result;
    switch (discount.type) {
      case 'BOGO':
        result = discount.applyToCart(cartItems);
        break;
      case 'PERCENTAGE':
        result = {
          discountAmount: cartTotal * (discount.value / 100),
          message: `${discount.value}% off`,
        };
        break;
      case 'FIXED_AMOUNT':
        result = {
          discountAmount: Math.min(discount.value, cartTotal),
          message: `$${discount.value} off`,
        };
        break;
      case 'FREE_SHIPPING':
        result = {
          discountAmount: 0,
          freeShipping: true,
          message: 'Free shipping',
        };
        break;
      default:
        throw new Error('Unknown discount type');
    }

    return {
      success: true,
      discount: {
        code: discount.code,
        title: discount.title,
        type: discount.type,
        ...result,
      },
    };
  } catch (error) {
    console.error('❌ Error applying discount:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Increment discount usage
 */
async function incrementDiscountUsage(shopDomain, code) {
  try {
    await Discount.findOneAndUpdate(
      { shopDomain, code: code.toUpperCase() },
      { $inc: { usageCount: 1 } }
    );
  } catch (error) {
    console.error('❌ Error incrementing discount usage:', error);
  }
}

/**
 * Get all active discounts
 */
async function getActiveDiscounts(shopDomain) {
  try {
    const now = new Date();
    const discounts = await Discount.find({
      shopDomain,
      active: true,
      $or: [
        { startsAt: { $lte: now }, endsAt: { $gte: now } },
        { startsAt: { $lte: now }, endsAt: null },
        { startsAt: null, endsAt: { $gte: now } },
        { startsAt: null, endsAt: null },
      ],
    }).select('-__v');

    return discounts.filter(d => d.isValid());
  } catch (error) {
    console.error('❌ Error fetching active discounts:', error);
    throw error;
  }
}

/**
 * Update discount
 */
async function updateDiscount(shopDomain, code, updates) {
  try {
    const discount = await Discount.findOneAndUpdate(
      { shopDomain, code: code.toUpperCase() },
      { $set: updates },
      { new: true }
    );

    if (!discount) {
      throw new Error('Discount not found');
    }

    console.log(`✅ Discount updated: ${code}`);
    return discount;
  } catch (error) {
    console.error('❌ Error updating discount:', error);
    throw error;
  }
}

/**
 * Delete discount
 */
async function deleteDiscount(shopDomain, code) {
  try {
    const discount = await Discount.findOneAndDelete({
      shopDomain,
      code: code.toUpperCase(),
    });

    if (!discount) {
      throw new Error('Discount not found');
    }

    console.log(`✅ Discount deleted: ${code}`);
    return discount;
  } catch (error) {
    console.error('❌ Error deleting discount:', error);
    throw error;
  }
}

/**
 * Create a general discount (percentage, fixed amount, free shipping)
 */
async function createGeneralDiscount(shopDomain, discountData) {
  try {
    const {
      code,
      title,
      description,
      method = 'CODE',
      type, // 'PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'
      value,
      valueType = 'percentage',
      appliesTo = 'ALL',
      applicableProducts = [],
      applicableCollections = [],
      minimumRequirement = 'NONE',
      minimumPurchaseAmount,
      minimumQuantity,
      customerEligibility = 'ALL',
      customerSegments = [],
      specificCustomers = [],
      usageLimit,
      oncePerCustomer = false,
      combinations = {},
      salesChannels = ['online_store'],
      startsAt,
      startTime,
      endsAt,
      endTime,
      createInShopify = true,
    } = discountData;

    let shopifyPriceRuleId = null;
    let shopifyDiscountCodeId = null;

    // Create in Shopify first
    if (createInShopify) {
      try {
        const shopifyAPI = getShopifyAPI(shopDomain);
        const productIds = applicableProducts.map(p => p.productId).filter(id => id);
        const shouldApplyToAll = appliesTo === 'ALL' || productIds.length === 0;

        const shopifyResult = await shopifyAPI.createPriceRule({
          code: code.toUpperCase(),
          title: title,
          value: type === 'FREE_SHIPPING' ? 0 : parseFloat(value),
          valueType: type === 'FREE_SHIPPING' ? 'percentage' : valueType,
          targetType: type === 'FREE_SHIPPING' ? 'shipping_line' : 'line_item',
          targetSelection: shouldApplyToAll ? 'all' : 'entitled',
          allocationMethod: 'across',
          entitledProductIds: shouldApplyToAll ? [] : productIds,
          startsAt: startsAt,
          endsAt: endsAt,
          usageLimit: usageLimit,
          oncePerCustomer: oncePerCustomer,
          salesChannels: salesChannels
        });

        shopifyPriceRuleId = shopifyResult.priceRule.id;
        shopifyDiscountCodeId = shopifyResult.discountCode.id;

        console.log(`✅ Discount created in Shopify: ${code} (Price Rule ID: ${shopifyPriceRuleId})`);
      } catch (shopifyError) {
        console.error('⚠️ Could not create in Shopify:', shopifyError.message);
        console.log('💾 Saving to database only...');
      }
    }

    // Create discount in database
    const discount = new Discount({
      shopDomain,
      code: code.toUpperCase(),
      type: type,
      title,
      description,
      method,
      value: type === 'FREE_SHIPPING' ? 0 : parseFloat(value),
      valueType,
      appliesTo,
      applicableProducts: applicableProducts.map(p => ({ productId: p.productId || p })),
      applicableCollections,
      minimumRequirement,
      minimumPurchaseAmount,
      minimumQuantity,
      customerEligibility,
      customerSegments,
      specificCustomers,
      usageLimit,
      oncePerCustomer,
      combinations: {
        productDiscounts: combinations.productDiscounts || false,
        orderDiscounts: combinations.orderDiscounts || false,
        shippingDiscounts: combinations.shippingDiscounts || false,
      },
      salesChannels,
      startsAt: startsAt ? new Date(startsAt) : undefined,
      startTime,
      endsAt: endsAt ? new Date(endsAt) : undefined,
      endTime,
      active: true,
      shopifyPriceRuleId: shopifyPriceRuleId ? shopifyPriceRuleId.toString() : undefined,
      shopifyDiscountCodeId: shopifyDiscountCodeId ? shopifyDiscountCodeId.toString() : undefined,
    });

    await discount.save();
    console.log(`✅ Discount saved to database: ${code}`);

    return discount;
  } catch (error) {
    console.error('❌ Error creating general discount:', error);
    throw error;
  }
}

module.exports = {
  createBOGODiscount,
  createGeneralDiscount,
  getDiscountByCode,
  applyDiscountToCart,
  incrementDiscountUsage,
  getActiveDiscounts,
  updateDiscount,
  deleteDiscount,
};