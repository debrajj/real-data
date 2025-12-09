import React, { useState, useEffect } from 'react';
import { Button, Card } from '../../components/UI';
import { Rocket, Smartphone, ShieldCheck, Plus, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { AppConfig, AppEnvironment } from '../../types';
import api from '../../utils/axios'; // Use the authenticated axios instance

interface WelcomeViewProps {
  onStartNew: () => void;
  onConnectExisting: (configs: Record<string, AppConfig>) => void;
  logoUrl: string;
}

const WelcomeView: React.FC<WelcomeViewProps> = ({ onStartNew, onConnectExisting, logoUrl }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(false);

  // Auto-check for existing configuration on mount
  useEffect(() => {
    checkExistingConfig();
  }, []);

  const checkExistingConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Checking for existing configuration...');
      const response = await api.get('/config');
      const data = response.data;

      if (data.success && data.data && data.data.length > 0) {
        // Map API response to AppConfig Record
        const newConfigs: Record<string, AppConfig> = {};

        data.data.forEach((apiConfig: any) => {
            // Normalize environment enum
            let env = AppEnvironment.PROD;
            if (apiConfig.environment && apiConfig.environment.toLowerCase() === 'development') {
              env = AppEnvironment.DEV;
            }

            newConfigs[env] = {
              clientName: apiConfig.clientName,
              clientKey: apiConfig.clientKey,
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
        });

        if (Object.keys(newConfigs).length > 0) {
           onConnectExisting(newConfigs);
        } else {
           setShowIntro(true); // No valid configs, show intro
        }
      } else {
        setShowIntro(true); // No data, show intro
      }
    } catch (err: any) {
      console.error('Failed to fetch config', err);
      // If 401, likely session issue, but for now show intro or error
      // setError('Could not connect to AppMint server.');
      setShowIntro(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
         <Loader2 className="animate-spin text-brand-500 mb-4" size={48} />
         <p className="text-gray-500 font-medium">Loading your AppMint profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-2 bg-brand-500"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-50 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50"></div>

      <div className="max-w-2xl w-full text-center space-y-8 z-10">
        
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
          Welcome to <span className="text-brand-500">AppMint</span>
        </h1>
        
        <p className="text-xl text-gray-500 max-w-lg mx-auto leading-relaxed">
          Transform your Shopify store into a premium mobile app for Android & iOS in minutes.
        </p>

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

        <div className="pt-4">
          <Button onClick={onStartNew} className="px-8 py-4 text-lg shadow-brand-200 shadow-lg transform hover:-translate-y-1 transition-transform">
            <Plus className="mr-2" size={20} />
            Create New App
          </Button>
          <p className="mt-4 text-sm text-gray-400">Step 1 of 3: Initial Setup</p>
        </div>
        
        {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg inline-flex items-center mt-4">
              <AlertCircle size={16} className="mr-2" />
              {error}
            </div>
        )}
      </div>
    </div>
  );
};

export default WelcomeView;