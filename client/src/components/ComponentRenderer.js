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
    return <div className="no-components">No components to display</div>;
  }

  return (
    <div className="component-renderer" style={getThemeStyles(theme)}>
      {components.map((component) => {
        if (component.props?.disabled) return null;
        
        const Component = componentMap[component.component] || DefaultComponent;
        
        return (
          <div key={component.id} className="component-wrapper">
            <Component {...component.props} blocks={component.blocks} />
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
      <div className="logo">{props.logo_text || 'Store Logo'}</div>
      <nav className="nav">
        {props.menu_items?.map((item, i) => (
          <a key={i} href={item.url}>{item.title}</a>
        ))}
      </nav>
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
  return (
    <div className="banner-component" style={{ 
      backgroundImage: props.image ? `url(${props.image})` : 'none',
      minHeight: props.height || '400px'
    }}>
      <div className="banner-content">
        {props.heading && <h2>{props.heading}</h2>}
        {props.text && <p>{props.text}</p>}
        {props.button_label && (
          <button className="banner-btn">{props.button_label}</button>
        )}
      </div>
    </div>
  );
}

function FeaturedCollectionComponent(props) {
  return (
    <section className="featured-collection">
      <h2>{props.title || 'Featured Collection'}</h2>
      <div className="collection-grid">
        {props.products?.map((product, i) => (
          <div key={i} className="product-card">
            <img src={product.image} alt={product.title} />
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
  return (
    <div className="default-component">
      <h3>Unknown Component</h3>
      <pre>{JSON.stringify(props, null, 2)}</pre>
    </div>
  );
}

export default ComponentRenderer;
