# Client Configuration API

Multi-tenant configuration system with automatic database creation.

## Base URL
```
http://localhost:3000/api/config
```

## Endpoints

### 1. Create Client Configuration
**POST** `/api/config`

Creates a new client configuration and automatically creates a dedicated database.

**Request Body:**
```json
{
  "clientKey": "kidzee",
  "environment": "development",
  "apiBaseUrl": "https://example.com/kushals",
  "appName": "Kushals",
  "primaryColor": "#E91E63",
  "bundleId": "com.kidzee.app",
  "packageName": "com.kidzee.app",
  "logoUrl": "https://www.kidzee.com/cdn/shop/files/logo_new.png?v=1738446411&width=1200",
  "shopifyConfig": {
    "development": {
      "shopDomain": "kidzee-test.myshopify.com",
      "accessToken": "test_access_token",
      "apiKey": "test_api_key",
      "apiSecret": "test_api_secret"
    },
    "production": {
      "shopDomain": "kidzee.myshopify.com",
      "accessToken": "prod_access_token",
      "apiKey": "prod_api_key",
      "apiSecret": "prod_api_secret"
    }
  }
}
```

**Required Fields:**
- `clientKey` - Unique identifier (lowercase alphanumeric and hyphens only)
- `apiBaseUrl` - Base API URL for the client
- `appName` - Application name
- `bundleId` - iOS bundle identifier
- `packageName` - Android package name

**Optional Fields:**
- `environment` - "production" or "development" (default: "development")
- `primaryColor` - Hex color code (default: "#E91E63")
- `logoUrl` - URL to logo image

**Response:**
```json
{
  "success": true,
  "message": "Client configuration created successfully",
  "data": {
    "clientKey": "kidzee",
    "environment": "development",
    "apiBaseUrl": "https://example.com/kushals",
    "appName": "Kushals",
    "primaryColor": "#E91E63",
    "bundleId": "com.kidzee.app",
    "packageName": "com.kidzee.app",
    "logoUrl": "https://www.kidzee.com/cdn/shop/files/logo_new.png",
    "databaseName": "shopify_kidzee",
    "isActive": true,
    "createdAt": "2025-01-29T10:30:00.000Z"
  }
}
```

---

### 2. Get All Configurations
**GET** `/api/config`

Retrieves all client configurations.

**Query Parameters:**
- `environment` (optional) - Filter by environment ("production" or "development")

**Example:**
```
GET /api/config?environment=production
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "clientKey": "kidzee",
      "environment": "development",
      "apiBaseUrl": "https://example.com/kushals",
      "appName": "Kushals",
      "primaryColor": "#E91E63",
      "bundleId": "com.kidzee.app",
      "packageName": "com.kidzee.app",
      "logoUrl": "https://www.kidzee.com/cdn/shop/files/logo_new.png",
      "databaseName": "shopify_kidzee",
      "isActive": true,
      "createdAt": "2025-01-29T10:30:00.000Z"
    }
  ]
}
```

---

### 3. Get Configuration by Client Key
**GET** `/api/config/:clientKey`

Retrieves a specific client configuration.

**Example:**
```
GET /api/config/kidzee
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clientKey": "kidzee",
    "environment": "development",
    "apiBaseUrl": "https://example.com/kushals",
    "appName": "Kushals",
    "primaryColor": "#E91E63",
    "bundleId": "com.kidzee.app",
    "packageName": "com.kidzee.app",
    "logoUrl": "https://www.kidzee.com/cdn/shop/files/logo_new.png",
    "databaseName": "shopify_kidzee",
    "isActive": true,
    "createdAt": "2025-01-29T10:30:00.000Z"
  }
}
```

---

### 4. Update Configuration
**PUT** `/api/config/:clientKey`

Updates an existing client configuration.

**Note:** Cannot update `clientKey`, `databaseName`, or `databaseUri`.

**Request Body:**
```json
{
  "appName": "Updated App Name",
  "primaryColor": "#FF5722",
  "logoUrl": "https://new-logo-url.com/logo.png"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Configuration updated successfully",
  "data": {
    "clientKey": "kidzee",
    "appName": "Updated App Name",
    "primaryColor": "#FF5722",
    "updatedAt": "2025-01-29T11:00:00.000Z"
  }
}
```

---

### 5. Deactivate Configuration (Soft Delete)
**DELETE** `/api/config/:clientKey`

Deactivates a configuration without deleting it.

**Example:**
```
DELETE /api/config/kidzee
```

**Response:**
```json
{
  "success": true,
  "message": "Configuration deactivated",
  "data": {
    "clientKey": "kidzee",
    "isActive": false,
    "updatedAt": "2025-01-29T11:30:00.000Z"
  }
}
```

---

### 6. Permanently Delete Configuration
**DELETE** `/api/config/:clientKey?permanent=true`

Permanently deletes a configuration and closes database connection.

**Example:**
```
DELETE /api/config/kidzee?permanent=true
```

