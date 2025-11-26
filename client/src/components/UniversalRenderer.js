import './UniversalRenderer.css';

/**
 * Universal Component Renderer
 * Renders Shopify sections using actual Dawn theme structure and classes
 */
function UniversalRenderer({ component, blocks = [], props = {}, media = [] }) {
  const { type, id } = component;
  
  // Helper to convert Shopify URLs to local media URLs
  const getMediaUrl = (shopifyUrl) => {
    if (!shopifyUrl || !media || media.length === 0) return shopifyUrl;
    
    // Find matching media by original URL or CDN URL
    const mediaItem = media.find(m => 
      m.originalUrl === shopifyUrl || 
      m.cdnUrl === shopifyUrl
    );
    
    if (mediaItem) {
      const API_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001'
        : window.location.origin;
      return `${API_URL}${mediaItem.url}`;
    }
    
    return shopifyUrl;
  };
  
  // Render blocks (sub-components within a section)
  const renderBlocks = () => {
    if (!blocks || blocks.length === 0) return null;
    
    return blocks.map((block) => {
      if (block.disabled) return null;
      
      return (
        <div key={block.id} className={`block block-${block.type}`}>
          {renderBlockContent(block)}
        </div>
      );
    });
  };
  
  // Render individual block content
  const renderBlockContent = (block) => {
    const { type, settings } = block;
    
    switch (type) {
      case 'text':
      case 'heading':
        return (
          <div 
            className="text-block"
            dangerouslySetInnerHTML={{ __html: settings.text || settings.heading }}
            style={{
              fontSize: settings.font_size,
              color: settings.color,
              textAlign: settings.alignment,
              maxWidth: settings.max_width,
            }}
          />
        );
        
      case 'button':
        return (
          <a 
            href={settings.link} 
            className={`button ${settings.style_class || 'button-primary'}`}
            target={settings.open_in_new_tab ? '_blank' : '_self'}
            rel={settings.open_in_new_tab ? 'noopener noreferrer' : ''}
            style={{
              width: settings.width === 'full-width' ? '100%' : settings.width,
            }}
          >
            {settings.label}
          </a>
        );
        
      case 'image':
        return settings.image ? (
          <img 
            src={getMediaUrl(settings.image)} 
            alt={settings.alt || ''} 
            className="block-image"
            style={{
              width: settings.width,
              borderRadius: settings.corner_radius,
            }}
          />
        ) : null;
        
      case 'video': {
        const getEmbedUrl = (url) => {
          if (!url) return null;
          
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

        const videoUrl = settings.video_url || settings.video;
        const embedUrl = getEmbedUrl(videoUrl);
        
        return embedUrl ? (
          <div className="video-wrapper">
            {embedUrl.endsWith('.mp4') || embedUrl.endsWith('.webm') ? (
              <video controls loop={settings.enable_video_looping}>
                <source src={getMediaUrl(embedUrl)} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <iframe
                src={embedUrl}
                title={settings.title || 'Video content'}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        ) : null;
      }
        
      case 'row':
        return (
          <div className="multirow-row">
            {settings.image && (
              <div className="row-image">
                <img 
                  src={getMediaUrl(settings.image)} 
                  alt={settings.caption || ''} 
                />
              </div>
            )}
            <div className="row-content">
              {settings.caption && <p className="row-caption">{settings.caption}</p>}
              {settings.heading && <h3>{settings.heading}</h3>}
              {settings.text && <div dangerouslySetInnerHTML={{ __html: settings.text }} />}
              {settings.button_label && (
                <a href={settings.button_link} className="button">
                  {settings.button_label}
                </a>
              )}
            </div>
          </div>
        );
        
      default:
        return (
          <div className="block-default">
            <span className="block-type">{type}</span>
            {settings.text && <p>{settings.text}</p>}
            {settings.title && <h4>{settings.title}</h4>}
          </div>
        );
    }
  };
  
  // Get section styles from props
  const getSectionStyles = () => {
    return {
      paddingTop: props['padding-block-start'] || props.padding_top || 0,
      paddingBottom: props['padding-block-end'] || props.padding_bottom || 0,
      paddingLeft: props['padding-inline-start'] || 0,
      paddingRight: props['padding-inline-end'] || 0,
      backgroundColor: props.background_color,
      minHeight: props.section_height === 'small' ? '300px' : 
                 props.section_height === 'medium' ? '500px' :
                 props.section_height === 'large' ? '700px' : 'auto',
      gap: props.gap,
      display: 'flex',
      flexDirection: props.content_direction || 'column',
      alignItems: props.horizontal_alignment || 'center',
      justifyContent: props.vertical_alignment || 'center',
    };
  };
  
  return (
    <section 
      id={id}
      className={`universal-section section-${type} ${props.color_scheme || ''}`}
      style={getSectionStyles()}
    >
      <div className={`section-content ${props.section_width || 'page-width'}`}>
        {renderBlocks()}
      </div>
    </section>
  );
}

export default UniversalRenderer;
