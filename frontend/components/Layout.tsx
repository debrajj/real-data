import React, { useState } from 'react';
import { LayoutDashboard, Smartphone, Settings, RefreshCw, Layers, LogOut, ChevronDown, Ticket, LifeBuoy, AlertCircle } from 'lucide-react';
import { DashboardTab, AppEnvironment } from '../types';
import { Button } from './UI';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  appName: string;
  logoUrl: string;
  environment: AppEnvironment;
  onEnvironmentChange: (env: AppEnvironment) => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange, 
  appName, 
  logoUrl,
  environment,
  onEnvironmentChange,
  onLogout
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const menuItems = [
    { id: DashboardTab.OVERVIEW, label: 'Dashboard', icon: LayoutDashboard },
    { id: DashboardTab.PREVIEW, label: 'App Preview', icon: Smartphone },
    { id: DashboardTab.BUILD_MANAGER, label: 'Build Manager', icon: Layers },
    { id: DashboardTab.THEME_SYNC, label: 'Theme Sync', icon: RefreshCw },
    { id: DashboardTab.SETTINGS, label: 'App Settings', icon: Settings },
    { id: DashboardTab.TICKETS, label: 'Ticket Management', icon: Ticket },
    { id: DashboardTab.SUPPORT, label: 'Support', icon: LifeBuoy },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-20">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
           {logoUrl ? (
             <img src={logoUrl} alt={appName} className="h-8 object-contain" />
           ) : (
             <span className="text-xl font-bold text-brand-600">{appName}</span>
           )}
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150 ${
                  isActive 
                    ? 'bg-brand-50 text-brand-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={18} className={`mr-3 ${isActive ? 'text-brand-500' : 'text-gray-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} className="mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-200 flex justify-between items-center px-8 sticky top-0 z-10 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-800">
            {menuItems.find(i => i.id === activeTab)?.label}
          </h1>
          <div className="flex items-center space-x-6">
             <div className="flex items-center bg-gray-50 rounded-full px-4 py-1.5 border border-gray-200">
               <span className="text-xs text-gray-500 mr-2 uppercase tracking-wide font-semibold">Environment</span>
               <div className="relative flex items-center">
                 <select 
                    value={environment}
                    onChange={(e) => onEnvironmentChange(e.target.value as AppEnvironment)}
                    className="appearance-none bg-transparent font-semibold text-gray-900 text-sm focus:outline-none cursor-pointer pr-4"
                 >
                    <option value={AppEnvironment.PROD}>Production</option>
                    <option value={AppEnvironment.DEV}>Development</option>
                 </select>
                 <ChevronDown size={14} className="text-gray-500 pointer-events-none absolute right-0" />
               </div>
             </div>
             
             <div className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold border border-brand-200 shadow-sm">
               {appName.charAt(0).toUpperCase()}
             </div>
          </div>
        </header>
        <main className="p-8 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm transform transition-all scale-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Confirm Logout</h3>
            </div>
            
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to log out? You will be redirected to the welcome screen.
            </p>
            
            <div className="flex justify-end space-x-3">
              <Button 
                variant="secondary" 
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </Button>
              <button 
                onClick={onLogout}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-red-600 hover:bg-red-700 text-white shadow-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;