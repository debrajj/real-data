import React from 'react';
import { Menu, Search, ShoppingBag, Heart, ChevronRight, Play } from 'lucide-react';
import { Product, Collection, ThemeData } from '../client/api';

interface PhoneFrameProps {
  appName: string;
  logoUrl: string;
  primaryColor: string;
  products?: Product[];
  collections?: Collection[];
  themeData?: ThemeData | null;
}

// Dynamic Component Renderers - Each renders based on JSON data
const ComponentRenderers: Record<string, React.FC<{ component: any; products: Product[]; collections: Collection[]; primaryColor: string }>> = {
  
  // Hero Component (similar to image-banner)
  hero: ({ component, primaryColor }) => {
    const props = component.props || {};
    const blocks = component.blocks || [];
    const image = props.image || props.background_image || blocks[0]?.settings?.image;
    const heading = props.heading || blocks.find((b: any) => b.type === 'heading')?.settings?.heading || '';
    const subheading = props.subheading || props.text || '';
    const buttonText = props.button_label || blocks.find((b: any) => b.type === 'buttons')?.settings?.button_label_1 || '';
    
    return (
      <div className="relative w-full h-44 overflow-hidden bg-gray-100">
        {image && <img src={image} alt="Hero" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-center p-4">
          {heading && <h2 className="text-white text-base font-bold mb-1">{heading}</h2>}
          {subheading && <p className="text-white text-[10px] opacity-90 mb-2">{subheading}</p>}
          {buttonText && (
            <button className="bg-white text-black text-[10px] px-4 py-1.5 rounded font-medium" style={{ color: primaryColor }}>
              {buttonText}
            </button>
          )}
        </div>
      </div>
    );
  },

  // Product List Component
  'product-list': ({ component, products, primaryColor }) => {
    const props = component.props || {};
    const title = props.title || props.heading || 'Products';
    const limit = props.limit || props.products_to_show || 6;
    const displayProducts = products.slice(0, Math.min(limit, 8));
    
    if (displayProducts.length === 0) {
      return (
        <div className="px-3 py-3">
          <h3 className="font-bold text-gray-800 text-xs mb-2">{title}</h3>
          <p className="text-[10px] text-gray-400 text-center py-4">No products available</p>
        </div>
      );
    }
    
    return (
      <div className="px-3 py-3">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-gray-800 text-xs">{title}</h3>
          <span className="text-[10px] flex items-center" style={{ color: primaryColor }}>
            View All <ChevronRight size={10} />
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {displayProducts.map((product) => (
            <div key={product.productId} className="bg-white rounded-lg border border-gray-100 p-1.5 shadow-sm">
              <div className="aspect-square bg-gray-100 rounded overflow-hidden mb-1">
                {product.images?.[0]?.src ? (
                  <img src={product.images[0].src} alt={product.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag size={20} className="text-gray-300" />
                  </div>
                )}
              </div>
              <h4 className="text-[10px] font-medium text-gray-900 truncate">{product.title}</h4>
              <p className="text-[8px] text-gray-500 truncate">{product.vendor}</p>
              <div className="flex justify-between items-center mt-0.5">
                <span className="text-[10px] font-bold" style={{ color: primaryColor }}>
                  ₹{parseFloat(product.variants?.[0]?.price || '0').toFixed(0)}
                </span>
                <Heart size={10} className="text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },

  // Header Component
  header: ({ component, primaryColor }) => {
    const props = component.props || {};
    const logo = props.logo;
    const logoText = props.logo_text || 'Store';
    const bgColor = props.bg_color || '#ffffff';
    
    return (
      <div className="h-12 flex items-center justify-between px-3 border-b border-gray-100" style={{ backgroundColor: bgColor }}>
        <Menu size={18} className="text-gray-700" />
        <div className="h-7 max-w-[100px] flex items-center justify-center">
          {logo ? (
            <img src={logo} alt="Logo" className="h-full object-contain" />
          ) : (
            <span className="font-bold text-sm" style={{ color: primaryColor }}>{logoText}</span>
          )}
        </div>
        <div className="flex space-x-2 text-gray-700">
          {props.show_search !== false && <Search size={18} />}
          {props.show_cart !== false && <ShoppingBag size={18} />}
        </div>
      </div>
    );
  },

  // Slideshow/Banner Component
  'slide-show': ({ component }) => {
    const blocks = component.blocks || [];
    const firstBlock = blocks[0];
    const image = firstBlock?.settings?.image_slide || firstBlock?.settings?.image;
    const heading = firstBlock?.settings?.heading || '';
    const subHeading = firstBlock?.settings?.sub_heading || '';
    const buttonText = firstBlock?.settings?.button_slide || '';
    
    if (!image) return null;
    
    return (
      <div className="relative w-full h-40 overflow-hidden">
        <img src={image} alt="Banner" className="w-full h-full object-cover" />
        {(heading || subHeading || buttonText) && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex flex-col justify-end p-3">
            {subHeading && <p className="text-white text-[10px] opacity-80">{subHeading}</p>}
            {heading && <h2 className="text-white text-sm font-bold">{heading}</h2>}
            {buttonText && (
              <button className="mt-1 bg-white text-black text-[10px] px-3 py-1 rounded self-start font-medium">
                {buttonText}
              </button>
            )}
          </div>
        )}
      </div>
    );
  },

  // Image Banner Component
  'image-banner': ({ component }) => {
    const props = component.props || {};
    const blocks = component.blocks || [];
    const image = props.image || blocks[0]?.settings?.image;
    const heading = blocks.find((b: any) => b.type === 'heading')?.settings?.heading || '';
    const buttonText = blocks.find((b: any) => b.type === 'buttons')?.settings?.button_label_1 || '';
    
    if (!image) return null;
    
    return (
      <div className="relative w-full h-36 overflow-hidden">
        <img src={image} alt="Banner" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-center p-3">
          {heading && <h2 className="text-white text-sm font-bold">{heading}</h2>}
          {buttonText && (
            <button className="mt-2 bg-white text-black text-[10px] px-3 py-1 rounded font-medium">
              {buttonText}
            </button>
          )}
        </div>
      </div>
    );
  },

  // Spotlight Block Component
  'spotlight-block': ({ component, collections }) => {
    const blocks = component.blocks || [];
    
    return (
      <div className="px-3 py-3">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {blocks.slice(0, 4).map((block: any, i: number) => {
            const image = block.settings?.image || collections[i]?.image?.src;
            const title = block.settings?.title || block.settings?.heading || '';
            
            return (
              <div key={block.id || i} className="flex-shrink-0 flex flex-col items-center">
                <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-200 bg-gray-100">
                  {image && <img src={image} alt={title} className="w-full h-full object-cover" />}
                </div>
                {title && <span className="text-[9px] text-gray-600 mt-1 text-center max-w-[56px] truncate">{title}</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  },

  // Product Block Component
  'product-block': ({ component, products, primaryColor }) => {
    const props = component.props || {};
    // Handle multiple possible field names from Shopify themes
    const title = props.product_block_title || props.title || props.heading || 'Products';
    const limit = props.product_block_limit || props.products_to_show || 4;
    const displayProducts = products.slice(0, Math.min(limit, 6));
    const viewAllText = props.view_all || 'View All';
    
    if (displayProducts.length === 0) {
      return (
        <div className="px-3 py-3">
          <h3 className="font-bold text-gray-800 text-xs mb-2">{title}</h3>
          <p className="text-[10px] text-gray-400 text-center py-4">No products available</p>
        </div>
      );
    }
    
    return (
      <div className="px-3 py-3">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-gray-800 text-xs">{title}</h3>
          {viewAllText && (
            <span className="text-[10px] flex items-center" style={{ color: primaryColor }}>
              {viewAllText} <ChevronRight size={10} />
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {displayProducts.map((product) => (
            <div key={product.productId} className="bg-white rounded-lg border border-gray-100 p-1.5 shadow-sm">
              <div className="aspect-square bg-gray-100 rounded overflow-hidden mb-1">
                {product.images?.[0]?.src ? (
                  <img src={product.images[0].src} alt={product.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag size={20} className="text-gray-300" />
                  </div>
                )}
              </div>
              <h4 className="text-[10px] font-medium text-gray-900 truncate">{product.title}</h4>
              <p className="text-[8px] text-gray-500 truncate">{product.vendor}</p>
              <div className="flex justify-between items-center mt-0.5">
                <span className="text-[10px] font-bold" style={{ color: primaryColor }}>
                  ₹{parseFloat(product.variants?.[0]?.price || '0').toFixed(0)}
                </span>
                <Heart size={10} className="text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },

  // Featured Collection Component
  'featured-collection': ({ component, products, primaryColor }) => {
    const props = component.props || {};
    const title = props.title || props.heading || 'Featured';
    const limit = props.products_to_show || props.product_block_limit || 4;
    
    return ComponentRenderers['product-block']({ 
      component: { ...component, props: { ...props, product_block_title: title, product_block_limit: limit } }, 
      products, 
      collections: [], 
      primaryColor 
    });
  },

  // Collection List Component
  'collection-list': ({ component, collections }) => {
    const props = component.props || {};
    const title = props.title || 'Collections';
    const blocks = component.blocks || [];
    const limit = blocks.length || 4;
    const displayCollections = collections.slice(0, limit);
    
    return (
      <div className="px-3 py-3">
        <h3 className="font-bold text-gray-800 text-xs mb-2">{title}</h3>
        <div className="grid grid-cols-2 gap-2">
          {displayCollections.map((col) => (
            <div key={col.collectionId} className="relative h-20 rounded-lg overflow-hidden">
              {col.image?.src && (
                <img src={col.image.src} alt={col.title} className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-white text-[10px] font-bold text-center px-1">{col.title}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },

  // Video Block Component
  'video-block': ({ component }) => {
    const props = component.props || {};
    const coverImage = props.cover_image || '';
    
    return (
      <div className="px-3 py-2">
        <div className="relative h-32 rounded-lg overflow-hidden bg-gray-900">
          {coverImage && <img src={coverImage} alt="Video" className="w-full h-full object-cover opacity-70" />}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
              <Play size={16} className="text-gray-900 ml-0.5" />
            </div>
          </div>
        </div>
      </div>
    );
  },

  // Rich Text Component
  'rich-text': ({ component }) => {
    const blocks = component.blocks || [];
    const heading = blocks.find((b: any) => b.type === 'heading')?.settings?.heading || '';
    const text = blocks.find((b: any) => b.type === 'text')?.settings?.text || '';
    
    return (
      <div className="px-3 py-3 text-center">
        {heading && <h3 className="text-xs font-bold text-gray-900 mb-1">{heading}</h3>}
        {text && <p className="text-[10px] text-gray-600">{text}</p>}
      </div>
    );
  },

  // Multicolumn Component
  'multicolumn': ({ component }) => {
    const props = component.props || {};
    const title = props.title || '';
    const blocks = component.blocks || [];
    
    return (
      <div className="px-3 py-3">
        {title && <h3 className="text-xs font-bold text-gray-900 mb-2 text-center">{title}</h3>}
        <div className="flex space-x-2 overflow-x-auto">
          {blocks.map((block: any, i: number) => (
            <div key={block.id || i} className="flex-shrink-0 w-20 text-center">
              {block.settings?.image && (
                <img src={block.settings.image} alt="" className="w-full h-16 object-cover rounded mb-1" />
              )}
              {block.settings?.title && (
                <p className="text-[9px] font-medium text-gray-900">{block.settings.title}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  },

  // Custom Service Block
  'custom-service-block': ({ component }) => {
    const blocks = component.blocks || [];
    
    return (
      <div className="px-3 py-2 bg-gray-50">
        <div className="flex justify-around">
          {blocks.slice(0, 4).map((block: any, i: number) => (
            <div key={block.id || i} className="text-center">
              {block.settings?.image && (
                <img src={block.settings.image} alt="" className="w-8 h-8 mx-auto mb-1" />
              )}
              <p className="text-[8px] text-gray-600">{block.settings?.title || ''}</p>
            </div>
          ))}
        </div>
      </div>
    );
  },

  // Instagram Component
  'instagram': ({ component }) => {
    const props = component.props || {};
    const title = props.title || 'Follow Us';
    const blocks = component.blocks || [];
    
    return (
      <div className="px-3 py-3">
        <h3 className="text-xs font-bold text-gray-900 mb-2 text-center">{title}</h3>
        <div className="grid grid-cols-3 gap-1">
          {blocks.slice(0, 6).map((block: any, i: number) => (
            <div key={block.id || i} className="aspect-square bg-gray-100 rounded overflow-hidden">
              {block.settings?.image && (
                <img src={block.settings.image} alt="" className="w-full h-full object-cover" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  },

  // Newsletter Component
  'newsletter': ({ component, primaryColor }) => {
    const blocks = component.blocks || [];
    const heading = blocks.find((b: any) => b.type === 'heading')?.settings?.heading || 'Subscribe';
    
    return (
      <div className="px-3 py-3 bg-gray-100">
        <h3 className="text-xs font-bold text-gray-900 mb-2 text-center">{heading}</h3>
        <div className="flex space-x-1">
          <input 
            type="email" 
            placeholder="Email" 
            className="flex-1 text-[10px] px-2 py-1.5 rounded border border-gray-300"
          />
          <button 
            className="text-[10px] px-3 py-1.5 rounded text-white font-medium"
            style={{ backgroundColor: primaryColor }}
          >
            Subscribe
          </button>
        </div>
      </div>
    );
  },

  // Footer Component
  'footer': () => {
    return (
      <div className="px-3 py-3 bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-[10px] opacity-70">© 2024 Store. All rights reserved.</p>
        </div>
      </div>
    );
  },
};

// Main PhoneFrame Component
const PhoneFrame: React.FC<PhoneFrameProps> = ({ 
  primaryColor, 
  products = [], 
  collections = [],
  themeData
}) => {
  const components = themeData?.components || [];
  

  
  // Render a single component based on its type
  const renderComponent = (component: any, index: number) => {
    const type = component.type?.toLowerCase() || '';
    const Renderer = ComponentRenderers[type];
    
    if (component.props?.disabled) return null;
    
    if (Renderer) {
      return (
        <div key={component.id || index}>
          <Renderer 
            component={component} 
            products={products} 
            collections={collections} 
            primaryColor={primaryColor} 
          />
        </div>
      );
    }
    
    // Fallback: render unknown component type as debug info
    return (
      <div key={component.id || index} className="px-3 py-2 bg-yellow-50 border-l-2 border-yellow-400">
        <p className="text-[9px] text-yellow-700">Unknown: {component.type}</p>
      </div>
    );
  };

  // If no theme data, show placeholder
  if (!themeData || components.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="relative border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[290px] shadow-2xl flex flex-col overflow-hidden">
          <div className="absolute top-0 w-full h-6 flex justify-center z-20 pointer-events-none">
            <div className="h-5 w-28 bg-gray-800 rounded-b-xl"></div>
          </div>
          <div className="h-6 bg-white w-full flex justify-between items-center px-4 pt-1 text-[9px] font-bold text-gray-900 z-10">
            <span>9:41</span>
            <div className="flex space-x-1"><span>5G</span><span>100%</span></div>
          </div>
          <div className="flex-1 bg-gray-50 flex items-center justify-center">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                <ShoppingBag size={20} className="text-gray-400" />
              </div>
              <p className="text-xs text-gray-500">No theme data</p>
              <p className="text-[10px] text-gray-400 mt-1">Sync your Shopify theme</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if there's a product-related component in the theme
  const hasProductComponent = components.some((c: any) => 
    ['product-block', 'featured-collection', 'collection-list'].includes(c.type?.toLowerCase())
  );

  return (
    <div className="flex justify-center items-center py-8">
      <div className="relative border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[290px] shadow-2xl flex flex-col overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 w-full h-6 flex justify-center z-20 pointer-events-none">
          <div className="h-5 w-28 bg-gray-800 rounded-b-xl"></div>
        </div>
        
        {/* Status Bar */}
        <div className="h-6 bg-white w-full flex justify-between items-center px-4 pt-1 text-[9px] font-bold text-gray-900 z-10">
          <span>9:41</span>
          <div className="flex space-x-1"><span>5G</span><span>100%</span></div>
        </div>
        
        {/* Dynamic Content - Renders all components from JSON */}
        <div className="flex-1 bg-gray-50 overflow-y-auto">
          {components.map((component, index) => renderComponent(component, index))}
          
          {/* Fallback: Show products if no product component exists but products are available */}
          {!hasProductComponent && products.length > 0 && (
            <div className="px-3 py-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-800 text-xs">Products</h3>
                <span className="text-[10px] flex items-center" style={{ color: primaryColor }}>
                  View All <ChevronRight size={10} />
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {products.slice(0, 4).map((product) => (
                  <div key={product.productId} className="bg-white rounded-lg border border-gray-100 p-1.5 shadow-sm">
                    <div className="aspect-square bg-gray-100 rounded overflow-hidden mb-1">
                      {product.images?.[0]?.src ? (
                        <img src={product.images[0].src} alt={product.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag size={20} className="text-gray-300" />
                        </div>
                      )}
                    </div>
                    <h4 className="text-[10px] font-medium text-gray-900 truncate">{product.title}</h4>
                    <p className="text-[8px] text-gray-500 truncate">{product.vendor}</p>
                    <div className="flex justify-between items-center mt-0.5">
                      <span className="text-[10px] font-bold" style={{ color: primaryColor }}>
                        ₹{parseFloat(product.variants?.[0]?.price || '0').toFixed(0)}
                      </span>
                      <Heart size={10} className="text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Home Indicator */}
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-28 h-1 bg-gray-900 rounded-full z-20 opacity-20"></div>
      </div>
    </div>
  );
};

export default PhoneFrame;
