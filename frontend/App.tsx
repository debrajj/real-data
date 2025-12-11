import React, { useState, useEffect } from 'react';
import WelcomeView from './views/WelcomeView';
import LoginView from './views/LoginView';
import ConfigView from './views/ConfigView';
import SyncSuccessView from './views/SyncSuccessView';
import AdminDashboard from './views/AdminDashboard';
import { AppConfig, AppEnvironment, AppView } from './types';
import { sessionAPI, SessionData, clearSession } from './client/api';
import { Loader2 } from 'lucide-react';

// Default configuration for the form (empty state for new users)
const defaultConfig: AppConfig = {
  clientName: '',
  clientKey: '',
  apiBaseUrl: '',
  adminApiBaseUrl: '',
  appName: '',
  primaryColor: '#E91E63',
  bundleId: '',
  packageName: '',
  logoUrl: '',
  environment: AppEnvironment.DEV,
  storefrontToken: '',
  adminShopToken: ''
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.WELCOME);
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  
  // Store configs for both environments
  const [appConfigs, setAppConfigs] = useState<Record<string, AppConfig>>({
    [AppEnvironment.DEV]: { ...defaultConfig, environment: AppEnvironment.DEV },
    [AppEnvironment.PROD]: { ...defaultConfig, environment: AppEnvironment.PROD }
  });

  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      // Check if we have a stored session token (either from session_data or session_token)
      const storedSession = sessionAPI.getStoredSession();
      const hasToken = sessionAPI.isLoggedIn();
      const rawToken = localStorage.getItem('session_token');
      
      console.log('🔍 Session check - storedSession:', !!storedSession);
      console.log('🔍 Session check - hasToken:', hasToken);
      console.log('🔍 Session check - rawToken in localStorage:', !!rawToken);
      
      if (storedSession || hasToken || rawToken) {
        // Validate the session with the server
        console.log('🔍 Calling validate API...');
        const validation = await sessionAPI.validate();
        console.log('🔍 Validate result:', validation);
        
        if (validation.valid && validation.session) {
          console.log('✅ Session restored:', validation.session.shopInfo?.name);
          
          // Get token from storage
          const token = storedSession?.token || rawToken || '';
          
          const restoredSession: SessionData = {
            token,
            clientKey: validation.session.clientKey,
            shopDomain: validation.session.shopDomain,
            shopInfo: validation.session.shopInfo,
          };
          
          setSessionData(restoredSession);
          
          // Re-save session data to ensure it's complete
          localStorage.setItem('session_data', JSON.stringify(restoredSession));
          
          // Update configs from session
          updateConfigsFromSession(validation.session);
          setCurrentView(AppView.DASHBOARD);
        } else {
          // Invalid session, clear it
          console.log('❌ Session invalid, validation result:', validation);
          clearSession();
          setCurrentView(AppView.WELCOME);
        }
      } else {
        console.log('🔍 No session found, showing welcome');
        setCurrentView(AppView.WELCOME);
      }
    } catch (error) {
      console.error('Session check error:', error);
      clearSession();
      setCurrentView(AppView.WELCOME);
    } finally {
      setLoading(false);
    }
  };

  const updateConfigsFromSession = (session: any) => {
    const config: AppConfig = {
      clientName: session.shopInfo?.name || '',
      clientKey: session.clientKey,
      apiBaseUrl: `https://${session.shopDomain}`,
      adminApiBaseUrl: `https://${session.shopDomain}/admin/api/2024-01`,
      appName: session.shopInfo?.name || '',
      primaryColor: session.config?.primaryColor || '#E91E63',
      bundleId: `com.${session.clientKey.replace(/-/g, '')}.app`,
      packageName: `com.${session.clientKey.replace(/-/g, '')}.app`,
      logoUrl: session.config?.logoUrl || '',
      environment: AppEnvironment.PROD,
      storefrontToken: '',
      adminShopToken: '',
    };

    setAppConfigs({
      [AppEnvironment.DEV]: { ...config, environment: AppEnvironment.DEV },
      [AppEnvironment.PROD]: { ...config, environment: AppEnvironment.PROD }
    });
  };

  const handleNewStart = () => {
    // Go to configuration view for new users
    setAppConfigs({
      [AppEnvironment.DEV]: { ...defaultConfig, environment: AppEnvironment.DEV },
      [AppEnvironment.PROD]: { ...defaultConfig, environment: AppEnvironment.PROD }
    });
    setCurrentView(AppView.CONFIGURATION);
  };

  const handleExistingConnect = (configs: Record<string, AppConfig>) => {
    setAppConfigs(configs);
    setCurrentView(AppView.DASHBOARD);
  };

  const handleLoginSuccess = (session: SessionData) => {
    setSessionData(session);
    
    // Update configs from session
    const config: AppConfig = {
      clientName: session.shopInfo?.name || '',
      clientKey: session.clientKey,
      apiBaseUrl: `https://${session.shopDomain}`,
      adminApiBaseUrl: `https://${session.shopDomain}/admin/api/2024-01`,
      appName: session.shopInfo?.name || '',
      primaryColor: '#E91E63',
      bundleId: `com.${session.clientKey.replace(/-/g, '')}.app`,
      packageName: `com.${session.clientKey.replace(/-/g, '')}.app`,
      logoUrl: '',
      environment: AppEnvironment.PROD,
      storefrontToken: '',
      adminShopToken: '',
    };

    setAppConfigs({
      [AppEnvironment.DEV]: { ...config, environment: AppEnvironment.DEV },
      [AppEnvironment.PROD]: { ...config, environment: AppEnvironment.PROD }
    });

    // New clients go to success screen, existing go to dashboard
    if (session.isNewClient) {
      setCurrentView(AppView.SYNC_SUCCESS);
    } else {
      setCurrentView(AppView.DASHBOARD);
    }
  };

  const handleConfigSave = (configs: Record<string, AppConfig>) => {
    setAppConfigs(configs);
    setCurrentView(AppView.SYNC_SUCCESS);
  };

  const handleLogout = async () => {
    try {
      await sessionAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    setSessionData(null);
    setAppConfigs({
      [AppEnvironment.DEV]: { ...defaultConfig, environment: AppEnvironment.DEV },
      [AppEnvironment.PROD]: { ...defaultConfig, environment: AppEnvironment.PROD }
    });
    setCurrentView(AppView.WELCOME);
  };

  // Helper to get a safe config for the initial view
  const initialConfig = appConfigs[AppEnvironment.PROD] || appConfigs[AppEnvironment.DEV] || defaultConfig;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-brand-500" size={48} />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
      case AppView.LOGIN:
        return (
          <LoginView 
            onLoginSuccess={handleLoginSuccess}
            onBack={() => setCurrentView(AppView.WELCOME)}
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
            clientKey={sessionData?.clientKey || initialConfig.clientKey}
            appName={sessionData?.shopInfo?.name || initialConfig.appName}
            onContinue={() => setCurrentView(AppView.DASHBOARD)} 
          />
        );
      case AppView.DASHBOARD:
        return (
          <AdminDashboard 
            configs={appConfigs} 
            onLogout={handleLogout}
            sessionData={sessionData}
          />
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
