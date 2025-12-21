import { Region } from './model';

/**
 * Parses region settings.
 * @param {string} input - The settings string (e.g. "id:fred width:50%")
 * @returns {Region}
 */
export function parseRegionSettings(input: string): Region {
  const region = new Region();
  const settings = input.split(/\s+/);
  
  for (const setting of settings) {
    if (!setting.includes(':')) continue;
    
    const colonIndex = setting.indexOf(':');
    if (colonIndex === 0 || colonIndex === setting.length - 1) continue;
    
    const name = setting.slice(0, colonIndex);
    const value = setting.slice(colonIndex + 1);
    
    switch (name) {
      case 'id':
        region.id = value;
        break;
        
      case 'width':
        if (value.endsWith('%')) {
          const num = parseFloat(value);
          if (!isNaN(num) && num >= 0 && num <= 100) {
            region.width = num;
          }
        }
        break;
        
      case 'lines':
        if (/^\d+$/.test(value)) {
          region.lines = parseInt(value, 10);
        }
        break;
        
      case 'regionanchor':
      case 'viewportanchor':
        if (value.includes(',')) {
            const [xStr, yStr] = value.split(',');
            if (xStr.endsWith('%') && yStr.endsWith('%')) {
                const x = parseFloat(xStr);
                const y = parseFloat(yStr);
                if (!isNaN(x) && !isNaN(y)) {
                    if (name === 'regionanchor') {
                        region.regionAnchorX = x;
                        region.regionAnchorY = y;
                    } else {
                        region.viewportAnchorX = x;
                        region.viewportAnchorY = y;
                    }
                }
            }
        }
        break;
        
      case 'scroll':
        if (value === 'up') {
          region.scroll = 'up';
        }
        break;
    }
  }
  
  return region;
}
