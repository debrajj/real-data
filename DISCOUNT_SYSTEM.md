# Discount System Documentation

## Overview

This system provides a complete discount management solution for Shopify stores, including BOGO (Buy One Get One), percentage discounts, fixed amount discounts, and free shipping offers.

## Features

- ✅ **BOGO Discounts**: Buy X Get Y offers with flexible configurations
- ✅ **Percentage Discounts**: Percentage off products or orders
- ✅ **Fixed Amount Discounts**: Fixed dollar amount off
- ✅ **Free Shipping**: Free shipping offers
- ✅ **Product/Collection Targeting**: Apply to specific products or collections
- ✅ **Customer Eligibility**: Target specific customer segments
- ✅ **Usage Limits**: Control how many times discounts can be used
- ✅ **Date Restrictions**: Set start and end dates
- ✅ **Shopify Integration**: Sync with Shopify price rules
- ✅ **Real-time Testing**: Test discounts before going live

## API Endpoints

### Get All Discounts
```
GET /api/discounts?shop=your-shop.myshopify.com
```

### Get Discount by Code
```
GET /api/discounts/SUMMER20?shop=your-shop.myshopify.com
```

### Create BOGO Discount
```
POST /api/discounts/bogo
Content-Type: application/json

{
  "code": "BOGO50",
  "title": "Buy 1 Get 1 50% Off",
  "method": "CODE",
  "bogoSettings": {
    "buyQuantity": 1,
    "getQuantity": 1,
    "getDiscount": 50,
    "discountType": "PERCENTAGE",
    "applyToAll": true
  },
  "usageLimit": 100,
  "startsAt": "2024-01-01T00:00:00Z",
  "endsAt": "2024-12-31T23:59:59Z"
}
```

### Create General Discount
```
POST /api/discounts/create
Content-Type: application/json

{
  "code": "SUMMER20",
  "title": "Summer Sale",
  "type": "PERCENTAGE",
  "value": 20,
  "valueType": "PERCENTAGE",
  "appliesTo": "ALL",
  "usageLimit": 500
}
```

### Apply Discount to Cart
```
POST /api/discounts/apply
Content-Type: application/json

{
  "code": "BOGO50",
  "cartItems": [
    {
      "productId": "123456789",
      "variantId": "987654321",
      "quantity": 2,
      "price": 29.99,
      "title": "Product Name"
    }
  ]
}
```

### Delete Discount
```
DELETE /api/discounts/SUMMER20?shop=your-shop.myshopify.com
```

## Database Schema

### Discount Model

```javascript
{
  shopDomain: String,           // Shop domain
  code: String,                 // Discount code (unique)
  type: String,                 // BOGO, PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING
  title: String,                // Display title
  description: String,          // Optional description
  method: String,               // CODE or AUTOMATIC
  
  // BOGO specific settings
  bogoSettings: {
    buyQuantity: Number,        // Items to buy
    getQuantity: Number,        // Items to get
    getDiscount: Number,        // Discount percentage (100 = free)
    discountType: String,       // PERCENTAGE, AMOUNT, FREE
    applicableProducts: [...],  // Product IDs
    applicableCollections: [...], // Collection IDs
    applyToAll: Boolean,        // Apply to all products
    maxUsesPerOrder: Number     // Max uses per order
  },
  
  // General discount settings
  value: Number,                // Discount value
  valueType: String,            // PERCENTAGE or FIXED_AMOUNT
  
  // Targeting
  appliesTo: String,            // ALL, PRODUCTS, COLLECTIONS
  applicableProducts: [...],    // Product targeting
  applicableCollections: [...], // Collection targeting
  
  // Requirements
  minimumRequirement: String,   // NONE, PURCHASE_AMOUNT, QUANTITY
  minimumPurchaseAmount: Number,
  minimumQuantity: Number,
  
  // Customer eligibility
  customerEligibility: String,  // ALL, SEGMENTS, SPECIFIC
  customerSegments: [...],
  specificCustomers: [...],
  
  // Usage limits
  usageLimit: Number,           // Total usage limit
  usageCount: Number,           // Current usage count
  oncePerCustomer: Boolean,     // Limit to one use per customer
  
  // Combinations
  combinations: {
    productDiscounts: Boolean,
    orderDiscounts: Boolean,
    shippingDiscounts: Boolean
  },
  
  // Sales channels
  salesChannels: [...],         // online_store, pos, facebook
  
  // Date restrictions
  startsAt: Date,
  startTime: String,
  endsAt: Date,
  endTime: String,
  
  // Status
  active: Boolean,
  
  // Shopify integration
  shopifyPriceRuleId: String,
  shopifyDiscountCodeId: String,
  
  timestamps: true
}
```

