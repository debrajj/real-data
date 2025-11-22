const axios = require('axios');

class ShopifyAPI {
  constructor(shopDomain, accessToken) {
    this.shopDomain = shopDomain;
    this.accessToken = accessToken;
    this.baseURL = `https://${shopDomain}/admin/api/2024-01`;
  }

  async getActiveTheme() {
    try {
      const response = await axios.get(`${this.baseURL}/themes.json`, {
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
        },
      });
      
      const activeTheme = response.data.themes.find(theme => theme.role === 'main');
      return activeTheme;
    } catch (error) {
      console.error('❌ Error fetching active theme:', error.response?.data || error.message);
      throw error;
    }
  }

  async getThemeAsset(themeId, assetKey) {
    try {
      const response = await axios.get(
        `${this.baseURL}/themes/${themeId}/assets.json`,
        {
          params: { 'asset[key]': assetKey },
          headers: {
            'X-Shopify-Access-Token': this.accessToken,
          },
        }
      );
      
      return response.data.asset;
    } catch (error) {
      console.error(`❌ Error fetching asset ${assetKey}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async getSettingsData(themeId) {
    try {
      const asset = await this.getThemeAsset(themeId, 'config/settings_data.json');
      
      if (asset && asset.value) {
        return JSON.parse(asset.value);
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error fetching settings_data.json:', error.message);
      throw error;
    }
  }

  async getTemplateData(themeId, templateName = 'index') {
    try {
      const asset = await this.getThemeAsset(themeId, `templates/${templateName}.json`);
      
      if (asset && asset.value) {
        return JSON.parse(asset.value);
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Error fetching template ${templateName}.json:`, error.message);
      return null; // Don't throw, just return null if template doesn't exist
    }
  }

  async getProduct(productId) {
    try {
      const response = await axios.get(`${this.baseURL}/products/${productId}.json`, {
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
        },
      });
      
      return response.data.product;
    } catch (error) {
      console.error(`❌ Error fetching product ${productId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async getAllProducts(limit = 250) {
    try {
      let allProducts = [];
      let params = { limit };
      let hasMore = true;

      while (hasMore) {
        const response = await axios.get(`${this.baseURL}/products.json`, {
          headers: {
            'X-Shopify-Access-Token': this.accessToken,
          },
          params,
        });

        const products = response.data.products;
        allProducts = allProducts.concat(products);

        // Check for pagination
        const linkHeader = response.headers.link;
        if (linkHeader && linkHeader.includes('rel="next"')) {
          // Extract next page info from link header
          const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
          if (nextMatch) {
            const nextUrl = new URL(nextMatch[1]);
            params = {
              limit,
              page_info: nextUrl.searchParams.get('page_info'),
            };
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }

        // Safety limit
        if (allProducts.length >= 1000) {
          console.warn('⚠️ Reached 1000 products limit');
          break;
        }
      }

      return allProducts;
    } catch (error) {
      console.error('❌ Error fetching all products:', error.response?.data || error.message);
      throw error;
    }
  }

  async getCollections(limit = 250) {
    try {
      const response = await axios.get(`${this.baseURL}/custom_collections.json`, {
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
        },
        params: { limit },
      });
      
      return response.data.custom_collections;
    } catch (error) {
      console.error('❌ Error fetching collections:', error.response?.data || error.message);
      throw error;
    }
  }

  async getOrders(limit = 250) {
    try {
      const response = await axios.get(`${this.baseURL}/orders.json`, {
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
        },
        params: { limit, status: 'any' },
      });
      
      return response.data.orders;
    } catch (error) {
      console.error('❌ Error fetching orders:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = ShopifyAPI;
