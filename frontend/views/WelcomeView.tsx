import React, { useState } from 'react';
import { Button, Input, Card } from '../components/UI';
import { Rocket, Smartphone, ShieldCheck, UserCheck, Plus, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { AppConfig, AppEnvironment } from '../types';
import { setSessionToken } from '../client/api';

interface WelcomeViewProps {
  onStartNew: () => void;
  onConnectExisting: (configs: Record<string, AppConfig>) => void;
  logoUrl: string;
}

const WelcomeView: React.FC<WelcomeViewProps> = ({ onStartNew, onConnectExisting, logoUrl }) => {
  const [mode, setMode] = useState<'initial' | 'select' | 'existing'>('initial');
  const [clientKey, setClientKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientKey.trim()) return;

    setLoading(true);
    setError(null);

    const key = encodeURIComponent(clientKey.trim());
    // Use relative path to leverage Vite proxy
    const url = `/api/config/${key}`;

    try {
      console.log(`Fetching configuration from: ${url}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        // If response is not JSON
        if (!response.ok) {
           throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        throw new Error('Invalid response from server');
      }

      console.log('API Response:', data);

      if (!data.success) {
         // Display specific API error message
         throw new Error(data.error || 'Failed to fetch configuration.');
      }

      if (data.data && data.data.length > 0) {
        // Map API response to AppConfig Record
        const newConfigs: Record<string, AppConfig> = {};

        data.data.forEach((apiConfig: any) => {
            // Normalize environment enum (handle case sensitivity)
            let env = AppEnvironment.PROD;
            if (apiConfig.environment && apiConfig.environment.toLowerCase() === 'development') {
              env = AppEnvironment.DEV;
            }

            const config: AppConfig = {
              clientName: apiConfig.clientName,
              clientKey: apiConfig.clientKey,
              shopDomain: apiConfig.shopDomain, // Include shop domain for syncing
              apiBaseUrl: apiConfig.apiBaseUrl,
              adminApiBaseUrl: apiConfig.adminApiBaseUrl,
              appName: apiConfig.appName,
              primaryColor: apiConfig.primaryColor,
              bundleId: apiConfig.bundleId,
              packageName: apiConfig.packageName,
              logoUrl: apiConfig.logoUrl,
              environment: env,
              storefrontToken: apiConfig.storefrontToken,
              adminShopToken: apiConfig.adminShopToken
            };

            newConfigs[env] = config;
        });

        // Ensure we have at least one valid config to proceed
        if (Object.keys(newConfigs).length === 0) {
            setError('Configuration found but environment data is invalid.');
            return;
        }

        // Store client key as a simple session token for persistence
        const clientKeyToken = `clientkey_${clientKey.trim()}`;
        setSessionToken(clientKeyToken);
        localStorage.setItem('client_key', clientKey.trim());
        localStorage.setItem('app_configs', JSON.stringify(newConfigs));
        
        onConnectExisting(newConfigs);
      } else {
        // Success true but no data
        setError('No configuration found for this client key.');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (mode === 'initial') {
      return (
        <div className="pt-4">
          <Button onClick={() => setMode('select')} className="px-8 py-4 text-lg shadow-brand-200 shadow-lg transform hover:-translate-y-1 transition-transform">
            Get Started
            <ArrowRight className="ml-2" size={20} />
          </Button>
          <p className="mt-4 text-sm text-gray-400">Step 1 of 3: Initial Setup</p>
        </div>
      );
    }

    if (mode === 'select') {
      return (
        <div className="pt-4 w-full max-w-lg mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={onStartNew}
            className="flex flex-col items-center justify-center p-6 bg-white border-2 border-gray-100 hover:border-brand-500 rounded-xl shadow-sm hover:shadow-md transition-all group"
          >
             <div className="h-12 w-12 bg-brand-50 text-brand-500 rounded-full flex items-center justify-center mb-3 group-hover:bg-brand-500 group-hover:text-white transition-colors">
               <Plus size={24} />
             </div>
             <h3 className="font-bold text-gray-900">Create New App</h3>
             <p className="text-xs text-gray-500 mt-1">Start fresh configuration</p>
          </button>

          <button 
            onClick={() => setMode('existing')}
            className="flex flex-col items-center justify-center p-6 bg-white border-2 border-gray-100 hover:border-blue-500 rounded-xl shadow-sm hover:shadow-md transition-all group"
          >
             <div className="h-12 w-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-500 group-hover:text-white transition-colors">
               <UserCheck size={24} />
             </div>
             <h3 className="font-bold text-gray-900">Existing User</h3>
             <p className="text-xs text-gray-500 mt-1">I have a Client Key</p>
          </button>
          
          <div className="col-span-1 md:col-span-2 mt-4">
             <button onClick={() => setMode('initial')} className="text-gray-400 hover:text-gray-600 text-sm">Back</button>
          </div>
        </div>
      );
    }

    if (mode === 'existing') {
      return (
        <div className="pt-4 w-full max-w-md mx-auto">
          <Card title="Connect to AppMint" className="text-left shadow-lg">
            <form onSubmit={handleConnect} className="space-y-4">
              <Input 
                label="Enter Client Key" 
                placeholder="e.g. kushals-fashion-8291" 
                value={clientKey}
                onChange={(e) => setClientKey(e.target.value)}
                required
                autoFocus
              />
              
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-start">
                  <AlertCircle size={16} className="mt-0.5 mr-2 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button type="submit" fullWidth disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={18} />
                      Connecting...
                    </>
                  ) : 'Connect Dashboard'}
                </Button>
                <button 
                  type="button"
                  onClick={() => setMode('select')} 
                  className="text-gray-500 text-sm hover:text-gray-800"
                >
                  Back
                </button>
              </div>
            </form>
          </Card>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-2 bg-brand-500"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-50 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50"></div>

      <div className="max-w-2xl w-full text-center space-y-8 z-10">
        <div className="flex justify-center mb-8">
            { /*logoUrl ? 
                <img src={logoUrl} alt="Logo" className="h-16" /> : 
                <div className="h-20 w-20 bg-brand-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                    <span className="text-white font-bold text-3xl">A</span>
                </div>
             */}
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
          Welcome to <span className="text-brand-500">AppMint</span>
        </h1>
        
        <p className="text-xl text-gray-500 max-w-lg mx-auto leading-relaxed">
          Transform your Shopify store into a premium mobile app for Android & iOS in minutes.
        </p>

        {mode === 'initial' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
              {[
                  { icon: Smartphone, title: "Native Experience", desc: "Smooth, fast, and native UI for both platforms." },
                  { icon: ShieldCheck, title: "Secure Checkout", desc: "Fully integrated Shopify checkout process." },
                  { icon: Rocket, title: "Instant Updates", desc: "Sync changes from your store in real-time." },
              ].map((item, i) => (
                  <div key={i} className="bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="bg-white w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-sm text-brand-500">
                          <item.icon size={24} />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
              ))}
          </div>
        )}

        {renderContent()}
      </div>
    </div>
  );
};

export default WelcomeView;