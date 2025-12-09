import React, { useEffect, useState } from 'react';
import { Button } from '../components/UI';
import { CheckCircle, Smartphone, Copy, Check, Key } from 'lucide-react';

interface SyncSuccessViewProps {
  clientKey: string;
  appName: string;
  onContinue: () => void;
}

const SyncSuccessView: React.FC<SyncSuccessViewProps> = ({ clientKey, appName, onContinue }) => {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(clientKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className={`transform transition-all duration-1000 ${visible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
        <div className="bg-green-100 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Connection Successful!</h2>
        <p className="text-lg text-gray-500 max-w-md mx-auto mb-6">
          Your app <span className="font-semibold text-gray-700">{appName}</span> is now configured.
        </p>

        {/* Client Key Display - Important! */}
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 max-w-md mx-auto mb-6">
          <div className="flex items-center justify-center mb-3">
            <Key className="h-5 w-5 text-amber-600 mr-2" />
            <h3 className="font-bold text-amber-800">Save Your Client Key</h3>
          </div>
          <p className="text-sm text-amber-700 mb-4">
            You'll need this key to access your dashboard in the future. Save it somewhere safe!
          </p>
          <div className="flex items-center bg-white rounded-lg border border-amber-300 p-3">
            <code className="flex-1 text-sm font-mono text-gray-800 break-all text-left">
              {clientKey}
            </code>
            <button
              onClick={handleCopyKey}
              className="ml-3 p-2 hover:bg-amber-100 rounded-md transition-colors"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <Copy className="h-5 w-5 text-amber-600" />
              )}
            </button>
          </div>
          {copied && (
            <p className="text-xs text-green-600 mt-2">Copied to clipboard!</p>
          )}
        </div>

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 max-w-sm mx-auto mb-8 text-left">
           <ul className="space-y-3">
             <li className="flex items-center text-sm text-gray-600">
               <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
               Development & Production Configs Created
             </li>
             <li className="flex items-center text-sm text-gray-600">
               <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
               Shopify Data Syncing
             </li>
             <li className="flex items-center text-sm text-gray-600">
               <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
               Mobile App Ready
             </li>
           </ul>
        </div>

        <Button onClick={onContinue} className="px-8 py-3 text-lg">
          <Smartphone size={20} className="mr-2" />
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default SyncSuccessView;
