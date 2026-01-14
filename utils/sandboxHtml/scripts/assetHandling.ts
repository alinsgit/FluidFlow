/**
 * Asset Handling Script
 *
 * Provides mock/placeholder support for images, SVGs, and other assets
 * in the sandbox environment where actual file system access is limited.
 */

/**
 * Generate the asset handling script for the sandbox
 */
export function getAssetHandlingScript(): string {
  return `
    // ═══════════════════════════════════════════════════════════
    // ASSET HANDLING SYSTEM
    // Provides placeholders and mocks for images/assets
    // ═══════════════════════════════════════════════════════════

    (function() {
      // Placeholder image generators using data URLs (safe, no innerHTML)
      window.__SANDBOX_ASSETS__ = {
        // Generate a placeholder image URL as base64 SVG
        placeholder: function(width, height, text, bgColor, textColor) {
          width = width || 300;
          height = height || 200;
          text = text || width + 'x' + height;
          bgColor = bgColor || '#e2e8f0';
          textColor = textColor || '#64748b';

          // Create SVG placeholder as data URL
          var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '">' +
            '<rect width="100%" height="100%" fill="' + bgColor + '"/>' +
            '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" ' +
            'font-family="system-ui, -apple-system, sans-serif" ' +
            'font-size="' + Math.min(width, height) / 8 + 'px" ' +
            'fill="' + textColor + '">' + text + '</text></svg>';
          return 'data:image/svg+xml;base64,' + btoa(svg);
        },

        // Generate avatar placeholder
        avatar: function(name, size) {
          name = name || 'User';
          size = size || 100;
          var parts = name.split(' ');
          var initials = '';
          for (var i = 0; i < Math.min(parts.length, 2); i++) {
            if (parts[i] && parts[i][0]) initials += parts[i][0].toUpperCase();
          }
          var colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
          var bgColor = colors[name.length % colors.length];

          var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '">' +
            '<rect width="100%" height="100%" fill="' + bgColor + '" rx="' + size/2 + '"/>' +
            '<text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" ' +
            'font-family="system-ui, -apple-system, sans-serif" ' +
            'font-size="' + size * 0.4 + 'px" font-weight="600" fill="white">' + initials + '</text></svg>';
          return 'data:image/svg+xml;base64,' + btoa(svg);
        },

        // Generate product/item placeholder using picsum
        product: function(index) {
          index = index || 1;
          return 'https://picsum.photos/seed/' + index + '/400/400';
        },

        // Generate thumbnail
        thumbnail: function(index) {
          index = index || 1;
          return 'https://picsum.photos/seed/thumb' + index + '/150/150';
        },

        // Generate hero/banner image
        hero: function(index) {
          index = index || 1;
          return 'https://picsum.photos/seed/hero' + index + '/1920/600';
        },

        // Generate background image
        background: function(index) {
          index = index || 1;
          return 'https://picsum.photos/seed/bg' + index + '/1920/1080';
        },

        // Icon placeholder as data URL
        icon: function(name, size, color) {
          size = size || 24;
          color = color || 'currentColor';
          var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" ' +
            'viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2" ' +
            'stroke-linecap="round" stroke-linejoin="round">' +
            '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>' +
            '<circle cx="8.5" cy="8.5" r="1.5"/>' +
            '<polyline points="21 15 16 10 5 21"/></svg>';
          return 'data:image/svg+xml;base64,' + btoa(svg);
        },

        // Logo placeholder
        logo: function(text, width, height) {
          text = text || 'Logo';
          width = width || 150;
          height = height || 50;

          var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '">' +
            '<rect width="100%" height="100%" fill="#1e293b" rx="8"/>' +
            '<text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" ' +
            'font-family="system-ui, -apple-system, sans-serif" ' +
            'font-size="' + height * 0.4 + 'px" font-weight="700" fill="white">' + text + '</text></svg>';
          return 'data:image/svg+xml;base64,' + btoa(svg);
        }
      };

      // ─────────────────────────────────────────────────────────
      // IMAGE ERROR HANDLER
      // Replaces broken images with placeholders
      // ─────────────────────────────────────────────────────────

      document.addEventListener('error', function(e) {
        var target = e.target;
        if (target && target.tagName === 'IMG' && !target.dataset.placeholderApplied) {
          target.dataset.placeholderApplied = 'true';

          // Determine placeholder type based on class/context
          var classes = target.className || '';
          var src = target.src || '';
          var alt = target.alt || '';

          var placeholder;

          if (classes.indexOf('avatar') >= 0 || classes.indexOf('profile') >= 0 ||
              src.indexOf('avatar') >= 0 || src.indexOf('profile') >= 0) {
            placeholder = window.__SANDBOX_ASSETS__.avatar(alt || 'User', target.width || 100);
          } else if (classes.indexOf('logo') >= 0 || src.indexOf('logo') >= 0) {
            placeholder = window.__SANDBOX_ASSETS__.logo(alt || 'Logo', target.width || 150, target.height || 50);
          } else if (classes.indexOf('hero') >= 0 || classes.indexOf('banner') >= 0 ||
                     src.indexOf('hero') >= 0 || src.indexOf('banner') >= 0) {
            placeholder = window.__SANDBOX_ASSETS__.hero(1);
          } else if (classes.indexOf('thumb') >= 0 || classes.indexOf('thumbnail') >= 0) {
            placeholder = window.__SANDBOX_ASSETS__.thumbnail(1);
          } else {
            // Default placeholder with dimensions
            var w = target.width || target.naturalWidth || 300;
            var h = target.height || target.naturalHeight || 200;
            placeholder = window.__SANDBOX_ASSETS__.placeholder(w, h, alt || (w + 'x' + h));
          }

          target.src = placeholder;
        }
      }, true);

      // ─────────────────────────────────────────────────────────
      // SVG AS IMAGE SUPPORT
      // SVG imports return the URL for use in img src
      // ─────────────────────────────────────────────────────────

      // Default SVG placeholder component (uses img tag, safe)
      window.__SvgPlaceholder__ = function SvgPlaceholder(props) {
        var size = props.size || props.width || 24;
        return React.createElement('img', {
          src: window.__SANDBOX_ASSETS__.icon('placeholder', size, props.color || '#64748b'),
          width: size,
          height: props.height || size,
          alt: props.alt || 'icon',
          className: props.className,
          style: props.style
        });
      };

    })();
  `;
}

