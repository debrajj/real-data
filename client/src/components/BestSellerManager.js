import React, { useState, useEffect } from 'react';
import './BestSellerManager.css';

const API_URL = process.env.REACT_APP_API_URL || '';

function BestSellerManager({ themeData, onUpdate }) {
  const [allProducts, setAllProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
    loadCurrentBestSellers();
  }, [themeData]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products?limit=100`);
      const data = await response.json();
      setAllProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const loadCurrentBestSellers = () => {
    if (!themeData) return;
    
    const sections = themeData.rawData?.original?.current?.sections || {};
    const bestSellerSection = Object.values(sections).find(
      section => section.settings?.product_block_title === 'BEST SELLER'
    );
    
    if (bestSellerSection?.settings?.product_block_ids) {
      setSelectedIds(bestSellerSection.settings.product_block_ids);
    }
  };

  const toggleProduct = (productId) => {
    setSelectedIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const newIds = [...selectedIds];
    [newIds[index - 1], newIds[index]] = [newIds[index], newIds[index - 1]];
    setSelectedIds(newIds);
  };

  const moveDown = (index) => {
    if (index === selectedIds.length - 1) return;
    const newIds = [...selectedIds];
    [newIds[index], newIds[index + 1]] = [newIds[index + 1], newIds[index]];
    setSelectedIds(newIds);
  };

  const removeProduct = (productId) => {
    setSelectedIds(prev => prev.filter(id => id !== productId));
  };

  const saveChanges = async () => {
    setSaving(true);
    // Notify parent component to update the JSON
    if (onUpdate) {
      onUpdate(selectedIds);
    }
    
    setTimeout(() => {
      setSaving(false);
      setIsExpanded(false);
    }, 1000);
  };

  const filteredProducts = allProducts.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedProducts = selectedIds
    .map(id => allProducts.find(p => p.productId === id))
    .filter(Boolean);

  return (
    <div className="best-seller-manager">
      <div className="manager-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>🏆 Best Seller Products ({selectedIds.length})</h3>
        <button className="expand-btn">{isExpanded ? '▼' : '▶'}</button>
      </div>

      {isExpanded && (
        <div className="manager-content">
          <div className="manager-grid">
            {/* Selected Products */}
            <div className="selected-section">
              <h4>Selected ({selectedIds.length})</h4>
              <div className="selected-list-compact">
                {selectedProducts.map((product, index) => (
                  <div key={product.productId} className="selected-item-compact">
                    <span className="item-number">#{index + 1}</span>
                    <span className="item-title-compact">{product.title.substring(0, 40)}...</span>
                    <div className="item-actions-compact">
                      <button onClick={() => moveUp(index)} disabled={index === 0}>▲</button>
                      <button onClick={() => moveDown(index)} disabled={index === selectedIds.length - 1}>▼</button>
                      <button onClick={() => removeProduct(product.productId)} className="remove">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Products */}
            <div className="available-section">
              <h4>Available Products</h4>
              <input
                type="text"
                placeholder="🔍 Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-compact"
              />
              <div className="products-list-compact">
                {filteredProducts.slice(0, 20).map(product => (
                  <div
                    key={product.productId}
                    className={`product-item-compact ${selectedIds.includes(product.productId) ? 'selected' : ''}`}
                    onClick={() => toggleProduct(product.productId)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(product.productId)}
                      readOnly
                    />
                    <span className="product-title-compact">{product.title.substring(0, 50)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="manager-actions">
            <button onClick={saveChanges} disabled={saving} className="save-btn-compact">
              {saving ? '💾 Saving...' : '💾 Save & Update JSON'}
            </button>
            <button onClick={() => setIsExpanded(false)} className="cancel-btn-compact">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BestSellerManager;
