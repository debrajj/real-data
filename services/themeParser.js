/**
 * Parse Shopify theme settings_data.json into custom component format
 */
class ThemeParser {
  constructor() {
    this.componentMap = {
      'header': 'Header',
      'announcement-bar': 'AnnouncementBar',
      'slideshow': 'Banner',
      'image-banner': 'Banner',
      'featured-collection': 'FeaturedCollection',
      'featured-product': 'FeaturedProduct',
      'collection-list': 'CollectionList',
      'multicolumn': 'MultiColumn',
      'rich-text': 'RichText',
      'footer': 'Footer',
      'image-with-text': 'ImageWithText',
      'video': 'Video',
      'newsletter': 'Newsletter',
    };
  }

  parse(settingsData) {
    try {
      const components = [];
      const sections = settingsData.current?.sections || {};
      const sectionOrder = settingsData.current?.order || [];

      // Parse sections in order
      for (const sectionId of sectionOrder) {
        const section = sections[sectionId];
        if (!section) continue;

        const component = this.parseSection(sectionId, section);
        if (component) {
          components.push(component);
        }
      }

      // Parse sections not in order
      for (const [sectionId, section] of Object.entries(sections)) {
        if (!sectionOrder.includes(sectionId)) {
          const component = this.parseSection(sectionId, section);
          if (component) {
            components.push(component);
          }
        }
      }

      return {
        components,
        theme: {
          colors: this.extractColors(settingsData),
          typography: this.extractTypography(settingsData),
          colorSchemes: settingsData.current?.color_schemes || {},
          settings: this.extractSettings(settingsData),
        },
      };
    } catch (error) {
      console.error('❌ Theme parsing error:', error);
      throw error;
    }
  }

  parseSection(sectionId, section) {
    const sectionType = section.type;
    const componentName = this.componentMap[sectionType] || this.toPascalCase(sectionType);

    const component = {
      id: sectionId,
      component: componentName,
      type: sectionType,
      props: {
        ...section.settings,
        disabled: section.disabled || false,
      },
      blocks: [],
    };

    // Parse blocks
    if (section.blocks) {
      const blockOrder = section.block_order || [];
      
      for (const blockId of blockOrder) {
        const block = section.blocks[blockId];
        if (block) {
          component.blocks.push({
            id: blockId,
            type: block.type,
            settings: block.settings || {},
            disabled: block.disabled || false,
          });
        }
      }
    }

    return component;
  }

  extractColors(settingsData) {
    const current = settingsData.current || {};
    const colors = {};

    // Extract color-related settings from root level
    for (const [key, value] of Object.entries(current)) {
      if ((key.includes('color') || key.includes('background')) && 
          key !== 'color_schemes' && 
          typeof value === 'string') {
        colors[key] = value;
      }
    }

    return colors;
  }

  extractTypography(settingsData) {
    const current = settingsData.current || {};
    const typography = {};

    // Extract font-related settings from root level
    for (const [key, value] of Object.entries(current)) {
      if ((key.includes('font') || key.includes('type_') || key.includes('heading') || key.includes('body_scale')) && 
          typeof value !== 'object') {
        typography[key] = value;
      }
    }

    return typography;
  }

  extractSettings(settingsData) {
    const current = settingsData.current || {};
    const settings = {};

    // Extract all non-section, non-order settings
    const excludeKeys = ['sections', 'order', 'content_for_index', 'color_schemes'];
    
    for (const [key, value] of Object.entries(current)) {
      if (!excludeKeys.includes(key) && typeof value !== 'object') {
        settings[key] = value;
      }
    }

    return settings;
  }

  toPascalCase(str) {
    return str
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }
}

module.exports = ThemeParser;
