const ThemeData = require('../models/ThemeData');

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

function initializeChangeStream() {
  try {
    const changeStream = ThemeData.watch([], {
      fullDocument: 'updateLookup',
    });

    console.log('👀 MongoDB Change Stream watching ThemeData collection');

    changeStream.on('change', (change) => {
      console.log('🔔 Change detected:', change.operationType);
      
      if (change.operationType === 'insert' || change.operationType === 'update' || change.operationType === 'replace') {
        const fullDocument = change.fullDocument;
        
        if (fullDocument) {
          const payload = {
            type: 'theme_update',
            operationType: change.operationType,
            data: {
              shopDomain: fullDocument.shopDomain,
              themeId: fullDocument.themeId,
              themeName: fullDocument.themeName,
              components: fullDocument.components,
              theme: fullDocument.rawData?.theme,
              version: fullDocument.version,
              updatedAt: fullDocument.updatedAt,
            },
          };
          
          broadcastToClients(payload, fullDocument.shopDomain);
        }
      }
    });

    changeStream.on('error', (error) => {
      console.error('❌ Change stream error:', error);
    });

    changeStream.on('close', () => {
      console.log('⚠️ Change stream closed, reinitializing...');
      setTimeout(initializeChangeStream, 5000);
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
