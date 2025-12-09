# Multi-Database Architecture

## Overview

This system uses a multi-database architecture where each store gets its own dedicated MongoDB database.

## Database Structure

```
MongoDB Server
├── appconfig (database)  # Note: 'config' is reserved in MongoDB
│   ├── clients (collection - all client configurations)
│   └── shops (collection - shop info and tokens)
│
├── store1 (database)
│   ├── products (collection)
│   ├── collections (collection)
│   ├── blogs (collection)
│   ├── articles (collection)
│   ├── themedatas (collection)
│   ├── media (collection)
│   ├── discounts (collection)
│   └── webhookevents (collection)
│
├── store2 (database)
│   ├── products (collection)
│   ├── collections (collection)
│   └── ... (same structure)
│
└── myspoon (database)
    ├── products (collection)
    ├── collections (collection)
    └── ... (same structure)
```

## How It Works

### 1. Config Database
- **clients**: Stores all client configurations (API keys, tokens, settings)
- **shops**: Stores shop information and access tokens

### 2. Store Databases
Each store (identified by `clientKey`) gets its own database containing:
- **products**: Synced from Shopify
- **collections**: Synced from Shopify
- **blogs**: Synced from Shopify
- **articles**: Blog articles synced from Shopify
- **themedatas**: Theme configuration and components
- **media**: Downloaded images and assets
- **discounts**: Discount codes and rules
- **webhookevents**: Webhook event logs

## Key Files

### Database Configuration
- `config/database.js` - Connection management for multi-database
- `services/databaseService.js` - Database operations service
- `models/schemas.js` - Schema definitions for store collections

### Sync Services
- `services/productSync.js` - Product sync with multi-DB support
- `services/collectionSync.js` - Collection sync with multi-DB support
- `services/blogSync.js` - Blog/article sync with multi-DB support
- `services/themeSync.js` - Theme sync with multi-DB support

## Usage

### Creating a New Store

```bash
POST /api/config/sync
{
  "clientKey": "mystore",
  "clientName": "My Store",
  "environment": "production",
  "apiBaseUrl": "https://mystore.myshopify.com",
  "adminApiBaseUrl": "https://mystore.myshopify.com",
  "appName": "MyStore App",
  "bundleId": "com.mystore.app",
  "packageName": "com.mystore.app",
  "storefrontToken": "xxx",
  "adminShopToken": "xxx"
}
```

This will:
1. Create client config in `config.clients`
2. Create `mystore` database
3. Sync all Shopify data to `mystore` database

### Accessing Store Data

The system automatically routes data to the correct database based on `clientKey`:

```javascript
// Get products for a specific store
const products = await getProducts(shopDomain, options, clientKey);

// Or let the system find clientKey from shopDomain
const products = await getProducts(shopDomain, options);
```

## Benefits

1. **Data Isolation**: Each store's data is completely separate
2. **Scalability**: Easy to add new stores without affecting existing ones
3. **Performance**: Queries only search within a single store's database
4. **Backup/Restore**: Can backup/restore individual stores independently
5. **Security**: Access can be controlled per-database if needed
