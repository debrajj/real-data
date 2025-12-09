import axios from 'axios';
import { getSessionToken } from '@shopify/app-bridge-utils';
import { createApp } from '@shopify/app-bridge';

// Helper to get app instance
const getApp = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const host = urlParams.get('host');
  const apiKey = import.meta.env.VITE_SHOPIFY_API_KEY;

  if (host && apiKey) {
    return createApp({
      apiKey,
      host,
    });
  }
  return null;
};

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use(async (config) => {
  const app = getApp();
  if (app) {
    try {
      const token = await getSessionToken(app);
      config.headers['Authorization'] = `Bearer ${token}`;
    } catch (e) {
      console.error('Error getting session token', e);
    }
  }
  return config;
});

export default api;