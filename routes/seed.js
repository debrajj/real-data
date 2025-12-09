const express = require('express');
const router = express.Router();
const { getStoreModel } = require('../config/database');
const { productSchema, collectionSchema } = require('../models/schemas');

/**
 * POST /api/seed/:clientKey
 * Seed sample data for testing
 */
router.post('/:clientKey', async (req, res) => {
  try {
    const { clientKey } = req.params;
    
    const Product = await getStoreModel(clientKey, 'Product', productSchema, 'products');
    const Collection = await getStoreModel(clientKey, 'Collection', collectionSchema, 'collections');
    
    // Sample products (tags is a comma-separated string per Shopify schema)
    const sampleProducts = [
      {
        productId: '1001',
        title: 'Classic Gold Necklace',
        handle: 'classic-gold-necklace',
        vendor: 'Joyspoon',
        product_type: 'Necklaces',
        status: 'active',
        tags: 'gold, classic, bestseller',
        images: [{ id: '1', src: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400', alt: 'Gold Necklace' }],
        variants: [{ id: 'v1', title: 'Default', price: '299.00', compare_at_price: '399.00' }],
      },
      {
        productId: '1002',
        title: 'Diamond Stud Earrings',
        handle: 'diamond-stud-earrings',
        vendor: 'Joyspoon',
        product_type: 'Earrings',
        status: 'active',
        tags: 'diamond, studs, elegant',
        images: [{ id: '2', src: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400', alt: 'Diamond Earrings' }],
        variants: [{ id: 'v2', title: 'Default', price: '499.00', compare_at_price: '599.00' }],
      },
      {
        productId: '1003',
        title: 'Silver Charm Bracelet',
        handle: 'silver-charm-bracelet',
        vendor: 'Joyspoon',
        product_type: 'Bracelets',
        status: 'active',
        tags: 'silver, charm, gift',
        images: [{ id: '3', src: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400', alt: 'Silver Bracelet' }],
        variants: [{ id: 'v3', title: 'Default', price: '149.00' }],
      },
      {
        productId: '1004',
        title: 'Rose Gold Ring Set',
        handle: 'rose-gold-ring-set',
        vendor: 'Joyspoon',
        product_type: 'Rings',
        status: 'active',
        tags: 'rose gold, set, wedding',
        images: [{ id: '4', src: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400', alt: 'Rose Gold Rings' }],
        variants: [{ id: 'v4', title: 'Default', price: '399.00', compare_at_price: '499.00' }],
      },
      {
        productId: '1005',
        title: 'Pearl Drop Pendant',
        handle: 'pearl-drop-pendant',
        vendor: 'Joyspoon',
        product_type: 'Pendants',
        status: 'active',
        tags: 'pearl, pendant, elegant',
        images: [{ id: '5', src: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400', alt: 'Pearl Pendant' }],
        variants: [{ id: 'v5', title: 'Default', price: '199.00' }],
      },
      {
        productId: '1006',
        title: 'Vintage Emerald Brooch',
        handle: 'vintage-emerald-brooch',
        vendor: 'Joyspoon',
        product_type: 'Brooches',
        status: 'active',
        tags: 'emerald, vintage, collector',
        images: [{ id: '6', src: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400', alt: 'Emerald Brooch' }],
        variants: [{ id: 'v6', title: 'Default', price: '599.00', compare_at_price: '799.00' }],
      },
    ];

    // Sample collections
    const sampleCollections = [
      {
        collectionId: 'c1',
        title: 'New Arrivals',
        handle: 'new-arrivals',
        body_html: 'Check out our latest jewelry pieces',
        image: { src: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=400', alt: 'New Arrivals' },
      },
      {
        collectionId: 'c2',
        title: 'Best Sellers',
        handle: 'best-sellers',
        body_html: 'Our most popular items',
        image: { src: 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=400', alt: 'Best Sellers' },
      },
      {
        collectionId: 'c3',
        title: 'Wedding Collection',
        handle: 'wedding-collection',
        body_html: 'Perfect pieces for your special day',
        image: { src: 'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?w=400', alt: 'Wedding Collection' },
      },
      {
        collectionId: 'c4',
        title: 'Gift Ideas',
        handle: 'gift-ideas',
        body_html: 'Find the perfect gift',
        image: { src: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=400', alt: 'Gift Ideas' },
      },
    ];

    // Insert products
    for (const product of sampleProducts) {
      await Product.findOneAndUpdate(
        { productId: product.productId },
        product,
        { upsert: true, new: true }
      );
    }

    // Insert collections
    for (const collection of sampleCollections) {
      await Collection.findOneAndUpdate(
        { collectionId: collection.collectionId },
        collection,
        { upsert: true, new: true }
      );
    }

    res.json({
      success: true,
      message: 'Sample data seeded successfully',
      data: {
        products: sampleProducts.length,
        collections: sampleCollections.length,
      },
    });
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/seed/:clientKey
 * Clear all sample data
 */
router.delete('/:clientKey', async (req, res) => {
  try {
    const { clientKey } = req.params;
    
    const Product = await getStoreModel(clientKey, 'Product', productSchema, 'products');
    const Collection = await getStoreModel(clientKey, 'Collection', collectionSchema, 'collections');
    
    await Product.deleteMany({});
    await Collection.deleteMany({});

    res.json({
      success: true,
      message: 'All data cleared',
    });
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
