# Shopify Webhook Setup for Live Theme Sync

## Step 1: Configure Netlify Environment Variables

Go to Netlify Dashboard → Site Settings → Environment Variables and add:

```
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SHOPIFY_ACCESS_TOKEN=your_access_token_here
SHOPIFY_SHOP_DOMAIN=your-store.myshopify.com
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret_here
MONGODB_URI=your_mongodb_uri_here
PORT=3001
```

## Step 2: Set Up Shopify Webhooks

### Option A: Using Shopify Admin (Recommended)

1. Go to **Shopify Admin** → **Settings** → **Notifications**
2. Scroll down to **Webhooks** section
3. Click **Create webhook**

#### Webhook 1: Theme Updates
- **Event**: `themes/update`
- **Format**: JSON
- **URL**: `https://realx-dara.netlify.app/.netlify/functions/api/webhooks/theme`
- **API Version**: Latest (2024-10)

#### Webhook 2: Asset Updates (Optional but recommended)
- **Event**: `themes/publish` 
- **Format**: JSON
- **URL**: `https://realx-dara.netlify.app/.netlify/functions/api/webhooks/theme`
- **API Version**: Latest (2024-10)

### Option B: Using Shopify API

Run this curl command (replace YOUR_ACCESS_TOKEN):

```bash
curl -X POST "https://your-store.myshopify.com/admin/api/2024-10/webhooks.json" \
  -H "X-Shopify-Access-Token: YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook": {
      "topic": "themes/update",
      "address": "https://realx-dara.netlify.app/.netlify/functions/api/webhooks/theme",
      "format": "json"
    }
  }'
```

## Step 3: Test the Connection

1. Go to **Shopify Admin** → **Online Store** → **Themes**
2. Click **Customize** on your active theme
3. Make any change (change text, color, add a section, etc.)
4. Click **Save**
5. Check your Netlify app at https://realx-dara.netlify.app/
6. The changes should appear in real-time!

## Step 4: Manual Sync (If Needed)

If webhooks aren't working yet, you can trigger a manual sync:

```bash
curl -X POST "https://realx-dara.netlify.app/.netlify/functions/api/api/sync" \
  -H "Content-Type: application/json" \
  -d '{"shopDomain": "your-store.myshopify.com"}'
```

Or click the "🔄 Manual Sync" button in your app.

## Troubleshooting

### Webhooks not triggering?
1. Check webhook status in Shopify Admin → Settings → Notifications → Webhooks
2. Look for failed deliveries (red X icon)
3. Check Netlify function logs: Site → Functions → api

### CORS errors?
- Make sure Netlify has redeployed with the latest code
- Check that environment variables are set in Netlify

### MongoDB connection issues?
- Verify MONGODB_URI is correct in Netlify environment variables
- Check MongoDB Atlas network access allows connections from anywhere (0.0.0.0/0)

## How It Works

```
Shopify Theme Editor
    ↓ (Save button clicked)
Shopify sends webhook
    ↓
Netlify Function receives webhook
    ↓
Fetches settings_data.json from Shopify API
    ↓
Parses and saves to MongoDB
    ↓
MongoDB Change Stream detects update
    ↓
Broadcasts to all connected clients via SSE
    ↓
Your app updates in real-time!
```

## Webhook URLs Reference

- **Theme webhook**: `https://realx-dara.netlify.app/.netlify/functions/api/webhooks/theme`
- **Asset webhook**: `https://realx-dara.netlify.app/.netlify/functions/api/webhooks/asset`
- **SSE stream**: `https://realx-dara.netlify.app/.netlify/functions/api/api/stream?shop=your-store.myshopify.com`
- **Manual sync**: `https://realx-dara.netlify.app/.netlify/functions/api/api/sync`