**Response:**
```json
{
  "success": true,
  "message": "Configuration permanently deleted"
}
```

---

### 7. Activate Configuration
**POST** `/api/config/:clientKey/activate`

Reactivates a deactivated configuration.

**Example:**
```
POST /api/config/kidzee/activate
```

**Response:**
```json
{
  "success": true,
  "message": "Configuration activated",
  "data": {
    "clientKey": "kidzee",
    "isActive": true,
    "updatedAt": "2025-01-29T12:00:00.000Z"
  }
}
```

---

### 8. Switch Environment
**POST** `/api/config/:clientKey/switch-environment`

Switches between development (testing) and production environment.

**Request Body:**
```json
{
  "environment": "production"
}
```

**Example:**
```
POST /api/config/kidzee/switch-environment
Body: {"environment": "production"}
```

**Response:**
```json
{
  "success": true,
  "message": "Environment switched to production",
  "data": {
    "clientKey": "kidzee",
    "environment": "production",
    "activeStore": "kidzee.myshopify.com",
    "updatedAt": "2025-01-29T12:30:00.000Z"
  }
}
```

---

### 9. Get Active Store
**GET** `/api/config/:clientKey/active-store`

Gets the currently active Shopify store based on the current environment.

**Example:**
```
GET /api/config/kidzee/active-store
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clientKey": "kidzee",
    "environment": "development",
    "shopDomain": "kidzee-test.myshopify.com",
    "hasAccessToken": true,
    "hasApiKey": true
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Missing required fields: clientKey, apiBaseUrl, appName, bundleId, packageName"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Configuration not found for client: kidzee"
}
```

### 409 Conflict
```json
{
  "success": false,
  "error": "Configuration for client 'kidzee' already exists"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Error message details"
}
```

---

## Database Structure

When a new configuration is created, a dedicated MongoDB database is automatically created with the following structure:

**Database Name:** `shopify_{clientKey}`

**Collections:**
- `products` - Product data
- `collections` - Collection data
- `media` - Media files
- `themedata` - Theme configurations
- `blogs` - Blog posts
- `articles` - Article content
- `discounts` - Discount rules
- `shops` - Shop information

---

## Postman Collection

Import this collection to test the API:

```json
{
  "info": {
    "name": "Client Configuration API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Config",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"clientKey\": \"kidzee\",\n  \"environment\": \"development\",\n  \"apiBaseUrl\": \"https://example.com/kushals\",\n  \"appName\": \"Kushals\",\n  \"primaryColor\": \"#E91E63\",\n  \"bundleId\": \"com.kidzee.app\",\n  \"packageName\": \"com.kidzee.app\",\n  \"logoUrl\": \"https://www.kidzee.com/cdn/shop/files/logo_new.png?v=1738446411&width=1200\"\n}"
        },
        "url": {"raw": "http://localhost:3000/api/config", "protocol": "http", "host": ["localhost"], "port": "3000", "path": ["api", "config"]}
      }
    },
    {
      "name": "Get All Configs",
      "request": {
        "method": "GET",
        "url": {"raw": "http://localhost:3000/api/config", "protocol": "http", "host": ["localhost"], "port": "3000", "path": ["api", "config"]}
      }
    },
    {
      "name": "Get Config by Key",
      "request": {
        "method": "GET",
        "url": {"raw": "http://localhost:3000/api/config/kidzee", "protocol": "http", "host": ["localhost"], "port": "3000", "path": ["api", "config", "kidzee"]}
      }
    },
    {
      "name": "Update Config",
      "request": {
        "method": "PUT",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"appName\": \"Updated App Name\",\n  \"primaryColor\": \"#FF5722\"\n}"
        },
        "url": {"raw": "http://localhost:3000/api/config/kidzee", "protocol": "http", "host": ["localhost"], "port": "3000", "path": ["api", "config", "kidzee"]}
      }
    },
    {
      "name": "Deactivate Config",
      "request": {
        "method": "DELETE",
        "url": {"raw": "http://localhost:3000/api/config/kidzee", "protocol": "http", "host": ["localhost"], "port": "3000", "path": ["api", "config", "kidzee"]}
      }
    },
    {
      "name": "Activate Config",
      "request": {
        "method": "POST",
        "url": {"raw": "http://localhost:3000/api/config/kidzee/activate", "protocol": "http", "host": ["localhost"], "port": "3000", "path": ["api", "config", "kidzee", "activate"]}
      }
    }
  ]
}
```

---

## Notes

1. **Client Key Format**: Must be lowercase alphanumeric with hyphens only (e.g., "kidzee", "my-app-123")
2. **Database Naming**: Databases are automatically named as `shopify_{clientKey}`
3. **Soft Delete**: By default, DELETE deactivates the config. Use `?permanent=true` to permanently delete
4. **Environment**: Use "production" for live apps and "development" for testing
5. **Database Connection**: Connections are managed automatically and cached for performance
