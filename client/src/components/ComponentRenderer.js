import React from 'react';
import './ComponentRenderer.css';
import UniversalRenderer from './UniversalRenderer';

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
