# Theme Sync Guide - Why Real-Time Updates Don't Work

## The Problem

Theme data in MongoDB doesn't update automatically when you make changes in Shopify's theme customizer because **Shopify doesn't send webhooks for theme customization changes**.

## Why This Happens

### Shopify Theme Webhooks ONLY Fire For:
- ✅ `themes/create` - When a new theme is created
- ✅ `themes/publish` - When a theme is published
- ✅ `themes/delete` - When a theme is deleted

### Shopify Theme Webhooks DON'T Fire For:
- ❌ Editing theme settings in the customizer
- ❌ Changing section settings
- ❌ Modifying `index.json` or template files
- ❌ Updating colors, fonts, or any theme settings

**Reason**: Theme files are considered "code" not "data", and changes happen too frequently during customization.

---

## Solutions

### Option 1: Manual Sync (Recommended for Development)

Run the sync script whenever you make theme changes:

```bash
node scripts/syncNewTheme.js
```

Or use the new API endpoint:

```bash
curl -X POST http://localhost:3000/api/theme/sync
```

### Option 2: Auto-Sync with Cron Job (Recommended for Production)

Install the cron package:

```bash
npm install node-cron
```

Run the auto-sync script:

```bash
node scripts/autoSyncTheme.js
```

This will sync your theme every 5 minutes automatically.

To run it in the background:

```bash
# Using PM2
pm2 start scripts/autoSyncTheme.js --name "theme-auto-sync"

# Or using nohup
nohup node scripts/autoSyncTheme.js > theme-sync.log 2>&1 &
```

### Option 3: Add Sync Button to Admin Panel

Use the new API endpoints:

**Trigger Sync:**
```javascript
POST /api/theme/sync
Body: {
  "shopDomain": "cmstestingg.myshopify.com",
  "themeId": "your-theme-id" // optional
}
```

**Check Sync Status:**
```javascript
GET /api/theme/status?shopDomain=cmstestingg.myshopify.com
```

**Get Theme Data:**
```javascript
GET /api/theme/data?shopDomain=cmstestingg.myshopify.com
```

---

## Best Practices

### For Development:
1. Make changes in Shopify theme customizer
2. Run `node scripts/syncNewTheme.js`
3. Refresh your frontend to see changes

### For Production:
1. Set up auto-sync with cron (every 5-10 minutes)
2. Add a "Sync Now" button in your admin panel
3. Monitor sync logs for errors

### For Staging:
1. Use webhooks for product/collection changes (already working)
2. Use manual sync for theme changes
3. Test thoroughly before deploying to production

---

## Current Webhook Status

✅ **Working Webhooks:**
- Products (create, update, delete)
- Collections (create, update, delete)
- Orders (create, update, etc.)
- Customers (create, update, etc.)
- Themes (publish only)

❌ **Not Available:**
- Theme customization changes
- Theme settings updates
- Section modifications

---

## API Endpoints Added

### 1. Sync Theme
```bash
POST /api/theme/sync
```

Manually triggers a full theme sync.

**Response:**
```json
{
  "success": true,
  "message": "Theme synced successfully",
  "version": 5,
  "components": 12,
  "themeId": "123456789"
}
```

### 2. Get Theme Status
```bash
GET /api/theme/status
```

Returns current sync status.

**Response:**
```json
{
  "success": true,
  "synced": true,
  "version": 5,
  "lastSync": "2024-01-15T10:30:00.000Z",
  "themeId": "123456789",
  "themeName": "Dawn",
  "componentsCount": 12
}
```

### 3. Get Theme Data
```bash
GET /api/theme/data
```

Returns full theme data from MongoDB.

---

## Files Created/Modified

### New Files:
- `scripts/autoSyncTheme.js` - Auto-sync with cron
- `routes/theme.js` - Theme API endpoints
- `THEME_SYNC_GUIDE.md` - This guide

### Modified Files:
- `server.js` - Added theme routes

---

## Troubleshooting

### Theme not syncing?
1. Check MongoDB connection
2. Verify SHOPIFY_SHOP_DOMAIN in .env
3. Verify SHOPIFY_ACCESS_TOKEN has theme read permissions
4. Check logs for errors

### Sync taking too long?
- Normal sync takes 30-60 seconds
- Includes downloading images
- Check network connection

### Old data showing?
- Clear browser cache
- Check theme version number
- Verify MongoDB has latest data

---

## Next Steps

1. **For immediate use**: Run `node scripts/syncNewTheme.js` after theme changes
2. **For production**: Set up auto-sync with PM2
3. **For better UX**: Add sync button to admin panel
4. **For monitoring**: Set up alerts for sync failures
