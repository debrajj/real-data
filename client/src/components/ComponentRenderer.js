import React from 'react';
import './ComponentRenderer.css';

// Component mapping
const componentMap = {
  Header: HeaderComponent,
  AnnouncementBar: AnnouncementBarComponent,
  Banner: BannerComponent,
  FeaturedCollection: FeaturedCollectionComponent,
  FeaturedProduct: FeaturedProductComponent,
  CollectionList: CollectionListComponent,
  MultiColumn: MultiColumnComponent,
  RichText: RichTextComponent,
  Footer: FooterComponent,
  ImageWithText: ImageWithTextComponent,
  Video: VideoComponent,
  Newsletter: NewsletterComponent,
};

function ComponentRenderer({ components, theme }) {
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

  // Check if header and footer exist
  const hasHeader = components.some(c => c.type === 'header' || c.component === 'Header');
  const hasFooter = components.some(c => c.type === 'footer' || c.component === 'Footer');

  return (
    <div className="component-renderer" style={getThemeStyles(theme)}>
      {/* Always show header if not present */}
      {!hasHeader && (
        <div className="component-wrapper">
          <div className="section-label">header</div>
          <HeaderComponent />
        </div>
      )}
      
      {components.map((component) => {
        if (component.props?.disabled) return null;
        
        const Component = componentMap[component.component] || DefaultComponent;
        
        return (
          <div key={component.id} className="component-wrapper">
            <div className="section-label">{component.type || component.component}</div>
            <Component {...component.props} blocks={component.blocks} type={component.type} />
          </div>
        );
      })}
      
      {/* Always show footer if not present */}
      {!hasFooter && (
        <div className="component-wrapper">
          <div className="section-label">footer</div>
          <FooterComponent />
        </div>
      )}
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
  return (
    <header className="header-component">
      <div className="header-inner">
        <div className="logo">
          {props.logo ? (
            <img src={props.logo} alt="Logo" style={{ height: props.logo_height || '36px' }} />
          ) : (
            <span className="logo-text">{props.logo_text || '🛍️ Store'}</span>
          )}
        </div>
        <nav className="nav">
          <a href="/">Home</a>
          <a href="/collections">Shop</a>
          <a href="/pages/about">About</a>
          <a href="/cart">Cart</a>
        </nav>
      </div>
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

function BannerComponent(props) {
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
  return (
    <section className="video-component">
      {props.video_url && (
        <iframe 
          src={props.video_url} 
          title="Video"
          frameBorder="0"
          allowFullScreen
        />
      )}
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

function DefaultComponent(props) {
  const { type, ...settings } = props;
  const hasContent = Object.keys(settings).length > 0;
  
  return (
    <div className="default-component">
      <div className="section-box">
        <div className="section-icon">📦</div>
        <h3>{type || 'Section'}</h3>
        {hasContent && (
          <div className="section-preview">
            {Object.entries(settings).slice(0, 3).map(([key, value]) => (
              <div key={key} className="setting-item">
                <span className="setting-key">{key}:</span>
                <span className="setting-value">
                  {typeof value === 'string' && value.length > 30 
                    ? value.substring(0, 30) + '...' 
                    : String(value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ComponentRenderer;
