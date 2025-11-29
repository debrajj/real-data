# Best Seller Products by ID - Configuration Guide

## Overview

You can now display specific products in the "Best Seller" section by providing product IDs instead of using a collection. This gives you full control over which products appear and in what order.

---

## Method 1: Using Product IDs (Recommended for Best Sellers)

### Step 1: Get Your Product IDs

Run this script to see all your product IDs:

```bash
node scripts/viewProducts.js
```

Or get specific stationery products:

```bash
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');

async function getIds() {
  await mongoose.connect(process.env.MONGODB_URI);
  const products = await Product.find({ 
    shopDomain: 'cmstestingg.myshopify.com',
    collections: '471669309668' // Stationery collection
  }).select('productId title');
  
  console.log('Product IDs:');
  products.forEach(p => {
    console.log(\`\${p.productId} - \${p.title.substring(0, 50)}\`);
  });
  await mongoose.disconnect();
}
getIds();
"
```

### Step 2: Update Your Theme JSON

Edit `full_theme/templates/index.json` and find the "BEST SELLER" section:

**Before (using collection):**
```json
{
  "product_block_collection": "stationery",
  "product_block_limit": 8,
  "product_block_title": "BEST SELLER"
}
```

**After (using specific IDs):**
```json
{
  "product_block_collection": "",
  "product_block_ids": [
    "8830798299364",
    "8830797873380",
    "8830798397668",
    "8830798168292",
    "8830798037220"
  ],
  "product_block_limit": 5,
  "product_block_title": "BEST SELLER"
}
```

### Step 3: Sync Theme

After updating the JSON, sync your theme:

```bash
node scripts/syncNewTheme.js
```

Or click the "🔄 Sync Theme" button in your admin panel.

---

## Method 2: Using Collection (Automatic)

If you want products to be automatically pulled from a collection:

```json
{
  "product_block_collection": "stationery",
  "product_block_ids": [],
  "product_block_limit": 8,
  "product_block_title": "BEST SELLER"
}
```

---

## Available Product IDs

### Stationery Products (5 items):
```json
[
  "8830798299364",  // WISHKEY 145 Pieces Art Set
  "8830797873380",  // Toy Imagine Unicorn Stationery Set
  "8830798397668",  // Space Theme Pencil Box
  "8830798168292",  // Skillmatics Search & Find Book
  "8830798037220"   // Doms Smart Kit
]
```

### All Products:
Run `node scripts/viewProducts.js` to see all available product IDs.

---

## Priority Order

The system checks in this order:

1. **product_block_ids** - If provided, uses these specific products in the exact order
2. **product_block_collection** - If no IDs, uses products from this collection
3. **Default** - Falls back to "shop-all" collection

---

## Examples

### Example 1: Top 5 Best Sellers (Manual Selection)
```json
{
  "product_block_title": "BEST SELLER",
  "product_block_ids": [
    "8830798299364",
    "8830797873380",
    "8830798397668",
    "8830798168292",
    "8830798037220"
  ],
  "product_block_limit": 5,
  "product_block_layout": "slider",
  "product_block_show": "5"
}
```

### Example 2: Featured Products (Mixed Categories)
```json
{
  "product_block_title": "FEATURED PRODUCTS",
  "product_block_ids": [
    "8830798299364",  // Art Set
    "8830796792036",  // Cow Plush Toy
    "8830797316324",  // Casino Theme Decoration
    "8830797873380",  // Stationery Set
    "8830796234980"   // Birthday Gift Pack
  ],
  "product_block_limit": 5
}
```

### Example 3: New Arrivals (By Collection)
```json
{
  "product_block_title": "NEW ARRIVALS",
  "product_block_collection": "shop-all",
  "product_block_limit": 8,
  "product_block_layout": "grid"
}
```

---

## API Endpoints

### Fetch Products by IDs
```bash
GET /api/products?ids=8830798299364,8830797873380,8830798397668
```

### Fetch Products by Collection
```bash
GET /api/products?collection=stationery&limit=10
```

### Fetch All Products
```bash
GET /api/products?limit=50
```

---

## Testing

Test the API directly:

```bash
# Test by IDs
curl "http://localhost:3000/api/products?ids=8830798299364,8830797873380"

# Test by collection
curl "http://localhost:3000/api/products?collection=stationery&limit=5"
```

---

## Troubleshooting

### Products not showing?

1. **Check product IDs are correct:**
   ```bash
   node scripts/viewProducts.js
   ```

2. **Verify products are synced:**
   ```bash
   node scripts/syncProducts.js
   ```

3. **Check collections are linked:**
   ```bash
   node scripts/linkProductsToCollections.js
   ```

4. **Sync theme after changes:**
   ```bash
   node scripts/syncNewTheme.js
   ```

### Wrong order?

Products will appear in the exact order you specify in the `product_block_ids` array. Rearrange the IDs to change the order.

---

## Benefits of Using Product IDs

✅ **Full Control** - Choose exactly which products appear  
✅ **Custom Order** - Products appear in the order you specify  
✅ **Mix Categories** - Combine products from different collections  
✅ **Easy Updates** - Just change the IDs in JSON  
✅ **No Collection Needed** - Works independently of collections  

---

## Next Steps

1. Get your product IDs using `node scripts/viewProducts.js`
2. Update `full_theme/templates/index.json` with your chosen IDs
3. Sync theme with `node scripts/syncNewTheme.js`
4. Refresh your preview to see the changes
