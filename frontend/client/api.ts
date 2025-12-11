/**
 * API Service Layer - Connects frontend to backend
 * Supports session-based authentication for multi-tenant app
 */

const API_BASE = '/api';

// Session token storage - initialize from localStorage immediately
let sessionToken: string | null = (() => {
  try {
    return localStorage.getItem('session_token');
  } catch {
    return null;
  }
})();

// Set session token (call after login)
export function setSessionToken(token: string | null) {
  sessionToken = token;
  if (token) {
    localStorage.setItem('session_token', token);
  } else {
    localStorage.removeItem('session_token');
  }
}

// Get session token
export function getSessionToken(): string | null {
  // Always try to get from localStorage first to handle page refresh
  if (!sessionToken) {
    try {
      sessionToken = localStorage.getItem('session_token');
    } catch {
      // localStorage not available
    }
  }
  return sessionToken;
}

// Clear session
export function clearSession() {
  sessionToken = null;
  localStorage.removeItem('session_token');
  localStorage.removeItem('session_data');
}

// Generic fetch wrapper with error handling and auth
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getSessionToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options?.headers as Record<string, string>,
  };

  // Add auth header if session exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Include cookies
  });

  const data = await response.json();
  
  // Handle auth errors
  if (response.status === 401) {
    clearSession();
    throw new Error(data.error || 'Session expired. Please login again.');
  }
  
  if (!response.ok || !data.success) {
    throw new Error(data.error || `API Error: ${response.status}`);
  }
  
  return data;
}

// ============ Config API ============
export interface ConfigResponse {
  success: boolean;
  data: ClientConfigData[];
  count?: number;
}

