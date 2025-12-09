/**
 * Shopify Embedded App - Main Entry Point
 * Uses Shopify App Bridge and Polaris for native Shopify admin experience
 */
/// <reference path="./types.d.ts" />
import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import {
  AppProvider,
  Page,
  Layout,
  LegacyCard,
  Text,
  Spinner,
  Banner,
  Frame,
  Button,
  Card,
  BlockStack,
  InlineStack,
  Badge,
} from '@shopify/polaris';
import enTranslations from '@shopify/polaris/locales/en.json';

// Import your existing dashboard components
import AdminDashboard from '../views/AdminDashboard';
import ConfigView from '../views/ConfigView';
import { AppConfig, AppEnvironment, DashboardTab } from '../types';

// Types
interface ShopifySession {
  shop: string;
  clientKey: string;
  appName: string;
  primaryColor: string;
  logoUrl: string;
}

interface SessionResponse {
  success: boolean;
  installed: boolean;
  session?: ShopifySession;
  redirectUrl?: string;
}

// Get shop from URL
function getShopFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('shop');
}

// Session Context
const SessionContext = createContext<ShopifySession | null>(null);
export const useShopifySession = () => useContext(SessionContext);

// Session Provider Component
const ShopifySessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<ShopifySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initSession = async () => {
      const shop = getShopFromUrl();
      
      if (!shop) {
        // No shop param - might be standalone mode or direct access
        // Try to work without session for development
        console.log('No shop parameter - running in standalone mode');
        setSession({
          shop: '',
          clientKey: '',
          appName: 'AppMint',
          primaryColor: '#008060',
          logoUrl: ''
        });
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/shopify/session?shop=${encodeURIComponent(shop)}`);
        const data: SessionResponse = await response.json();

        if (data.success && data.installed && data.session) {
          setSession(data.session);
        } else if (data.redirectUrl) {
          // Redirect to OAuth
          window.location.href = data.redirectUrl;
          return;
        } else {
          // Not installed - redirect to OAuth
          window.location.href = `/api/shopify/auth?shop=${encodeURIComponent(shop)}`;
          return;
        }
      } catch (err) {
        console.error('Session init error:', err);
        // Fallback to standalone mode
        setSession({
          shop: shop,
          clientKey: shop.replace('.myshopify.com', ''),
          appName: 'AppMint',
          primaryColor: '#008060',
          logoUrl: ''
        });
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, []);

  if (loading) {
    return (
      <Frame>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <Spinner size="large" />
          <Text as="p" variant="bodyMd">Loading your app...</Text>
        </div>
      </Frame>
    );
  }

  if (error && !session) {
    return (
      <Frame>
        <Page>
          <Banner tone="critical" title="Session Error">
            <p>{error}</p>
          </Banner>
        </Page>
      </Frame>
    );
  }

  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
};

// Navigation Menu Component (uses App Bridge nav-menu)
const NavigationMenu: React.FC = () => {
  return (
    <ui-nav-menu>
      <a href="/" rel="home">Dashboard</a>
      <a href="/preview">Preview</a>
      <a href="/build">Build Manager</a>
      <a href="/sync">Theme Sync</a>
      <a href="/settings">Settings</a>
    </ui-nav-menu>
  );
};

// Dashboard Page - Wraps your existing AdminDashboard
const DashboardPage: React.FC = () => {
  const session = useShopifySession();
  const [configs, setConfigs] = useState<Record<string, AppConfig>>({});
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadConfig = async () => {
      const clientKey = session?.clientKey;
      
      if (!clientKey) {
        setNeedsSetup(true);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/config/${encodeURIComponent(clientKey)}`);
        const data = await response.json();

        if (data.success && data.data && data.data.length > 0) {
          const configMap: Record<string, AppConfig> = {};
          data.data.forEach((cfg: any) => {
            const env = cfg.environment === 'development' ? AppEnvironment.DEV : AppEnvironment.PROD;
            configMap[env] = {
              clientName: cfg.clientName,
              clientKey: cfg.clientKey,
              shopDomain: cfg.shopDomain,
              apiBaseUrl: cfg.apiBaseUrl,
              adminApiBaseUrl: cfg.adminApiBaseUrl,
              appName: cfg.appName,
              primaryColor: cfg.primaryColor,
              bundleId: cfg.bundleId,
              packageName: cfg.packageName,
              logoUrl: cfg.logoUrl,
              environment: env,
              storefrontToken: cfg.storefrontToken || '',
              adminShopToken: cfg.adminShopToken || '',
            };
          });
          setConfigs(configMap);
          setNeedsSetup(false);
        } else {
          setNeedsSetup(true);
        }
      } catch (err) {
        console.error('Failed to load config:', err);
        setNeedsSetup(true);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [session]);

  if (loading) {
    return (
      <Page title="Dashboard">
        <Layout>
          <Layout.Section>
            <LegacyCard sectioned>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <Spinner size="large" />
              </div>
            </LegacyCard>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  // If no configs, show setup
  if (needsSetup || Object.keys(configs).length === 0) {
    return <SetupPage onComplete={() => window.location.reload()} />;
  }

  // Render your existing AdminDashboard
  return (
    <div className="shopify-dashboard-wrapper">
      <AdminDashboard 
        configs={configs} 
        onLogout={() => {
          // In embedded app, logout means going back to Shopify admin
          const shop = session?.shop;
          if (shop && window.top) {
            window.top.location.href = `https://${shop}/admin`;
          } else {
            navigate('/');
          }
        }} 
      />
    </div>
  );
};

// Setup Page for new installations
const SetupPage: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const session = useShopifySession();
  const navigate = useNavigate();

  const handleSave = async (configs: Record<string, AppConfig>) => {
    // Configs are saved via ConfigView
    if (onComplete) {
      onComplete();
    } else {
      navigate('/');
      window.location.reload();
    }
  };

  const initialConfig: AppConfig = {
    clientName: session?.appName || '',
    clientKey: session?.clientKey || '',
    shopDomain: session?.shop || '',
    apiBaseUrl: session?.shop ? `https://${session.shop}` : '',
    adminApiBaseUrl: session?.shop ? `https://${session.shop}/admin/api/2024-01` : '',
    appName: session?.appName || '',
    primaryColor: session?.primaryColor || '#008060',
    bundleId: '',
    packageName: '',
    logoUrl: session?.logoUrl || '',
    environment: AppEnvironment.PROD,
    storefrontToken: '',
    adminShopToken: '',
  };

  return <ConfigView initialConfig={initialConfig} onSave={handleSave} />;
};

