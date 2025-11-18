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
  const [currentPage, setCurrentPage] = useState('index');

  useEffect(() => {
    // Fetch initial theme data
    fetchThemeData();
    setIsConnected(true);

    // Use polling for Netlify (SSE doesn't work with serverless functions)
    const pollingInterval = setInterval(() => {
      fetchThemeData();
    }, 5000); // Poll every 5 seconds

    return () => {
      clearInterval(pollingInterval);
    };
  }, []);

  const fetchThemeData = async () => {
    try {
      console.log('📡 Fetching theme data...');
      const response = await fetch(`${API_URL}/api/theme-data?shop=${SHOP_DOMAIN}`);
      const result = await response.json();
      
      console.log('📥 Fetch result:', result);
      
      if (result.success) {
        setThemeData(result.data);
        setLastUpdate(new Date());
        setError(null);
        console.log('✅ Theme data updated');
      } else {
        console.warn('⚠️ No theme data found:', result);
        setError(result.error || 'No theme data available');
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
      
      // Fetch updated data immediately after sync
      setTimeout(() => {
        fetchThemeData();
      }, 2000); // Wait 2 seconds for sync to complete
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
        {themeData && themeData.pages && (
          <div className="page-selector">
            <label>Page: </label>
            <select value={currentPage} onChange={(e) => setCurrentPage(e.target.value)}>
              {Object.keys(themeData.pages).map(pageName => (
                <option key={pageName} value={pageName}>
                  {pageName.charAt(0).toUpperCase() + pageName.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}
        {error && <div className="error">{error}</div>}
      </header>

      <main className="App-main">
        {themeData ? (
          <div className="preview-container">
            <div className="mobile-preview">
              <div className="mobile-frame">
                <div className="mobile-notch"></div>
                <div className="mobile-content">
                  <ComponentRenderer 
                    components={themeData.pages?.[currentPage]?.components || themeData.components} 
                    theme={themeData.theme} 
                  />
                </div>
              </div>
            </div>
            
            <div className="side-panel">
              <div className="json-panel-section">
                <div className="panel-header">
                  <h3>📄 Live JSON Changes</h3>
                  <div className="panel-controls">
                    <span className="version-badge">v{themeData.version || 1}</span>
                    <button onClick={() => setShowJson(!showJson)} className="toggle-btn">
                      {showJson ? '▼' : '▶'}
                    </button>
                  </div>
                </div>
                {showJson && (
                  <div className="json-viewer">
                    <div className="json-section">
                      <h4>🏠 Current Page: {currentPage}</h4>
                      <pre className="json-content">
                        {JSON.stringify(
                          themeData.pages?.[currentPage] || themeData.components,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                    
                    <div className="json-section">
                      <h4>🎨 Theme Settings</h4>
                      <pre className="json-content">
                        {JSON.stringify(themeData.rawData?.theme || {}, null, 2)}
                      </pre>
                    </div>
                    
                    <div className="json-section">
                      <h4>📦 All Pages</h4>
                      <pre className="json-content">
                        {JSON.stringify(
                          Object.keys(themeData.pages || {}),
                          null,
                          2
                        )}
                      </pre>
                    </div>
                    
                    <div className="json-section">
                      <h4>🔧 Full Data</h4>
                      <pre className="json-content">
                        {JSON.stringify(themeData, null, 2)}
                      </pre>
                    </div>
                  </div>
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
