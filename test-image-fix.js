const { fixImageUrl, fixImageUrlsInData } = require('./utils/imageUrlFixer');

// Test the problematic URLs
const testUrls = [
  'https://cdn.shopify.com/s/files/1/0776/7012/1700/files/44203786010938_61xuBBpiA9L_ac56f9a2-7f48-4859-be67-93282b077d59.jpg?v=1764309257',
  'shopify://shop_images/Untitled_design_17.png',
  'shopify://shop_images/Untitled_design_15.png'
];

console.log('🔧 Testing image URL fixer...');
testUrls.forEach(url => {
  console.log('Original URL:', url);
  const fixedUrl = fixImageUrl(url, 'cmstestingg.myshopify.com');
  console.log('Fixed URL:', fixedUrl);
  console.log('---');
});

// Test with sample theme data
const sampleData = {
  components: [
    {
      type: 'Banner',
      props: {
        image_slide: 'shopify://shop_images/Untitled_design_17.png',
        image_slide_mb: 'shopify://shop_images/Untitled_design_15.png',
        logo: 'https://cdn.shopify.com/s/files/1/0776/7012/1700/files/logo.png?v=1234567890'
      }
    }
  ],
  theme: {
    settings: {
      banner_image: 'shopify://shop_images/Untitled_design_17.png'
    }
  }
};

console.log('\n🔧 Testing data structure fixing...');
console.log('Original data:', JSON.stringify(sampleData, null, 2));

const fixedData = fixImageUrlsInData(sampleData, 'cmstestingg.myshopify.com');
console.log('Fixed data:', JSON.stringify(fixedData, null, 2));