/**
 * Process image and SVG imports in files
 * Converts asset imports to placeholder URLs
 */
export function processAssetImports(files: Record<string, string>): Record<string, string> {
  const processedFiles: Record<string, string> = {};

  for (const [filename, content] of Object.entries(files)) {
    if (filename.endsWith('.svg')) {
      // Convert SVG file to a module that exports a data URL
      const svgContent = content
        .replace(/\r?\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Escape for JavaScript string
      const escapedSvg = svgContent
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'");

      processedFiles[filename] = `
        const svgDataUrl = 'data:image/svg+xml;base64,' + btoa('${escapedSvg}');
        export default svgDataUrl;
        export const ReactComponent = function SvgComponent(props) {
          return React.createElement('img', {
            src: svgDataUrl,
            alt: props.alt || '',
            width: props.width,
            height: props.height,
            className: props.className,
            style: props.style
          });
        };
      `;
    } else if (/\.(png|jpg|jpeg|gif|webp|ico)$/i.test(filename)) {
      // For image files, export a placeholder URL
      const basename = filename.split('/').pop()?.replace(/\.[^.]+$/, '') || 'image';

      // Generate a consistent placeholder based on filename
      const seed = basename.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

      processedFiles[filename] = `
        // Image placeholder for: ${filename}
        const imageUrl = 'https://picsum.photos/seed/${seed}/400/300';
        export default imageUrl;
      `;
    } else {
      processedFiles[filename] = content;
    }
  }

  return processedFiles;
}

/**
 * Get image placeholder URL based on context
 */
export function getImagePlaceholder(
  type: 'default' | 'avatar' | 'product' | 'hero' | 'logo' = 'default',
  options: { width?: number; height?: number; text?: string; index?: number } = {}
): string {
  const { width = 300, height = 200, text, index = 1 } = options;

  switch (type) {
    case 'avatar':
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${text || index}`;
    case 'product':
      return `https://picsum.photos/seed/${index}/400/400`;
    case 'hero':
      return `https://picsum.photos/seed/hero${index}/1920/600`;
    case 'logo':
      // Simple placeholder URL
      return `https://via.placeholder.com/${width}x${height}/1e293b/ffffff?text=${encodeURIComponent(text || 'Logo')}`;
    default:
      return `https://via.placeholder.com/${width}x${height}?text=${encodeURIComponent(text || `${width}x${height}`)}`;
  }
}
