# Media API Documentation

This system automatically downloads images from Shopify CDN and stores them in MongoDB, then serves them via JSON API.

## Features

- ✅ Automatic image download during theme sync
- ✅ Store images as binary data in MongoDB
- ✅ Serve images via REST API
- ✅ JSON metadata for all images
- ✅ Duplicate detection (won't download same image twice)

## API Endpoints

### 1. Get All Media (JSON)
```
GET /api/media/:shopDomain
```

**Query Parameters:**
- `limit` (optional): Number of images to return (default: 100)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "media": [
    {
      "id": "673f8a1b2c3d4e5f6a7b8c9d",
      "filename": "teddy-bear-567952_1280.jpg",
      "originalUrl": "https://cmstestingg.myshopify.com/cdn/shop/files/teddy-bear-567952_1280.jpg?v=1763802644&width=3000",
      "contentType": "image/jpeg",
      "size": 245678,
      "width": null,
      "height": null,
      "alt": "",
      "usedIn": [
        {
          "themeId": "123456789",
          "sectionId": "image_banner"
        }
      ],
      "createdAt": "2024-11-22T10:30:00.000Z",
      "updatedAt": "2024-11-22T10:30:00.000Z"
    }
  ]
}
```

### 2. Get Image File
```
GET /api/media/:shopDomain/image/:mediaId
```

**Response:** Binary image data with proper Content-Type header

**Example:**
```
GET /api/media/cmstestingg.myshopify.com/image/673f8a1b2c3d4e5f6a7b8c9d
```

### 3. Download Specific Image
```
POST /api/media/:shopDomain/download
```

**Body:**
```json
{
  "imageUrl": "https://cmstestingg.myshopify.com/cdn/shop/files/teddy-bear-567952_1280.jpg?v=1763802644&width=3000",
  "metadata": {
    "alt": "Teddy Bear",
    "width": 1280,
    "height": 720
  }
}
```

**Response:**
```json
{
  "success": true,
  "media": {
    "id": "673f8a1b2c3d4e5f6a7b8c9d",
    "filename": "teddy-bear-567952_1280.jpg",
    "originalUrl": "https://...",
    "size": 245678,
    "contentType": "image/jpeg"
  }
}
```

## Scripts

### Download All Images
```bash
node scripts/downloadImages.js
```

Downloads all images from the latest theme data for your shop.

### View Stored Media
```bash
node scripts/viewMedia.js
```

Lists all images stored in MongoDB with metadata.

## Automatic Download

Images are automatically downloaded when:
1. Theme sync runs (via webhook or manual trigger)
2. The system extracts all image URLs from theme data
3. Each image is downloaded and stored in MongoDB
4. Duplicates are skipped automatically

## How It Works

1. **Theme Sync**: When theme data is synced, the system extracts all image URLs
2. **Download**: Images are downloaded from Shopify CDN using axios
3. **Storage**: Binary data is stored in MongoDB with metadata
4. **Serving**: Images can be served via API or as JSON metadata

## Example Usage

### Get all images as JSON:
```bash
curl http://localhost:3001/api/media/cmstestingg.myshopify.com
```

### Get specific image:
```bash
curl http://localhost:3001/api/media/cmstestingg.myshopify.com/image/673f8a1b2c3d4e5f6a7b8c9d > image.jpg
```

### Download specific image:
```bash
curl -X POST http://localhost:3001/api/media/cmstestingg.myshopify.com/download \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://cmstestingg.myshopify.com/cdn/shop/files/teddy-bear-567952_1280.jpg?v=1763802644&width=3000"}'
```

## Frontend Integration

```javascript
// Fetch all images
const response = await fetch('http://localhost:3001/api/media/cmstestingg.myshopify.com');
const { media } = await response.json();

// Display images
media.forEach(img => {
  const imgElement = document.createElement('img');
  imgElement.src = `http://localhost:3001/api/media/cmstestingg.myshopify.com/image/${img.id}`;
  imgElement.alt = img.alt || img.filename;
  document.body.appendChild(imgElement);
});
```

## Notes

- Images are stored as Buffer in MongoDB
- Duplicate URLs are automatically detected and skipped
- Original Shopify URLs are preserved in metadata
- Images are cached with max-age=31536000 (1 year)
