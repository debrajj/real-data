const ShopifyAPI = require('./shopifyAPI');
const Product = require('../models/Product');
const Shop = require('../models/Shop');

/**
 * Sync a single product
 */
async function syncProduct(shopDomain, productId) {
  try {
    console.log(`🔄 Syncing product ${productId} from ${shopDomain}`);
    
    const shop = await Shop.findOne({ shopDomain });
    if (!shop) {
      throw new Error(`Shop not found: ${shopDomain}`);
    }

    const shopifyAPI = new ShopifyAPI(shopDomain, shop.accessToken);
    const productData = await shopifyAPI.getProduct(productId);
    
    if (!productData) {
      throw new Error(`Product not found: ${productId}`);
    }

    await saveProduct(shopDomain, productData);
    
    console.log(`✅ Product synced: ${productData.title}`);
    return productData;
  } catch (error) {
    console.error(`❌ Error syncing product ${productId}:`, error);
    throw error;
  }
}

/**
 * Sync all products from Shopify
 */
async function syncAllProducts(shopDomain) {
  try {
    console.log(`🔄 Starting full product sync for ${shopDomain}`);
    
    const shop = await Shop.findOne({ shopDomain });
    if (!shop) {
      throw new Error(`Shop not found: ${shopDomain}`);
    }

    const shopifyAPI = new ShopifyAPI(shopDomain, shop.accessToken);
    const products = await shopifyAPI.getAllProducts();
    
    console.log(`📦 Found ${products.length} products`);
    
    let synced = 0;
    let failed = 0;
    
    for (const productData of products) {
      try {
        await saveProduct(shopDomain, productData);
        synced++;
      } catch (error) {
        console.error(`❌ Failed to save product ${productData.id}:`, error);
        failed++;
      }
    }
    
    console.log(`✅ Product sync complete: ${synced} synced, ${failed} failed`);
    
    return { synced, failed, total: products.length };
  } catch (error) {
    console.error(`❌ Error syncing all products:`, error);
    throw error;
  }
}

/**
 * Save product to MongoDB
 */
async function saveProduct(shopDomain, productData) {
  const productDoc = {
    shopDomain,
    productId: productData.id.toString(),
    title: productData.title,
    body_html: productData.body_html,
    vendor: productData.vendor,
    product_type: productData.product_type,
    handle: productData.handle,
    published_at: productData.published_at,
    template_suffix: productData.template_suffix,
    status: productData.status,
    published_scope: productData.published_scope,
    tags: productData.tags,
    admin_graphql_api_id: productData.admin_graphql_api_id,
    variants: productData.variants || [],
    options: productData.options || [],
    images: productData.images || [],
    image: productData.image,
    rawData: productData,
  };

  const savedProduct = await Product.findOneAndUpdate(
    { shopDomain, productId: productData.id.toString() },
    productDoc,
    { upsert: true, new: true }
  );

  return savedProduct;
}

/**
 * Delete product from MongoDB
 */
async function deleteProduct(shopDomain, productId) {
  try {
    await Product.findOneAndDelete({
      shopDomain,
      productId: productId.toString(),
    });
    console.log(`🗑️ Product deleted: ${productId}`);
  } catch (error) {
    console.error(`❌ Error deleting product ${productId}:`, error);
    throw error;
  }
}

/**
 * Get all products for a shop
 */
async function getProducts(shopDomain, options = {}) {
  const query = { shopDomain };
  
  // Filter by specific product IDs if provided
  if (options.ids && options.ids.length > 0) {
    query.productId = { $in: options.ids };
    
    // Fetch products and maintain the order of IDs
    const products = await Product.find(query)
      .select('-rawData')
      .lean();
    
    // Sort products to match the order of IDs provided
    const orderedProducts = [];
    for (const id of options.ids) {
      const product = products.find(p => p.productId === id);
      if (product) {
        orderedProducts.push(product);
      }
    }
    
    return orderedProducts;
  }
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.product_type) {
    query.product_type = options.product_type;
  }
  
  if (options.vendor) {
    query.vendor = options.vendor;
  }

  // Filter by collection if provided
  if (options.collection) {
    const Collection = require('../models/Collection');
    
    // Find collection by handle
    const collection = await Collection.findOne({
      shopDomain,
      handle: options.collection
    });
    
    if (collection) {
      // Filter products that have this collection ID
      query.collections = collection.collectionId;
    } else {
      console.warn(`⚠️ Collection not found: ${options.collection}`);
      // Return empty array if collection doesn't exist
      return [];
    }
  }

  const products = await Product.find(query)
    .select('-rawData')
    .sort({ createdAt: -1 })
    .allowDiskUse(true)
    .limit(options.limit || 250)
    .lean();

  return products;
}

/**
 * Get single product
 */
async function getProduct(shopDomain, productId) {
  const product = await Product.findOne({
    shopDomain,
    productId: productId.toString(),
  }).lean();

  return product;
}

module.exports = {
  syncProduct,
  syncAllProducts,
  saveProduct,
  deleteProduct,
  getProducts,
  getProduct,
};
