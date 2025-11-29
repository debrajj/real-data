const axios = require('axios');

class ShopifyAPI {
  constructor(shopDomain, accessToken) {
    this.shopDomain = shopDomain;
    this.accessToken = accessToken;
    this.baseURL = `https://${shopDomain}/admin/api/2024-01`;
  }

  async getShopInfo() {
    try {
      const response = await axios.get(`${this.baseURL}/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
        },
      });
      
      return response.data.shop;
    } catch (error) {
      console.error('❌ Error fetching shop info:', error.response?.data || error.message);
      throw error;
    }
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

  async getAllBlogs() {
    try {
      const response = await axios.get(`${this.baseURL}/blogs.json`, {
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
        },
      });
      
      return response.data.blogs;
    } catch (error) {
      console.error('❌ Error fetching blogs:', error.response?.data || error.message);
      throw error;
    }
  }

  async getBlogArticles(blogId, limit = 250) {
    try {
      const response = await axios.get(`${this.baseURL}/blogs/${blogId}/articles.json`, {
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
        },
        params: { limit },
      });
      
      return response.data.articles;
    } catch (error) {
      console.error(`❌ Error fetching articles for blog ${blogId}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async getAllPages(limit = 250) {
    try {
      const response = await axios.get(`${this.baseURL}/pages.json`, {
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
        },
        params: { limit },
      });
      
      return response.data.pages;
    } catch (error) {
      console.error('❌ Error fetching pages:', error.response?.data || error.message);
      throw error;
    }
  }

  async getMenu(menuHandle) {
    try {
      // Use the Storefront API to get menu data
      const storefrontAccessToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
      
      if (!storefrontAccessToken) {
        console.warn('⚠️ No Storefront API token, using fallback menu');
        return null;
      }

      const query = `
        query getMenu($handle: String!) {
          menu(handle: $handle) {
            items {
              title
              url
              items {
                title
                url
              }
            }
          }
        }
      `;

      const response = await axios.post(
        `https://${this.shopDomain}/api/2024-01/graphql.json`,
        {
          query,
          variables: { handle: menuHandle }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
          },
        }
      );

      if (response.data.data && response.data.data.menu) {
        return {
          links: response.data.data.menu.items.map(item => ({
            title: item.title,
            url: item.url,
            links: item.items || []
          }))
        };
      }

      return null;
    } catch (error) {
      console.error(`❌ Error fetching menu ${menuHandle}:`, error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Create BOGO discount in Shopify using GraphQL Admin API
   * Note: This requires Shopify Plus for automatic discounts
   */
  async createBOGODiscount(discountData) {
    try {
      const {
        code,
        title,
        buyQuantity,
        getQuantity,
        getDiscount,
        applicableProducts = [],
        startsAt,
        endsAt,
        usageLimit
      } = discountData;

      // Build product variant IDs for GraphQL
      const productVariantIds = applicableProducts.map(p => 
        `gid://shopify/ProductVariant/${p.variantId || p.productId}`
      );

      const mutation = `
        mutation discountCodeBxgyCreate($bxgyCodeDiscount: DiscountCodeBxgyInput!) {
          discountCodeBxgyCreate(bxgyCodeDiscount: $bxgyCodeDiscount) {
            codeDiscountNode {
              id
              codeDiscount {
                ... on DiscountCodeBxgy {
                  title
                  codes(first: 1) {
                    nodes {
                      code
                    }
                  }
                  startsAt
                  endsAt
                  customerBuys {
                    value {
                      ... on DiscountQuantity {
                        quantity
                      }
                    }
                  }
                  customerGets {
                    value {
                      ... on DiscountOnQuantity {
                        quantity {
                          quantity
                        }
                        effect {
                          ... on DiscountPercentage {
                            percentage
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variables = {
        bxgyCodeDiscount: {
          title: title,
          code: code,
          startsAt: startsAt || new Date().toISOString(),
          endsAt: endsAt || null,
          customerBuys: {
            value: {
              quantity: buyQuantity.toString()
            },
            items: productVariantIds.length > 0 ? {
              productVariants: {
                ids: productVariantIds
              }
            } : {
              all: true
            }
          },
          customerGets: {
            value: {
              discountOnQuantity: {
                quantity: getQuantity.toString(),
                effect: {
                  percentage: (getDiscount / 100)
                }
              }
            },
            items: productVariantIds.length > 0 ? {
              productVariants: {
                ids: productVariantIds
              }
            } : {
              all: true
            }
          },
          usesPerOrderLimit: usageLimit || null
        }
      };

      const response = await axios.post(
        `https://${this.shopDomain}/admin/api/2024-01/graphql.json`,
        {
          query: mutation,
          variables: variables
        },
        {
          headers: {
            'X-Shopify-Access-Token': this.accessToken,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.errors) {
        throw new Error(JSON.stringify(response.data.errors));
      }

      const result = response.data.data.discountCodeBxgyCreate;
      
      if (result.userErrors && result.userErrors.length > 0) {
        throw new Error(result.userErrors.map(e => e.message).join(', '));
      }

      return result.codeDiscountNode;
    } catch (error) {
      console.error('❌ Error creating BOGO discount in Shopify:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create price rule and discount code (REST API - works for all Shopify plans)
   */
  async createPriceRule(discountData) {
    try {
      const {
        code,
        title,
        value,
        valueType = 'percentage', // 'percentage' or 'fixed_amount'
        targetType = 'line_item', // 'line_item' or 'shipping_line'
        targetSelection = 'all', // 'all' or 'entitled'
        allocationMethod = 'across', // 'across' or 'each'
        prerequisiteProductIds = [],
        entitledProductIds = [],
        startsAt,
        endsAt,
        usageLimit,
        oncePerCustomer = false,
        salesChannels = ['online_store']
      } = discountData;

      // Create price rule first
      const priceRuleResponse = await axios.post(
        `${this.baseURL}/price_rules.json`,
        {
          price_rule: {
            title: title,
            target_type: targetType,
            target_selection: targetSelection,
            allocation_method: allocationMethod,
            value_type: valueType,
            value: valueType === 'percentage' ? `-${value}` : `-${value}`,
            customer_selection: 'all',
            starts_at: startsAt || new Date().toISOString(),
            ends_at: endsAt || null,
            usage_limit: usageLimit || null,
            once_per_customer: oncePerCustomer,
            prerequisite_product_ids: prerequisiteProductIds,
            entitled_product_ids: entitledProductIds.length > 0 ? entitledProductIds : undefined
          }
        },
        {
          headers: {
            'X-Shopify-Access-Token': this.accessToken,
            'Content-Type': 'application/json',
          },
        }
      );

      const priceRuleId = priceRuleResponse.data.price_rule.id;

      // Create discount code
      const discountCodeResponse = await axios.post(
        `${this.baseURL}/price_rules/${priceRuleId}/discount_codes.json`,
        {
          discount_code: {
            code: code
          }
        },
        {
          headers: {
            'X-Shopify-Access-Token': this.accessToken,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        priceRule: priceRuleResponse.data.price_rule,
        discountCode: discountCodeResponse.data.discount_code
      };
    } catch (error) {
      console.error('❌ Error creating price rule in Shopify:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create BOGO discount in Shopify using GraphQL Admin API
   * Note: This requires Shopify Plus for automatic discounts
   */
  async createBOGODiscount(discountData) {
    try {
      const {
        code,
        title,
        buyQuantity,
        getQuantity,
        getDiscount,
        applicableProducts = [],
        startsAt,
        endsAt,
        usageLimit
      } = discountData;

      // Build product variant IDs for GraphQL
      const productVariantIds = applicableProducts.map(p => 
        `gid://shopify/ProductVariant/${p.variantId || p.productId}`
      );

      const mutation = `
        mutation discountCodeBxgyCreate($bxgyCodeDiscount: DiscountCodeBxgyInput!) {
          discountCodeBxgyCreate(bxgyCodeDiscount: $bxgyCodeDiscount) {
            codeDiscountNode {
              id
              codeDiscount {
                ... on DiscountCodeBxgy {
                  title
                  codes(first: 1) {
                    nodes {
                      code
                    }
                  }
                  startsAt
                  endsAt
                  customerBuys {
                    value {
                      ... on DiscountQuantity {
                        quantity
                      }
                    }
                  }
                  customerGets {
                    value {
                      ... on DiscountOnQuantity {
                        quantity {
                          quantity
                        }
                        effect {
                          ... on DiscountPercentage {
                            percentage
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variables = {
        bxgyCodeDiscount: {
          title: title,
          code: code,
          startsAt: startsAt || new Date().toISOString(),
          endsAt: endsAt || null,
          customerBuys: {
            value: {
              quantity: buyQuantity.toString()
            },
            items: productVariantIds.length > 0 ? {
              productVariants: {
                ids: productVariantIds
              }
            } : {
              all: true
            }
          },
          customerGets: {
            value: {
              discountOnQuantity: {
                quantity: getQuantity.toString(),
                effect: {
                  percentage: (getDiscount / 100)
                }
              }
            },
            items: productVariantIds.length > 0 ? {
              productVariants: {
                ids: productVariantIds
              }
            } : {
              all: true
            }
          },
          usesPerOrderLimit: usageLimit || null
        }
      };

      const response = await axios.post(
        `https://${this.shopDomain}/admin/api/2024-01/graphql.json`,
        {
          query: mutation,
          variables: variables
        },
        {
          headers: {
            'X-Shopify-Access-Token': this.accessToken,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.errors) {
        throw new Error(JSON.stringify(response.data.errors));
      }

      const result = response.data.data.discountCodeBxgyCreate;
      
      if (result.userErrors && result.userErrors.length > 0) {
        throw new Error(result.userErrors.map(e => e.message).join(', '));
      }

      return result.codeDiscountNode;
    } catch (error) {
      console.error('❌ Error creating BOGO discount in Shopify:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create price rule and discount code (REST API - works for all Shopify plans)
   */
  async createPriceRule(discountData) {
    try {
      const {
        code,
        title,
        value,
        valueType = 'percentage', // 'percentage' or 'fixed_amount'
        targetType = 'line_item', // 'line_item' or 'shipping_line'
        targetSelection = 'all', // 'all' or 'entitled'
        allocationMethod = 'across', // 'across' or 'each'
        prerequisiteProductIds = [],
        entitledProductIds = [],
        startsAt,
        endsAt,
        usageLimit,
        oncePerCustomer = false,
        salesChannels = ['online_store']
      } = discountData;

      // Create price rule first
      const priceRuleResponse = await axios.post(
        `${this.baseURL}/price_rules.json`,
        {
          price_rule: {
            title: title,
            target_type: targetType,
            target_selection: targetSelection,
            allocation_method: allocationMethod,
            value_type: valueType,
            value: valueType === 'percentage' ? `-${value}` : `-${value}`,
            customer_selection: 'all',
            starts_at: startsAt || new Date().toISOString(),
            ends_at: endsAt || null,
            usage_limit: usageLimit || null,
            once_per_customer: oncePerCustomer,
            prerequisite_product_ids: prerequisiteProductIds,
            entitled_product_ids: entitledProductIds.length > 0 ? entitledProductIds : undefined
          }
        },
        {
          headers: {
            'X-Shopify-Access-Token': this.accessToken,
            'Content-Type': 'application/json',
          },
        }
      );

      const priceRuleId = priceRuleResponse.data.price_rule.id;

      // Create discount code
      const discountCodeResponse = await axios.post(
        `${this.baseURL}/price_rules/${priceRuleId}/discount_codes.json`,
        {
          discount_code: {
            code: code
          }
        },
        {
          headers: {
            'X-Shopify-Access-Token': this.accessToken,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        priceRule: priceRuleResponse.data.price_rule,
        discountCode: discountCodeResponse.data.discount_code
      };
    } catch (error) {
      console.error('❌ Error creating price rule in Shopify:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = ShopifyAPI;
