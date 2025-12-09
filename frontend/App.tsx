import React, { useState } from 'react';
import WelcomeView from './views/WelcomeView';
import ConfigView from './views/ConfigView';
import SyncSuccessView from './views/SyncSuccessView';
import AdminDashboard from './views/AdminDashboard';
import { AppConfig, AppEnvironment, AppView } from './types';

// Default configuration for the form (empty state for new users)
const defaultConfig: AppConfig = {
  clientName: '',
  clientKey: '', // Will be auto-generated
  apiBaseUrl: 'https://api.example.com/app',
  adminApiBaseUrl: 'https://api.example.com/app/admin',
  appName: '',
  primaryColor: '#E91E63',
  bundleId: 'com.example.app',
  packageName: 'com.example.app',
  logoUrl: '',
  environment: AppEnvironment.DEV,
  storefrontToken: '',
  adminShopToken: ''
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.WELCOME);
  
  // Store configs for both environments
  const [appConfigs, setAppConfigs] = useState<Record<string, AppConfig>>({
    [AppEnvironment.DEV]: { ...defaultConfig, environment: AppEnvironment.DEV },
    [AppEnvironment.PROD]: { ...defaultConfig, environment: AppEnvironment.PROD }
  });

  const handleNewStart = () => {
    // Reset config for new user, keep defaults
    setAppConfigs({
        [AppEnvironment.DEV]: { ...defaultConfig, environment: AppEnvironment.DEV },
        [AppEnvironment.PROD]: { ...defaultConfig, environment: AppEnvironment.PROD }
    });
    setCurrentView(AppView.CONFIGURATION);
  };

  const handleExistingConnect = (configs: Record<string, AppConfig>) => {
    setAppConfigs(configs);
    // Onboard existing clients directly to dashboard
    setCurrentView(AppView.DASHBOARD);
  };

  const handleConfigSave = (configs: Record<string, AppConfig>) => {
    setAppConfigs(configs);
    // New users go to success screen first
    setCurrentView(AppView.SYNC_SUCCESS);
  };

  const handleLogout = () => {
    // In a real app, clear tokens/session here
    setCurrentView(AppView.WELCOME);
  };

  // Helper to get a safe config for the initial view (usually Dev)
  const initialConfig = appConfigs[AppEnvironment.DEV] || defaultConfig;

  const renderView = () => {
    switch (currentView) {
      case AppView.WELCOME:
        return (
          <WelcomeView 
            logoUrl={initialConfig.logoUrl} 
            onStartNew={handleNewStart}
            onConnectExisting={handleExistingConnect}
          />
        );
      case AppView.CONFIGURATION:
        return (
          <ConfigView 
            initialConfig={initialConfig} 
            onSave={handleConfigSave} 
          />
        );
      case AppView.SYNC_SUCCESS:
        return (
          <SyncSuccessView 
            clientKey={initialConfig.clientKey}
            appName={initialConfig.appName}
            onContinue={() => setCurrentView(AppView.DASHBOARD)} 
          />
        );
      case AppView.DASHBOARD:
        return (
          <AdminDashboard configs={appConfigs} onLogout={handleLogout} />
        );
      default:
        return <div>Unknown View</div>;
    }
  };

  return (
    <>
      {renderView()}
    </>
  );
};

export default App;