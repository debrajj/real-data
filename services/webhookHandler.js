const mongoose = require('mongoose');

/**
 * Webhook Event Handler
 * Processes all Shopify webhook events and stores them in MongoDB
 */

// Create a generic webhook event schema
const webhookEventSchema = new mongoose.Schema({
  shopDomain: {
    type: String,
    required: true,
    index: true,
  },
  topic: {
    type: String,
    required: true,
    index: true,
  },
  eventType: {
    type: String,
    required: true,
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  webhookId: {
    type: String,
  },
  apiVersion: {
    type: String,
  },
  processed: {
    type: Boolean,
    default: false,
  },
  processedAt: {
    type: Date,
  },
  error: {
    type: String,
  },
}, {
  timestamps: true,
});

webhookEventSchema.index({ shopDomain: 1, topic: 1, createdAt: -1 });
webhookEventSchema.index({ createdAt: -1 });

const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema);

/**
 * Webhook event handlers by topic
 */
const eventHandlers = {
  // Cart events
  'carts/create': async (shopDomain, payload) => {
    console.log(`🛒 Cart created: ${payload.id}`);
    return { action: 'cart_created', cartId: payload.id };
  },
  
  'carts/update': async (shopDomain, payload) => {
    console.log(`🛒 Cart updated: ${payload.id}`);
    return { action: 'cart_updated', cartId: payload.id };
  },

  // Checkout events
  'checkouts/create': async (shopDomain, payload) => {
    console.log(`💳 Checkout created: ${payload.id}`);
    return { action: 'checkout_created', checkoutId: payload.id };
  },

  'checkouts/update': async (shopDomain, payload) => {
    console.log(`💳 Checkout updated: ${payload.id}`);
    return { action: 'checkout_updated', checkoutId: payload.id };
  },

  'checkouts/delete': async (shopDomain, payload) => {
    console.log(`💳 Checkout deleted: ${payload.id}`);
    return { action: 'checkout_deleted', checkoutId: payload.id };
  },

  // Collection events
  'collections/create': async (shopDomain, payload) => {
    console.log(`📚 Collection created: ${payload.id} - ${payload.title}`);
    return { action: 'collection_created', collectionId: payload.id };
  },

  'collections/update': async (shopDomain, payload) => {
    console.log(`📚 Collection updated: ${payload.id} - ${payload.title}`);
    return { action: 'collection_updated', collectionId: payload.id };
  },

  'collections/delete': async (shopDomain, payload) => {
    console.log(`📚 Collection deleted: ${payload.id}`);
    return { action: 'collection_deleted', collectionId: payload.id };
  },

  // Customer events
  'customers/create': async (shopDomain, payload) => {
    console.log(`👤 Customer created: ${payload.id} - ${payload.email}`);
    return { action: 'customer_created', customerId: payload.id };
  },

  'customers/update': async (shopDomain, payload) => {
    console.log(`👤 Customer updated: ${payload.id} - ${payload.email}`);
    return { action: 'customer_updated', customerId: payload.id };
  },

  'customers/delete': async (shopDomain, payload) => {
    console.log(`👤 Customer deleted: ${payload.id}`);
    return { action: 'customer_deleted', customerId: payload.id };
  },

  'customers/enable': async (shopDomain, payload) => {
    console.log(`👤 Customer enabled: ${payload.id}`);
    return { action: 'customer_enabled', customerId: payload.id };
  },

  'customers/disable': async (shopDomain, payload) => {
    console.log(`👤 Customer disabled: ${payload.id}`);
    return { action: 'customer_disabled', customerId: payload.id };
  },

  'customers_marketing_consent/update': async (shopDomain, payload) => {
    console.log(`📧 Customer marketing consent updated: ${payload.customer_id}`);
    return { action: 'customer_marketing_consent_updated', customerId: payload.customer_id };
  },

  // Order events
  'orders/create': async (shopDomain, payload) => {
    console.log(`📦 Order created: ${payload.id} - ${payload.order_number}`);
    return { action: 'order_created', orderId: payload.id, orderNumber: payload.order_number };
  },

  'orders/updated': async (shopDomain, payload) => {
    console.log(`📦 Order updated: ${payload.id} - ${payload.order_number}`);
    return { action: 'order_updated', orderId: payload.id };
  },

  'orders/delete': async (shopDomain, payload) => {
    console.log(`📦 Order deleted: ${payload.id}`);
    return { action: 'order_deleted', orderId: payload.id };
  },

  'orders/cancelled': async (shopDomain, payload) => {
    console.log(`📦 Order cancelled: ${payload.id} - ${payload.order_number}`);
    return { action: 'order_cancelled', orderId: payload.id };
  },

  'orders/fulfilled': async (shopDomain, payload) => {
    console.log(`📦 Order fulfilled: ${payload.id} - ${payload.order_number}`);
    return { action: 'order_fulfilled', orderId: payload.id };
  },

  'orders/paid': async (shopDomain, payload) => {
    console.log(`💰 Order paid: ${payload.id} - ${payload.order_number}`);
    return { action: 'order_paid', orderId: payload.id };
  },

  'orders/edited': async (shopDomain, payload) => {
    console.log(`📦 Order edited: ${payload.id}`);
    return { action: 'order_edited', orderId: payload.id };
  },

  // Product events
  'products/create': async (shopDomain, payload) => {
    console.log(`🏷️ Product created: ${payload.id} - ${payload.title}`);
    const { saveProduct } = require('./productSync');
    await saveProduct(shopDomain, payload);
    return { action: 'product_created', productId: payload.id };
  },

  'products/update': async (shopDomain, payload) => {
    console.log(`🏷️ Product updated: ${payload.id} - ${payload.title}`);
    const { saveProduct } = require('./productSync');
    await saveProduct(shopDomain, payload);
    return { action: 'product_updated', productId: payload.id };
  },

  'products/delete': async (shopDomain, payload) => {
    console.log(`🏷️ Product deleted: ${payload.id}`);
    const { deleteProduct } = require('./productSync');
    await deleteProduct(shopDomain, payload.id);
    return { action: 'product_deleted', productId: payload.id };
  },

  // Inventory events
  'inventory_levels/connect': async (shopDomain, payload) => {
    console.log(`📊 Inventory level connected: ${payload.inventory_item_id}`);
    return { action: 'inventory_connected', inventoryItemId: payload.inventory_item_id };
  },

  'inventory_levels/update': async (shopDomain, payload) => {
    console.log(`📊 Inventory level updated: ${payload.inventory_item_id}`);
    return { action: 'inventory_updated', inventoryItemId: payload.inventory_item_id };
  },

  'inventory_levels/disconnect': async (shopDomain, payload) => {
    console.log(`📊 Inventory level disconnected: ${payload.inventory_item_id}`);
    return { action: 'inventory_disconnected', inventoryItemId: payload.inventory_item_id };
  },

  // Fulfillment events
  'fulfillments/create': async (shopDomain, payload) => {
    console.log(`📮 Fulfillment created: ${payload.id}`);
    return { action: 'fulfillment_created', fulfillmentId: payload.id };
  },

  'fulfillments/update': async (shopDomain, payload) => {
    console.log(`📮 Fulfillment updated: ${payload.id}`);
    return { action: 'fulfillment_updated', fulfillmentId: payload.id };
  },

  // Refund events
  'refunds/create': async (shopDomain, payload) => {
    console.log(`💸 Refund created: ${payload.id}`);
    return { action: 'refund_created', refundId: payload.id };
  },

  // Theme events
  'themes/create': async (shopDomain, payload) => {
    console.log(`🎨 Theme created: ${payload.id} - ${payload.name}`);
    return { action: 'theme_created', themeId: payload.id };
  },

  'themes/update': async (shopDomain, payload) => {
    console.log(`🎨 Theme updated: ${payload.id} - ${payload.name}`);
    const { handleThemeUpdate } = require('./themeSync');
    await handleThemeUpdate(shopDomain, payload.id.toString());
    return { action: 'theme_updated', themeId: payload.id };
  },

  'themes/publish': async (shopDomain, payload) => {
    console.log(`🎨 Theme published: ${payload.id} - ${payload.name}`);
    const { handleThemeUpdate } = require('./themeSync');
    await handleThemeUpdate(shopDomain, payload.id.toString());
    return { action: 'theme_published', themeId: payload.id };
  },

  'themes/delete': async (shopDomain, payload) => {
    console.log(`🎨 Theme deleted: ${payload.id}`);
    return { action: 'theme_deleted', themeId: payload.id };
  },

  // Shop events
  'shop/update': async (shopDomain, payload) => {
    console.log(`🏪 Shop updated: ${payload.id} - ${payload.name}`);
    return { action: 'shop_updated', shopId: payload.id };
  },

  // Draft order events
  'draft_orders/create': async (shopDomain, payload) => {
    console.log(`📝 Draft order created: ${payload.id}`);
    return { action: 'draft_order_created', draftOrderId: payload.id };
  },

  'draft_orders/update': async (shopDomain, payload) => {
    console.log(`📝 Draft order updated: ${payload.id}`);
    return { action: 'draft_order_updated', draftOrderId: payload.id };
  },

  'draft_orders/delete': async (shopDomain, payload) => {
    console.log(`📝 Draft order deleted: ${payload.id}`);
    return { action: 'draft_order_deleted', draftOrderId: payload.id };
  },

  // Discount events
  'discounts/create': async (shopDomain, payload) => {
    console.log(`🎫 Discount created: ${payload.id}`);
    return { action: 'discount_created', discountId: payload.id };
  },

  'discounts/update': async (shopDomain, payload) => {
    console.log(`🎫 Discount updated: ${payload.id}`);
    return { action: 'discount_updated', discountId: payload.id };
  },

  'discounts/delete': async (shopDomain, payload) => {
    console.log(`🎫 Discount deleted: ${payload.id}`);
    return { action: 'discount_deleted', discountId: payload.id };
  },
};

/**
 * Process webhook event
 */
async function processWebhook(topic, shopDomain, payload, headers = {}) {
  try {
    // Store webhook event
    const webhookEvent = new WebhookEvent({
      shopDomain,
      topic,
      eventType: topic.split('/')[0],
      payload,
      webhookId: headers['x-shopify-webhook-id'],
      apiVersion: headers['x-shopify-api-version'],
    });

    await webhookEvent.save();
    console.log(`💾 Webhook event stored: ${topic}`);

    // Process with specific handler if available
    const handler = eventHandlers[topic];
    if (handler) {
      const result = await handler(shopDomain, payload);
      
      // Mark as processed
      webhookEvent.processed = true;
      webhookEvent.processedAt = new Date();
      await webhookEvent.save();
      
      return { success: true, result };
    } else {
      console.log(`⚠️ No handler for webhook topic: ${topic}`);
      return { success: true, message: 'Webhook stored but no handler' };
    }
  } catch (error) {
    console.error(`❌ Error processing webhook ${topic}:`, error);
    
    // Store error
    if (webhookEvent) {
      webhookEvent.error = error.message;
      await webhookEvent.save();
    }
    
    throw error;
  }
}

/**
 * Get webhook events
 */
async function getWebhookEvents(shopDomain, options = {}) {
  const query = { shopDomain };
  
  if (options.topic) {
    query.topic = options.topic;
  }
  
  if (options.eventType) {
    query.eventType = options.eventType;
  }
  
  const events = await WebhookEvent.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 100)
    .lean();
  
  return events;
}

module.exports = {
  processWebhook,
  getWebhookEvents,
  WebhookEvent,
};