// Preview Page
const PreviewPage: React.FC = () => {
  return (
    <Page title="App Preview">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Mobile App Preview</Text>
              <Text as="p" variant="bodyMd">
                Preview how your mobile app will look on different devices.
              </Text>
              <Banner tone="info">
                <p>This feature shows a live preview of your app with synced Shopify data.</p>
              </Banner>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

// Build Manager Page
const BuildManagerPage: React.FC = () => {
  return (
    <Page title="Build Manager">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Build Your Mobile App</Text>
              <Text as="p" variant="bodyMd">
                Generate iOS and Android builds for your mobile app.
              </Text>
              <InlineStack gap="300">
                <Button>Build for iOS</Button>
                <Button>Build for Android</Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

// Theme Sync Page
const ThemeSyncPage: React.FC = () => {
  const [syncing, setSyncing] = useState(false);
  const session = useShopifySession();

  const handleSync = async () => {
    setSyncing(true);
    try {
      const shop = session?.shop;
      if (shop) {
        await fetch('/api/theme/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shopDomain: shop })
        });
      }
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Page title="Theme Sync">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Sync Your Shopify Theme</Text>
              <Text as="p" variant="bodyMd">
                Pull the latest theme configuration, products, and collections from your Shopify store.
              </Text>
              <Button onClick={handleSync} loading={syncing}>
                {syncing ? 'Syncing...' : 'Start Sync'}
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

// Settings Page
const SettingsPage: React.FC = () => {
  return (
    <Page title="Settings">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">App Settings</Text>
              <Text as="p" variant="bodyMd">
                Configure your app settings, branding, and API connections.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

// Main App Component
const ShopifyApp: React.FC = () => {
  return (
    <>
      <NavigationMenu />
      <BrowserRouter>
        <AppProvider i18n={enTranslations}>
          <Frame>
            <ShopifySessionProvider>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/preview" element={<PreviewPage />} />
                <Route path="/build" element={<BuildManagerPage />} />
                <Route path="/sync" element={<ThemeSyncPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/setup" element={<SetupPage />} />
              </Routes>
            </ShopifySessionProvider>
          </Frame>
        </AppProvider>
      </BrowserRouter>
    </>
  );
};

export default ShopifyApp;
