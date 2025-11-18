# HOP_DOMAIN=testing-appx.myshopify.com
MONGODB_URI=mongodb+srv://shopify_db_user:debraj123@shopifyyyy.ed4qywd.mongodb.net/shopify_images
PORT=3001
```

## Frontend client/.env (client directory)

### For Local Development:
```
REACT_APP_API_URL=http://localhost:3001
REACT_APP_SHOP_DOMAIN=testing-appx.myshopify.com
```

### For Production (Vercel):
```
REACT_APP_API_URL=https://realtime-apps-json.vercel.app
REACT_APP_SHOP_DOMAIN=testing-appx.myshopify.com
```

**Note:** Currently, the backend API is not deployed. You need to either:
1. Deploy the backend separately to a Vercel project
2. Or combine both frontend and backend in the same deployment