export interface ClientConfigData {
  _id: string;
  clientName: string;
  clientKey: string;
  environment: string;
  apiBaseUrl: string;
  adminApiBaseUrl: string;
  shopDomain?: string;
  appName: string;
  primaryColor: string;
  bundleId: string;
  packageName: string;
  logoUrl: string;
  storefrontToken: string;
  adminShopToken: string;
  databaseName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const configAPI = {
  // Get all configs for a client key
  getByClientKey: (clientKey: string) => 
    fetchAPI<ConfigResponse>(`/config/${encodeURIComponent(clientKey)}`),
  
  // Get config by client key and environment
  getByKeyAndEnv: (clientKey: string, environment: string) =>
    fetchAPI<ConfigResponse>(`/config/${encodeURIComponent(clientKey)}/${environment}`),
  
  // Create new config
  create: (config: Partial<ClientConfigData>) =>
    fetchAPI<{ success: boolean; message: string; id: string }>('/config', {
      method: 'POST',
      body: JSON.stringify(config),
    }),
  
  // Create config with auto-sync
  createWithSync: (config: Partial<ClientConfigData>) =>
    fetchAPI<{ success: boolean; config: ClientConfigData; syncResults: any }>('/config/sync', {
      method: 'POST',
      body: JSON.stringify(config),
    }),
  
  // Update config
  update: (clientKey: string, environment: string, updates: Partial<ClientConfigData>) =>
    fetchAPI<{ success: boolean; data: ClientConfigData }>(`/config/stores/${clientKey}/${environment}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
};

// ============ Products API ============
export interface Product {
  _id: string;
  productId: string;
  shopDomain?: string;
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  status: string;
  tags: string | string[]; // Can be comma-separated string or array
  images: Array<{
    id: string;
    src: string;
    alt?: string;
    width?: number;
    height?: number;
  }>;
  variants: Array<{
    id: string;
    title: string;
    price: string;
    compare_at_price?: string;
    sku?: string;
    inventory_quantity?: number;
  }>;
  collections?: Array<{ id: string; handle: string }>;
}

export interface ProductsResponse {
  success: boolean;
  count: number;
  products: Product[];
}

export const productsAPI = {
  // Get products by clientKey (preferred method)
  getByClientKey: (clientKey: string, options?: { limit?: number }) => {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI<ProductsResponse>(`/products/client/${encodeURIComponent(clientKey)}${query}`);
  },
  
  // Get all products (legacy)
  getAll: (shopDomain?: string, options?: { limit?: number; collection?: string }) => {
    const params = new URLSearchParams();
    if (shopDomain) params.append('shop', shopDomain);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.collection) params.append('collection', options.collection);
    return fetchAPI<ProductsResponse>(`/products?${params.toString()}`);
  },
  
  // Get products by shop domain
  getByShop: (shopDomain: string) =>
    fetchAPI<ProductsResponse>(`/products/${encodeURIComponent(shopDomain)}`),
  
  // Get single product
  getOne: (shopDomain: string, productId: string) =>
    fetchAPI<{ success: boolean; product: Product }>(`/products/${shopDomain}/${productId}`),
  
  // Sync all products
  syncAll: (shopDomain: string) =>
    fetchAPI<{ success: boolean; message: string }>(`/products/${shopDomain}/sync`, { method: 'POST' }),
};

// ============ Collections API ============
export interface Collection {
  _id: string;
  collectionId: string;
  shopDomain?: string;
  title: string;
  handle: string;
  description?: string;
  body_html?: string;
  image?: {
    src: string;
    alt?: string;
  };
  products_count?: number;
  products?: Product[];
}

export interface CollectionsResponse {
  success: boolean;
  count: number;
  collections: Collection[];
}

export const collectionsAPI = {
  // Get collections by clientKey (preferred method)
  getByClientKey: (clientKey: string, options?: { limit?: number }) => {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI<CollectionsResponse>(`/collections/client/${encodeURIComponent(clientKey)}${query}`);
  },
  
  // Get collections by shop domain (legacy)
  getByShop: (shopDomain: string) =>
    fetchAPI<CollectionsResponse>(`/collections/${encodeURIComponent(shopDomain)}`),
};

// ============ Theme API ============
export interface ThemeData {
  _id: string;
  shopDomain?: string;
  themeId: string;
  themeName: string;
  version: number;
  components: any[];
  pages: Record<string, any>;
  theme: any;
  updatedAt: string;
}

export interface ThemeDataResponse {
  success: boolean;
  data: ThemeData & {
    products: Product[];
    collections: Collection[];
  };
}

export interface ThemeClientResponse {
  success: boolean;
  data: {
    theme: ThemeData | null;
    products: Product[];
    collections: Collection[];
    counts: {
      products: number;
      collections: number;
      hasTheme: boolean;
    };
  };
}

export interface ThemeStatusResponse {
  success: boolean;
  synced: boolean;
  version?: number;
  lastSync?: string;
  themeId?: string;
  themeName?: string;
  componentsCount?: number;
}

export interface ShopifyTheme {
  id: string;
  name: string;
  role: string;
  isActive: boolean;
  previewable: boolean;
  processing: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ThemeListResponse {
  success: boolean;
  themes: ShopifyTheme[];
  activeThemeId: string;
}

export const themeAPI = {
  // Get all data by clientKey (preferred - includes products, collections, theme)
  getByClientKey: (clientKey: string) =>
    fetchAPI<ThemeClientResponse>(`/theme/client/${encodeURIComponent(clientKey)}`),
  
  // Get all available themes from Shopify
  listThemes: (shopDomain?: string) => {
    const params = shopDomain ? `?shopDomain=${encodeURIComponent(shopDomain)}` : '';
    return fetchAPI<ThemeListResponse>(`/theme/list${params}`);
  },
  
  // Get theme data
  getData: (shopDomain?: string) => {
    const params = shopDomain ? `?shopDomain=${encodeURIComponent(shopDomain)}` : '';
    return fetchAPI<ThemeDataResponse>(`/theme/data${params}`);
  },
  
  // Get theme sync status
  getStatus: (shopDomain?: string) => {
    const params = shopDomain ? `?shopDomain=${encodeURIComponent(shopDomain)}` : '';
    return fetchAPI<ThemeStatusResponse>(`/theme/status${params}`);
  },
  
  // Trigger theme sync with specific theme ID
  sync: (shopDomain?: string, themeId?: string) =>
    fetchAPI<{ success: boolean; message: string; version: number }>('/theme/sync', {
      method: 'POST',
      body: JSON.stringify({ shopDomain, themeId }),
    }),
};

// ============ Blogs API ============
export interface Blog {
  _id: string;
  blogId: string;
  shopDomain: string;
  title: string;
  handle: string;
  articleCount?: number;
}

export interface Article {
  _id: string;
  articleId: string;
  blogId: string;
  shopDomain: string;
  title: string;
  handle: string;
  author: string;
  body_html: string;
  summary_html?: string;
  image?: { src: string; alt?: string };
  published_at: string;
  tags: string[];
}

export const blogsAPI = {
  getByShop: (shopDomain: string) =>
    fetchAPI<{ success: boolean; blogs: Blog[] }>(`/blogs/${encodeURIComponent(shopDomain)}`),
  
  getArticles: (shopDomain: string, blogId?: string) => {
    const params = blogId ? `?blogId=${blogId}` : '';
    return fetchAPI<{ success: boolean; articles: Article[] }>(`/blogs/${shopDomain}/articles${params}`);
  },
};

// ============ Media API ============
export interface MediaItem {
  _id: string;
  shopDomain: string;
  filename: string;
  originalUrl: string;
  cdnUrl?: string;
  contentType: string;
  size: number;
  width?: number;
  height?: number;
  alt?: string;
}

export const mediaAPI = {
  getByShop: (shopDomain: string) =>
    fetchAPI<{ success: boolean; media: MediaItem[] }>(`/media/${encodeURIComponent(shopDomain)}`),
  
  getImageUrl: (shopDomain: string, mediaId: string) =>
    `${API_BASE}/media/${shopDomain}/image/${mediaId}`,
};

// ============ Discounts API ============
export interface Discount {
  _id: string;
  shopDomain: string;
  discountId: string;
  title: string;
  code?: string;
  type: string;
  value: number;
  valueType: string;
  startsAt: string;
  endsAt?: string;
  status: string;
}

export const discountsAPI = {
  getByShop: (shopDomain: string) =>
    fetchAPI<{ success: boolean; discounts: Discount[] }>(`/discounts/${encodeURIComponent(shopDomain)}`),
};

// ============ Session API ============
export interface ShopInfo {
  name: string;
  email: string;
  currency: string;
  timezone: string;
}

export interface SessionData {
  token: string;
  clientKey: string;
  shopDomain: string;
  shopInfo: ShopInfo;
  isNewClient?: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  session: SessionData;
}

export interface SyncResults {
  products: { success: boolean; synced?: number; total?: number; error?: string };
  collections: { success: boolean; synced?: number; total?: number; error?: string };
  blogs: { success: boolean; blogsCount?: number; articlesCount?: number; error?: string };
  theme: { success: boolean; themeName?: string; components?: number; error?: string };
}

export const sessionAPI = {
  // Login with Shopify credentials
  login: async (credentials: {
    shopDomain: string;
    adminToken: string;
    storefrontToken: string;
  }): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE}/session/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
      credentials: 'include',
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Login failed');
    }
    
    // Store session token
    if (data.session?.token) {
      setSessionToken(data.session.token);
      localStorage.setItem('session_data', JSON.stringify(data.session));
    }
    
    return data;
  },
  
  // Logout
  logout: async () => {
    try {
      await fetchAPI('/session/logout', { method: 'POST' });
    } finally {
      clearSession();
    }
  },
  
  // Get current session info
  me: () => fetchAPI<{
    success: boolean;
    session: {
      clientKey: string;
      shopDomain: string;
      shopInfo: ShopInfo;
      config: {
        appName: string;
        primaryColor: string;
        logoUrl: string;
        environment: string;
      } | null;
    };
  }>('/session/me'),
  
  // Validate session
  validate: async (): Promise<{
    valid: boolean;
    session?: {
      clientKey: string;
      shopDomain: string;
      shopInfo: ShopInfo;
    };
  }> => {
    try {
      const token = getSessionToken();
      console.log('🔍 Validating session, token exists:', !!token);
      
      if (!token) {
        console.log('❌ No token found in storage');
        return { valid: false };
      }
      
      const response = await fetch(`${API_BASE}/session/validate`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      console.log('🔍 Validate response:', data);
      
      if (data.valid && data.session) {
        return { valid: true, session: data.session };
      }
      
      return { valid: false };
    } catch (error) {
      console.error('❌ Validate error:', error);
      return { valid: false };
    }
  },
  
  // Sync all Shopify data
  sync: () => fetchAPI<{
    success: boolean;
    message: string;
    syncResults: SyncResults;
  }>('/session/sync', { method: 'POST' }),
  
  // Update config (branding)
  updateConfig: (updates: {
    appName?: string;
    primaryColor?: string;
    logoUrl?: string;
  }) => fetchAPI<{ success: boolean; config: ClientConfigData }>('/session/config', {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  
  // Get stored session data
  getStoredSession: (): SessionData | null => {
    const data = localStorage.getItem('session_data');
    return data ? JSON.parse(data) : null;
  },
  
  // Check if logged in
  isLoggedIn: (): boolean => {
    return !!getSessionToken();
  },
};

export default {
  config: configAPI,
  products: productsAPI,
  collections: collectionsAPI,
  theme: themeAPI,
  blogs: blogsAPI,
  media: mediaAPI,
  discounts: discountsAPI,
  session: sessionAPI,
  setSessionToken,
  getSessionToken,
  clearSession,
};
