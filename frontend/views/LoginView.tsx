import React, { useState } from 'react';
import { Button, Input, Card } from '../components/UI';
import { sessionAPI, SessionData } from '../client/api';
import { Store, Key, Lock, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (session: SessionData) => void;
  onBack?: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onBack }) => {
  const [formData, setFormData] = useState({
    shopDomain: '',
    adminToken: '',
    storefrontToken: '',
  });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Login with credentials
      const response = await sessionAPI.login({
        shopDomain: formData.shopDomain,
        adminToken: formData.adminToken,
        storefrontToken: formData.storefrontToken,
      });

      console.log('✅ Login successful:', response.session.shopInfo.name);
      setLoginSuccess(true);

      // Auto-sync data for new clients
      if (response.session.isNewClient) {
        setSyncing(true);
        try {
          console.log('🔄 Syncing Shopify data...');
          await sessionAPI.sync();
          console.log('✅ Sync complete');
        } catch (syncError) {
          console.warn('⚠️ Sync had some issues:', syncError);
        }
        setSyncing(false);
      }

      // Notify parent
      onLoginSuccess(response.session);

    } catch (err: any) {
      console.error('❌ Login failed:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  if (loginSuccess && syncing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <Loader2 className="animate-spin mx-auto mb-4 text-brand-500" size={48} />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Setting up your store...
          </h2>
          <p className="text-gray-600">
            Syncing products, collections, and theme data from Shopify.
            This may take a moment.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="mb-8 text-center">
          <div className="mx-auto w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mb-4">
            <Store className="text-brand-600" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Connect Your Store</h2>
          <p className="mt-2 text-gray-600">
            Enter your Shopify credentials to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
              <AlertCircle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Card className="shadow-lg">
            <div className="space-y-4">
              <Input
                label="Shopify Store Domain"
                name="shopDomain"
                value={formData.shopDomain}
                onChange={handleChange}
                required
                placeholder="mystore.myshopify.com"
                icon={<Store size={16} />}
                autoComplete="off"
              />

              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Lock size={16} className="mr-2 text-gray-500" />
                  API Tokens
                </h4>
                
                <div className="space-y-4">
                  <Input
                    type="password"
                    label="Admin API Access Token"
                    name="adminToken"
                    value={formData.adminToken}
                    onChange={handleChange}
                    required
                    placeholder="shpat_xxxxxxxxxxxxx"
                    icon={<Key size={16} />}
                    autoComplete="off"
                  />
                  
                  <Input
                    type="password"
                    label="Storefront Access Token"
                    name="storefrontToken"
                    value={formData.storefrontToken}
                    onChange={handleChange}
                    required
                    placeholder="xxxxxxxxxxxxx"
                    icon={<Key size={16} />}
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
          </Card>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Where to find your tokens?
            </h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Go to your Shopify Admin → Settings → Apps</li>
              <li>Click "Develop apps" → Create an app</li>
              <li>Configure Admin API scopes (products, themes, content)</li>
              <li>Install the app and copy the tokens</li>
            </ol>
          </div>

          <div className="flex gap-3">
            {onBack && (
              <Button
                type="button"
                variant="secondary"
                onClick={onBack}
                className="flex-1"
              >
                Back
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading}
              className={`${onBack ? 'flex-1' : 'w-full'} py-3`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Connecting...
                </>
              ) : (
                <>
                  <CheckCircle size={18} className="mr-2" />
                  Connect Store
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginView;
