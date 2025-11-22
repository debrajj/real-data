const express = require('express');
const router = express.Router();
const MediaService = require('../services/mediaService');
const Media = require('../models/Media');

/**
 * GET /api/media/:shopDomain
 * Get all media for a shop (JSON list)
 */
router.get('/:shopDomain', async (req, res) => {
  try {
    const { shopDomain } = req.params;
    const { limit } = req.query;

    const mediaService = new MediaService(shopDomain);
    const media = await mediaService.getAllMedia({ limit: parseInt(limit) || 100 });

    // Add full URL to each media item
    const mediaWithUrls = media.map(m => ({
      ...m,
      url: `/api/media/${shopDomain}/image/${m.id}`,
    }));

    res.json({
      success: true,
      count: mediaWithUrls.length,
      media: mediaWithUrls,
    });
  } catch (error) {
    console.error('❌ Error fetching media:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/media/:shopDomain/image/:mediaId
 * Get actual image file by ID
 */
router.get('/:shopDomain/image/:mediaId', async (req, res) => {
  try {
    const { mediaId } = req.params;

    const media = await Media.findById(mediaId);
    
    if (!media) {
      return res.status(404).json({
        success: false,
        error: 'Image not found',
      });
    }

    res.set('Content-Type', media.contentType);
    res.set('Content-Length', media.size);
    res.set('Cache-Control', 'public, max-age=31536000');
    res.send(media.data);
  } catch (error) {
    console.error('❌ Error serving image:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/media/:shopDomain/download
 * Download specific image URL
 */
router.post('/:shopDomain/download', async (req, res) => {
  try {
    const { shopDomain } = req.params;
    const { imageUrl, metadata } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'imageUrl is required',
      });
    }

    const mediaService = new MediaService(shopDomain);
    const media = await mediaService.downloadAndStore(imageUrl, metadata);

    if (!media) {
      return res.status(500).json({
        success: false,
        error: 'Failed to download image',
      });
    }

    res.json({
      success: true,
      media: {
        id: media._id,
        filename: media.filename,
        originalUrl: media.originalUrl,
        cdnUrl: media.cdnUrl,
        size: media.size,
        contentType: media.contentType,
      },
    });
  } catch (error) {
    console.error('❌ Error downloading image:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
