# Shopify App Deployment Guide

## Pre-Deployment Checklist

- [ ] All code committed to GitHub
- [ ] MongoDB Atlas cluster is set up and accessible
- [ ] Shopify Partners account created
- [ ] App created in Shopify Partners Dashboard

---

## Step 1: Deploy to Netlify

### Option A: Via Netlify UI
1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Netlify auto-detects settings from `netlify.toml`
5. Click "Deploy site"

### Option B: Via Netlify CLI
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

---

## Step 2: Configure Environment Variables

In Netlify Dashboard → Site Settings → Environment Variables:

```
SHOPIFY_API_KEY=<from Shopify Partners>
SHOPIFY_API_SECRET=<from Shopify Partners>
SHOPIFY_SCOPES=read_products,write_products,read_themes,write_themes,read_content,write_content,read_price_rules,write_price_rules
MONGODB_URI=<your MongoDB connection string>
APP_URL=https://your-app-name.netlify.app
NODE_ENV=production
```

---

## Step 3: Configure Shopify App

### In Shopify Partners Dashboard (https://partners.shopify.com):

1. **Create/Select Your App**
   - Go to Apps → Create app (or select existing)
   - Choose "Create app manually"

2. **App Setup - URLs**
   ```
   App URL: https://your-app-name.netlify.app
   
   Allowed redirection URL(s):
   - https://your-app-name.netlify.app/api/shopify/callback
   ```

3. **API Access - Scopes**
   Select these scopes:
   - `read_products`, `write_products`
   - `read_themes`, `write_themes`
   - `read_content`, `write_content`
   - `read_price_rules`, `write_price_rules`

4. **Get API Credentials**
   - Copy `API key` and `API secret key`
   - Add them to Netlify environment variables

---

## Step 4: Register Webhooks

In Shopify Partners → Your App → Webhooks:

| Event | URL |
|-------|-----|
| `app/uninstalled` | `https://your-app.netlify.app/api/shopify/uninstall` |
| `themes/update` | `https://your-app.netlify.app/webhooks/theme` |
| `products/create` | `https://your-app.netlify.app/webhooks/products` |
| `products/update` | `https://your-app.netlify.app/webhooks/products` |
| `products/delete` | `https://your-app.netlify.app/webhooks/products` |

---

## Step 5: Test Installation

1. In Partners Dashboard, click "Test on development store"
2. Select a development store
3. Install the app
4. Verify OAuth flow works
5. Test all features

---

## Step 6: Submit to Shopify App Store

### Prepare App Listing:
- [ ] App name and tagline
- [ ] Detailed description (what it does, benefits)
- [ ] Screenshots (min 3, showing key features)
- [ ] App icon (1200x1200px)
- [ ] Demo video (optional but recommended)
- [ ] Pricing plan
- [ ] Privacy policy URL
- [ ] Support email/URL

### Submit for Review:
1. Go to Partners Dashboard → Your App → Distribution
2. Select "Public" distribution
3. Complete all required fields
4. Submit for review

### Review Timeline:
- Initial review: 5-10 business days
- May require changes based on feedback
- Once approved, app goes live on Shopify App Store

---

## Post-Launch

- [ ] Monitor error logs in Netlify
- [ ] Set up uptime monitoring
- [ ] Respond to merchant support requests
- [ ] Track app analytics in Partners Dashboard
- [ ] Iterate based on merchant feedback

---

## Useful Links

- Shopify Partners: https://partners.shopify.com
- Netlify Dashboard: https://app.netlify.com
- MongoDB Atlas: https://cloud.mongodb.com
- Shopify App Requirements: https://shopify.dev/docs/apps/launch/app-requirements
- App Store Listing Guidelines: https://shopify.dev/docs/apps/launch/listing
