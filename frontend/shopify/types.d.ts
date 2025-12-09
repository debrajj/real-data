// Type declarations for Shopify App Bridge custom elements
declare namespace JSX {
  interface IntrinsicElements {
    'ui-nav-menu': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
  }
}

// Extend Window for Shopify App Bridge
declare global {
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
