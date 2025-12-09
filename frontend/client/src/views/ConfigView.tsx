import React, { useState, useEffect } from 'react';
import { Button, Input, Card } from '../../components/UI';
import { AppConfig, AppEnvironment } from '../../types';
import { ArrowRight, Globe, Lock, Key, Loader2, AlertCircle, Palette, Eye } from 'lucide-react';
import api from '../../utils/axios'; // Use authenticated axios instance

interface ConfigViewProps {
  initialConfig: AppConfig;
  onSave: (configs: Record<string, AppConfig>) => void;
}

const ConfigView: React.FC<ConfigViewProps> = ({ initialConfig, onSave }) => {
  const [formData, setFormData] = useState<AppConfig>(initialConfig);
  
  // Separate state for Branding to allow distinct Dev/Prod values
  const [devBranding, setDevBranding] = useState({
      primaryColor: initialConfig.primaryColor,
      logoUrl: initialConfig.logoUrl
  });
  
  const [prodBranding, setProdBranding] = useState({
      primaryColor: initialConfig.primaryColor, // Initially same
      logoUrl: initialConfig.logoUrl
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate secure clientKey when clientName changes
  useEffect(() => {
    if (formData.clientName && !formData.clientKey) {
        const randomValues = new Uint8Array(16);
        window.crypto.getRandomValues(randomValues);
        const secureKey = Array.from(randomValues)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        setFormData(prev => ({
            ...prev,
            clientKey: secureKey
        }));
    }
  }, [formData.clientName]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const createConfig = async (environment: string, branding: { primaryColor: string, logoUrl: string }) => {
    const payload = {
        ...formData,
        environment: environment,
        primaryColor: branding.primaryColor,
        logoUrl: branding.logoUrl
    };

    console.log(`Creating ${environment} configuration...`, payload);

    // POST to local internal API
    const response = await api.post('/config', payload);
    const data = response.data;

    if (!data.success) {
        throw new Error(data.error || `Failed to create ${environment} configuration.`);
    }
    
    return data.data; // The server returns the created config object
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Create Development Config with Dev Branding
      const devConfig = await createConfig('Development', devBranding);
      
      // 2. Create Production Config with Prod Branding
      const prodConfig = await createConfig('Production', prodBranding);

      console.log('Both Development and Production configurations created successfully.');

      const newConfigs: Record<string, AppConfig> = {
          [AppEnvironment.DEV]: { ...devConfig, environment: AppEnvironment.DEV },
          [AppEnvironment.PROD]: { ...prodConfig, environment: AppEnvironment.PROD }
      };

      onSave(newConfigs);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900">App Configuration</h2>
          <p className="mt-2 text-gray-600">Enter your store details to create your mobile app.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                <AlertCircle size={20} className="mr-2" />
                {error}
            </div>
          )}

          <Card title="General Information" className="shadow-lg">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Client Name" 
                  name="clientName" 
                  value={formData.clientName} 
                  onChange={handleChange} 
                  required 
                  placeholder="e.g. Kushals Fashion"
                />
                <Input 
                  label="Client Key (Auto-generated)" 
                  name="clientKey" 
                  value={formData.clientKey} 
                  readOnly
                  required 
                  icon={<Key size={16} />}
                  placeholder="Generated secure key..."
                  className="bg-gray-100 text-gray-500 cursor-not-allowed font-mono text-xs"
                />
                <Input 
                  label="App Name (Display Name)" 
                  name="appName" 
                  value={formData.appName} 
                  onChange={handleChange} 
                  required 
                  placeholder="e.g. Kushals"
                />
                <Input 
                  label="Bundle ID (iOS)" 
                  name="bundleId" 
                  value={formData.bundleId} 
                  onChange={handleChange} 
                  placeholder="com.kushals.app"
                />
                 <Input 
                  label="Package Name (Android)" 
                  name="packageName" 
                  value={formData.packageName} 
                  onChange={handleChange} 
                  placeholder="com.kushals.app"
                />
             </div>
          </Card>

          <Card title="API Configuration" className="shadow-lg">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="API Base URL" 
                  name="apiBaseUrl" 
                  value={formData.apiBaseUrl} 
                  onChange={handleChange} 
                  icon={<Globe size={16} />}
                />
                <Input 
                  label="Admin API Base URL" 
                  name="adminApiBaseUrl" 
                  value={formData.adminApiBaseUrl} 
                  onChange={handleChange} 
                  icon={<Globe size={16} />}
                />
              </div>
              <div className="border-t border-gray-100 pt-4">
                 <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <Lock size={16} className="mr-2 text-gray-500" /> 
                    Security Tokens
                 </h4>
                 <div className="grid grid-cols-1 gap-4">
                   <Input 
                    type="password"
                    label="Storefront Access Token" 
                    name="storefrontToken" 
                    value={formData.storefrontToken} 
                    onChange={handleChange} 
                    required
                  />
                  <Input 
                    type="password"
                    label="Admin API Token" 
                    name="adminShopToken" 
                    value={formData.adminShopToken} 
                    onChange={handleChange} 
                    required
                  />
                 </div>
              </div>
            </div>
          </Card>

          <Card title="Branding Configuration" className="shadow-lg">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
               
               {/* Divider for md screens */}
               <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-px bg-gray-200 transform -translate-x-1/2"></div>

               {/* Development Branding */}
               <div className="space-y-4">
                 <div className="flex items-center space-x-2 mb-2">
                     <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide">Development</span>
                 </div>
                 
                 <div>
                    <Input 
                        label="Dev Primary Color" 
                        value={devBranding.primaryColor} 
                        onChange={(e) => setDevBranding(prev => ({ ...prev, primaryColor: e.target.value }))} 
                        type="color"
                        className="h-10 p-1 w-full cursor-pointer"
                        icon={<Palette size={16} />}
                    />
                    <p className="text-xs text-gray-500 mt-1 font-mono">{devBranding.primaryColor}</p>
                 </div>
                 
                 <Input 
                    label="Dev Logo URL" 
                    value={devBranding.logoUrl} 
                    onChange={(e) => setDevBranding(prev => ({ ...prev, logoUrl: e.target.value }))} 
                    placeholder="https://.../dev-logo.png"
                    icon={<Eye size={16} />}
                 />
               </div>

               {/* Production Branding */}
               <div className="space-y-4">
                 <div className="flex items-center space-x-2 mb-2">
                     <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide">Production</span>
                 </div>
                 
                 <div>
                    <Input 
                        label="Prod Primary Color" 
                        value={prodBranding.primaryColor} 
                        onChange={(e) => setProdBranding(prev => ({ ...prev, primaryColor: e.target.value }))} 
                        type="color"
                        className="h-10 p-1 w-full cursor-pointer"
                        icon={<Palette size={16} />}
                    />
                    <p className="text-xs text-gray-500 mt-1 font-mono">{prodBranding.primaryColor}</p>
                 </div>
                 
                 <Input 
                    label="Prod Logo URL" 
                    value={prodBranding.logoUrl} 
                    onChange={(e) => setProdBranding(prev => ({ ...prev, logoUrl: e.target.value }))} 
                    placeholder="https://.../prod-logo.png"
                    icon={<Eye size={16} />}
                 />
               </div>

             </div>
          </Card>

          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              disabled={loading} 
              className="px-8 py-3 text-base shadow-lg shadow-brand-200"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Creating Environments...
                </>
              ) : (
                <>
                  Save & Continue
                  <ArrowRight size={18} className="ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfigView;