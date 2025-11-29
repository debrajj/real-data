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

  'customers/email_marketing_consent/update': async (shopDomain, payload) => {
    console.log(`📧 Customer email marketing consent updated: ${payload.customer_id}`);
    return { action: 'customer_email_marketing_consent_updated', customerId: payload.customer_id };
  },

  'customers_marketing_consent/sms_update': async (shopDomain, payload) => {
    console.log(`📱 Customer SMS marketing consent updated: ${payload.customer_id}`);
    return { action: 'customer_sms_marketing_consent_updated', customerId: payload.customer_id };
  },

  'customer_groups/create': async (shopDomain, payload) => {
    console.log(`👥 Customer group created: ${payload.id}`);
    return { action: 'customer_group_created', groupId: payload.id };
  },

  'customer_groups/update': async (shopDomain, payload) => {
    console.log(`👥 Customer group updated: ${payload.id}`);
    return { action: 'customer_group_updated', groupId: payload.id };
  },

  'customer_groups/delete': async (shopDomain, payload) => {
    console.log(`👥 Customer group deleted: ${payload.id}`);
    return { action: 'customer_group_deleted', groupId: payload.id };
  },

  'customer_payment_methods/create': async (shopDomain, payload) => {
    console.log(`💳 Customer payment method created: ${payload.id}`);
    return { action: 'customer_payment_method_created', paymentMethodId: payload.id };
  },

  'customer_payment_methods/update': async (shopDomain, payload) => {
    console.log(`💳 Customer payment method updated: ${payload.id}`);
    return { action: 'customer_payment_method_updated', paymentMethodId: payload.id };
  },

  'customer_payment_methods/revoke': async (shopDomain, payload) => {
    console.log(`💳 Customer payment method revoked: ${payload.id}`);
    return { action: 'customer_payment_method_revoked', paymentMethodId: payload.id };
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

  // Fulfillment order events
  'fulfillment_orders/scheduled_fulfillment_order_ready': async (shopDomain, payload) => {
    console.log(`📦 Fulfillment order ready: ${payload.id}`);
    return { action: 'fulfillment_order_ready', fulfillmentOrderId: payload.id };
  },

  'fulfillment_orders/hold_released': async (shopDomain, payload) => {
    console.log(`📦 Fulfillment order hold released: ${payload.id}`);
    return { action: 'fulfillment_order_hold_released', fulfillmentOrderId: payload.id };
  },

  'fulfillment_orders/order_routing_complete': async (shopDomain, payload) => {
    console.log(`📦 Fulfillment order routing complete: ${payload.id}`);
    return { action: 'fulfillment_order_routing_complete', fulfillmentOrderId: payload.id };
  },

  'fulfillment_orders/placed_on_hold': async (shopDomain, payload) => {
    console.log(`📦 Fulfillment order placed on hold: ${payload.id}`);
    return { action: 'fulfillment_order_placed_on_hold', fulfillmentOrderId: payload.id };
  },

  'fulfillment_orders/rescheduled': async (shopDomain, payload) => {
    console.log(`📦 Fulfillment order rescheduled: ${payload.id}`);
    return { action: 'fulfillment_order_rescheduled', fulfillmentOrderId: payload.id };
  },

  'fulfillment_orders/cancellation_request_submitted': async (shopDomain, payload) => {
    console.log(`📦 Fulfillment order cancellation requested: ${payload.id}`);
    return { action: 'fulfillment_order_cancellation_requested', fulfillmentOrderId: payload.id };
  },

  'fulfillment_orders/cancellation_request_accepted': async (shopDomain, payload) => {
    console.log(`📦 Fulfillment order cancellation accepted: ${payload.id}`);
    return { action: 'fulfillment_order_cancellation_accepted', fulfillmentOrderId: payload.id };
  },

  'fulfillment_orders/cancellation_request_rejected': async (shopDomain, payload) => {
    console.log(`📦 Fulfillment order cancellation rejected: ${payload.id}`);
    return { action: 'fulfillment_order_cancellation_rejected', fulfillmentOrderId: payload.id };
  },

  'fulfillment_orders/cancelled': async (shopDomain, payload) => {
    console.log(`📦 Fulfillment order cancelled: ${payload.id}`);
    return { action: 'fulfillment_order_cancelled', fulfillmentOrderId: payload.id };
  },

  'fulfillment_orders/fulfillment_request_submitted': async (shopDomain, payload) => {
    console.log(`📦 Fulfillment request submitted: ${payload.id}`);
    return { action: 'fulfillment_request_submitted', fulfillmentOrderId: payload.id };
  },

  'fulfillment_orders/fulfillment_request_accepted': async (shopDomain, payload) => {
    console.log(`📦 Fulfillment request accepted: ${payload.id}`);
    return { action: 'fulfillment_request_accepted', fulfillmentOrderId: payload.id };
  },

  'fulfillment_orders/fulfillment_request_rejected': async (shopDomain, payload) => {
    console.log(`📦 Fulfillment request rejected: ${payload.id}`);
    return { action: 'fulfillment_request_rejected', fulfillmentOrderId: payload.id };
  },

  'fulfillment_orders/line_items_prepared_for_pickup': async (shopDomain, payload) => {
    console.log(`📦 Line items prepared for pickup: ${payload.id}`);
    return { action: 'line_items_prepared_for_pickup', fulfillmentOrderId: payload.id };
  },

  'fulfillment_orders/line_items_prepared_for_local_delivery': async (shopDomain, payload) => {
    console.log(`📦 Line items prepared for local delivery: ${payload.id}`);
    return { action: 'line_items_prepared_for_local_delivery', fulfillmentOrderId: payload.id };
  },

  'fulfillment_orders/moved': async (shopDomain, payload) => {
    console.log(`📦 Fulfillment order moved: ${payload.id}`);
    return { action: 'fulfillment_order_moved', fulfillmentOrderId: payload.id };
  },

  'fulfillment_orders/merged': async (shopDomain, payload) => {
    console.log(`📦 Fulfillment orders merged`);
    return { action: 'fulfillment_orders_merged' };
  },

  'fulfillment_orders/split': async (shopDomain, payload) => {
    console.log(`📦 Fulfillment order split: ${payload.id}`);
    return { action: 'fulfillment_order_split', fulfillmentOrderId: payload.id };
  },

  // Inventory item events
  'inventory_items/create': async (shopDomain, payload) => {
    console.log(`📦 Inventory item created: ${payload.id}`);
    return { action: 'inventory_item_created', inventoryItemId: payload.id };
  },

  'inventory_items/update': async (shopDomain, payload) => {
    console.log(`📦 Inventory item updated: ${payload.id}`);
    return { action: 'inventory_item_updated', inventoryItemId: payload.id };
  },

  'inventory_items/delete': async (shopDomain, payload) => {
    console.log(`📦 Inventory item deleted: ${payload.id}`);
    return { action: 'inventory_item_deleted', inventoryItemId: payload.id };
  },

  // Location events
  'locations/create': async (shopDomain, payload) => {
    console.log(`📍 Location created: ${payload.id} - ${payload.name}`);
    return { action: 'location_created', locationId: payload.id };
  },

  'locations/update': async (shopDomain, payload) => {
    console.log(`📍 Location updated: ${payload.id} - ${payload.name}`);
    return { action: 'location_updated', locationId: payload.id };
  },

  'locations/delete': async (shopDomain, payload) => {
    console.log(`📍 Location deleted: ${payload.id}`);
    return { action: 'location_deleted', locationId: payload.id };
  },

  'locations/activate': async (shopDomain, payload) => {
    console.log(`📍 Location activated: ${payload.id}`);
    return { action: 'location_activated', locationId: payload.id };
  },

  'locations/deactivate': async (shopDomain, payload) => {
    console.log(`📍 Location deactivated: ${payload.id}`);
    return { action: 'location_deactivated', locationId: payload.id };
  },

  // Market events
  'markets/create': async (shopDomain, payload) => {
    console.log(`🌍 Market created: ${payload.id}`);
    return { action: 'market_created', marketId: payload.id };
  },

  'markets/update': async (shopDomain, payload) => {
    console.log(`🌍 Market updated: ${payload.id}`);
    return { action: 'market_updated', marketId: payload.id };
  },

  'markets/delete': async (shopDomain, payload) => {
    console.log(`🌍 Market deleted: ${payload.id}`);
    return { action: 'market_deleted', marketId: payload.id };
  },

  // Tender transaction events
  'tender_transactions/create': async (shopDomain, payload) => {
    console.log(`💰 Tender transaction created: ${payload.id}`);
    return { action: 'tender_transaction_created', transactionId: payload.id };
  },

  // Transaction events
  'transactions/create': async (shopDomain, payload) => {
    console.log(`💳 Transaction created: ${payload.id}`);
    return { action: 'transaction_created', transactionId: payload.id };
  },

  // Order risk assessment
  'order_transactions/create': async (shopDomain, payload) => {
    console.log(`💳 Order transaction created: ${payload.id}`);
    return { action: 'order_transaction_created', transactionId: payload.id };
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
    .allowDiskUse(true)
    .limit(options.limit || 100)
    .lean();
  
  return events;
}

module.exports = {
  processWebhook,
  getWebhookEvents,
  WebhookEvent,
};
