import React, { useState, useEffect } from 'react';
import './App.css';
import ComponentRenderer from './components/ComponentRenderer';

// Determine API URL based on environment
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001'
  : window.location.origin; // Use same domain for Netlify deployment
const SHOP_DOMAIN = 'testing-appx.myshopify.com';
console.log('🔧 API_URL:', API_URL); // Debug log

function App() {
  const [themeData, setThemeData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const [showJson, setShowJson] = useState(true);
  const [showExtensions, setShowExtensions] = useState(true);

  useEffect(() => {
    // Fetch initial theme data
    fetchThemeData();

    // Connect to SSE for realtime updates
    const eventSource = new EventSource(`${API_URL}/api/stream?shop=${SHOP_DOMAIN}`);

    eventSource.onopen = () => {
      console.log('✅ SSE Connected');
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📥 SSE Message:', data);

        if (data.type === 'theme_update') {
          setThemeData(data.data);
          setLastUpdate(new Date());
        }
      } catch (err) {
        console.error('❌ SSE parse error:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('❌ SSE Error:', err);
      setIsConnected(false);
      setError('Connection lost. Reconnecting...');
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const fetchThemeData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/theme-data?shop=${SHOP_DOMAIN}`);
      const result = await response.json();
      
      if (result.success) {
        setThemeData(result.data);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError('Failed to load theme data');
    }
  };

  const triggerManualSync = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopDomain: SHOP_DOMAIN }),
      });
      
      const result = await response.json();
      console.log('🔄 Manual sync triggered:', result);
    } catch (err) {
      console.error('❌ Sync error:', err);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🛍️ Shopify Theme Live Preview</h1>
        <div className="status-bar">
          <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
          {lastUpdate && (
            <span className="last-update">
              Last update: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button onClick={triggerManualSync} className="sync-btn">
            🔄 Manual Sync
          </button>
        </div>
        {error && <div className="error">{error}</div>}
      </header>

      <main className="App-main">
        {themeData ? (
          <div className="preview-container">
            <div className="mobile-preview">
              <div className="mobile-frame">
                <div className="mobile-notch"></div>
                <div className="mobile-content">
                  <ComponentRenderer components={themeData.components} theme={themeData.theme} />
                </div>
              </div>
            </div>
            
            <div className="side-panel">
              <div className="extensions-panel">
                <div className="panel-header">
                  <h3>🧩 Active Theme Extensions</h3>
                  <button onClick={() => setShowExtensions(!showExtensions)} className="toggle-btn">
                    {showExtensions ? '▼' : '▶'}
                  </button>
                </div>
                {showExtensions && (
                  <div className="extensions-list">
                    {themeData.theme?.app_extensions && themeData.theme.app_extensions.length > 0 ? (
                      themeData.theme.app_extensions.map((ext, index) => (
                        <div key={index} className="extension-item">
                          <div className="extension-icon">📦</div>
                          <div className="extension-info">
                            <h4>{ext.title || ext.name || 'Unnamed Extension'}</h4>
                            <p className="extension-type">{ext.type || 'App Extension'}</p>
                            {ext.enabled !== undefined && (
                              <span className={`extension-status ${ext.enabled ? 'active' : 'inactive'}`}>
                                {ext.enabled ? '✓ Active' : '✗ Inactive'}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-extensions">No active extensions found</div>
                    )}
                  </div>
                )}
              </div>

              <div className="json-panel-section">
                <div className="panel-header">
                  <h3>📄 Theme JSON Data</h3>
                  <button onClick={() => setShowJson(!showJson)} className="toggle-btn">
                    {showJson ? '▼' : '▶'}
                  </button>
                </div>
                {showJson && (
                  <pre className="json-content">
                    {JSON.stringify(themeData, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="loading">Loading theme data...</div>
        )}
      </main>
    </div>
  );
}

export default App;
