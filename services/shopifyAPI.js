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
}

module.exports = ShopifyAPI;
