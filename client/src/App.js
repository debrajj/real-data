import React, { useState, useEffect } from 'react';
import './App.css';
import './assets/ella-theme/ella-master.css';
import ComponentRenderer from './components/ComponentRenderer';
import UnifiedDiscountAdmin from './components/UnifiedDiscountAdmin';
import BestSellerAdmin from './components/BestSellerAdmin';
import BestSellerManager from './components/BestSellerManager';



// Determine API URL based on environment
// Since frontend and backend are on the same server, use same origin
const API_URL = process.env.REACT_APP_API_URL || '';
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
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [currentView, setCurrentView] = useState('preview'); // 'preview', 'discounts', 'bestsellers'
  const [editableJson, setEditableJson] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);


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
      console.log('📡 Fetching theme data from:', `${API_URL}/api/theme/data?shopDomain=${SHOP_DOMAIN}`);
      
      const response = await fetch(`${API_URL}/api/theme/data?shopDomain=${SHOP_DOMAIN}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
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
      setError(`Connection failed: ${err.message}`);
      setIsConnected(false);
    }
  };



  const triggerManualSync = async () => {
    if (isSyncing) return; // Prevent multiple syncs
    
    try {
      setIsSyncing(true);
      console.log('🔄 Triggering theme sync...');
      setError('🔄 Syncing theme from Shopify... This may take 30-60 seconds.');
      
      const response = await fetch(`${API_URL}/api/theme/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopDomain: SHOP_DOMAIN }),
      });

      const result = await response.json();
      console.log('✅ Theme sync result:', result);

      if (result.success) {
        setError(`✅ Theme synced successfully! Version: ${result.version}, Components: ${result.components}`);
        // Fetch updated data immediately after sync
        setTimeout(() => {
          fetchThemeData();
          setTimeout(() => setError(null), 3000); // Clear success message after 3 seconds
        }, 1000);
      } else {
        setError(`❌ Sync failed: ${result.error}`);
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      console.error('❌ Sync error:', err);
      setError(`❌ Sync failed: ${err.message}`);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  };



  const handleBestSellerUpdate = (productIds) => {
    if (!themeData) return;
    
    // Update the theme data with new product IDs
    const updatedThemeData = { ...themeData };
    const sections = updatedThemeData.rawData?.original?.current?.sections || {};
    
    // Find and update the best seller section
    Object.keys(sections).forEach(key => {
      if (sections[key].settings?.product_block_title === 'BEST SELLER') {
        sections[key].settings.product_block_ids = productIds;
        sections[key].settings.product_block_limit = productIds.length;
        sections[key].settings.product_block_collection = '';
      }
    });
    
    setThemeData(updatedThemeData);
    setError('✅ Best Seller products updated! Changes reflected in JSON below.');
    setTimeout(() => setError(null), 3000);
  };

  // Shared function to get enriched data for display
  const getEnrichedData = () => {
    if (!themeData) return null;
    
    // Debug logging
    console.log('🔍 Theme Data Keys:', Object.keys(themeData || {}));
    console.log('🔍 Collections:', themeData?.collections?.length);
    console.log('🔍 Products:', themeData?.products?.length);
    
    if (currentPage === 'blog' && themeData.articles) {
      return { components: themeData.pages?.[currentPage]?.components || [], articles: themeData.articles };
    } else if (currentPage === 'article' && themeData.articles) {
      return { components: themeData.pages?.[currentPage]?.components || [], articles: themeData.articles };
    } else if (currentPage === 'page' && themeData.customPages) {
      return { components: themeData.pages?.[currentPage]?.components || [], customPages: themeData.customPages };
    } else if (currentPage === 'index') {
      // For index page, enrich components with Best Seller product details
      const sections = themeData.rawData?.original?.current?.sections || {};
      const bestSellerSection = Object.values(sections).find(
        section => section.settings?.product_block_title === 'BEST SELLER'
      );
      
      const allProducts = themeData.products || [];
      const allCollections = themeData.collections || [];
      let bestSellerProducts = [];
      let productIds = [];
      
      console.log('🔍 Best Seller Section:', bestSellerSection?.settings);
      console.log('🔍 All Products Count:', allProducts.length);
      console.log('🔍 All Collections Count:', allCollections.length);
      console.log('🔍 Collection Handle:', bestSellerSection?.settings?.product_block_collection);
      if (allCollections.length > 0) {
        console.log('🔍 First Collection:', allCollections[0]);
      }
      
      // Check if using product IDs or collection
      if (bestSellerSection?.settings?.product_block_ids && bestSellerSection.settings.product_block_ids.length > 0) {
        // Using specific product IDs
        productIds = bestSellerSection.settings.product_block_ids;
        bestSellerProducts = productIds
          .slice(0, 5)
          .map(id => {
            const product = allProducts.find(p => p.id === id);
            return product ? {
              id: product.id,
              title: product.title,
              handle: product.handle,
              price: product.variants?.[0]?.price,
              compareAtPrice: product.variants?.[0]?.compare_at_price,
              image: product.images?.[0]?.src,
              vendor: product.vendor,
              productType: product.product_type,
              tags: product.tags
            } : { id, error: 'Product not found' };
          });
      } else if (bestSellerSection?.settings?.product_block_collection) {
        // Using collection - find products from that collection
        const collectionHandle = bestSellerSection.settings.product_block_collection;
        const collection = allCollections.find(c => c.handle === collectionHandle);
        
        console.log('🔍 Found Collection:', collection?.title, 'Products:', collection?.products?.length);
        
        if (collection && collection.products) {
          const limit = bestSellerSection.settings.product_block_limit || 5;
          bestSellerProducts = collection.products.slice(0, limit).map(product => ({
            id: product.id,
            title: product.title,
            handle: product.handle,
            price: product.variants?.[0]?.price,
            compareAtPrice: product.variants?.[0]?.compare_at_price,
            image: product.images?.[0]?.src,
            vendor: product.vendor,
            productType: product.product_type,
            tags: product.tags
          }));
          productIds = bestSellerProducts.map(p => p.id);
        }
      }
      
      console.log('🔍 Best Seller Products Found:', bestSellerProducts.length);
      
      // Enrich components array with product details for Best Seller block
      const components = themeData.pages?.[currentPage]?.components || themeData.components || [];
      const enrichedComponents = components.map(comp => {
        if (comp.component === 'ProductBlock' && comp.props?.product_block_title === 'BEST SELLER') {
          return {
            ...comp,
            bestSellerProducts: bestSellerProducts,
            productIds: productIds
          };
        }
        return comp;
      });
      
      return {
        components: enrichedComponents,
        bestSellerProductsSummary: {
          count: bestSellerProducts.length,
          products: bestSellerProducts,
          source: bestSellerSection?.settings?.product_block_collection ? 'collection' : 'product_ids',
          collectionHandle: bestSellerSection?.settings?.product_block_collection || null
        }
      };
    } else {
      return themeData.pages?.[currentPage]?.components || themeData.components || [];
    }
  };

  const copyJsonToClipboard = () => {
    const dataToShow = getEnrichedData();
    if (!dataToShow) return;

    const jsonData = JSON.stringify(dataToShow, null, 2);

    navigator.clipboard.writeText(jsonData).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };



  return (
    <div className="App">
      <header className="App-header">
        <h1>🛍️ Shopify Theme Live Preview</h1>
        <div className="nav-tabs">
          <button
            className={`nav-tab ${currentView === 'preview' ? 'active' : ''}`}
            onClick={() => setCurrentView('preview')}
          >
            🏠 Home Preview
          </button>
          <button
            className={`nav-tab ${currentView === 'discounts' ? 'active' : ''}`}
            onClick={() => setCurrentView('discounts')}
          >
            🎫 Discounts
          </button>
        </div>
        <div className="status-bar">
          <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
          {lastUpdate && (
            <span className="last-update">
              Last update: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          {themeData && (
            <span className="theme-version">
              v{themeData.version || 1}
            </span>
          )}
          <button 
            onClick={triggerManualSync} 
            className={`sync-btn ${isSyncing ? 'syncing' : ''}`}
            disabled={isSyncing}
            title="Sync theme data from Shopify"
          >
            {isSyncing ? '⏳ Syncing...' : '🔄 Sync Theme'}
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
        {currentView === 'discounts' ? (
          <UnifiedDiscountAdmin />
        ) : currentView === 'bestsellers' ? (
          <BestSellerAdmin />
        ) : themeData ? (
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
                  <>
                    <div className="json-editor-controls">
                      <button 
                        onClick={() => {
                          if (!isEditing) {
                            const data = getEnrichedData();
                            setEditableJson(JSON.stringify(data, null, 2));
                          }
                          setIsEditing(!isEditing);
                        }}
                        className="edit-btn"
                      >
                        {isEditing ? '👁️ View' : '✏️ Edit'}
                      </button>
                      {isEditing && (
                        <button 
                          onClick={() => {
                            try {
                              const parsed = JSON.parse(editableJson);
                              // Update theme data with edited JSON
                              setThemeData({
                                ...themeData,
                                pages: {
                                  ...themeData.pages,
                                  [currentPage]: {
                                    ...themeData.pages[currentPage],
                                    components: parsed.components || parsed
                                  }
                                }
                              });
                              setIsEditing(false);
                              alert('✅ Changes applied! Preview updated.');
                            } catch (err) {
                              alert('❌ Invalid JSON: ' + err.message);
                            }
                          }}
                          className="save-btn"
                        >
                          💾 Apply Changes
                        </button>
                      )}
                    </div>
                    {isEditing ? (
                      <textarea
                        className="json-editor"
                        value={editableJson}
                        onChange={(e) => setEditableJson(e.target.value)}
                        spellCheck={false}
                      />
                    ) : (
                      <pre className="json-content">
                        {JSON.stringify(getEnrichedData(), null, 2)}
                      </pre>
                    )}
                  </>
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
