# Shopify Theme Editor → MongoDB Realtime Sync

Complete system for syncing Shopify Theme Editor changes to MongoDB with realtime updates to React/mobile apps.

## Architecture

```
Shopify Theme Editor
    ↓ (webhook)
Node.js Backend
    ↓ (fetch settings_data.json)
Theme Parser
    ↓ (convert to custom JSON)
MongoDB
    ↓ (Change Streams)
SSE/WebSocket
    ↓ (realtime push)
React/Mobile App
```

## Features

- ✅ Shopify webhook receiver (themes/update, assets/update)
- ✅ Fetch `settings_data.json` from Shopify Admin API
- ✅ Parse Shopify theme schema → custom component JSON
- ✅ MongoDB storage with Change Streams
- ✅ Server-Sent Events (SSE) for realtime updates
- ✅ React app with live component rendering
- ✅ Production-ready, modular code

## Setup

### 1. Install Backend Dependencies

```bash
npm install
```

### 2. Configure Environment

Edit `.env` with your credentials:

```
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SHOPIFY_ACCESS_TOKEN=your_access_token_here
SHOPIFY_SHOP_DOMAIN=your-store.myshopify.com
MONGODB_URI=your_mongodb_connection_string
HOST=https://realtime-apps-json.vercel.app
PORT=3001
```

### 3. Start Backend Server

```bash
npm start
```

Server runs on `http://localhost:3001`

### 4. Setup Shopify Webhooks

In Shopify Admin → Settings → Notifications → Webhooks:

1. **Theme update webhook:**
   - Event: `themes/update`
   - URL: `https://realtime-apps-json.vercel.app/webhooks/theme`
   - Format: JSON

2. **Asset update webhook:**
   - Event: `assets/update`
   - URL: `https://realtime-apps-json.vercel.app/webhooks/asset`
   - Format: JSON

### 5. Install Frontend Dependencies

```bash
cd client
npm install
```

### 6. Start React App

```bash
npm start
```

React app runs on `http://localhost:3000`

## API Endpoints

### Backend

- `GET /` - Health check
- `POST /webhooks/theme` - Theme update webhook
- `POST /webhooks/asset` - Asset update webhook
- `GET /api/stream?shop=<domain>` - SSE realtime stream
- `GET /api/theme-data?shop=<domain>` - Get current theme data
- `POST /api/sync` - Manual sync trigger

## How It Works

### 1. Webhook Flow

```javascript
Shopify Theme Editor Change
    ↓
Webhook triggered (themes/update or assets/update)
    ↓
Backend receives webhook at /webhooks/theme
    ↓
Fetch settings_data.json from Shopify API
    ↓
Parse theme data (ThemeParser)
    ↓
Save to MongoDB (ThemeData col
lection)
    ↓
MongoDB Change Stream detects change
    ↓
Broadcast to all connected SSE clients
    ↓
React app receives update and re-renders
```

### 2. Theme Parser

Converts Shopify's `settings_data.json` format:

```json
{
  "current": {
    "sections": {
      "header": {
        "type": "header",
        "settings": { "logo": "..." }
      }
    }
  }
}
```

To custom component format:

```json
{
  "component": "Header",
  "props": {
    "logo": "..."
  }
}
```

### 3. MongoDB Change Streams

Watches the `theme_data` collection for changes and broadcasts to connected clients in realtime.

### 4. React Component Renderer

Dynamically renders components based on JSON:

```javascript
<ComponentRenderer components={themeData.components} theme={themeData.theme} />
```

## Project Structure

```
├── server.js                 # Express server entry point
├── config/
│   └── database.js          # MongoDB connection
├── models/
│   ├── Shop.js              # Shop model
│   └── ThemeData.js         # Theme data model
├── routes/
│   ├── webhooks.js          # Webhook routes
│   └── sse.js               # SSE routes
├── services/
│   ├── shopifyAPI.js        # Shopify API client
│   ├── themeParser.js       # Theme parser
│   ├── themeSync.js         # Theme sync logic
│   └── changeStream.js      # MongoDB change stream
├── client/                   # React frontend
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js           # Main app component
│       ├── App.css
│       ├── components/
│       │   ├── ComponentRenderer.js
│       │   └── ComponentRenderer.css
│       └── index.js
└── .env                     # Environment variables
```

## Testing

### 1. Test Manual Sync

```bash
curl -X POST http://localhost:3001/api/sync \
  -H "Content-Type: application/json" \
  -d '{"shopDomain": "testing-appx.myshopify.com"}'
```

### 2. Test SSE Connection

```bash
curl -N http://localhost:3001/api/stream?shop=testing-appx.myshopify.com
```

### 3. Test Theme Data Fetch

```bash
curl http://localhost:3001/api/theme-data?shop=testing-appx.myshopify.com
```

### 4. Make Changes in Shopify

1. Go to Shopify Admin → Online Store → Themes
2. Click "Customize" on your active theme
3. Make any change (text, color, section, block)
4. Click "Save"
5. Watch your React app update in realtime!

## MongoDB Collections

### shops
```javascript
{
  shopDomain: "testing-appx.myshopify.com",
  accessToken: "shpat_...",
  themeId: "123456789",
  isActive: true,
  lastSync: Date
}
```

### theme_data
```javascript
{
  shopDomain: "testing-appx.myshopify.com",
  themeId: "123456789",
  themeName: "Dawn",
  components: [...],
  rawData: { theme: {...}, original: {...} },
  version: 1,
  updatedAt: Date
}
```

## Deployment

### Backend (Vercel)

1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel --prod`
3. Set environment variables in Vercel dashboard

### Frontend (Vercel/Netlify)

```bash
cd client
npm run build
# Deploy build folder
```

## Troubleshooting

### Webhooks not triggering
- Check webhook URL is correct in Shopify Admin
- Verify HMAC signature validation
- Check server logs for errors

### SSE not connecting
- Ensure CORS is enabled
- Check firewall/proxy settings
- Verify API_URL in React app

### MongoDB Change Stream not working
- Ensure MongoDB is replica set (required for change streams)
- Check MongoDB Atlas cluster configuration
- Verify connection string

## Component Mapping

The parser automatically maps Shopify section types to custom components:

| Shopify Type | Custom Component |
|--------------|------------------|
| header | Header |
| announcement-bar | AnnouncementBar |
| slideshow | Banner |
| image-banner | Banner |
| featured-collection | FeaturedCollection |
| featured-product | FeaturedProduct |
| collection-list | CollectionList |
| multicolumn | MultiColumn |
| rich-text | RichText |
| footer | Footer |
| image-with-text | ImageWithText |
| video | Video |
| newsletter | Newsletter |

## License

MIT
