import React from 'react';

// --- Components ---

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'variant'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-brand-500 hover:bg-brand-600 text-white focus:ring-brand-500 shadow-sm",
    secondary: "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-sm focus:ring-brand-500",
    outline: "bg-transparent border border-brand-500 text-brand-500 hover:bg-brand-50 focus:ring-brand-500",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; icon?: React.ReactNode }> = ({ label, icon, className = '', ...props }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <div className="relative">
      {icon && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
          {icon}
        </div>
      )}
      <input
        className={`block w-full ${icon ? 'pl-10' : 'px-3'} py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 sm:text-sm ${className}`}
        {...props}
      />
    </div>
  </div>
);

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, className = '', ...props }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <div className="relative">
      <textarea
        className={`block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 sm:text-sm ${className}`}
        {...props}
      />
    </div>
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }> = ({ label, children, className = '', ...props }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <select
      className={`block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm rounded-lg ${className}`}
      {...props}
    >
      {children}
    </select>
  </div>
);

export const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string; action?: React.ReactNode }> = ({ children, className = '', title, action }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col ${className}`}>
    {(title || action) && (
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
        {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="p-6 flex-1 min-h-0">{children}</div>
  </div>
);

export const Badge: React.FC<{ status: string; children: React.ReactNode }> = ({ status, children }) => {
  let colorClass = "bg-gray-100 text-gray-800";
  
  const s = status.toLowerCase();
  
  // Statuses
  if (['completed', 'success', 'active', 'resolved', 'open'].includes(s)) colorClass = "bg-green-100 text-green-800";
  if (['building', 'queued', 'pending', 'in progress'].includes(s)) colorClass = "bg-yellow-100 text-yellow-800";
  if (['failed', 'error', 'closed', 'high'].includes(s)) colorClass = "bg-red-100 text-red-800";
  
  // Envs
  if (s === 'development') colorClass = "bg-blue-100 text-blue-800";
  if (s === 'production') colorClass = "bg-purple-100 text-purple-800";
  
  // Priorities
  if (s === 'medium') colorClass = "bg-orange-100 text-orange-800";
  if (s === 'low') colorClass = "bg-gray-100 text-gray-800";


  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {children}
    </span>
  );
};