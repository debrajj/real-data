import React, { useState, useEffect } from 'react';
import './UnifiedDiscountAdmin.css';

const UnifiedDiscountAdmin = () => {
  const [currentView, setCurrentView] = useState('select'); // 'select' or 'create'
  const [selectedType, setSelectedType] = useState(null);
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [existingDiscounts, setExistingDiscounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState({
    method: 'CODE',
    code: '',
    title: '',
    type: null,
    value: '',
    valueType: 'PERCENTAGE',
    buyQuantity: 1,
    getQuantity: 1,
    getDiscount: 100,
    getDiscountType: 'FREE',
    maxUsesPerOrder: '',
    customerBuys: 'ANY',
    customerGets: 'ANY',
    appliesTo: 'ALL',
    selectedProducts: [],
    selectedCollections: [],
    minimumRequirement: 'NONE',
    minimumPurchaseAmount: '',
    minimumQuantity: '',
    customerEligibility: 'ALL',
    customerSegments: [],
    specificCustomers: [],
    usageLimit: '',
    oncePerCustomer: false,
    combineProductDiscounts: false,
    combineOrderDiscounts: false,
    combineShippingDiscounts: false,
    salesChannels: ['online_store'],
    startsAt: '',
    startTime: '',
    endsAt: '',
    endTime: '',
  });

  const API_URL = window.location.origin;

  const discountTypes = [
    {
      id: 'PERCENTAGE',
      title: 'Amount off products',
      description: 'Discount specific products or collections of products',
      icon: '💰'
    },
    {
      id: 'BOGO',
      title: 'Buy X get Y',
      description: 'Discount specific products or collections of products',
      icon: '🎁'
    },
    {
      id: 'FIXED_AMOUNT',
      title: 'Amount off order',
      description: 'Discount the total order amount',
      icon: '🛒'
    },
    {
      id: 'FREE_SHIPPING',
      title: 'Free shipping',
      description: 'Offer free shipping on an order',
      icon: '🚚'
    }
  ];

  useEffect(() => {
    fetchProducts();
    fetchCollections();
    fetchExistingDiscounts();
  }, []);

  const fetchProducts = async () => {
    try {
      const shopDomain = 'cmstestingg.myshopify.com';
      const response = await fetch(`${API_URL}/api/products/${shopDomain}`);
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCollections = async () => {
    try {
      const shopDomain = 'cmstestingg.myshopify.com';
      const response = await fetch(`${API_URL}/api/collections/${shopDomain}`);
      const data = await response.json();
      if (data.success) {
        setCollections(data.collections || []);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const fetchExistingDiscounts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/discounts`);
      const data = await response.json();
      if (data.success) {
        setExistingDiscounts(data.discounts);
      }
    } catch (error) {
      console.error('Error fetching discounts:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProductSelect = (productId) => {
    setFormData(prev => {
      const selected = prev.selectedProducts.includes(productId)
        ? prev.selectedProducts.filter(id => id !== productId)
        : [...prev.selectedProducts, productId];
      return { ...prev, selectedProducts: selected };
    });
  };

  const handleSalesChannelToggle = (channel) => {
    setFormData(prev => {
      const channels = prev.salesChannels.includes(channel)
        ? prev.salesChannels.filter(c => c !== channel)
        : [...prev.salesChannels, channel];
      return { ...prev, salesChannels: channels };
    });
  };

  const selectDiscountType = (type) => {
    setSelectedType(type);
    setFormData(prev => ({ ...prev, type: type.id }));
    setCurrentView('create');
  };

  const deleteDiscount = async (code) => {
    if (window.confirm(`Delete discount ${code}?`)) {
      try {
        const response = await fetch(`${API_URL}/api/discounts/${code}`, {
          method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
          setMessage('✅ Discount deleted');
          fetchExistingDiscounts();
        }
      } catch (error) {
        setMessage('❌ Error deleting discount');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      // Validation
      if (!formData.code && !formData.title) {
        setMessage('❌ Please enter a discount code or title');
        setIsLoading(false);
        return;
      }

      const code = formData.code || formData.title.toUpperCase().replace(/\s+/g, '_') || 'DISCOUNT';
      const title = formData.title || formData.code || 'Discount';

      // BOGO validation
      if (formData.type === 'BOGO') {
        if (!formData.buyQuantity || !formData.getQuantity) {
          setMessage('❌ Please set buy and get quantities for BOGO discount');
          setIsLoading(false);
          return;
        }
      } else if (formData.type !== 'FREE_SHIPPING' && !formData.value) {
        setMessage('❌ Please enter a discount value');
        setIsLoading(false);
        return;
      }

      const discountData = {
        code: code.toUpperCase(),
        title: title,
        type: formData.type,
        method: formData.method,
        ...(formData.type === 'BOGO' ? {
          bogoSettings: {
            buyQuantity: parseInt(formData.buyQuantity) || 1,
            getQuantity: parseInt(formData.getQuantity) || 1,
            getDiscount: formData.getDiscountType === 'FREE' ? 100 : parseInt(formData.getDiscount) || 100,
            discountType: formData.getDiscountType || 'FREE',
            maxUsesPerOrder: formData.maxUsesPerOrder ? parseInt(formData.maxUsesPerOrder) : undefined,
            applyToAll: formData.appliesTo === 'ALL',
            applicableProducts: formData.selectedProducts.map(id => ({ productId: id })),
            applicableCollections: formData.selectedCollections,
          }
        } : {
          value: parseFloat(formData.value) || 0,
          valueType: formData.valueType || 'PERCENTAGE',
        }),
        appliesTo: formData.appliesTo,
        applicableProducts: formData.selectedProducts.map(id => ({ productId: id })),
        applicableCollections: formData.selectedCollections,
        minimumRequirement: formData.minimumRequirement,
        minimumPurchaseAmount: formData.minimumPurchaseAmount ? parseFloat(formData.minimumPurchaseAmount) : undefined,
        minimumQuantity: formData.minimumQuantity ? parseInt(formData.minimumQuantity) : undefined,
        customerEligibility: formData.customerEligibility,
        customerSegments: formData.customerSegments,
        specificCustomers: formData.specificCustomers,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
        oncePerCustomer: formData.oncePerCustomer,
        combinations: {
          productDiscounts: formData.combineProductDiscounts,
          orderDiscounts: formData.combineOrderDiscounts,
          shippingDiscounts: formData.combineShippingDiscounts,
        },
        salesChannels: formData.salesChannels,
        startsAt: formData.startsAt || undefined,
        startTime: formData.startTime || undefined,
        endsAt: formData.endsAt || undefined,
        endTime: formData.endTime || undefined,
      };

      console.log('📤 Sending discount data:', discountData);

      const endpoint = formData.type === 'BOGO' ? '/api/discounts/bogo' : '/api/discounts/create';
      console.log('📍 Endpoint:', `${API_URL}${endpoint}`);

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(discountData),
      });

      const data = await response.json();
      console.log('📥 Response:', data);

      if (data.success) {
        setMessage('✅ Discount created successfully!');
        fetchExistingDiscounts();
        setCurrentView('select');
        setSelectedType(null);
        setFormData({
          method: 'CODE',
          code: '',
          title: '',
          type: null,
          value: '',
          valueType: 'PERCENTAGE',
          buyQuantity: 1,
          getQuantity: 1,
          getDiscount: 100,
          getDiscountType: 'FREE',
          maxUsesPerOrder: '',
          customerBuys: 'ANY',
          customerGets: 'ANY',
          appliesTo: 'ALL',
          selectedProducts: [],
          selectedCollections: [],
          minimumRequirement: 'NONE',
          minimumPurchaseAmount: '',
          minimumQuantity: '',
          customerEligibility: 'ALL',
          customerSegments: [],
          specificCustomers: [],
          usageLimit: '',
          oncePerCustomer: false,
          combineProductDiscounts: false,
          combineOrderDiscounts: false,
          combineShippingDiscounts: false,
          salesChannels: ['online_store'],
          startsAt: '',
          startTime: '',
          endsAt: '',
          endTime: '',
        });
      } else {
        setMessage('❌ Error: ' + data.error);
      }
    } catch (error) {
      setMessage('❌ Error creating discount: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (currentView === 'select') {
    return (
      <div className="unified-discount-admin">
        <div className="discount-header">
          <h1>Create discount</h1>
        </div>

        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="discount-type-selector">
          <h2>Select discount type</h2>
          <div className="discount-types-grid">
            {discountTypes.map(type => (
              <div
                key={type.id}
                className="discount-type-card"
                onClick={() => selectDiscountType(type)}
              >
                <div className="type-icon">{type.icon}</div>
                <h3>{type.title}</h3>
                <p>{type.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="existing-discounts">
          <h2>Existing Discounts ({existingDiscounts.length})</h2>
          {existingDiscounts.length === 0 ? (
            <p className="no-discounts">No discounts created yet.</p>
          ) : (
            <div className="discounts-list">
              {existingDiscounts.map(discount => (
                <div key={discount._id} className="discount-item">
                  <div className="discount-info">
                    <h4>{discount.code}</h4>
                    <p>{discount.title}</p>
                    <span className="badge">
                      {(() => {
                        const typeMap = {
                          'PERCENTAGE': 'Amount off products',
                          'BOGO': 'Buy X Get Y',
                          'FIXED_AMOUNT': 'Amount off order',
                          'FREE_SHIPPING': 'Free shipping'
                        };
                        return typeMap[discount.type] || discount.type;
                      })()}
                    </span>
                  </div>
                  <button
                    className="btn-delete"
                    onClick={() => deleteDiscount(discount.code)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="unified-discount-admin">
      <div className="discount-header">
        <button className="btn-back" onClick={() => setCurrentView('select')}>
          ← Back
        </button>
        <h1>Create {selectedType?.title}</h1>
      </div>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="discount-form">
        {/* Method Selection */}
        <div className="form-section">
          <h3>Method</h3>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="method"
                value="CODE"
                checked={formData.method === 'CODE'}
                onChange={handleInputChange}
              />
              <div>
                <strong>Discount code</strong>
                <p>Customers must enter this code at checkout</p>
              </div>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="method"
                value="AUTOMATIC"
                checked={formData.method === 'AUTOMATIC'}
                onChange={handleInputChange}
              />
              <div>
                <strong>Automatic discount</strong>
                <p>Automatically applied at checkout</p>
              </div>
            </label>
          </div>
        </div>

        {/* Code/Title Input */}
        <div className="form-section">
          {formData.method === 'CODE' ? (
            <div className="form-group">
              <label>Discount code *</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    code: value,
                    title: value || 'Discount'
                  }));
                }}
                placeholder="e.g., SUMMER20"
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    title: value,
                    code: value.toUpperCase().replace(/\s+/g, '_') || 'AUTO_DISCOUNT'
                  }));
                }}
                placeholder="e.g., Summer Sale"
                required
              />
            </div>
          )}
        </div>

        {/* BOGO Specific Fields */}
        {formData.type === 'BOGO' && (
          <>
            <div className="form-section">
              <h3>Customer buys</h3>
              <div className="form-group">
                <label>Minimum quantity of items</label>
                <input
                  type="number"
                  name="buyQuantity"
                  value={formData.buyQuantity}
                  onChange={handleInputChange}
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Any items from</label>
                <select
                  name="appliesTo"
                  value={formData.appliesTo}
                  onChange={handleInputChange}
                >
                  <option value="ALL">All products</option>
                  <option value="PRODUCTS">Specific products</option>
                  <option value="COLLECTIONS">Specific collections</option>
                </select>
              </div>
              {formData.appliesTo === 'PRODUCTS' && (
                <div className="product-selector">
                  <label>Select products ({formData.selectedProducts.length} selected)</label>
                  <div className="product-list">
                    {products.map(product => (
                      <div
                        key={product.shopifyId}
                        className="product-item"
                        onClick={() => handleProductSelect(product.shopifyId)}
                      >
                        <input
                          type="checkbox"
                          checked={formData.selectedProducts.includes(product.shopifyId)}
                          readOnly
                        />
                        {product.images?.[0] && (
                          <img src={product.images[0].src} alt={product.title} />
                        )}
                        <span>{product.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {formData.appliesTo === 'COLLECTIONS' && (
                <div className="collection-selector">
                  <label>Select collections ({formData.selectedCollections.length} selected)</label>
                  <div className="collection-list">
                    {collections.map(collection => (
                      <div
                        key={collection.id}
                        className="collection-item"
                        onClick={() => {
                          const collectionId = collection.id;
                          setFormData(prev => {
                            const selected = prev.selectedCollections.includes(collectionId)
                              ? prev.selectedCollections.filter(id => id !== collectionId)
                              : [...prev.selectedCollections, collectionId];
                            return { ...prev, selectedCollections: selected };
                          });
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.selectedCollections.includes(collection.id)}
                          readOnly
                        />
                        <span>{collection.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="form-section">
              <h3>Customer gets</h3>
              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  name="getQuantity"
                  value={formData.getQuantity}
                  onChange={handleInputChange}
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>At a discounted value</label>
                <select
                  name="getDiscountType"
                  value={formData.getDiscountType}
                  onChange={handleInputChange}
                >
                  <option value="FREE">Free</option>
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="AMOUNT">Amount off each</option>
                </select>
              </div>
              {formData.getDiscountType === 'PERCENTAGE' && (
                <div className="form-group">
                  <label>Discount percentage</label>
                  <input
                    type="number"
                    name="getDiscount"
                    value={formData.getDiscount}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    required
                  />
                </div>
              )}
              <div className="form-group">
                <label>Set a maximum number of uses per order</label>
                <input
                  type="number"
                  name="maxUsesPerOrder"
                  value={formData.maxUsesPerOrder}
                  onChange={handleInputChange}
                  placeholder="Optional"
                />
              </div>
            </div>
          </>
        )}

        {/* Value Fields for Non-BOGO Discounts */}
        {(formData.type === 'PERCENTAGE' || formData.type === 'FIXED_AMOUNT') && (
          <>
            <div className="form-section">
              <h3>Value</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Discount type</label>
                  <select
                    name="valueType"
                    value={formData.valueType}
                    onChange={handleInputChange}
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED_AMOUNT">Fixed amount</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{formData.valueType === 'PERCENTAGE' ? 'Percentage (%)' : 'Amount ($)'}</label>
                  <input
                    type="number"
                    name="value"
                    value={formData.value}
                    onChange={handleInputChange}
                    min="0"
                    step={formData.valueType === 'FIXED_AMOUNT' ? '0.01' : '1'}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Applies to</h3>
              <select
                name="appliesTo"
                value={formData.appliesTo}
                onChange={handleInputChange}
              >
                <option value="ALL">All products</option>
                <option value="PRODUCTS">Specific products</option>
                <option value="COLLECTIONS">Specific collections</option>
              </select>
              {formData.appliesTo === 'PRODUCTS' && (
                <div className="product-selector">
                  <div className="product-list">
                    {products.map(product => (
                      <div
                        key={product.shopifyId}
                        className="product-item"
                        onClick={() => handleProductSelect(product.shopifyId)}
                      >
                        <input
                          type="checkbox"
                          checked={formData.selectedProducts.includes(product.shopifyId)}
                          readOnly
                        />
                        {product.images?.[0] && (
                          <img src={product.images[0].src} alt={product.title} />
                        )}
                        <span>{product.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Minimum Requirements */}
        <div className="form-section">
          <h3>Minimum purchase requirements</h3>
          <select
            name="minimumRequirement"
            value={formData.minimumRequirement}
            onChange={handleInputChange}
          >
            <option value="NONE">No minimum requirements</option>
            <option value="PURCHASE_AMOUNT">Minimum purchase amount</option>
            <option value="QUANTITY">Minimum quantity of items</option>
          </select>
          {formData.minimumRequirement === 'PURCHASE_AMOUNT' && (
            <div className="form-group">
              <input
                type="number"
                name="minimumPurchaseAmount"
                value={formData.minimumPurchaseAmount}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
              />
            </div>
          )}
          {formData.minimumRequirement === 'QUANTITY' && (
            <div className="form-group">
              <input
                type="number"
                name="minimumQuantity"
                value={formData.minimumQuantity}
                onChange={handleInputChange}
                placeholder="0"
              />
            </div>
          )}
        </div>

        {/* Customer Eligibility */}
        <div className="form-section">
          <h3>Customer eligibility</h3>
          <select
            name="customerEligibility"
            value={formData.customerEligibility}
            onChange={handleInputChange}
          >
            <option value="ALL">All customers</option>
            <option value="SEGMENTS">Specific customer segments</option>
            <option value="SPECIFIC">Specific customers</option>
          </select>
        </div>

        {/* Usage Limits */}
        <div className="form-section">
          <h3>Maximum discount uses</h3>
          <div className="form-group">
            <label>Limit number of times this discount can be used in total</label>
            <input
              type="number"
              name="usageLimit"
              value={formData.usageLimit}
              onChange={handleInputChange}
              placeholder="No limit"
            />
          </div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="oncePerCustomer"
              checked={formData.oncePerCustomer}
              onChange={handleInputChange}
            />
            Limit to one use per customer
          </label>
        </div>

        {/* Combinations */}
        <div className="form-section">
          <h3>Combinations</h3>
          <p className="section-description">This discount can be combined with:</p>
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="combineProductDiscounts"
              checked={formData.combineProductDiscounts}
              onChange={handleInputChange}
            />
            Product discounts
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="combineOrderDiscounts"
              checked={formData.combineOrderDiscounts}
              onChange={handleInputChange}
            />
            Order discounts
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="combineShippingDiscounts"
              checked={formData.combineShippingDiscounts}
              onChange={handleInputChange}
            />
            Shipping discounts
          </label>
        </div>

        {/* Sales Channels */}
        <div className="form-section">
          <h3>Sales channel access</h3>
          <p className="section-description">Allow discount to be featured on selected channels</p>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.salesChannels.includes('online_store')}
              onChange={() => handleSalesChannelToggle('online_store')}
            />
            Online Store
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.salesChannels.includes('pos')}
              onChange={() => handleSalesChannelToggle('pos')}
            />
            Point of Sale
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.salesChannels.includes('facebook')}
              onChange={() => handleSalesChannelToggle('facebook')}
            />
            Facebook & Instagram
          </label>
        </div>

        {/* Active Dates */}
        <div className="form-section">
          <h3>Active dates</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Start date</label>
              <input
                type="date"
                name="startsAt"
                value={formData.startsAt}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Start time (EST)</label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={!!formData.endsAt}
              onChange={(e) => {
                if (!e.target.checked) {
                  setFormData(prev => ({ ...prev, endsAt: '', endTime: '' }));
                }
              }}
            />
            Set end date
          </label>
          {formData.endsAt !== '' && (
            <div className="form-row">
              <div className="form-group">
                <label>End date</label>
                <input
                  type="date"
                  name="endsAt"
                  value={formData.endsAt}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>End time (EST)</label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setCurrentView('select')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Save discount'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UnifiedDiscountAdmin;