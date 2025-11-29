import React from 'react';
import './ThemeComponents.css';

// SlideShow Component
export function SlideShow({ blocks = [], ...props }) {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);
  
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  React.useEffect(() => {
    if (props.autoplay && blocks.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % blocks.length);
      }, parseInt(props.slideshow_speed || 5000));
      return () => clearInterval(interval);
    }
  }, [props.autoplay, props.slideshow_speed, blocks.length]);

  const showDots = props.dots === 'true' || props.dots === true;
  const showArrows = props.arrow_active === 'true' || props.arrow_active === true;

  return (
    <div className="slideshow" style={{
      marginTop: `${props.mg_top_desktop || 0}px`,
      marginBottom: `${props.mg_bottom_desktop || 0}px`,
      backgroundColor: props.slideshow_background || 'transparent'
    }}>
      <div className="slideshow__slides" style={{
        maxWidth: `${props.container || 1470}px`,
        margin: '0 auto',
        borderRadius: `${props.border_radius || 0}px`,
        overflow: 'hidden'
      }}>
        {blocks.map((block, index) => {
          const imageUrl = isMobile 
            ? (block.settings.image_slide_mb || block.settings.image_slide)
            : block.settings.image_slide;
          
          const heading = isMobile ? (block.settings.heading_mb || block.settings.heading) : block.settings.heading;
          const subHeading = isMobile ? (block.settings.sub_heading_mb || block.settings.sub_heading) : block.settings.sub_heading;
          const description = isMobile ? (block.settings['slide-des-mb'] || block.settings['slide-des']) : block.settings['slide-des'];
          
          const hasContent = heading || subHeading || description || block.settings.button_slide;
          
          return (
            <div
              key={block.id}
              className={`slideshow__slide ${index === currentSlide ? 'active' : ''}`}
              style={{
                backgroundImage: imageUrl ? `url(${imageUrl})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                display: index === currentSlide ? 'block' : 'none',
                minHeight: '500px',
                height: 'auto',
                position: 'relative',
                width: '100%'
              }}
            >
              {hasContent && (
                <div className="slideshow__content" style={{
                  textAlign: block.settings.text_alignment || 'center',
                  maxWidth: `${block.settings.content_width || 475}px`,
                  padding: `${block.settings.padding_vertical || 30}px 20px`,
                  backgroundColor: block.settings.bg_color_content || 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '8px',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
                }}>
                  {subHeading && (
                    <p className="slideshow__subheading" style={{
                      color: block.settings.color_sub_heading || '#ffffff',
                      fontSize: `${block.settings.font_size_sub_heading || 30}px`,
                      marginBottom: `${block.settings.sub_heading_spacing_bottom || 20}px`,
                      fontWeight: block.settings.font_weight_sub_heading || '400'
                    }}>
                      {subHeading}
                    </p>
                  )}
                  {heading && (
                    <h2 className="slideshow__heading" style={{
                      color: block.settings.color_heading || '#232323',
                      fontSize: `${block.settings.font_size_heading || 40}px`,
                      lineHeight: `${block.settings.line_height_heading || 40}px`,
                      marginBottom: `${block.settings.heading_spacing_bottom || 25}px`,
                      fontStyle: block.settings.font_style_heading || 'normal'
                    }}>
                      {heading}
                    </h2>
                  )}
                  {description && (
                    <p className="slideshow__description" style={{
                      color: block.settings.color_des || '#232323',
                      fontSize: `${block.settings.font_size_des || 16}px`,
                      lineHeight: `${block.settings.line_height_des || 22}px`,
                      marginBottom: `${block.settings.des_spacing_bottom || 45}px`
                    }}>
                      {description}
                    </p>
                  )}
                  {block.settings.button_slide && (
                    <a 
                      href={block.settings.link || '#'} 
                      className="slideshow__button button"
                      style={{
                        minWidth: `${block.settings.min_width_banner_button || 195}px`,
                        color: block.settings.color_button || '#ffffff',
                        backgroundColor: block.settings.bg_button || '#000000',
                        border: `1px solid ${block.settings.border_button || '#000000'}`
                      }}
                    >
                      {block.settings.button_slide}
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {showDots && blocks.length > 1 && (
        <div className="slideshow__controls" style={{
          bottom: props.position_slick_dots || '34px'
        }}>
          {blocks.map((_, index) => (
            <button
              key={index}
              className={`slideshow__dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
              style={{
                backgroundColor: index === currentSlide 
                  ? (props.dots_active_color || '#000000')
                  : (props.dots_color || '#f5f5f5'),
                borderColor: index === currentSlide
                  ? (props.dots_active_border_color || '#000000')
                  : (props.dots_border_color || '#f5f5f5')
              }}
            />
          ))}
        </div>
      )}
      
      {showArrows && blocks.length > 1 && (
        <>
          <button 
            className="slideshow__arrow slideshow__arrow--prev"
            onClick={() => setCurrentSlide((prev) => (prev - 1 + blocks.length) % blocks.length)}
            style={{
              color: props.arrow_color || '#666d6d',
              backgroundColor: props.arrow_bg_color || 'transparent',
              borderColor: props.arrow_border_color || '#666d6d'
            }}
          >
            ‹
          </button>
          <button 
            className="slideshow__arrow slideshow__arrow--next"
            onClick={() => setCurrentSlide((prev) => (prev + 1) % blocks.length)}
            style={{
              color: props.arrow_color || '#666d6d',
              backgroundColor: props.arrow_bg_color || 'transparent',
              borderColor: props.arrow_border_color || '#666d6d'
            }}
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}

// SpotlightBlock Component
export function SpotlightBlock({ blocks = [], ...props }) {
  const heading = props.spotlight_block_title || props.heading;
  const description = props.spotlight_block_des || props.description;
  
  return (
    <div className="spotlight-block" style={{
      backgroundColor: props.spotlight_bg || '#ffffff',
      paddingTop: `${props.mg_top_desktop || 50}px`,
      paddingBottom: `${props.mg_bottom_desktop || 50}px`
    }}>
      <div className="spotlight-block__inner" style={{ maxWidth: `${props.container || 1320}px`, margin: '0 auto' }}>
        {heading && (
          <h2 className="spotlight-block__heading" style={{
            textAlign: props.title_align || 'center',
            color: props.color_title || '#232323',
            fontSize: `${props.fontsize_title || 24}px`,
            marginBottom: `${props.margin_bottom_title || 0}px`
          }}>
            {heading}
          </h2>
        )}
        {description && (
          <p className="spotlight-block__description" style={{
            textAlign: props.title_align || 'center',
            color: props.color_des || '#3c3c3c',
            fontSize: `${props.fontsize_des || 16}px`,
            marginBottom: `${props.margin_bottom_des || 30}px`
          }}>
            {description}
          </p>
        )}
        <div className="spotlight-block__items" style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${props.column || 4}, 1fr)`,
          gap: `${props.item_distance || 15}px`
        }}>
          {blocks.map((block) => (
            <div key={block.id} className="spotlight-item" style={{
              borderRadius: `${props.item_radius || 0}px`,
              textAlign: block.settings.title_align || 'center'
            }}>
              {block.settings.enable_image && block.settings.image && (
                <div className="spotlight-item__image">
                  <img src={block.settings.image} alt={block.settings.title || block.settings.sub_title || ''} />
                </div>
              )}
              <div className="spotlight-item__content">
                {block.settings.sub_title && (
                  <p className="spotlight-item__subtitle" style={{
                    color: block.settings.color_sub_title || '#232323',
                    fontSize: `${block.settings.fontsize_sub_title || 19}px`,
                    fontWeight: block.settings.font_weight_sub_title || '500',
                    marginBottom: `${block.settings.mg_bottom_sub_title || 10}px`
                  }}>
                    {block.settings.sub_title}
                  </p>
                )}
                {block.settings.title && (
                  <h3 className="spotlight-item__title" style={{
                    color: block.settings.color_title || '#232323',
                    fontSize: `${block.settings.fontsize_title || 20}px`,
                    fontWeight: block.settings.font_weight_title || '500'
                  }}>
                    {block.settings.title}
                  </h3>
                )}
                {block.settings.des && (
                  <p className="spotlight-item__description" style={{
                    color: block.settings.color_des || '#3c3c3c',
                    fontSize: `${block.settings.fontsize_des || 14}px`,
                    marginTop: `${block.settings.mg_top_des || 8}px`
                  }}>
                    {block.settings.des}
                  </p>
                )}
                {block.settings.button && (
                  <a 
                    href={block.settings.link || '#'} 
                    className="spotlight-item__button"
                    style={{
                      display: 'inline-block',
                      marginTop: `${block.settings.mg_top_btn || 30}px`,
                      padding: '12px 24px',
                      color: block.settings.color_button || '#ffffff',
                      backgroundColor: block.settings.bg_color_button || '#232323',
                      border: `1px solid ${block.settings.border_color_button || '#232323'}`,
                      fontSize: `${block.settings.fontsize_btn || 16}px`,
                      textTransform: block.settings.btn_text_transform || 'uppercase',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {block.settings.button}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ProductBlock Component
export function ProductBlock({ blocks = [], ...props }) {
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Check if specific product IDs are provided
        if (props.product_block_ids && props.product_block_ids.length > 0) {
          const ids = props.product_block_ids.join(',');
          const response = await fetch(`/api/products?ids=${ids}`);
          const data = await response.json();
          setProducts(data.products || []);
        } else {
          // Fall back to collection-based fetching
          const collection = props.product_block_collection || 'shop-all';
          const limit = props.product_block_limit || 8;
          const response = await fetch(`/api/products?collection=${collection}&limit=${limit}`);
          const data = await response.json();
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [props.product_block_collection, props.product_block_limit, props.product_block_ids]);
  
  const title = props.product_block_title || props.heading;
  
  return (
    <div className="product-block" style={{
      backgroundColor: props.product_bg || '#ffffff',
      paddingTop: `${props.mg_top_desktop || 50}px`,
      paddingBottom: `${props.mg_bottom_desktop || 50}px`
    }}>
      <div className="product-block__inner" style={{
        maxWidth: props.container === 'container' ? '1200px' : '100%',
        margin: '0 auto',
        padding: '0 20px'
      }}>
        {title && (
          <h2 className="product-block__heading" style={{
            textAlign: props.title_align || 'center',
            color: props.color_title || '#232323',
            fontSize: `${props.fontsize_title || 30}px`,
            marginBottom: `${props.mg_bottom_title || 12}px`
          }}>
            {title}
          </h2>
        )}
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading products...</div>
        ) : products.length > 0 ? (
          <div className="product-block__grid" style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${props.product_block_per_row || 4}, 1fr)`,
            gap: `${props.grid_gap || 30}px`
          }}>
            {products.map((product) => (
              <div key={product._id || product.productId} className="product-card" style={{
                backgroundColor: props.bg_card || '#ffffff',
                borderRadius: `${props.border_radius_card || 5}px`,
                padding: `${props.padding_card || 0}px`,
                border: props.border_layout_card ? `${props.border_width_card || 3}px solid ${props.border_color_card || '#f0f1f4'}` : 'none'
              }}>
                {product.images && product.images[0] && (
                  <div className="product-card__image">
                    <img src={product.images[0].src} alt={product.title} />
                  </div>
                )}
                <div className="product-card__info">
                  {product.vendor && (
                    <p className="product-card__vendor" style={{
                      color: props.product_vendor_color || '#010101',
                      fontSize: '0.85rem',
                      marginBottom: '0.5rem'
                    }}>
                      {product.vendor}
                    </p>
                  )}
                  <h3 className="product-card__title" style={{
                    color: props.product_title_color || '#505050'
                  }}>
                    {product.title}
                  </h3>
                  {product.variants && product.variants[0] && (
                    <div className="product-card__price" style={{
                      color: props.product_price_color || '#010101'
                    }}>
                      {product.variants[0].compare_at_price && (
                        <span className="price-compare" style={{
                          textDecoration: 'line-through',
                          color: props.product_price_compare_color || '#808080',
                          marginRight: '0.5rem'
                        }}>
                          ${product.variants[0].compare_at_price}
                        </span>
                      )}
                      <span className="price-current" style={{
                        color: product.variants[0].compare_at_price ? (props.product_price_sale_color || '#d12442') : (props.product_price_color || '#010101'),
                        fontWeight: 'bold'
                      }}>
                        ${product.variants[0].price}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No products found in collection "{props.product_block_collection}"
          </div>
        )}
      </div>
    </div>
  );
}

// ProductTabBlock Component
export function ProductTabBlock({ blocks = [], ...props }) {
  const [activeTab, setActiveTab] = React.useState(0);

  return (
    <div className="product-tab-block">
      <div className="product-tab-block__inner">
        {props.heading && <h2 className="product-tab-block__heading">{props.heading}</h2>}
        <div className="product-tab-block__tabs">
          {blocks.map((block, index) => (
            <button
              key={block.id}
              className={`tab ${index === activeTab ? 'active' : ''}`}
              onClick={() => setActiveTab(index)}
            >
              {block.settings.tab_title || `Tab ${index + 1}`}
            </button>
          ))}
        </div>
        <div className="product-tab-block__content">
          {blocks[activeTab] && (
            <div className="tab-content">
              {blocks[activeTab].settings.content && (
                <div dangerouslySetInnerHTML={{ __html: blocks[activeTab].settings.content }} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// StickyScrollingBanner Component
export function StickyScrollingBanner({ blocks = [], ...props }) {
  return (
    <div className="sticky-scrolling-banner">
      <div className="sticky-scrolling-banner__content">
        {props.heading && <h2>{props.heading}</h2>}
        {props.text && <p>{props.text}</p>}
        {blocks.map((block) => (
          <div key={block.id} className="sticky-banner-item">
            {block.settings.image && <img src={block.settings.image} alt="" />}
            {block.settings.text && <p>{block.settings.text}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// VideoBlock Component
export function VideoBlock({ blocks = [], ...props }) {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);
  
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Helper to convert video URL to embed format
  const getEmbedUrl = (url) => {
    if (!url || url === '') return null;
    
    // YouTube URL conversion
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=${props.autoplay ? 1 : 0}&mute=${props.video_sound ? 0 : 1}` : url;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=${props.autoplay ? 1 : 0}&mute=${props.video_sound ? 0 : 1}` : url;
    }
    
    // Vimeo URL conversion
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=${props.autoplay ? 1 : 0}&muted=${props.video_sound ? 0 : 1}` : url;
    }
    
    return url;
  };

  const videoUrl = isMobile ? (props.video_url_mb || props.video_url) : props.video_url;
  const embedUrl = getEmbedUrl(videoUrl);
  const title = props.video_block_title || props.heading;
  const description = props.video_block_des || props.description;
  
  // Calculate padding for aspect ratio
  const videoHeight = isMobile ? (props.video_height_mb || 100) : (props.video_height || 54);
  
  return (
    <div className="video-block" style={{
      backgroundColor: props.spotlight_bg || '#ffffff',
      paddingTop: `${props.mg_top_desktop || 0}px`,
      paddingBottom: `${props.mg_bottom_desktop || 0}px`
    }}>
      <div className="video-block__inner" style={{
        maxWidth: props.container === 'container' ? '1200px' : '100%',
        margin: '0 auto',
        padding: props.full_width ? '0' : '0 20px'
      }}>
        {title && (
          <h2 className="video-block__heading" style={{
            textAlign: props.title_align || 'center',
            color: props.color_title || '#232323',
            fontSize: `${isMobile ? props.fontsize_title_mb : props.fontsize_title}px`,
            marginBottom: `${props.margin_bottom_title || 27}px`
          }}>
            {title}
          </h2>
        )}
        {description && (
          <p className="video-block__description" style={{
            textAlign: props.title_align || 'center',
            color: props.color_des || '#3c3c3c',
            fontSize: `${props.fontsize_des || 16}px`,
            marginBottom: '2rem'
          }}>
            {description}
          </p>
        )}
        {embedUrl ? (
          <div className="video-block__video" style={{
            paddingBottom: `${videoHeight}%`,
            position: 'relative',
            height: 0,
            overflow: 'hidden',
            borderRadius: '8px'
          }}>
            {embedUrl.endsWith('.mp4') || embedUrl.endsWith('.webm') ? (
              <video 
                controls 
                autoPlay={props.autoplay}
                muted={!props.video_sound}
                loop
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%'
                }}
              >
                <source src={embedUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <iframe 
                src={embedUrl} 
                title={title || "Video"}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%'
                }}
              />
            )}
          </div>
        ) : (
          <div style={{
            padding: '3rem 1rem',
            textAlign: 'center',
            background: '#f5f5f5',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎥</div>
            <p style={{ color: '#666', margin: 0 }}>Video section (no video configured)</p>
          </div>
        )}
        {props.text && (
          <div className="video-block__content" style={{
            textAlign: props.align || 'center',
            maxWidth: `${props.content_width || 2000}px`,
            margin: '2rem auto 0',
            color: props.color_des_content || '#232323',
            fontSize: `${isMobile ? props.font_size_des_mb : props.font_size_des}px`
          }}>
            {props.text}
          </div>
        )}
        {props.btn_text && (
          <div style={{ textAlign: props.align || 'center', marginTop: '2rem' }}>
            <a 
              href={props.link || '#'} 
              className="button"
              style={{
                minWidth: `${props.button_width || 235}px`,
                color: props.button_color || '#ffffff',
                backgroundColor: props.button_background || '#232323',
                border: `1px solid ${props.button_border || '#232323'}`,
                display: 'inline-block',
                padding: '12px 24px',
                textDecoration: 'none',
                borderRadius: '4px'
              }}
            >
              {props.btn_text}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// CustomServiceBlock Component
export function CustomServiceBlock({ blocks = [], ...props }) {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);
  
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const title = props.service_block_title || props.heading;
  const description = props.service_block_des;
  
  return (
    <div className="custom-service-block" style={{
      backgroundColor: props.policies_bg || '#ffffff',
      paddingTop: `${props.mg_top_desktop || 50}px`,
      paddingBottom: `${props.mg_bottom_desktop || 50}px`,
      borderTop: props.display_border_top ? `1px solid ${props.border_color || '#d0d0d0'}` : 'none',
      borderBottom: props.display_border_bottom ? `1px solid ${props.border_color || '#d0d0d0'}` : 'none'
    }}>
      <div className="custom-service-block__inner" style={{
        maxWidth: props.container === 'container' ? '1200px' : '100%',
        margin: '0 auto',
        padding: '0 20px'
      }}>
        {title && (
          <h2 className="custom-service-block__heading" style={{
            textAlign: props.title_align || 'center',
            color: props.color_title || '#000000',
            fontSize: `${isMobile ? props.fontsize_title_mb : props.fontsize_title}px`,
            marginBottom: `${isMobile ? props.mg_bottom_title_service_block_mb : props.mg_bottom_title_service_block}px`
          }}>
            {title}
          </h2>
        )}
        {description && (
          <p className="custom-service-block__description" style={{
            textAlign: props.title_align || 'center',
            color: props.color_des || '#000000',
            fontSize: `${props.fontsize_des || 16}px`,
            marginTop: `${props.mg_top_service_block_des || 50}px`,
            marginBottom: `${props.mg_bottom_service_block_des || 50}px`
          }}>
            {description}
          </p>
        )}
        <div className="custom-service-block__items" style={{
          display: 'grid',
          gridTemplateColumns: props.item_width === 'full_width' 
            ? `repeat(auto-fit, minmax(250px, 1fr))` 
            : `repeat(${blocks.length}, 1fr)`,
          gap: `${props.grid_gap || 30}px`
        }}>
          {blocks.map((block) => (
            <div 
              key={block.id} 
              className="service-item"
              style={{
                textAlign: block.settings.item_align || props.item_align || 'center',
                padding: `${props.item_padding_top || 13}px ${props.item_padding_left_right || 40}px ${props.item_padding_bottom || 13}px`,
                backgroundColor: block.settings.bg_color_block || '#ffffff',
                border: props.border_item !== 'none' ? `1px solid ${block.settings.border_block || '#ffffff'}` : 'none',
                borderRadius: `${props.item_radius || 4}px`
              }}
            >
              {block.settings.icon && block.settings.icon_type === 'text' && (
                <div 
                  className="service-item__icon"
                  style={{
                    width: `${block.settings.width_icon || 64}px`,
                    height: `${block.settings.height_icon || 64}px`,
                    marginBottom: `${block.settings.mg_bottom_icon || 45}px`,
                    margin: '0 auto',
                    color: block.settings.color_icon || '#000000'
                  }}
                  dangerouslySetInnerHTML={{ __html: block.settings.icon }}
                />
              )}
              {block.settings.text && (
                <h3 style={{
                  color: block.settings.color_block || '#000000',
                  fontSize: `${isMobile ? block.settings.fontsize_title_block_mb : block.settings.fontsize_title_block}px`,
                  fontWeight: block.settings.title_block_font_weight || '700',
                  marginBottom: `${isMobile ? block.settings.mg_bottom_title_mb : block.settings.mg_bottom_title}px`
                }}>
                  {block.settings.text}
                </h3>
              )}
              {block.settings.description && (
                <p style={{
                  color: block.settings.color_des_block || '#3c3c3c',
                  fontSize: `${isMobile ? block.settings.fontsize_des_block_mb : block.settings.fontsize_des_block}px`,
                  lineHeight: `${block.settings.lineheight_des_block || 22}px`,
                  marginBottom: `${block.settings.mg_bottom_des || 0}px`
                }}>
                  {block.settings.description}
                </p>
              )}
              {block.settings.button && (
                <a 
                  href={block.settings.link || '#'} 
                  className="service-item__button"
                  style={{
                    display: 'inline-block',
                    marginTop: '1rem',
                    color: block.settings.color_button || '#ba7a2d',
                    fontSize: `${block.settings.fontsize_button || 14}px`,
                    fontWeight: block.settings.fontweight_button || '500',
                    textDecoration: block.settings.enable_underline_button ? 'underline' : 'none'
                  }}
                >
                  {block.settings.button}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Instagram Component
export function Instagram({ blocks = [], ...props }) {
  return (
    <div className="instagram-block">
      <div className="instagram-block__inner">
        {props.heading && <h2 className="instagram-block__heading">{props.heading}</h2>}
        <div className="instagram-block__grid">
          {blocks.map((block) => (
            <div key={block.id} className="instagram-item">
              {block.settings.image && (
                <a href={block.settings.link || '#'} target="_blank" rel="noopener noreferrer">
                  <img src={block.settings.image} alt="" />
                </a>
              )}
            </div>
          ))}
        </div>
        {props.instagram_handle && (
          <a
            href={`https://instagram.com/${props.instagram_handle}`}
            className="instagram-block__follow button"
            target="_blank"
            rel="noopener noreferrer"
          >
            Follow @{props.instagram_handle}
          </a>
        )}
      </div>
    </div>
  );
}
