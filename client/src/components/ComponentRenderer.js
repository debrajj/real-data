import React from 'react';
import './ComponentRenderer.css';
import './ThemeComponents.css';
import UniversalRenderer from './UniversalRenderer';
import {
  SlideShow,
  SpotlightBlock,
  ProductBlock,
  ProductTabBlock,
  StickyScrollingBanner,
  VideoBlock,
  CustomServiceBlock,
  Instagram
} from './ThemeComponents';

// Component mapping - specific renderers for common sections
const componentMap = {
  Header: HeaderComponent,
  AnnouncementBar: AnnouncementBarComponent,
  Banner: BannerComponent,
  Hero: HeroComponent,
  FeaturedCollection: FeaturedCollectionComponent,
  FeaturedProduct: FeaturedProductComponent,
  ProductList: ProductListComponent,
  CollectionList: CollectionListComponent,
  MultiColumn: MultiColumnComponent,
  RichText: RichTextComponent,
  Footer: FooterComponent,
  ImageWithText: ImageWithTextComponent,
  Video: VideoComponent,
  Newsletter: NewsletterComponent,
  // New theme components
  SlideShow: SlideShow,
  SpotlightBlock: SpotlightBlock,
  ProductBlock: ProductBlock,
  ProductTabBlock: ProductTabBlock,
  StickyScrollingBanner: StickyScrollingBanner,
  VideoBlock: VideoBlock,
  CustomServiceBlock: CustomServiceBlock,
  Instagram: Instagram,
};

