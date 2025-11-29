import React, { useState, useEffect } from 'react';
import './BestSellerAdmin.css';

const API_URL = process.env.REACT_APP_API_URL || '';
const SHOP_DOMAIN = 'cmstestingg.myshopify.com';

function BestSellerAdmin() {
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCollection, setFilterCollection] = useState('all');
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCollections();
    loadCurrentBestSellers();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products?limit=100`);
      const data = await response.json();
      setAllProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setMessage('❌ Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await fetch(`${API_URL}/api/collections/${SHOP_DOMAIN}`);
      const data = await response.json();
      setCollections(data.collections || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const loadCurrentBestSellers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/theme/data`);
      const data = await response.json();
      
      if (data.success && data.data) {
        // Find the best seller section in the theme data
        const sections = data.data.rawData?.original?.current?.sections || {};
        const bestSellerSection = Object.values(sections).find(
          section => section.settings?.product_block_title === 'BEST SELLER'
        );
        
        if (bestSellerSection?.settings?.product_block_ids) {
          setSelectedProducts(bestSellerSection.settings.product_block_ids);
        }
      }
    } catch (error) {
      console.error('Error loading current best sellers:', error);
    }
  };

  const toggleProduct = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const newSelected = [...selectedProducts];
    [newSelected[index - 1], newSelected[index]] = [newSelected[index], newSelected[index - 1]];
    setSelectedProducts(newSelected);
  };

  const moveDown = (index) => {
    if (index === selectedProducts.length - 1) return;
    const newSelected = [...selectedProducts];
    [newSelected[index], newSelected[index + 1]] = [newSelected[index + 1], newSelected[index]];
    setSelectedProducts(newSelected);
  };

  const removeProduct = (productId) => {
    setSelectedProducts(prev => prev.filter(id => id !== productId));
  };

  const saveBestSellers = async () => {
    setSaving(true);
    setMessage('💾 Saving best sellers...');
    
    try {
      // Here you would update the theme JSON
      // For now, we'll just show the JSON that needs to be updated
      const jsonConfig = {
        product_block_ids: selectedProducts,
        product_block_collection: '',
        product_block_limit: selectedProducts.length,
        product_block_title: 'BEST SELLER'
      };
      
      console.log('Best Seller Configuration:', jsonConfig);
      
      setMessage(`✅ Saved ${selectedProducts.length} best seller products! Copy the JSON below to your theme.`);
      
      // Show the JSON in console for now
      console.log('Add this to your index.json:', JSON.stringify(jsonConfig, null, 2));
      
    } catch (error) {
      console.error('Error saving:', error);
      setMessage('❌ Failed to save best sellers');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = allProducts.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCollection = filterCollection === 'all' || 
      (product.collections && product.collections.includes(filterCollection));
    return matchesSearch && matchesCollection;
  });

  const selectedProductsData = selectedProducts
    .map(id => allProducts.find(p => p.productId === id))
    .filter(Boolean);

  if (loading) {
    return <div className="best-seller-admin loading">Loading products...</div>;
  }

  return (
    <div className="best-seller-admin">
      <div className="admin-header">
        <h1>🏆 Best Seller Products Manager</h1>
        <p>Select and order products to display in the Best Seller section</p>
      </div>

      {message && (
        <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="admin-layout">
        {/* Left Panel - Available Products */}
        <div className="products-panel">
          <div className="panel-header">
            <h2>Available Products ({filteredProducts.length})</h2>
            <div className="filters">
              <input
                type="text"
                placeholder="🔍 Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <select
                value={filterCollection}
                onChange={(e) => setFilterCollection(e.target.value)}
                className="collection-filter"
              >
                <option value="all">All Collections</option>
                {collections.map(col => (
                  <option key={col.collectionId} value={col.collectionId}>
                    {col.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="products-list">
            {filteredProducts.map(product => (
              <div
                key={product.productId}
                className={`product-item ${selectedProducts.includes(product.productId) ? 'selected' : ''}`}
                onClick={() => toggleProduct(product.productId)}
              >
                <div className="product-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.productId)}
                    readOnly
                  />
                </div>
                <div className="product-info">
                  <div className="product-title">{product.title}</div>
                  <div className="product-meta">
                    <span className="product-id">ID: {product.productId}</span>
                    <span className="product-price">${product.variants?.[0]?.price || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Selected Products */}
        <div className="selected-panel">
          <div className="panel-header">
            <h2>Best Sellers ({selectedProducts.length})</h2>
            <button
              onClick={saveBestSellers}
              disabled={saving || selectedProducts.length === 0}
              className="save-btn"
            >
              {saving ? '💾 Saving...' : '💾 Save Configuration'}
            </button>
          </div>

          {selectedProducts.length === 0 ? (
            <div className="empty-state">
              <p>👈 Select products from the left to add them as best sellers</p>
            </div>
          ) : (
            <>
              <div className="selected-list">
                {selectedProductsData.map((product, index) => (
                  <div key={product.productId} className="selected-item">
                    <div className="item-order">#{index + 1}</div>
                    <div className="item-info">
                      <div className="item-title">{product.title}</div>
                      <div className="item-id">ID: {product.productId}</div>
                    </div>
                    <div className="item-actions">
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="move-btn"
                        title="Move up"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === selectedProducts.length - 1}
                        className="move-btn"
                        title="Move down"
                      >
                        ▼
                      </button>
                      <button
                        onClick={() => removeProduct(product.productId)}
                        className="remove-btn"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="json-output">
                <h3>📋 Configuration JSON</h3>
                <pre>
                  {JSON.stringify({
                    product_block_ids: selectedProducts,
                    product_block_collection: '',
                    product_block_limit: selectedProducts.length,
                    product_block_title: 'BEST SELLER'
                  }, null, 2)}
                </pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify({
                      product_block_ids: selectedProducts,
                      product_block_collection: '',
                      product_block_limit: selectedProducts.length
                    }, null, 2));
                    setMessage('✅ JSON copied to clipboard!');
                  }}
                  className="copy-json-btn"
                >
                  📋 Copy JSON
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default BestSellerAdmin;
