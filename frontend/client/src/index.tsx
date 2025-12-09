import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppBridgeProvider } from './providers/AppBridgeProvider';
import './index.css'; // Tailwind import

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppBridgeProvider>
      <App />
    </AppBridgeProvider>
  </React.StrictMode>
);