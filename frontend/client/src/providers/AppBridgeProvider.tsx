import React, { useMemo } from 'react';
import { Provider } from '@shopify/app-bridge-react';
import { AppProvider as PolarisProvider } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';

interface AppBridgeProviderProps {
  children: React.ReactNode;
}

export function AppBridgeProvider({ children }: AppBridgeProviderProps) {
  const urlParams = new URLSearchParams(window.location.search);
  const host = urlParams.get('host');
  const apiKey = import.meta.env.VITE_SHOPIFY_API_KEY;

  const config = useMemo(() => {
    if (!host || !apiKey) return null;
    return {
      host,
      apiKey,
      forceRedirect: true,
    };
  }, [host, apiKey]);

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading Shopify Configuration...</p>
      </div>
    );
  }

  return (
    <PolarisProvider i18n={{}}>
      <Provider config={config}>
        {children}
      </Provider>
    </PolarisProvider>
  );
}