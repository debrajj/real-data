const axios = require('axios');

(async () => {
  try {
    const response = await axios.get('http://localhost:3001/api/theme-data?shop=cmstestingg.myshopify.com');
    const data = response.data.data;
    
    console.log('Has pages?', !!data.pages);
    console.log('Pages keys:', Object.keys(data.pages || {}));
    console.log('Collection page components:', data.pages?.collection?.components?.length || 0);
    console.log('Product page components:', data.pages?.product?.components?.length || 0);
    
    console.log('\nCollection page first component:');
    console.log(JSON.stringify(data.pages?.collection?.components?.[0], null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
