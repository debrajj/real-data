const mongoose = require('mongoose');

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

const productSchema = new mongoose.Schema({
  shopDomain: {
    type: String,
    required: true,
    index: true,
  },
  productId: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
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
  collections: [String], // Array of collection IDs this product belongs to
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
  rawData: {
    type: mongoose.Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

productSchema.index({ shopDomain: 1, productId: 1 }, { unique: true });
productSchema.index({ shopDomain: 1, handle: 1 });
productSchema.index({ shopDomain: 1, status: 1 });

module.exports = mongoose.model('Product', productSchema);
