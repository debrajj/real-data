import './UniversalRenderer.css';

/**
 * Universal Component Renderer
 * Renders Shopify sections using actual Dawn theme structure and classes
 */
function UniversalRenderer({ component, blocks = [], props = {} }) {
  const { type, id } = component;
  
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
            src={settings.image} 
            alt={settings.alt || ''} 
            className="block-image"
            style={{
              width: settings.width,
              borderRadius: settings.corner_radius,
            }}
          />
        ) : null;
        
      case 'video':
        return settings.video_url ? (
          <div className="video-wrapper">
            <iframe
              src={settings.video_url}
              title={settings.title || 'Video content'}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : null;
        
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
