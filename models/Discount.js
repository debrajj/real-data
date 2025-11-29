const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
  shopDomain: {
    type: String,
    required: true,
    index: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  type: {
    type: String,
    enum: ['BOGO', 'PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: String,
  
  // Method (automatic or code)
  method: {
    type: String,
    enum: ['CODE', 'AUTOMATIC'],
    default: 'CODE',
  },
  
  // BOGO specific settings
  bogoSettings: {
    buyQuantity: {
      type: Number,
      default: 1,
    },
    getQuantity: {
      type: Number,
      default: 1,
    },
    getDiscount: {
      type: Number, // Percentage discount on free items (100 = free)
      default: 100,
    },
    discountType: {
      type: String,
      enum: ['PERCENTAGE', 'AMOUNT', 'FREE'],
      default: 'FREE',
    },
    applicableProducts: [{
      productId: {
        type: String,
        validate: {
          validator: function(v) {
            return v && typeof v === 'string' && v.trim() !== '';
          },
          message: 'productId must be a non-empty string'
        }
      },
      variantId: String,
    }],
    applicableCollections: [String],
    applyToAll: {
      type: Boolean,
      default: false,
    },
    maxUsesPerOrder: Number,
  },
  
  // General discount settings
  value: Number, // For percentage or fixed amount
  valueType: {
    type: String,
    enum: ['PERCENTAGE', 'FIXED_AMOUNT'],
    default: 'PERCENTAGE',
  },
  
  // Customer eligibility
  customerEligibility: {
    type: String,
    enum: ['ALL', 'SEGMENTS', 'SPECIFIC'],
    default: 'ALL',
  },
  customerSegments: [String],
  specificCustomers: [String],
  
  // Minimum requirements
  minimumRequirement: {
    type: String,
    enum: ['NONE', 'PURCHASE_AMOUNT', 'QUANTITY'],
    default: 'NONE',
  },
  minimumPurchaseAmount: Number,
  minimumQuantity: Number,
  
  // Product/Collection selection
  appliesTo: {
    type: String,
    enum: ['ALL', 'PRODUCTS', 'COLLECTIONS'],
    default: 'ALL',
  },
  applicableProducts: [{
    productId: {
      type: String,
      validate: {
        validator: function(v) {
          return v && typeof v === 'string' && v.trim() !== '';
        },
        message: 'productId must be a non-empty string'
      }
    },
    variantId: String,
  }],
  applicableCollections: [String],
  
  // Usage limits
  usageLimit: Number,
  usageCount: {
    type: Number,
    default: 0,
  },
  oncePerCustomer: {
    type: Boolean,
    default: false,
  },
  
  // Combinations
  combinations: {
    productDiscounts: {
      type: Boolean,
      default: false,
    },
    orderDiscounts: {
      type: Boolean,
      default: false,
    },
    shippingDiscounts: {
      type: Boolean,
      default: false,
    },
  },
  
  // Sales channels
  salesChannels: {
    type: [String],
    default: ['online_store'],
  },
  
  // Date restrictions
  startsAt: Date,
  startTime: String,
  endsAt: Date,
  endTime: String,
  
  // Status
  active: {
    type: Boolean,
    default: true,
  },
  
  // Shopify integration
  shopifyPriceRuleId: String,
  shopifyDiscountCodeId: String,
  
}, {
  timestamps: true,
});

discountSchema.index({ shopDomain: 1, code: 1 }, { unique: true });
discountSchema.index({ active: 1, startsAt: 1, endsAt: 1 });

// Pre-save hook to ensure code is always set and clean invalid data
discountSchema.pre('save', function(next) {
  if (!this.code && this.title) {
    this.code = this.title.toUpperCase().replace(/\s+/g, '_');
  }
  if (!this.code) {
    this.code = 'DISCOUNT_' + Date.now();
  }
  
  // Clean invalid productId values
  if (this.applicableProducts) {
    this.applicableProducts = this.applicableProducts.filter(p => 
      p.productId && typeof p.productId === 'string' && p.productId.trim() !== ''
    );
  }
  
  if (this.bogoSettings && this.bogoSettings.applicableProducts) {
    this.bogoSettings.applicableProducts = this.bogoSettings.applicableProducts.filter(p => 
      p.productId && typeof p.productId === 'string' && p.productId.trim() !== ''
    );
  }
  
  next();
});

// Method to check if discount is currently valid
discountSchema.methods.isValid = function() {
  if (!this.active) return false;
  
  const now = new Date();
  if (this.startsAt && now < this.startsAt) return false;
  if (this.endsAt && now > this.endsAt) return false;
  
  if (this.usageLimit && this.usageCount >= this.usageLimit) return false;
  
  return true;
};

// Method to apply BOGO discount to cart
discountSchema.methods.applyToCart = function(cartItems) {
  if (this.type !== 'BOGO') {
    throw new Error('This method only applies to BOGO discounts');
  }
  
  const { buyQuantity, getQuantity, getDiscount, applicableProducts, applicableCollections, applyToAll } = this.bogoSettings;
  
  // Filter applicable items
  let applicableItems = cartItems;
  if (!applyToAll) {
    applicableItems = cartItems.filter(item => {
      // Check if product/variant is in applicable list
      const isApplicableProduct = applicableProducts.some(p => 
        p.productId === item.productId || p.variantId === item.variantId
      );
      
      // Check if product is in applicable collections
      const isApplicableCollection = applicableCollections.some(collectionId =>
        item.collections && item.collections.includes(collectionId)
      );
      
      return isApplicableProduct || isApplicableCollection;
    });
  }
  
  // Calculate total quantity of applicable items
  const totalQuantity = applicableItems.reduce((sum, item) => sum + item.quantity, 0);
  
  // Calculate how many free items customer gets
  const sets = Math.floor(totalQuantity / (buyQuantity + getQuantity));
  const freeItems = sets * getQuantity;
  
  // Calculate discount amount
  let discountAmount = 0;
  let remainingFreeItems = freeItems;
  
  // Sort items by price (descending) to give discount on cheapest items
  const sortedItems = [...applicableItems].sort((a, b) => a.price - b.price);
  
  for (const item of sortedItems) {
    if (remainingFreeItems <= 0) break;
    
    const itemsToDiscount = Math.min(item.quantity, remainingFreeItems);
    discountAmount += item.price * itemsToDiscount * (getDiscount / 100);
    remainingFreeItems -= itemsToDiscount;
  }
  
  return {
    discountAmount,
    freeItems,
    applicableItemsCount: applicableItems.length,
    message: `Buy ${buyQuantity} Get ${getQuantity} ${getDiscount === 100 ? 'Free' : getDiscount + '% Off'}`,
  };
};

module.exports = mongoose.model('Discount', discountSchema);