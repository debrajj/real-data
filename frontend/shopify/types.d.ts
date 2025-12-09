// Type declarations for Shopify App Bridge custom elements
import 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'ui-nav-menu': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        children?: React.ReactNode;
      };
    }
  }

  interface Window {
    shopify?: {
      config: {
        apiKey: string;
        host: string;
      };
    };
  }
}

export {};
