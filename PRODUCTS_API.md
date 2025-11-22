# Products API Documentation

Complete product management system with webhook integration and API access.

## Features

✅ Automatic product sync via webhooks
✅ Manual product sync (all or single)
✅ Store products in MongoDB
✅ REST API for product access
✅ Real-time updates when products change

## API Endpoints

### 1. Get All Products
```
GET /api/products/:shopDomain
```

**Query Parameters:**
- `limit` (optional): Number of products (default: 250)
- `status` (optional): Filter by status (active, draft, archived)
- `product_type` (optional): Filter by product type
- `vendor` (optional): Filter by vendor

**Response:**
```json
{
  "success": true,
  "count": 27,
  "products": [
    {
      "_id": "...",
      "shopDomain": "cmstestingg.myshopify.com",
      "productId": "8830798299364",
      "title": "WISHKEY 145 Pieces Art Set for Kids",
      "handle": "wishkey-145-pieces-art-set",
      "vendor": "Kids-Toysx",
      "product_type": "",
      "status": "active",
      "variants": [
        {
          "id": "...",
          "title": "Default Title",
          "price": "399.00",
          "sku": "",
          "inventory_quantity": 10
        }
      ],
      "images": [
        {
          "id": "...",
          "src": "https://cdn.shopify.com/...",
          "width": 1000,
          "height": 1000
        }
      ]
    }
  ]
}
```

### 2. Get Single Product
```
GET /api/products/:shopDomain/:productId
```

**Response:**
```json
{
  "success": true,
  "product": {
    "productId": "8830798299364",
    "title": "Product Name",
    "variants": [...],
    "images": [...]
  }
}
```

### 3. Sync All Products
```
POST /api/products/:shopDomain/sync
```

Triggers a full product sync from Shopify to MongoDB.

**Response:**
```json
{
  "success": true,
  "message": "Product sync started"
}
```

### 4. Sync Single Product
```
POST /api/products/:shopDomain/:productId/sync
```

Syncs a specific product from Shopify.

**Response:**
```json
{
  "success": true,
  "product": {...}
}
```

## Webhook Integration

Products are automatically synced when these webhooks are received:

- `products/create` - New product created
- `products/update` - Product updated
- `products/delete` - Product deleted

### Webhook Setup

Configure these webhooks in Shopify Admin:

1. Go to Settings > Notifications > Webhooks
2. Add webhooks:
   - **Event**: Product creation
   - **Format**: JSON
   - **URL**: `https://your-domain.com/webhooks/products-create`
   
3. Repeat for:
   - Product update: `/webhooks/products-update`
   - Product deletion: `/webhooks/products-delete`

## Scripts

### Sync All Products
```bash
npm run sync-products
```

Downloads all products from Shopify and stores them in MongoDB.

### View Products
```bash
npm run view-products
```

Lists all products stored in MongoDB.

## Example Usage

### Get all active products
```bash
curl http://localhost:3001/api/products/cmstestingg.myshopify.com?status=active
```

### Get products by vendor
```bash
curl http://localhost:3001/api/products/cmstestingg.myshopify.com?vendor=Kids-Toysx
```

### Get specific product
```bash
curl http://localhost:3001/api/products/cmstestingg.myshopify.com/8830798299364
```

### Trigger product sync
```bash
curl -X POST http://localhost:3001/api/products/cmstestingg.myshopify.com/sync
```

## Frontend Integration

```javascript
// Fetch all products
const response = await fetch('http://localhost:3001/api/products/cmstestingg.myshopify.com');
const { products } = await response.json();

// Display products
products.forEach(product => {
  console.log(product.title);
  console.log(`Price: $${product.variants[0].price}`);
  console.log(`Image: ${product.images[0]?.src}`);
});
```

## Product Data Structure

Each product includes:
- `productId` - Shopify product ID
- `title` - Product title
- `body_html` - Product description (HTML)
- `vendor` - Product vendor
- `product_type` - Product type/category
- `handle` - URL-friendly handle
- `status` - active, draft, or archived
- `tags` - Product tags
- `variants` - Array of product variants with:
  - `id`, `title`, `price`, `sku`
  - `inventory_quantity`
  - `option1`, `option2`, `option3`
- `images` - Array of product images with:
  - `id`, `src`, `width`, `height`, `alt`
- `options` - Product options (Size, Color, etc.)

## Notes

- Products are stored without the full `rawData` in API responses for performance
- Use `limit` parameter to control response size
- Webhook events are logged in the `webhookevents` collection
- Product sync runs asynchronously to avoid blocking
