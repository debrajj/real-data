# AppMint - Shopify Embedded App

A full-featured Shopify embedded app for building mobile apps from your Shopify store. Built with React, Shopify Polaris, App Bridge, and Node.js.

## Features

- 🛍️ **Shopify Integration** - Full OAuth flow for public app store deployment
- 📱 **Mobile App Builder** - Generate iOS and Android apps from your Shopify store
- 🎨 **Theme Sync** - Automatically sync products, collections, and theme data
- 🔄 **Real-time Updates** - SSE-based live updates when Shopify data changes
- 🏗️ **Build Manager** - Generate and download mobile app builds
- 🌐 **Multi-tenant** - Support multiple stores with isolated databases

## Project Structure

```
├── frontend/                 # React frontend (Vite + TypeScript)
│   ├── shopify/             # Shopify embedded app components
│   │   ├── App.tsx          # Main Shopify app with App Bridge
│   │   └── main.tsx         # Entry point
│   ├── components/          # Reusable UI components
│   ├── views/               # Page components
│   │   ├── AdminDashboard.tsx
│   │   ├── ConfigView.tsx
│   │   └── ...
│   ├── client/              # API client
│   └── types.ts             # TypeScript types
│
├── routes/                   # Express API routes
│   ├── shopify-auth.js      # OAuth flow for Shopify
│   ├── products.js          # Products API
│   ├── collections.js       # Collections API
│   ├── theme.js             # Theme sync API
│   ├── config.js            # Client configuration
│   └── webhooks.js          # Shopify webhooks
│
├── services/                 # Business logic
│   ├── productSync.js       # Product synchronization
│   ├── collectionSync.js    # Collection synchronization
│   ├── themeSync.js         # Theme synchronization
│   └── ...
│
├── models/                   # MongoDB models
├── config/                   # Configuration
├── netlify/                  # Netlify functions
│   └── functions/
│       └── api.js           # Serverless API handler
│
├── server.js                 # Express server
├── netlify.toml             # Netlify deployment config
└── package.json
```

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Shopify Partners account

### Local Development

1. **Clone and install dependencies:**
   ```bash
   npm install
   cd frontend && npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp env-template.txt .env
   # Edit .env with your credentials
   ```

3. **Start the backend server:**
   ```bash
   npm run dev
   ```

4. **Start the frontend (in another terminal):**
   ```bash
   cd frontend
   npm run dev
   ```

5. **Access the app:**
   - Frontend: http://localhost:3000
   - API: http://localhost:3001

### Shopify App Setup

1. Go to [Shopify Partners](https://partners.shopify.com)
2. Create a new app
3. Configure URLs:
   - **App URL:** `https://your-app.netlify.app`
   - **Allowed redirection URLs:**
     - `https://your-app.netlify.app/api/shopify/callback`
     - `http://localhost:3000/api/shopify/callback` (for dev)
4. Copy API credentials to your `.env` file

## Deployment to Netlify

### Option 1: Netlify UI

1. Push code to GitHub
2. Go to [Netlify](https://app.netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your repository
5. Add environment variables in Site Settings
6. Deploy!

### Option 2: Netlify CLI

```bash
# Install CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

### Environment Variables for Netlify

Set these in Netlify Dashboard → Site Settings → Environment Variables:

```
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_SCOPES=read_products,write_products,read_themes,write_themes
MONGODB_URI=mongodb+srv://...
APP_URL=https://your-app.netlify.app
NODE_ENV=production
```

## API Endpoints

### Authentication
- `GET /api/shopify/auth?shop=store.myshopify.com` - Start OAuth
- `GET /api/shopify/callback` - OAuth callback
- `GET /api/shopify/session?shop=...` - Get session info

### Products
- `GET /api/products/client/:clientKey` - Get products by client
- `POST /api/products/:shopDomain/sync` - Sync products

### Collections
- `GET /api/collections/client/:clientKey` - Get collections
- `POST /api/collections/:shopDomain/sync` - Sync collections

### Theme
- `GET /api/theme/client/:clientKey` - Get all data (theme, products, collections)
- `POST /api/theme/sync` - Trigger theme sync

### Configuration
- `GET /api/config/:clientKey` - Get client config
- `POST /api/config` - Create new config

## Webhooks

Register these webhooks in your Shopify app settings:

- `app/uninstalled` → `/api/shopify/uninstall`
- `themes/update` → `/webhooks/theme`
- `products/create`, `products/update`, `products/delete` → `/webhooks/products`

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Shopify Polaris, App Bridge
- **Backend:** Node.js, Express
- **Database:** MongoDB Atlas
- **Deployment:** Netlify (Functions + Static)
- **APIs:** Shopify Admin API, Storefront API

## License

MIT
