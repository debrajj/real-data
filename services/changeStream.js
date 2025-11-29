const ThemeData = require('../models/ThemeData');
const Media = require('../models/Media');

// Store SSE clients
const sseClients = new Map();

function addSSEClient(clientId, res, shopDomain) {
  sseClients.set(clientId, { res, shopDomain });
  console.log(`📡 SSE client added: ${clientId}, Total clients: ${sseClients.size}`);
}

function removeSSEClient(clientId) {
  sseClients.delete(clientId);
  console.log(`📡 SSE client removed: ${clientId}, Total clients: ${sseClients.size}`);
}

function broadcastToClients(data, shopDomain) {
  let sentCount = 0;
  
  for (const [clientId, client] of sseClients.entries()) {
    // Only send to clients watching this shop
    if (client.shopDomain === shopDomain) {
      try {
        client.res.write(`data: ${JSON.stringify(data)}\n\n`);
        sentCount++;
      } catch (error) {
        console.error(`❌ Error sending to client ${clientId}:`, error.message);
        sseClients.delete(clientId);
      }
    }
  }
  
  console.log(`📤 Broadcast sent to ${sentCount} clients for shop: ${shopDomain}`);
}

let themeStreamRetryCount = 0;
let mediaStreamRetryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 10000; // 10 seconds

function initializeChangeStream() {
  try {
    // Watch ThemeData collection
    const themeChangeStream = ThemeData.watch([], {
      fullDocument: 'updateLookup',
    });

    console.log('👀 MongoDB Change Stream watching ThemeData collection');
    themeStreamRetryCount = 0; // Reset on successful connection

    themeChangeStream.on('change', async (change) => {
      console.log('🔔 Theme change detected:', change.operationType);
      
      if (change.operationType === 'insert' || change.operationType === 'update' || change.operationType === 'replace') {
        const fullDocument = change.fullDocument;
        
        if (fullDocument) {
          // Get media for this shop
          const media = await Media.find({ shopDomain: fullDocument.shopDomain })
            .select('-data')
            .sort({ createdAt: -1 })
            .allowDiskUse(true)
            .limit(100)
            .lean();

          // Replace shopify:// URLs with CDN URLs
          const UrlReplacer = require('../services/urlReplacer');
          const urlReplacer = new UrlReplacer(fullDocument.shopDomain);
          const replacedComponents = await urlReplacer.replaceUrls(fullDocument.components);
          const replacedPages = await urlReplacer.replaceUrls(fullDocument.pages);

          const payload = {
            type: 'theme_update',
            operationType: change.operationType,
            data: {
              shopDomain: fullDocument.shopDomain,
              themeId: fullDocument.themeId,
              themeName: fullDocument.themeName,
              components: replacedComponents,
              pages: replacedPages,
              theme: fullDocument.rawData?.theme,
              version: fullDocument.version,
              updatedAt: fullDocument.updatedAt,
              media: media.map(m => ({
                id: m._id,
                filename: m.filename,
                originalUrl: m.originalUrl,
                cdnUrl: m.cdnUrl, // Include CDN URL
                contentType: m.contentType,
                size: m.size,
                width: m.width,
                height: m.height,
                alt: m.alt,
                url: `/api/media/${fullDocument.shopDomain}/image/${m._id}`,
              })),
            },
          };
          
          broadcastToClients(payload, fullDocument.shopDomain);
        }
      }
    });

    themeChangeStream.on('error', (error) => {
      console.error('❌ Theme change stream error:', error.message);
      themeStreamRetryCount++;
    });

    themeChangeStream.on('close', () => {
      if (themeStreamRetryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY * Math.pow(2, themeStreamRetryCount);
        console.log(`⚠️ Theme change stream closed, retrying in ${delay/1000}s (attempt ${themeStreamRetryCount + 1}/${MAX_RETRIES})`);
        setTimeout(initializeChangeStream, delay);
      } else {
        console.log('❌ Theme change stream max retries reached, giving up');
      }
    });

    // Watch Media collection
    const mediaChangeStream = Media.watch([], {
      fullDocument: 'updateLookup',
    });

    console.log('👀 MongoDB Change Stream watching Media collection');
    mediaStreamRetryCount = 0; // Reset on successful connection

    mediaChangeStream.on('change', async (change) => {
      console.log('🔔 Media change detected:', change.operationType);
      
      if (change.operationType === 'insert' || change.operationType === 'update' || change.operationType === 'replace') {
        const fullDocument = change.fullDocument;
        
        if (fullDocument) {
          const payload = {
            type: 'media_update',
            operationType: change.operationType,
            data: {
              id: fullDocument._id,
              shopDomain: fullDocument.shopDomain,
              filename: fullDocument.filename,
              originalUrl: fullDocument.originalUrl,
              cdnUrl: fullDocument.cdnUrl, // Include CDN URL
              contentType: fullDocument.contentType,
              size: fullDocument.size,
              width: fullDocument.width,
              height: fullDocument.height,
              alt: fullDocument.alt,
              url: `/api/media/${fullDocument.shopDomain}/image/${fullDocument._id}`,
              createdAt: fullDocument.createdAt,
              updatedAt: fullDocument.updatedAt,
            },
          };
          
          broadcastToClients(payload, fullDocument.shopDomain);
        }
      }
    });

    mediaChangeStream.on('error', (error) => {
      console.error('❌ Media change stream error:', error.message);
      mediaStreamRetryCount++;
    });

    mediaChangeStream.on('close', () => {
      if (mediaStreamRetryCount < MAX_RETRIES) {
        console.log(`⚠️ Media change stream closed (attempt ${mediaStreamRetryCount}/${MAX_RETRIES})`);
      } else {
        console.log('❌ Media change stream max retries reached');
      }
    });

  } catch (error) {
    console.error('❌ Failed to initialize change stream:', error);
  }
}

module.exports = {
  initializeChangeStream,
  addSSEClient,
  removeSSEClient,
  broadcastToClients,
};
