import React, { useState, useEffect } from 'react';
import './App.css';
import './components/DawnTheme.css';
import './components/dawn-base.css';
import ComponentRenderer from './components/ComponentRenderer';

// Determine API URL based on environment
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001'
  : window.location.origin; // Use same domain for Netlify deployment
const SHOP_DOMAIN = 'cmstestingg.myshopify.com';
console.log('🔧 API_URL:', API_URL); // Debug log

function App() {
  const [themeData, setThemeData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const [showJson, setShowJson] = useState(true);
  const [currentPage, setCurrentPage] = useState('index');
  const [viewMode, setViewMode] = useState('mobile'); // 'mobile' or 'desktop'
  const [copySuccess, setCopySuccess] = useState(false);
  const [products, setProducts] = useState([]);
  const [showProducts, setShowProducts] = useState(true);
  const [showThemeSettings, setShowThemeSettings] = useState(true);

  useEffect(() => {
    // Fetch initial theme data
    fetchThemeData();
    fetchProducts();
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
        console.log('📸 Media count:', result.data.media?.length || 0);
      } else {
        console.warn('⚠️ No theme data found:', result);
        setError(result.error || 'No theme data available');
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError('Failed to load theme data');
    }
  };

  const fetchProducts = async () => {
    try {
      console.log('📡 Fetching products...');
      const response = await fetch(`${API_URL}/api/products/${SHOP_DOMAIN}?limit=50`);
      const result = await response.json();
      
      if (result.success) {
        setProducts(result.products);
        console.log('✅ Products loaded:', result.count);
      }
    } catch (err) {
      console.error('❌ Products fetch error:', err);
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

  const syncProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products/${SHOP_DOMAIN}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const result = await response.json();
      console.log('🏷️ Product sync triggered:', result);
      
      // Fetch updated products after sync
      setTimeout(() => {
        fetchProducts();
      }, 3000); // Wait 3 seconds for sync to complete
    } catch (err) {
      console.error('❌ Product sync error:', err);
    }
  };

  const copyJsonToClipboard = () => {
    const jsonData = JSON.stringify(
      themeData.pages?.[currentPage]?.components || themeData.components || [],
      null,
      2
    );
    
    navigator.clipboard.writeText(jsonData).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
            🔄 Sync Theme
          </button>
          <button onClick={syncProducts} className="sync-btn">
            🏷️ Sync Products
          </button>
        </div>
        <div className="controls-row">
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
          <div className="view-mode-toggle">
            <button 
              className={`mode-btn ${viewMode === 'mobile' ? 'active' : ''}`}
              onClick={() => setViewMode('mobile')}
            >
              📱 Mobile
            </button>
            <button 
              className={`mode-btn ${viewMode === 'desktop' ? 'active' : ''}`}
              onClick={() => setViewMode('desktop')}
            >
              🖥️ Desktop
            </button>
          </div>
        </div>
        {error && <div className="error">{error}</div>}
      </header>

      <main className="App-main">
        {themeData ? (
          <div className="preview-container">
            <div className={`preview-wrapper ${viewMode}`}>
              {viewMode === 'mobile' ? (
                <div className="mobile-preview">
                  <div className="mobile-frame">
                    <div className="mobile-notch"></div>
                    <div className="mobile-content">
                      <ComponentRenderer 
                        components={themeData.pages?.[currentPage]?.components || themeData.components} 
                        theme={themeData.theme}
                        media={themeData.media || []}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="desktop-preview">
                  <div className="desktop-frame">
                    <div className="browser-bar">
                      <div className="browser-dots">
                        <span className="dot red"></span>
                        <span className="dot yellow"></span>
                        <span className="dot green"></span>
                      </div>
                      <div className="browser-url">
                        🔒 {SHOP_DOMAIN}
                      </div>
                    </div>
                    <div className="desktop-content">
                      <ComponentRenderer 
                        components={themeData.pages?.[currentPage]?.components || themeData.components} 
                        theme={themeData.theme}
                        media={themeData.media || []}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="side-panel">
              <div className="json-panel-section">
                <div className="panel-header">
                  <h3>📄 {currentPage.toUpperCase()} - v{themeData.version || 1}</h3>
                  <div className="panel-controls">
                    <button 
                      onClick={copyJsonToClipboard} 
                      className="copy-btn"
                      title="Copy JSON"
                    >
                      {copySuccess ? '✓ Copied!' : '📋 Copy'}
                    </button>
                    <button onClick={() => setShowJson(!showJson)} className="toggle-btn">
                      {showJson ? '▼' : '▶'}
                    </button>
                  </div>
                </div>
                {showJson && (
                  <pre className="json-content">
                    {JSON.stringify(
                      themeData.pages?.[currentPage]?.components || themeData.components || [],
                      null,
                      2
                    )}
                  </pre>
                )}
              </div>

              {themeData.theme && (
                <div className="json-panel-section">
                  <div className="panel-header">
                    <h3>🎨 Theme Settings</h3>
                    <button onClick={() => setShowThemeSettings(!showThemeSettings)} className="toggle-btn">
                      {showThemeSettings ? '▼' : '▶'}
                    </button>
                  </div>
                  {showThemeSettings && (
                    <pre className="json-content">
                      {JSON.stringify(themeData.theme, null, 2)}
                    </pre>
                  )}
                </div>
              )}

              {products && products.length > 0 && (
                <div className="json-panel-section">
                  <div className="panel-header">
                    <h3>🏷️ Products ({products.length})</h3>
                    <button onClick={() => setShowProducts(!showProducts)} className="toggle-btn">
                      {showProducts ? '▼' : '▶'}
                    </button>
                  </div>
                  {showProducts && (
                    <pre className="json-content">
                      {JSON.stringify(products, null, 2)}
                    </pre>
                  )}
                </div>
              )}
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
