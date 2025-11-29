const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/theme-data?shop=cmstestingg.myshopify.com',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const slideshow = json.data.components.find(c => c.component === 'SlideShow');
      
      if (slideshow) {
        console.log('\n=== SLIDESHOW IN API RESPONSE ===\n');
        console.log('SlideShow found:', !!slideshow);
        console.log('Number of blocks:', slideshow.blocks?.length || 0);
        
        if (slideshow.blocks && slideshow.blocks[0]) {
          console.log('\nFirst slide:');
          console.log('  image_slide:', slideshow.blocks[0].settings.image_slide);
          console.log('  image_slide_mb:', slideshow.blocks[0].settings.image_slide_mb);
          console.log('  heading:', slideshow.blocks[0].settings.heading);
          console.log('  button_slide:', slideshow.blocks[0].settings.button_slide);
        }
      } else {
        console.log('No SlideShow component found');
      }
    } catch (error) {
      console.error('Error parsing response:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error.message);
});

req.end();
