const { fixImageUrl, fixImageUrlsInData } = require('./utils/imageUrlFixer');

// Test the problematic URL
const testUrl = 'https://cdn.shopify.com/s/files/1/0776/7012/1700/files/44203786010938_61xuBBpiA9L_ac56f9a2-7f48-4859-be67-93282b077d59.jpg?v=1764309257';

console.log('🔧 Testing image URL fixer...');
console.log('Original URL:', testUrl);

const fixedUrl = fixImageUrl(testUrl);
console.log('Fixed URL:', fixedUrl);

// Test with sample theme data
const sampleData = {
  components: [
    {
      type: 'Banner',
      props: {
        image: testUrl,
        logo: 'https://cdn.shopify.com/s/files/1/0776/7012/1700/files/logo.png?v=1234567890'
      }
    }
  ],
  theme: {
    settings: {
      banner_image: testUrl
    }
  }
};

console.log('\n🔧 Testing data structure fixing...');
console.log('Original data:', JSON.stringify(sampleData, null, 2));

const fixedData = fixImageUrlsInData(sampleData);
console.log('Fixed data:', JSON.stringify(fixedData, null, 2));