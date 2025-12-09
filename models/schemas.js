const mongoose = require('mongoose');

/**
 * Schema Registry - Defines all schemas for store databases
 * These schemas are used with getStoreModel() to create models per store database
 */

// Product Variant Schema
const productVariantSchema = new mongoose.Schema({
  id: String,
  title: String,
  price: String,
  sku: String,
  position: Number,
  inventory_policy: String,
  compare_at_price: String,
  fulfillment_service: String,
  inventory_management: String,
  option1: String,
  option2: String,
  option3: String,
  taxable: Boolean,
  barcode: String,
  grams: Number,
  image_id: String,
  weight: Number,
  weight_unit: String,
  inventory_item_id: String,
  inventory_quantity: Number,
  old_inventory_quantity: Number,
  requires_shipping: Boolean,
  admin_graphql_api_id: String,
});

// Product Image Schema
const productImageSchema = new mongoose.Schema({
  id: String,
  product_id: String,
  position: Number,
  created_at: Date,
  updated_at: Date,
  alt: String,
  width: Number,
  height: Number,
  src: String,
  variant_ids: [String],
  admin_graphql_api_id: String,
});

// Product Schema
const productSchema = new mongoose.Schema({
  shopDomain: { type: String, required: true, index: true },
  productId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  body_html: String,
  vendor: String,
  product_type: String,
  handle: String,
  published_at: Date,
  template_suffix: String,
  status: String,
  published_scope: String,
  tags: String,
  admin_graphql_api_id: String,
  collections: [String],
  variants: [productVariantSchema],
  options: [{
    id: String,
    product_id: String,
    name: String,
    position: Number,
    values: [String],
  }],
  images: [productImageSchema],
  image: productImageSchema,
  rawData: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

productSchema.index({ shopDomain: 1, productId: 1 }, { unique: true });
productSchema.index({ shopDomain: 1, handle: 1 });

// Collection Schema
const collectionSchema = new mongoose.Schema({
  shopDomain: { type: String, required: true, index: true },
  collectionId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  handle: String,
  body_html: String,
  published_at: Date,
  updated_at: Date,
  sort_order: String,
  template_suffix: String,
  published_scope: String,
  image: {
    created_at: Date,
    alt: String,
    width: Number,
    height: Number,
    src: String,
  },
  rawData: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

collectionSchema.index({ shopDomain: 1, collectionId: 1 }, { unique: true });
collectionSchema.index({ shopDomain: 1, handle: 1 });

// Blog Schema
const blogSchema = new mongoose.Schema({
  shopDomain: { type: String, required: true, index: true },
  blogId: { type: String, required: true, index: true },
  title: String,
  handle: String,
  commentable: String,
  feedburner: String,
  feedburner_location: String,
  created_at: Date,
  updated_at: Date,
  tags: String,
  template_suffix: String,
  admin_graphql_api_id: String,
  rawData: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

blogSchema.index({ shopDomain: 1, blogId: 1 }, { unique: true });

// Article Schema
const articleSchema = new mongoose.Schema({
  shopDomain: { type: String, required: true, index: true },
  articleId: { type: String, required: true, index: true },
  blogId: { type: String, required: true, index: true },
  blogHandle: String,
  blogTitle: String,
  title: String,
  handle: String,
  author: String,
  body_html: String,
  summary_html: String,
  published_at: Date,
  created_at: Date,
  updated_at: Date,
  tags: String,
  image: {
    src: String,
    alt: String,
    width: Number,
    height: Number,
  },
  admin_graphql_api_id: String,
  rawData: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

articleSchema.index({ shopDomain: 1, articleId: 1 }, { unique: true });
articleSchema.index({ shopDomain: 1, blogId: 1 });

// Theme Data Schema
const themeDataSchema = new mongoose.Schema({
  shopDomain: { type: String, required: true, index: true },
  storeName: { type: String, default: 'store', index: true },
  themeId: { type: String, required: true },
  themeName: String,
  components: { type: Array, default: [] },
  pages: { type: Object, default: {} },
  customPages: { type: Array, default: [] },
  theme: { type: Object, default: {} },
  rawData: Object,
  version: { type: Number, default: 1 },
}, { timestamps: true });

themeDataSchema.index({ shopDomain: 1, themeId: 1 });

// Media Schema
const mediaSchema = new mongoose.Schema({
  shopDomain: { type: String, required: true, index: true },
  originalUrl: { type: String, required: true },
  cdnUrl: { type: String, required: true },
  filename: { type: String, required: true },
  contentType: { type: String, required: true },
  size: Number,
  data: Buffer,
  width: Number,
  height: Number,
  alt: String,
  usedIn: [{
    themeId: String,
    sectionId: String,
    blockId: String,
    type: String,
    id: String,
    title: String,
  }],
}, { timestamps: true });

mediaSchema.index({ shopDomain: 1, cdnUrl: 1 }, { unique: true });

// Discount Schema
const discountSchema = new mongoose.Schema({
  shopDomain: { type: String, required: true, index: true },
  code: { type: String, required: true, uppercase: true },
  type: { type: String, enum: ['BOGO', 'PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'], required: true },
  title: { type: String, required: true },
  description: String,
  method: { type: String, enum: ['CODE', 'AUTOMATIC'], default: 'CODE' },
  bogoSettings: {
    buyQuantity: { type: Number, default: 1 },
    getQuantity: { type: Number, default: 1 },
    getDiscount: { type: Number, default: 100 },
    discountType: { type: String, enum: ['PERCENTAGE', 'AMOUNT', 'FREE'], default: 'FREE' },
    applicableProducts: [{ productId: String, variantId: String }],
    applicableCollections: [String],
    applyToAll: { type: Boolean, default: false },
    maxUsesPerOrder: Number,
  },
  value: Number,
  valueType: { type: String, enum: ['PERCENTAGE', 'FIXED_AMOUNT'], default: 'PERCENTAGE' },
  customerEligibility: { type: String, enum: ['ALL', 'SEGMENTS', 'SPECIFIC'], default: 'ALL' },
  customerSegments: [String],
  specificCustomers: [String],
  minimumRequirement: { type: String, enum: ['NONE', 'PURCHASE_AMOUNT', 'QUANTITY'], default: 'NONE' },
  minimumPurchaseAmount: Number,
  minimumQuantity: Number,
  appliesTo: { type: String, enum: ['ALL', 'PRODUCTS', 'COLLECTIONS'], default: 'ALL' },
  applicableProducts: [{ productId: String, variantId: String }],
  applicableCollections: [String],
  usageLimit: Number,
  usageCount: { type: Number, default: 0 },
  oncePerCustomer: { type: Boolean, default: false },
  combinations: {
    productDiscounts: { type: Boolean, default: false },
    orderDiscounts: { type: Boolean, default: false },
    shippingDiscounts: { type: Boolean, default: false },
  },
  salesChannels: { type: [String], default: ['online_store'] },
  startsAt: Date,
  startTime: String,
  endsAt: Date,
  endTime: String,
  active: { type: Boolean, default: true },
  shopifyPriceRuleId: String,
  shopifyDiscountCodeId: String,
}, { timestamps: true });

discountSchema.index({ shopDomain: 1, code: 1 }, { unique: true });
discountSchema.index({ active: 1, startsAt: 1, endsAt: 1 });

// Method to check if discount is currently valid
discountSchema.methods.isValid = function() {
  if (!this.active) return false;
  const now = new Date();
  if (this.startsAt && now < this.startsAt) return false;
  if (this.endsAt && now > this.endsAt) return false;
  if (this.usageLimit && this.usageCount >= this.usageLimit) return false;
  return true;
};

// Method to apply BOGO discount to cart
discountSchema.methods.applyToCart = function(cartItems) {
  if (this.type !== 'BOGO') {
    throw new Error('This method only applies to BOGO discounts');
  }
  const { buyQuantity, getQuantity, getDiscount, applicableProducts, applicableCollections, applyToAll } = this.bogoSettings;
  let applicableItems = cartItems;
  if (!applyToAll) {
    applicableItems = cartItems.filter(item => {
      const isApplicableProduct = applicableProducts.some(p => 
        p.productId === item.productId || p.variantId === item.variantId
      );
      const isApplicableCollection = applicableCollections.some(collectionId =>
        item.collections && item.collections.includes(collectionId)
      );
      return isApplicableProduct || isApplicableCollection;
    });
  }
  const totalQuantity = applicableItems.reduce((sum, item) => sum + item.quantity, 0);
  const sets = Math.floor(totalQuantity / (buyQuantity + getQuantity));
  const freeItems = sets * getQuantity;
  let discountAmount = 0;
  let remainingFreeItems = freeItems;
  const sortedItems = [...applicableItems].sort((a, b) => a.price - b.price);
  for (const item of sortedItems) {
    if (remainingFreeItems <= 0) break;
    const itemsToDiscount = Math.min(item.quantity, remainingFreeItems);
    discountAmount += item.price * itemsToDiscount * (getDiscount / 100);
    remainingFreeItems -= itemsToDiscount;
  }
  return {
    discountAmount,
    freeItems,
    applicableItemsCount: applicableItems.length,
    message: `Buy ${buyQuantity} Get ${getQuantity} ${getDiscount === 100 ? 'Free' : getDiscount + '% Off'}`,
  };
};

// Webhook Event Schema
const webhookEventSchema = new mongoose.Schema({
  shopDomain: { type: String, required: true, index: true },
  topic: String,
  payload: mongoose.Schema.Types.Mixed,
  processedAt: Date,
}, { timestamps: true });

module.exports = {
  productSchema,
  collectionSchema,
  blogSchema,
  articleSchema,
  themeDataSchema,
  mediaSchema,
  discountSchema,
  webhookEventSchema,
};
