const ShopifyAPI = require('./shopifyAPI');
const Shop = require('../models/Shop');
const { getStoreModel, getClientKeyFromShopDomain } = require('../config/database');
const { productSchema, collectionSchema } = require('../models/schemas');

/**
 * Get Product model for a specific store database
 */
async function getProductModel(clientKey) {
  return getStoreModel(clientKey, 'Product', productSchema, 'products');
}

/**
 * Get Collection model for a specific store database
 */
async function getCollectionModel(clientKey) {
  return getStoreModel(clientKey, 'Collection', collectionSchema, 'collections');
}

/**
 * Sync a single product
 */
async function syncProduct(shopDomain, productId, clientKey = null) {
  try {
    console.log(`🔄 Syncing product ${productId} from ${shopDomain}`);
    
    // Get clientKey if not provided
    if (!clientKey) {
      clientKey = await getClientKeyFromShopDomain(shopDomain);
      if (!clientKey) {
        throw new Error(`No client found for shop: ${shopDomain}`);
      }
    }
    
    const shop = await Shop.findOne({ shopDomain });
    if (!shop) {
      throw new Error(`Shop not found: ${shopDomain}`);
    }

    const shopifyAPI = new ShopifyAPI(shopDomain, shop.accessToken);
    const productData = await shopifyAPI.getProduct(productId);
    
    if (!productData) {
      throw new Error(`Product not found: ${productId}`);
    }

    await saveProduct(shopDomain, productData, clientKey);
    
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
async function syncAllProducts(shopDomain, clientKey = null) {
  try {
    console.log(`🔄 Starting full product sync for ${shopDomain}`);
    
    // Get clientKey if not provided
    if (!clientKey) {
      clientKey = await getClientKeyFromShopDomain(shopDomain);
      if (!clientKey) {
        throw new Error(`No client found for shop: ${shopDomain}`);
      }
    }
    
    const shop = await Shop.findOne({ shopDomain });
    if (!shop) {
      throw new Error(`Shop not found: ${shopDomain}`);
    }

    const shopifyAPI = new ShopifyAPI(shopDomain, shop.accessToken);
    const products = await shopifyAPI.getAllProducts();
    
    console.log(`📦 Found ${products.length} products → saving to ${clientKey} database`);
    
    let synced = 0;
    let failed = 0;
    
    for (const productData of products) {
      try {
        await saveProduct(shopDomain, productData, clientKey);
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
 * Save product to store database
 */
async function saveProduct(shopDomain, productData, clientKey) {
  if (!clientKey) {
    clientKey = await getClientKeyFromShopDomain(shopDomain);
    if (!clientKey) {
      throw new Error(`No client found for shop: ${shopDomain}`);
    }
  }
  
  const Product = await getProductModel(clientKey);
  
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
 * Delete product from store database
 */
async function deleteProduct(shopDomain, productId, clientKey = null) {
  try {
    if (!clientKey) {
      clientKey = await getClientKeyFromShopDomain(shopDomain);
      if (!clientKey) {
        throw new Error(`No client found for shop: ${shopDomain}`);
      }
    }
    
    const Product = await getProductModel(clientKey);
    
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
async function getProducts(shopDomain, options = {}, clientKey = null) {
  if (!clientKey) {
    clientKey = await getClientKeyFromShopDomain(shopDomain);
    if (!clientKey) {
      throw new Error(`No client found for shop: ${shopDomain}`);
    }
  }
  
  const Product = await getProductModel(clientKey);
  const query = { shopDomain };
  
  // Filter by specific product IDs if provided
  if (options.ids && options.ids.length > 0) {
    query.productId = { $in: options.ids };
    
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
    const Collection = await getCollectionModel(clientKey);
    
    const collection = await Collection.findOne({
      shopDomain,
      handle: options.collection
    });
    
    if (collection) {
      query.collections = collection.collectionId;
    } else {
      console.warn(`⚠️ Collection not found: ${options.collection}`);
      return [];
    }
  }

  const products = await Product.find(query)
    .select('-rawData')
    .sort({ createdAt: -1 })
    .limit(options.limit || 250)
    .lean();

  return products;
}

/**
 * Get single product
 */
async function getProduct(shopDomain, productId, clientKey = null) {
  if (!clientKey) {
    clientKey = await getClientKeyFromShopDomain(shopDomain);
    if (!clientKey) {
      throw new Error(`No client found for shop: ${shopDomain}`);
    }
  }
  
  const Product = await getProductModel(clientKey);
  
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
  getProductModel,
};
