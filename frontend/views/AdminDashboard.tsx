import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import PhoneFrame from '../components/PhoneFrame';
import { AppConfig, BuildJob, BuildStatus, DashboardTab, AppEnvironment, Platform, Ticket } from '../types';
import { Button, Card, Badge, Input, Select, TextArea } from '../components/UI';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Download, RefreshCw, Smartphone, Eye, Server, Database, Lock, Key, Copy, Mail, MessageCircle, Phone, Plus, Ticket as TicketIcon, Loader2 } from 'lucide-react';
import { themeAPI, Product, Collection, ThemeData, ShopifyTheme } from '../client/api';

interface SessionData {
  token: string;
  clientKey: string;
  shopDomain: string;
  shopInfo: {
    name: string;
    email: string;
    currency: string;
    timezone: string;
  };
}

interface AdminDashboardProps {
  configs: Record<string, AppConfig>;
  onLogout: () => void;
  sessionData?: SessionData | null;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ configs, onLogout, sessionData }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(DashboardTab.OVERVIEW);
  const [environment, setEnvironment] = useState<AppEnvironment>(AppEnvironment.PROD);
  
  // Get config for current environment, fallback to any available config
  const config = configs[environment] || configs[AppEnvironment.DEV] || Object.values(configs)[0];
  
  // Check if both environments are configured
  const hasDevConfig = !!configs[AppEnvironment.DEV]?.clientKey;
  const hasProdConfig = !!configs[AppEnvironment.PROD]?.clientKey;

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date>(new Date());
  const [syncTargetEnv, setSyncTargetEnv] = useState<AppEnvironment>(environment);

  // Real data from backend
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [themeData, setThemeData] = useState<ThemeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [themeStatus, setThemeStatus] = useState<{ synced: boolean; version?: number; lastSync?: string; componentsCount?: number; themeName?: string; themeId?: string } | null>(null);
  
  // Available themes from Shopify
  const [availableThemes, setAvailableThemes] = useState<ShopifyTheme[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState<string>('');
  const [loadingThemes, setLoadingThemes] = useState(false);
  const [syncingThemeName, setSyncingThemeName] = useState<string>('');
  
  // Connection status
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  // Mock Data for Builds (can be connected to backend later)
  const [builds, setBuilds] = useState<BuildJob[]>([
    { id: 'b-102', version: '1.0.2', platform: Platform.ANDROID, environment: AppEnvironment.PROD, status: BuildStatus.COMPLETED, progress: 100, startedAt: new Date(Date.now() - 86400000), downloadUrl: '#' },
    { id: 'b-101', version: '1.0.1', platform: Platform.IOS, environment: AppEnvironment.PROD, status: BuildStatus.FAILED, progress: 45, startedAt: new Date(Date.now() - 172800000) },
  ]);

  // Mock Data for Tickets
  const [tickets, setTickets] = useState<Ticket[]>([
    { id: 'T-1024', subject: 'Build failing on iOS', status: 'In Progress', priority: 'High', createdAt: new Date(Date.now() - 86400000), lastUpdate: new Date(Date.now() - 3600000) },
    { id: 'T-1023', subject: 'Theme sync timeout', status: 'Resolved', priority: 'Medium', createdAt: new Date(Date.now() - 172800000), lastUpdate: new Date(Date.now() - 86400000) },
  ]);
  const [showTicketForm, setShowTicketForm] = useState(false);

  // Get clientKey from session or config
  const getClientKey = useCallback(() => {
    // Prefer session data if available
    if (sessionData?.clientKey) return sessionData.clientKey;
    return config?.clientKey || '';
  }, [sessionData, config]);

  // Fetch all data from backend using clientKey
  const fetchData = useCallback(async () => {
    const clientKey = getClientKey();
    
    if (!clientKey) {
      console.log('No clientKey configured');
      setProducts([]);
      setCollections([]);
      setThemeData(null);
      setDataError('No client key configured');
      setConnectionStatus('disconnected');
      return;
    }

    setLoading(true);
    setDataError(null);
    setConnectionStatus('checking');

    try {
      const response = await themeAPI.getByClientKey(clientKey);
      
      if (response.success && response.data) {
        setProducts(response.data.products || []);
        setCollections(response.data.collections || []);
        setThemeData(response.data.theme || null);
        setConnectionStatus('connected');
        
        setThemeStatus({
          synced: response.data.counts.hasTheme,
          componentsCount: response.data.theme?.components?.length || 0,
          version: response.data.theme?.version,
          lastSync: response.data.theme?.updatedAt,
          themeName: response.data.theme?.themeName,
          themeId: response.data.theme?.themeId,
        });
        
        if (response.data.theme?.updatedAt) {
          setLastSynced(new Date(response.data.theme.updatedAt));
        }
        
        if (response.data.products?.length === 0 && !response.data.theme) {
          setDataError('No data synced yet - click "Sync Theme" to fetch from Shopify');
        }
      } else {
        setProducts([]);
        setCollections([]);
        setThemeData(null);
        setDataError('Failed to load data');
        setConnectionStatus('disconnected');
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setProducts([]);
      setCollections([]);
      setThemeData(null);
      setDataError(`Connection error: ${error.message}`);
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  }, [getClientKey]);

  // Fetch data when environment or config changes
  useEffect(() => {
    fetchData();
  }, [fetchData, environment]);

  // Fetch available themes from Shopify
  const fetchAvailableThemes = useCallback(async () => {
    const shopDomain = sessionData?.shopDomain || config?.shopDomain;
    if (!shopDomain) return;
    
    setLoadingThemes(true);
    try {
      const response = await themeAPI.listThemes(shopDomain);
      if (response.success && response.themes) {
        setAvailableThemes(response.themes);
        // Set default to active theme
        if (response.activeThemeId && !selectedThemeId) {
          setSelectedThemeId(response.activeThemeId);
        }
      }
    } catch (error) {
      console.error('Error fetching themes:', error);
    } finally {
      setLoadingThemes(false);
    }
  }, [sessionData?.shopDomain, config?.shopDomain, selectedThemeId]);

  // Auto-fetch available themes when theme name is Unknown
  useEffect(() => {
    if (themeStatus?.themeName === 'Unknown' && themeStatus?.themeId && availableThemes.length === 0) {
      fetchAvailableThemes();
    }
  }, [themeStatus?.themeName, themeStatus?.themeId, availableThemes.length, fetchAvailableThemes]);

  // Stats data - use real product count
  const statsData = [
    { name: 'Mon', activeUsers: 400, installs: 24 },
    { name: 'Tue', activeUsers: 300, installs: 18 },
    { name: 'Wed', activeUsers: 550, installs: 35 },
    { name: 'Thu', activeUsers: 500, installs: 28 },
    { name: 'Fri', activeUsers: 700, installs: 45 },
    { name: 'Sat', activeUsers: 900, installs: 60 },
    { name: 'Sun', activeUsers: 850, installs: 55 },
  ];

  const triggerBuild = (platform: Platform) => {
    const newBuild: BuildJob = {
      id: `b-${Date.now()}`,
      version: `1.0.${builds.length + 3}`,
      platform,
      environment,
      status: BuildStatus.BUILDING,
      progress: 0,
      startedAt: new Date()
    };
    setBuilds([newBuild, ...builds]);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setBuilds(current => current.map(b => 
        b.id === newBuild.id ? { ...b, progress } : b
      ));

      if (progress >= 100) {
        clearInterval(interval);
        setBuilds(current => current.map(b => 
          b.id === newBuild.id ? { ...b, status: BuildStatus.COMPLETED, downloadUrl: '#' } : b
        ));
      }
    }, 500);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setDataError(null);
    const clientKey = getClientKey();
    const shopDomain = sessionData?.shopDomain || config?.shopDomain;
    
    try {
      // Use session-based sync if available (preferred)
      const token = localStorage.getItem('session_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Try session-based sync first
      if (token) {
        console.log('Using session-based sync...');
        try {
          const syncResponse = await fetch('/api/session/sync', {
            method: 'POST',
            headers,
            credentials: 'include',
          });
          const syncData = await syncResponse.json();
          if (syncData.success) {
            console.log('Session sync completed:', syncData.syncResults);
          }
        } catch (e) {
          console.warn('Session sync failed, falling back to legacy sync:', e);
        }
      }
      
      // Fallback: trigger sync from Shopify if shopDomain is available
      if (shopDomain && !token) {
        console.log(`Syncing from Shopify: ${shopDomain}`);
        
        // Sync products
        try {
          await fetch(`/api/products/${encodeURIComponent(shopDomain)}/sync`, { method: 'POST', headers });
        } catch (e) {
          console.warn('Product sync failed:', e);
        }
        
        // Sync collections
        try {
          await fetch(`/api/collections/${encodeURIComponent(shopDomain)}/sync`, { method: 'POST', headers });
        } catch (e) {
          console.warn('Collection sync failed:', e);
        }
        
        // Sync theme
        try {
          await themeAPI.sync(shopDomain);
        } catch (e) {
          console.warn('Theme sync failed:', e);
        }
        
        // Wait a moment for sync to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Then refresh data from database
      if (clientKey) {
        const response = await themeAPI.getByClientKey(clientKey);
        
        if (response.success && response.data) {
          setProducts(response.data.products || []);
          setCollections(response.data.collections || []);
          setThemeData(response.data.theme || null);
          setConnectionStatus('connected');
          
          setThemeStatus({
            synced: response.data.counts.hasTheme,
            componentsCount: response.data.theme?.components?.length || 0,
            version: response.data.theme?.version,
            lastSync: response.data.theme?.updatedAt,
          });
        }
      }
      
      setLastSynced(new Date());
    } catch (error: any) {
      console.error('Sync failed:', error);
      setDataError(`Sync failed: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle theme sync with selected theme ID
  const handleThemeSync = async () => {
    if (!selectedThemeId) return;
    
    // Get the theme name for display
    const selectedTheme = availableThemes.find(t => t.id === selectedThemeId);
    setSyncingThemeName(selectedTheme?.name || selectedThemeId);
    
    setIsSyncing(true);
    setDataError(null);
    const clientKey = getClientKey();
    const shopDomain = sessionData?.shopDomain || config?.shopDomain;
    
    try {
      console.log(`Syncing theme ${selectedThemeId} (${selectedTheme?.name}) from ${shopDomain}`);
      
      // Sync the selected theme
      await themeAPI.sync(shopDomain, selectedThemeId);
      
      // Wait a moment for sync to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh data from database
      if (clientKey) {
        const response = await themeAPI.getByClientKey(clientKey);
        
        if (response.success && response.data) {
          setProducts(response.data.products || []);
          setCollections(response.data.collections || []);
          setThemeData(response.data.theme || null);
          setConnectionStatus('connected');
          
          setThemeStatus({
            synced: response.data.counts.hasTheme,
            componentsCount: response.data.theme?.components?.length || 0,
            version: response.data.theme?.version,
            lastSync: response.data.theme?.updatedAt,
            themeName: response.data.theme?.themeName,
            themeId: response.data.theme?.themeId,
          });
        }
      }
      
      setLastSynced(new Date());
    } catch (error: any) {
      console.error('Theme sync failed:', error);
      setDataError(`Theme sync failed: ${error.message}`);
    } finally {
      setIsSyncing(false);
      setSyncingThemeName('');
    }
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const newTicket: Ticket = {
      id: `T-${Math.floor(Math.random() * 10000)}`,
      subject: 'New Support Request',
      status: 'Open',
      priority: 'Medium',
      createdAt: new Date(),
      lastUpdate: new Date()
    };
    setTickets([newTicket, ...tickets]);
    setShowTicketForm(false);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Environment Status Banner */}
      <div className={`px-4 py-3 rounded-lg flex items-center justify-between ${
        environment === AppEnvironment.DEV 
          ? 'bg-blue-50 border border-blue-200' 
          : 'bg-purple-50 border border-purple-200'
      }`}>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-3 ${
            connectionStatus === 'connected' ? 'bg-green-500' : 
            connectionStatus === 'checking' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
          }`} />
          <span className={`font-medium ${environment === AppEnvironment.DEV ? 'text-blue-700' : 'text-purple-700'}`}>
            {environment} Environment
          </span>
          <span className="mx-2 text-gray-400">•</span>
          <span className="text-gray-600 text-sm">
            {connectionStatus === 'connected' ? 'Connected' : 
             connectionStatus === 'checking' ? 'Checking...' : 'Disconnected'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {hasDevConfig && (
            <button
              onClick={() => setEnvironment(AppEnvironment.DEV)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                environment === AppEnvironment.DEV 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              DEV
            </button>
          )}
          {hasProdConfig && (
            <button
              onClick={() => setEnvironment(AppEnvironment.PROD)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                environment === AppEnvironment.PROD 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              PROD
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center">
          <Loader2 className="animate-spin mr-2" size={18} />
          Loading data from backend...
        </div>
      )}
      
      {dataError && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{dataError}</span>
          <Button variant="outline" onClick={handleSync} disabled={isSyncing} className="h-8 text-xs">
            <RefreshCw size={14} className={`mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync Now
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-gray-500 text-sm font-medium">Total Products</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{products.length}</p>
            <span className={`text-sm font-medium mt-1 inline-block ${products.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              {products.length > 0 ? 'From Shopify' : 'Not synced'}
            </span>
         </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-gray-500 text-sm font-medium">Collections</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{collections.length}</p>
            <span className={`text-sm font-medium mt-1 inline-block ${collections.length > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
              {collections.length > 0 ? 'Synced' : 'Not synced'}
            </span>
         </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-gray-500 text-sm font-medium">Theme Components</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{themeStatus?.componentsCount || 0}</p>
            <span className={`text-sm font-medium mt-1 inline-block ${themeStatus?.synced ? 'text-purple-600' : 'text-gray-400'}`}>
              {themeStatus?.synced ? `v${themeStatus?.version || 1}` : 'Not synced'}
            </span>
         </div>
         <div className={`p-6 rounded-xl shadow-sm border ${
           environment === AppEnvironment.DEV 
             ? 'bg-blue-50 border-blue-200' 
             : 'bg-purple-50 border-purple-200'
         }`}>
            <h3 className="text-gray-500 text-sm font-medium">Current Environment</h3>
            <p className="text-xl font-bold text-gray-900 mt-3 flex items-center">
              <Badge status={environment}>{environment}</Badge>
            </p>
            <span className="text-gray-500 text-xs font-medium mt-2 inline-block">
              {config?.shopDomain || 'No shop domain'}
            </span>
         </div>
      </div>

      <Card title={`App Activity (${environment})`} className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={statsData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid stroke="#f5f5f5" strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip />
            <Line type="monotone" dataKey="activeUsers" stroke={config.primaryColor} strokeWidth={3} dot={{r: 4}} activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="installs" stroke="#82ca9d" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Recent Products" action={<span className="text-xs text-gray-500">{products.length} total</span>}>
           <ul className="divide-y divide-gray-100">
             {products.slice(0, 5).map(product => (
               <li key={product.productId} className="py-3 flex justify-between items-center">
                 <div className="flex items-center space-x-3">
                   {product.images?.[0]?.src && (
                     <img src={product.images[0].src} alt={product.title} className="w-10 h-10 rounded object-cover" />
                   )}
                   <div>
                     <span className="font-medium text-gray-900 block truncate max-w-[200px]">{product.title}</span>
                     <span className="text-xs text-gray-400">{product.vendor}</span>
                   </div>
                 </div>
                 <Badge status={product.status === 'active' ? 'Active' : product.status}>{product.status}</Badge>
               </li>
             ))}
             {products.length === 0 && (
               <li className="py-4 text-center text-gray-500">No products synced yet</li>
             )}
           </ul>
        </Card>
        <Card title="System Status">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Shopify API Connection</span>
              <Badge status={products.length > 0 ? "Active" : "Inactive"}>{products.length > 0 ? 'Connected' : 'Not Connected'}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Theme Sync Status</span>
              <Badge status={themeStatus?.synced ? "Active" : "Inactive"}>{themeStatus?.synced ? 'Synced' : 'Not Synced'}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Sync</span>
              <span className="text-sm text-gray-900">{lastSynced.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Build System</span>
              <Badge status="Active">Operational</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );


  const renderPreview = () => (
    <div className="h-full flex flex-col">
       <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Mobile Layout Preview</h2>
          <div className="flex items-center space-x-4">
             <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                <button 
                  onClick={() => setEnvironment(AppEnvironment.DEV)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${environment === AppEnvironment.DEV ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Development
                </button>
                <button 
                  onClick={() => setEnvironment(AppEnvironment.PROD)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${environment === AppEnvironment.PROD ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Production
                </button>
             </div>

             <div className="flex items-center space-x-3 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                <span className="text-sm text-gray-500 pl-2">Last synced: <span className="text-gray-900 font-medium">{lastSynced.toLocaleTimeString()}</span></span>
                <Button variant="outline" onClick={handleSync} disabled={isSyncing} className="h-8 text-xs">
                    <RefreshCw size={14} className={`mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync Theme'}
                </Button>
             </div>
          </div>
       </div>

       <div className={`w-full py-2 text-center text-xs font-bold uppercase tracking-wider mb-4 rounded-md border ${
          environment === AppEnvironment.DEV 
            ? 'bg-blue-50 text-blue-700 border-blue-200' 
            : 'bg-purple-50 text-purple-700 border-purple-200'
       }`}>
          Viewing {environment} Application • {products.length} Products • {collections.length} Collections
          {loading && ' • Loading...'}
          {dataError && ` • ${dataError}`}
       </div>

       <div className="flex-1 flex justify-center bg-gray-100 rounded-2xl border border-gray-200 p-8 shadow-inner overflow-hidden relative">
          <PhoneFrame 
            appName={config.appName} 
            logoUrl={config.logoUrl} 
            primaryColor={config.primaryColor}
            products={products}
            collections={collections}
            themeData={themeData}
          />
          
          {environment === AppEnvironment.DEV && (
            <div className="absolute top-4 right-4 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg opacity-80 pointer-events-none">
              DEV MODE
            </div>
          )}
       </div>
    </div>
  );

  const renderBuildManager = () => (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
           <div>
              <h2 className="text-lg font-bold text-gray-900">Build Application</h2>
              <p className="text-sm text-gray-500 mt-1">Generate binaries for app stores.</p>
           </div>
           <div className="bg-gray-100 p-1 rounded-lg flex">
             <button 
               onClick={() => setEnvironment(AppEnvironment.DEV)}
               className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${environment === AppEnvironment.DEV ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
             >
               Development
             </button>
             <button 
               onClick={() => setEnvironment(AppEnvironment.PROD)}
               className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${environment === AppEnvironment.PROD ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
             >
               Production
             </button>
           </div>
        </div>

        <div className="mt-6 mb-4 p-4 bg-yellow-50 border border-yellow-100 rounded-lg flex items-start">
           <div className="flex-shrink-0 mt-0.5">
             <Server size={16} className="text-yellow-600" />
           </div>
           <div className="ml-3">
             <h3 className="text-sm font-medium text-yellow-800">Current Target: {environment}</h3>
             <p className="text-xs text-yellow-700 mt-1">
               You are about to build a <strong>{environment}</strong> version of the app. 
               {environment === AppEnvironment.DEV ? ' This will use test API keys and sandbox endpoints.' : ' This will use live production data.'}
             </p>
           </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="border border-gray-200 rounded-xl p-6 hover:border-brand-300 transition-colors">
              <div className="flex items-center mb-4">
                 <div className="bg-green-100 p-3 rounded-lg mr-4">
                    <Smartphone className="text-green-600" size={24} />
                 </div>
                 <div>
                    <h3 className="font-bold text-gray-900">Android Build</h3>
                    <p className="text-xs text-gray-500">Generate APK & AAB</p>
                 </div>
              </div>
              <Button onClick={() => triggerBuild(Platform.ANDROID)} fullWidth>Build Android</Button>
           </div>

           <div className="border border-gray-200 rounded-xl p-6 hover:border-brand-300 transition-colors">
              <div className="flex items-center mb-4">
                 <div className="bg-blue-100 p-3 rounded-lg mr-4">
                    <Smartphone className="text-blue-600" size={24} />
                 </div>
                 <div>
                    <h3 className="font-bold text-gray-900">iOS Build</h3>
                    <p className="text-xs text-gray-500">Generate IPA</p>
                 </div>
              </div>
              <Button onClick={() => triggerBuild(Platform.IOS)} fullWidth>Build iOS</Button>
           </div>
        </div>
      </Card>

      <Card title="Build History">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Env</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {builds.map((build) => (
                <tr key={build.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">v{build.version}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{build.platform}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                     <Badge status={build.environment}>{build.environment}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{build.startedAt.toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     {build.status === BuildStatus.BUILDING ? (
                       <div className="w-24">
                          <div className="flex justify-between text-xs mb-1">
                             <span>Building</span>
                             <span>{build.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${build.progress}%` }}></div>
                          </div>
                       </div>
                     ) : (
                        <Badge status={build.status}>{build.status}</Badge>
                     )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {build.status === BuildStatus.COMPLETED && (
                      <a href="#" className="text-brand-600 hover:text-brand-900 flex items-center justify-end">
                        <Download size={16} className="mr-1" /> Download
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderThemeSync = () => (
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto">
       <Card className="w-full">
         <div className="text-center p-6 pb-0">
           <div className="bg-brand-50 p-4 rounded-full inline-flex mb-4">
              <RefreshCw size={32} className="text-brand-500" />
           </div>
           <h3 className="text-xl font-bold text-gray-900">Theme Sync</h3>
           <p className="text-gray-500 mt-2">
             Pull the latest theme configuration, templates, and settings from Shopify to update your app.
           </p>
         </div>

         <div className="p-8">
            {/* Current Synced Theme Info */}
            {themeStatus && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                {themeStatus.themeId && (
                  <div className="mb-3 pb-3 border-b border-gray-200">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Currently Synced Theme</span>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {/* Try to get name from available themes if stored name is Unknown */}
                      {themeStatus.themeName && themeStatus.themeName !== 'Unknown' 
                        ? themeStatus.themeName 
                        : availableThemes.find(t => t.id === themeStatus.themeId)?.name || themeStatus.themeName || 'Unknown'}
                    </p>
                    <span className="text-xs text-gray-400">ID: {themeStatus.themeId}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className="ml-2 font-medium">{themeStatus.synced ? 'Synced' : 'Not Synced'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Version:</span>
                    <span className="ml-2 font-medium">{themeStatus.version || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Components:</span>
                    <span className="ml-2 font-medium">{themeStatus.componentsCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Sync:</span>
                    <span className="ml-2 font-medium">{themeStatus.lastSync ? new Date(themeStatus.lastSync).toLocaleString() : 'Never'}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Syncing Progress Indicator */}
            {isSyncing && syncingThemeName && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <Loader2 className="animate-spin mr-3 text-blue-600" size={20} />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Syncing Theme...</p>
                    <p className="text-xs text-blue-700 mt-0.5">Fetching data from: <strong>{syncingThemeName}</strong></p>
                  </div>
                </div>
              </div>
            )}

            {/* Theme Selection */}
            <div className="mb-6">
               <div className="flex justify-between items-center mb-3">
                 <label className="block text-sm font-medium text-gray-700">Select Theme to Sync</label>
                 <button 
                   onClick={fetchAvailableThemes}
                   disabled={loadingThemes}
                   className="text-xs text-brand-600 hover:text-brand-700 flex items-center"
                 >
                   <RefreshCw size={12} className={`mr-1 ${loadingThemes ? 'animate-spin' : ''}`} />
                   {loadingThemes ? 'Loading...' : 'Refresh Themes'}
                 </button>
               </div>
               
               {availableThemes.length === 0 ? (
                 <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center">
                   <p className="text-sm text-gray-500 mb-2">No themes loaded</p>
                   <Button variant="outline" onClick={fetchAvailableThemes} disabled={loadingThemes} className="text-xs">
                     {loadingThemes ? 'Loading...' : 'Load Available Themes'}
                   </Button>
                 </div>
               ) : (
                 <div className="space-y-2 max-h-48 overflow-y-auto">
                   {availableThemes.map((theme) => (
                     <div 
                       key={theme.id}
                       onClick={() => setSelectedThemeId(theme.id)}
                       className={`cursor-pointer border rounded-lg p-3 flex items-center justify-between transition-all ${
                         selectedThemeId === theme.id 
                           ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' 
                           : 'border-gray-200 hover:border-gray-300'
                       }`}
                     >
                       <div className="flex items-center">
                         <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 ${
                           selectedThemeId === theme.id ? 'border-brand-500' : 'border-gray-400'
                         }`}>
                           {selectedThemeId === theme.id && <div className="w-2 h-2 rounded-full bg-brand-500" />}
                         </div>
                         <div>
                           <span className="block text-sm font-medium text-gray-900">{theme.name}</span>
                           <span className="block text-xs text-gray-500">ID: {theme.id}</span>
                         </div>
                       </div>
                       <div className="flex items-center space-x-2">
                         {theme.isActive && (
                           <span className="px-2 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 rounded-full">
                             Published
                           </span>
                         )}
                         {theme.role === 'unpublished' && (
                           <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded-full">
                             Draft
                           </span>
                         )}
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>

            <div className="mb-6">
               <label className="block text-sm font-medium text-gray-700 mb-3">Select Target Environment to Sync</label>
               <div className="grid grid-cols-2 gap-4">
                  <div 
                    onClick={() => setSyncTargetEnv(AppEnvironment.DEV)}
                    className={`cursor-pointer border rounded-lg p-4 flex items-center ${syncTargetEnv === AppEnvironment.DEV ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                     <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 ${syncTargetEnv === AppEnvironment.DEV ? 'border-brand-500' : 'border-gray-400'}`}>
                        {syncTargetEnv === AppEnvironment.DEV && <div className="w-2 h-2 rounded-full bg-brand-500" />}
                     </div>
                     <div>
                        <span className="block text-sm font-medium text-gray-900">Development</span>
                        <span className="block text-xs text-gray-500">Updates test app immediately</span>
                     </div>
                  </div>

                  <div 
                    onClick={() => setSyncTargetEnv(AppEnvironment.PROD)}
                    className={`cursor-pointer border rounded-lg p-4 flex items-center ${syncTargetEnv === AppEnvironment.PROD ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                     <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 ${syncTargetEnv === AppEnvironment.PROD ? 'border-brand-500' : 'border-gray-400'}`}>
                        {syncTargetEnv === AppEnvironment.PROD && <div className="w-2 h-2 rounded-full bg-brand-500" />}
                     </div>
                     <div>
                        <span className="block text-sm font-medium text-gray-900">Production</span>
                        <span className="block text-xs text-gray-500">Live updates for users</span>
                     </div>
                  </div>
               </div>
            </div>

            <Button onClick={handleThemeSync} disabled={isSyncing || !selectedThemeId} fullWidth className="py-3 text-base">
                {isSyncing ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={18} />
                    Syncing Theme...
                  </>
                ) : selectedThemeId ? `Sync Selected Theme to ${syncTargetEnv}` : 'Select a Theme to Sync'}
            </Button>
            
            {lastSynced && (
              <div className="mt-6 border-t border-gray-100 pt-4 text-center">
                 <p className="text-xs text-gray-400">Last successful sync: {lastSynced.toLocaleString()}</p>
              </div>
            )}
         </div>
       </Card>
    </div>
  );


  const renderSettings = () => (
    <div className="space-y-6">
      <Card title="General Configuration" action={<Button variant="outline" className="text-xs h-8">Edit Settings</Button>}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="App Name" value={config.appName} disabled icon={<Smartphone size={16}/>} />
              <Input label="Client Name" value={config.clientName} disabled icon={<Server size={16}/>} />
              <Input label="Bundle ID" value={config.bundleId} disabled />
              <Input label="Package Name" value={config.packageName} disabled />
              
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100 pt-4 mt-2">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-3">Current Context: {environment}</span>
                    <Input label="Logo URL" value={config.logoUrl} disabled icon={<Eye size={16}/>} />
                    <div className="flex items-end mt-4">
                        <div className="w-full flex items-center space-x-3">
                            <div className="flex-1">
                                <Input label="Primary Color" value={config.primaryColor} disabled />
                            </div>
                            <div className="h-10 w-10 rounded-lg shadow-sm border border-gray-200 mt-6" style={{ backgroundColor: config.primaryColor }}></div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-center text-gray-400 text-sm italic">
                    Switch environment in header to view other settings.
                </div>
              </div>
          </div>
      </Card>

      <Card title="API Configuration">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Client Key" value={config.clientKey} disabled icon={<Key size={16}/>} />
              <Input label="Environment" value={config.environment} disabled icon={<Database size={16}/>} />
              <div className="md:col-span-2">
                 <Input label="API Base URL" value={config.apiBaseUrl} disabled />
              </div>
              <div className="md:col-span-2">
                 <Input label="Admin API Base URL" value={config.adminApiBaseUrl} disabled />
              </div>
          </div>
      </Card>

      <Card title="Security Tokens">
          <div className="space-y-4">
              <div className="relative">
                 <Input label="Storefront Token" value={config.storefrontToken} type="password" disabled icon={<Lock size={16}/>} />
                 <button className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
                    <Copy size={14} />
                 </button>
              </div>
              <div className="relative">
                 <Input label="Admin Shop Token" value={config.adminShopToken} type="password" disabled icon={<Lock size={16}/>} />
                 <button className="absolute right-3 top-8 text-gray-400 hover:text-gray-600">
                    <Copy size={14} />
                 </button>
              </div>
          </div>
          <div className="mt-4 bg-blue-50 p-3 rounded-lg flex items-start">
             <Lock size={16} className="text-blue-600 mt-0.5 mr-2" />
             <p className="text-xs text-blue-700">Tokens are securely stored and encrypted. They are only visible to administrators with root access.</p>
          </div>
      </Card>
    </div>
  );

  const renderTicketManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ticket Management</h2>
          <p className="text-gray-600 mt-1">Raise and track support issues directly from your dashboard.</p>
        </div>
        <Button onClick={() => setShowTicketForm(!showTicketForm)}>
           {showTicketForm ? 'Cancel' : 'Create New Ticket'}
        </Button>
      </div>

      {showTicketForm && (
        <Card title="Create New Support Ticket" className="animate-fade-in-down">
           <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Input label="Subject" placeholder="Brief description of the issue" required />
                 <Select label="Priority">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                 </Select>
              </div>
              <TextArea label="Description" rows={4} placeholder="Please provide detailed steps to reproduce the issue..." required />
              <div className="flex justify-end">
                <Button type="submit">Submit Ticket</Button>
              </div>
           </form>
        </Card>
      )}

      <Card title="Your Tickets">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Update</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
               {tickets.map(ticket => (
                 <tr key={ticket.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ticket.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{ticket.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Badge status={ticket.priority}>{ticket.priority}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       <Badge status={ticket.status}>{ticket.status}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.lastUpdate.toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                       <a href="#" className="text-brand-600 hover:text-brand-900">View Details</a>
                    </td>
                 </tr>
               ))}
            </tbody>
          </table>
          {tickets.length === 0 && (
             <div className="p-8 text-center text-gray-500">
                <TicketIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                No active tickets found.
             </div>
          )}
        </div>
      </Card>
    </div>
  );

  const renderSupport = () => (
    <div className="max-w-4xl mx-auto space-y-8">
       <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">How can we help you?</h2>
          <p className="mt-4 text-lg text-gray-600">Our dedicated support team is available 24/7 to assist you with your app building journey.</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center hover:shadow-md transition-shadow">
             <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-blue-600" />
             </div>
             <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Support</h3>
             <p className="text-gray-500 text-sm mb-4">Get a response within 24 hours.</p>
             <a href="mailto:support@appmint.com" className="text-brand-600 font-medium hover:underline">support@appmint.com</a>
          </Card>

          <Card className="text-center hover:shadow-md transition-shadow">
             <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-green-600" />
             </div>
             <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Chat</h3>
             <p className="text-gray-500 text-sm mb-4">Instant answers to your questions.</p>
             <Button variant="outline" className="text-sm">Start Chat</Button>
          </Card>

          <Card className="text-center hover:shadow-md transition-shadow">
             <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8 text-purple-600" />
             </div>
             <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone Support</h3>
             <p className="text-gray-500 text-sm mb-4">Mon-Fri from 9am to 6pm EST.</p>
             <a href="tel:+18001234567" className="text-brand-600 font-medium hover:underline">+1 (800) 123-4567</a>
          </Card>
       </div>

       <Card title="Frequently Asked Questions">
          <div className="space-y-4 divide-y divide-gray-100">
             <div className="pt-4">
                <h4 className="text-sm font-semibold text-gray-900 flex justify-between cursor-pointer">
                   How do I update my app after making changes in Shopify? <Plus size={16} />
                </h4>
             </div>
             <div className="pt-4">
                <h4 className="text-sm font-semibold text-gray-900 flex justify-between cursor-pointer">
                   What is the difference between Dev and Prod environments? <Plus size={16} />
                </h4>
             </div>
             <div className="pt-4">
                <h4 className="text-sm font-semibold text-gray-900 flex justify-between cursor-pointer">
                   How long does it take for a build to complete? <Plus size={16} />
                </h4>
             </div>
          </div>
       </Card>
    </div>
  );

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
      appName={config.appName} 
      logoUrl={config.logoUrl}
      environment={environment}
      onEnvironmentChange={setEnvironment}
      onLogout={onLogout}
    >
      {activeTab === DashboardTab.OVERVIEW && renderOverview()}
      {activeTab === DashboardTab.PREVIEW && renderPreview()}
      {activeTab === DashboardTab.BUILD_MANAGER && renderBuildManager()}
      {activeTab === DashboardTab.THEME_SYNC && renderThemeSync()}
      {activeTab === DashboardTab.SETTINGS && renderSettings()}
      {activeTab === DashboardTab.TICKETS && renderTicketManagement()}
      {activeTab === DashboardTab.SUPPORT && renderSupport()}
    </Layout>
  );
};

export default AdminDashboard;