function ComponentRenderer({ components, theme, media = [] }) {
  if (!components || components.length === 0) {
    return (
      <div className="no-components">
        <div className="empty-state">
          <h3>No sections found</h3>
          <p>Click "🔄 Manual Sync" to load theme sections</p>
        </div>
      </div>
    );
  }

  return (
    <div className="component-renderer" style={getThemeStyles(theme)}>
      {components.map((component) => {
        if (component.props?.disabled) return null;
        
        // Check if we have a specific renderer for this component
        const SpecificComponent = componentMap[component.component];
        
        return (
          <div key={component.id} className="component-wrapper">
            <div className="section-label">{component.type || component.component}</div>
            {SpecificComponent ? (
              <SpecificComponent {...component.props} blocks={component.blocks} type={component.type} media={media} />
            ) : (
              <UniversalRenderer component={component} blocks={component.blocks} props={component.props} media={media} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function getThemeStyles(theme) {
  if (!theme) return {};
  
  const colors = theme.colors || {};
  return {
    '--primary-color': colors.color_primary || '#000',
    '--secondary-color': colors.color_secondary || '#666',
    '--background-color': colors.background_color || '#fff',
  };
}


// Component implementations
function HeaderComponent(props) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  
  const menuItems = props.menu || [];
  const iconSize = props.icons_width || 24;
  
  return (
    <header className="header-component" style={{
      backgroundColor: props.bg_color || '#ffffff',
      borderBottom: '1px solid #e5e5e5',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div className="header-inner" style={{
        maxWidth: '1470px',
        margin: '0 auto',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div className="logo">
          {props.logo ? (
            <a href="/">
              <img 
                src={props.logo} 
                alt={props.logo_text || 'Store Logo'} 
                style={{ 
                  height: 'auto',
                  width: `${props.logo_width || 145}px`,
                  maxHeight: '60px'
                }} 
              />
            </a>
          ) : props.logo_text ? (
            <a href="/" style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              textDecoration: 'none',
              color: props.logo_color || '#000'
            }}>
              {props.logo_text}
            </a>
          ) : null}
        </div>
        
        {/* Desktop Navigation */}
        <nav className="nav desktop-nav" style={{
          display: 'flex',
          gap: '2rem',
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center'
        }}>
          {menuItems.map((item, index) => (
            <a 
              key={index}
              href={item.url} 
              style={{
                textDecoration: 'none',
                color: props.menu_color || '#333',
                fontSize: '1rem',
                fontWeight: '500',
                transition: 'color 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.color = props.menu_hover_color || '#666'}
              onMouseLeave={(e) => e.target.style.color = props.menu_color || '#333'}
            >
              {item.title}
            </a>
          ))}
        </nav>
        
        {/* Header Icons */}
        <div className="header-icons" style={{
          display: 'flex',
          gap: '1.5rem',
          alignItems: 'center'
        }}>
          {props.show_search !== false && (
            <a href="/search" style={{ 
              textDecoration: 'none', 
              color: props.menu_color || '#333',
              fontSize: `${iconSize}px`
            }}>
              🔍
            </a>
          )}
          {props.show_customer !== false && (
            <a href="/account" style={{ 
              textDecoration: 'none', 
              color: props.menu_color || '#333',
              fontSize: `${iconSize}px`
            }}>
              👤
            </a>
          )}
          {props.show_wishlist !== false && (
            <a href="/pages/wishlist" style={{ 
              textDecoration: 'none', 
              color: props.menu_color || '#333',
              fontSize: `${iconSize}px`
            }}>
              ❤️
            </a>
          )}
          {props.show_cart !== false && (
            <a href="/cart" style={{
              textDecoration: 'none',
              color: props.menu_color || '#333',
              fontSize: `${iconSize}px`
            }}>
              🛒
            </a>
          )}
        </div>
        
        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer'
          }}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>
      
      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="mobile-nav" style={{
          display: 'none',
          flexDirection: 'column',
          padding: '1rem 2rem',
          backgroundColor: props.bg_color || '#ffffff',
          borderTop: '1px solid #e5e5e5'
        }}>
          {menuItems.map((item, index) => (
            <a 
              key={index}
              href={item.url} 
              style={{
                textDecoration: 'none',
                color: props.menu_color || '#333',
                padding: '0.75rem 0',
                borderBottom: '1px solid #f0f0f0'
              }}
            >
              {item.title}
            </a>
          ))}
          <a href="/cart" style={{
            textDecoration: 'none',
            color: props.menu_color || '#333',
            padding: '0.75rem 0'
          }}>
            🛒 Cart
          </a>
        </nav>
      )}
      
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
          .mobile-nav {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}

function AnnouncementBarComponent(props) {
  if (!props.text) return null;
  return (
    <div className="announcement-bar" style={{ background: props.background }}>
      <p>{props.text}</p>
    </div>
  );
}

function BannerComponent({ blocks, ...props }) {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);
  
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // If blocks exist, render each block as a banner
  if (blocks && blocks.length > 0) {
    return (
      <div className="banner-wrapper" style={{
        marginTop: `${props.mg_top_desktop || 0}px`,
        marginBottom: `${props.mg_bottom_desktop || 0}px`,
        backgroundColor: props.bg_color || 'transparent'
      }}>
        <div style={{ maxWidth: `${props.container || 1470}px`, margin: '0 auto' }}>
          {blocks.map((block, index) => {
            const imageUrl = isMobile 
              ? (block.settings.mobile_image || block.settings.image)
              : block.settings.image;
            
            const heading = isMobile 
              ? (block.settings.heading_mb || block.settings.heading)
              : block.settings.heading;
            
            const subTitle = block.settings.sub_title;
            const text = block.settings.text;
            const buttonText = block.settings.btn_text;
            
            return (
              <div 
                key={block.id || index}
                className="banner-component" 
                style={{ 
                  backgroundImage: imageUrl ? `url(${imageUrl})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  minHeight: '400px',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  borderRadius: `${block.settings.border_radius || 0}px`,
                  position: 'relative',
                  display: 'flex',
                  alignItems: block.settings.align_items || 'center',
                  justifyContent: block.settings.position || 'center'
                }}
              >
                {(heading || subTitle || text || buttonText) && (
                  <div className="banner-content" style={{
                    textAlign: block.settings.align || 'center',
                    maxWidth: `${block.settings.content_width || 400}px`,
                    backgroundColor: block.settings.bg_color_content || 'rgba(0, 0, 0, 0.3)',
                    padding: '2rem',
                    borderRadius: '8px'
                  }}>
                    {subTitle && (
                      <p className="banner-subtitle" style={{
                        color: isMobile ? block.settings.color_sub_title_mb : block.settings.color_sub_title,
                        fontSize: `${isMobile ? block.settings.font_size_sub_title_mb : block.settings.font_size_sub_title}px`,
                        fontWeight: block.settings.font_weight_sub_title || '700',
                        marginBottom: `${block.settings.margin_bottom_sub_title || 14}px`
                      }}>
                        {subTitle}
                      </p>
                    )}
                    {heading && (
                      <h2 className="banner-heading" style={{
                        color: isMobile ? block.settings.color_heading_mb : block.settings.color_heading,
                        fontSize: `${isMobile ? block.settings.font_size_heading_mb : block.settings.font_size_heading}px`,
                        fontWeight: block.settings.font_weight_heading || '600',
                        marginBottom: `${block.settings.margin_bottom_heading || 35}px`,
                        fontStyle: block.settings.enable_style_italic ? 'italic' : 'normal'
                      }}>
                        {heading}
                      </h2>
                    )}
                    {text && (
                      <p className="banner-text" style={{
                        color: isMobile ? block.settings.color_des_mb : block.settings.color_des,
                        fontSize: `${isMobile ? block.settings.font_size_des_mb : block.settings.font_size_des}px`,
                        lineHeight: `${block.settings.line_height_des || 26}px`,
                        marginBottom: `${block.settings.margin_bottom_des || 45}px`
                      }}>
                        {text}
                      </p>
                    )}
                    {buttonText && (
                      <a 
                        href={block.settings.link || '#'} 
                        className="banner-btn button"
                        style={{
                          minWidth: `${block.settings.button_1_width || 200}px`,
                          color: block.settings.button_color || '#ffffff',
                          backgroundColor: block.settings.button_background || '#000000',
                          border: `1px solid ${block.settings.button_border || '#000000'}`
                        }}
                      >
                        {buttonText}
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  
  // Fallback for simple banner without blocks
  const hasImage = props.image || props.image_url || props.desktop_image;
  const heading = props.heading || props.title || 'Welcome to our store';
  const text = props.text || props.description || 'Discover amazing products';
  const buttonLabel = props.button_label || props.button_text || 'Shop Now';
  
  return (
    <div className="banner-component" style={{ 
      backgroundImage: hasImage ? `url(${hasImage})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: props.height || '400px',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
      <div className="banner-content">
        <h2>{heading}</h2>
        <p>{text}</p>
        <button className="banner-btn">{buttonLabel}</button>
      </div>
    </div>
  );
}

function HeroComponent({ blocks, ...props }) {
  const textBlock = blocks?.find(b => b.type === 'text');
  const buttonBlock = blocks?.find(b => b.type === 'button');
  
  const height = props.section_height === 'small' ? '300px' :
                 props.section_height === 'medium' ? '400px' :
                 props.section_height === 'large' ? '600px' : '400px';
  
  return (
    <div className="banner-component" style={{ 
      backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: height,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundColor: props.overlay_color,
    }}>
      <div className="banner-content">
        {textBlock && (
          <div dangerouslySetInnerHTML={{ __html: textBlock.settings.text }} />
        )}
        {buttonBlock && (
          <a href={buttonBlock.settings.link} className="banner-btn">
            {buttonBlock.settings.label}
          </a>
        )}
      </div>
    </div>
  );
}

function ProductListComponent({ blocks, ...props }) {
  const mockProducts = Array.from({ length: props.max_products || 8 }, (_, i) => ({
    title: `Product ${i + 1}`,
    price: `$${(29.99 + i * 10).toFixed(2)}`,
    image: `https://via.placeholder.com/300x300?text=Product+${i + 1}`
  }));
  
  return (
    <section className="featured-collection">
      <div className="collection-grid" style={{
        gridTemplateColumns: `repeat(${props.columns || 4}, 1fr)`,
        gap: `${props.rows_gap || 24}px ${props.columns_gap || 8}px`,
      }}>
        {mockProducts.map((product, i) => (
          <div key={i} className="product-card">
            <div className="product-image">
              <img src={product.image} alt={product.title} />
            </div>
            <h3>{product.title}</h3>
            <p className="price">{product.price}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturedCollectionComponent(props) {
  // Mock products if none provided
  const mockProducts = [
    { title: 'Product 1', price: '$29.99', image: 'https://via.placeholder.com/300x300?text=Product+1' },
    { title: 'Product 2', price: '$39.99', image: 'https://via.placeholder.com/300x300?text=Product+2' },
    { title: 'Product 3', price: '$49.99', image: 'https://via.placeholder.com/300x300?text=Product+3' },
    { title: 'Product 4', price: '$59.99', image: 'https://via.placeholder.com/300x300?text=Product+4' },
  ];
  
  const products = props.products || mockProducts;
  
  return (
    <section className="featured-collection">
      <h2>{props.title || props.heading || 'Featured Collection'}</h2>
      <div className="collection-grid">
        {products.slice(0, 4).map((product, i) => (
          <div key={i} className="product-card">
            <div className="product-image">
              <img src={product.image} alt={product.title} />
            </div>
            <h3>{product.title}</h3>
            <p className="price">{product.price}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturedProductComponent(props) {
  return (
    <section className="featured-product">
      <h2>{props.title || 'Featured Product'}</h2>
      <div className="product-details">
        {props.image && <img src={props.image} alt={props.title} />}
        <div className="product-info">
          <h3>{props.product_title}</h3>
          <p>{props.description}</p>
          <p className="price">{props.price}</p>
        </div>
      </div>
    </section>
  );
}

function CollectionListComponent(props) {
  return (
    <section className="collection-list">
      <h2>{props.title || 'Collections'}</h2>
      <div className="collections-grid">
        {props.collections?.map((collection, i) => (
          <div key={i} className="collection-item">
            <img src={collection.image} alt={collection.title} />
            <h3>{collection.title}</h3>
          </div>
        ))}
      </div>
    </section>
  );
}

function MultiColumnComponent({ blocks }) {
  return (
    <section className="multi-column">
      <div className="columns">
        {blocks?.map((block) => (
          <div key={block.id} className="column">
            {block.settings.image && <img src={block.settings.image} alt="" />}
            {block.settings.title && <h3>{block.settings.title}</h3>}
            {block.settings.text && <p>{block.settings.text}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function RichTextComponent(props) {
  return (
    <section className="rich-text">
      {props.heading && <h2>{props.heading}</h2>}
      {props.text && <div dangerouslySetInnerHTML={{ __html: props.text }} />}
    </section>
  );
}

function FooterComponent(props) {
  return (
    <footer className="footer-component">
      <div className="footer-content">
        <p>{props.copyright || '© 2024 Store'}</p>
        {props.social_links && (
          <div className="social-links">
            {props.social_links.map((link, i) => (
              <a key={i} href={link.url}>{link.platform}</a>
            ))}
          </div>
        )}
      </div>
    </footer>
  );
}

function ImageWithTextComponent(props) {
  return (
    <section className="image-with-text">
      <div className="content-wrapper">
        {props.image && <img src={props.image} alt="" />}
        <div className="text-content">
          {props.heading && <h2>{props.heading}</h2>}
          {props.text && <p>{props.text}</p>}
        </div>
      </div>
    </section>
  );
}

function VideoComponent(props) {
  // Helper to convert YouTube URL to embed format
  const getEmbedUrl = (url) => {
    if (!url || url === '') return null;
    
    // YouTube URL conversion
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }
    
    // Vimeo URL conversion
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
    }
    
    return url;
  };

  // Prioritize video_url (YouTube/Vimeo) over video (hosted file)
  const videoUrl = (props.video_url && props.video_url !== '') ? props.video_url : props.video;
  const embedUrl = getEmbedUrl(videoUrl);
  
  // If no valid video URL, show placeholder
  if (!embedUrl || embedUrl === '') {
    return (
      <section className="video-component">
        {props.heading && <h2>{props.heading}</h2>}
        <div style={{padding: '3rem 1rem', textAlign: 'center', background: '#f5f5f5', borderRadius: '8px'}}>
          <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🎥</div>
          <p style={{color: '#666', margin: 0}}>Video section (no video configured)</p>
        </div>
        {props.description && <p>{props.description}</p>}
      </section>
    );
  }
  
  return (
    <section className="video-component">
      {props.heading && <h2>{props.heading}</h2>}
      <div className="video-wrapper">
        {embedUrl.endsWith('.mp4') || embedUrl.endsWith('.webm') ? (
          <video controls loop={props.enable_video_looping}>
            <source src={embedUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <iframe 
            src={embedUrl} 
            title={props.heading || "Video"}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
      {props.description && <p>{props.description}</p>}
    </section>
  );
}

function NewsletterComponent(props) {
  return (
    <section className="newsletter">
      <h2>{props.heading || 'Subscribe to our newsletter'}</h2>
      <form className="newsletter-form">
        <input type="email" placeholder={props.placeholder || 'Enter your email'} />
        <button type="submit">{props.button_label || 'Subscribe'}</button>
      </form>
    </section>
  );
}



export default ComponentRenderer;