## Usage Examples

### 1. Create a BOGO Discount

```javascript
const bogoDiscount = {
  code: 'BOGO_SUMMER',
  title: 'Summer BOGO Sale',
  method: 'CODE',
  type: 'BOGO',
  bogoSettings: {
    buyQuantity: 2,
    getQuantity: 1,
    getDiscount: 100, // 100% = free
    discountType: 'FREE',
    applyToAll: false,
    applicableProducts: [
      { productId: '123456789' },
      { productId: '987654321' }
    ]
  },
  minimumRequirement: 'PURCHASE_AMOUNT',
  minimumPurchaseAmount: 50.00,
  usageLimit: 100,
  oncePerCustomer: true,
  startsAt: '2024-06-01T00:00:00Z',
  endsAt: '2024-08-31T23:59:59Z'
};
```

### 2. Create a Percentage Discount

```javascript
const percentageDiscount = {
  code: 'SAVE20',
  title: '20% Off Everything',
  method: 'CODE',
  type: 'PERCENTAGE',
  value: 20,
  valueType: 'PERCENTAGE',
  appliesTo: 'ALL',
  customerEligibility: 'ALL',
  usageLimit: 1000,
  salesChannels: ['online_store', 'pos']
};
```

### 3. Create a Free Shipping Discount

```javascript
const freeShippingDiscount = {
  code: 'FREESHIP',
  title: 'Free Shipping',
  method: 'AUTOMATIC',
  type: 'FREE_SHIPPING',
  minimumRequirement: 'PURCHASE_AMOUNT',
  minimumPurchaseAmount: 75.00,
  customerEligibility: 'ALL'
};
```

### 4. Apply Discount to Cart

```javascript
const cartItems = [
  {
    productId: '123456789',
    variantId: '111111111',
    quantity: 3,
    price: 29.99,
    title: 'T-Shirt',
    collections: ['summer-collection']
  },
  {
    productId: '987654321',
    variantId: '222222222',
    quantity: 1,
    price: 49.99,
    title: 'Jeans'
  }
];

const result = await applyDiscountToCart('shop.myshopify.com', 'BOGO_SUMMER', cartItems);

// Result:
{
  success: true,
  discount: {
    code: 'BOGO_SUMMER',
    title: 'Summer BOGO Sale',
    type: 'BOGO',
    discountAmount: 29.99,
    freeItems: 1,
    message: 'Buy 2 Get 1 Free'
  }
}
```

## Frontend Integration

### React Component Usage

```javascript
import UnifiedDiscountAdmin from './components/UnifiedDiscountAdmin';

function App() {
  const [showDiscounts, setShowDiscounts] = useState(false);

  return (
    <div>
      <button onClick={() => setShowDiscounts(!showDiscounts)}>
        {showDiscounts ? 'Hide' : 'Show'} Discounts
      </button>
      
      {showDiscounts && <UnifiedDiscountAdmin />}
    </div>
  );
}
```

### Testing Discounts

The system includes a built-in discount tester that allows you to:

1. Create test cart scenarios
2. Apply discount codes
3. See real-time calculations
4. Validate discount logic before going live

## Shopify Integration

### Webhook Events

The system listens for these Shopify webhook events:

- `discounts/create` - When a discount is created in Shopify
- `discounts/update` - When a discount is updated in Shopify  
- `discounts/delete` - When a discount is deleted in Shopify

### Price Rules

When creating discounts, the system can optionally create corresponding Shopify price rules and discount codes for seamless integration.

## Error Handling

The system includes comprehensive error handling:

- **Validation Errors**: Invalid discount configurations
- **Shopify API Errors**: Issues with Shopify integration
- **Database Errors**: MongoDB connection or query issues
- **Usage Limit Errors**: When discounts exceed usage limits
- **Eligibility Errors**: When customers don't meet requirements

## Security

- All discount codes are stored in uppercase
- Input validation on all API endpoints
- Rate limiting on discount application
- Secure webhook verification
- MongoDB injection protection

## Performance

- Indexed database queries for fast lookups
- Efficient cart calculation algorithms
- Caching of frequently accessed discounts
- Optimized Shopify API calls

## Monitoring

- Comprehensive logging of all discount operations
- Usage tracking and analytics
- Error monitoring and alerting
- Performance metrics

## Deployment

1. Set up MongoDB database
2. Configure environment variables
3. Deploy backend API
4. Set up Shopify webhooks
5. Deploy frontend application
6. Test discount functionality

## Support

For issues or questions:

1. Check the logs for error messages
2. Verify environment configuration
3. Test API endpoints manually
4. Check Shopify webhook delivery
5. Review database collections

## License

MIT License - see LICENSE file for details.