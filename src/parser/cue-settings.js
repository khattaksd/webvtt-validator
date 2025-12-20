/**
 * Parses cue settings and updates the cue object.
 * @param {string} input - The settings string
 * @param {import('./model.js').Cue} cue
 * @param {import('./model.js').Region[]} regions - List of known regions for lookup
 */
export function parseCueSettings(input, cue, regions) {
    const settings = input.split(/\s+/);
  
    for (const setting of settings) {
      if (!setting.includes(':')) continue;
      
      const colonIndex = setting.indexOf(':');
      if (colonIndex === 0 || colonIndex === setting.length - 1) continue;
      
      const name = setting.slice(0, colonIndex);
      const value = setting.slice(colonIndex + 1);
      
      switch (name) {
        case 'region':
          // Find last region with this ID
          // Spec: "Let cue’s WebVTT cue region be the last WebVTT region in regions whose WebVTT region identifier is value"
          // We assume regions are in order of appearance? Or passed in?
          // The parser accumulates regions.
          // We'll iterate backwards.
          {
              let found = null;
              for (let i = regions.length - 1; i >= 0; i--) {
                  if (regions[i].id === value) {
                      found = regions[i];
                      break;
                  }
              }
              // If found, we just store the region ID or reference? 
              // The cue model usually stores the region *relationship*.
              // For serialization/validation, maybe just keep the setting?
              // But the spec says "cue's WebVTT cue region".
              // Let's store the region ID for now if we can't link object directly cleanly in JSON output.
              // Actually model has `region`.
              if (found) {
                  cue.region = found;
              }
          }
          break;
          
        case 'vertical':
          if (value === 'rl' || value === 'lr') {
            cue.vertical = value;
            cue.region = null; // Spec side effect
          }
          break;
          
        case 'line':
          // value can be: number, number%, or number,align or number%,align
          {
              const parts = value.split(',');
              const lineVal = parts[0];
              const alignVal = parts[1]; // optional
              
              if (lineVal.endsWith('%')) {
                  const num = parseFloat(lineVal);
                  if (!isNaN(num)) {
                      cue.line = num; // Percentage
                      cue.snapToLines = false;
                  }
              } else {
                  const num = parseFloat(lineVal);
                  if (!isNaN(num)) {
                      cue.line = num;
                      cue.snapToLines = true;
                  }
              }
              
              if (alignVal) {
                  if (['start', 'center', 'end'].includes(alignVal)) {
                      cue.lineAlign = alignVal;
                  }
              }
              
              // If line is not auto, region becomes null
              cue.region = null;
          }
          break;
          
        case 'position':
            {
                const parts = value.split(',');
                const posVal = parts[0];
                const alignVal = parts[1];
                
                if (posVal.endsWith('%')) {
                    const num = parseFloat(posVal);
                    if (!isNaN(num)) {
                        cue.position = num;
                    }
                }
                
                if (alignVal) {
                    if (['line-left', 'center', 'line-right'].includes(alignVal)) {
                        cue.positionAlign = alignVal;
                    }
                }
            }
            break;
            
        case 'size':
            if (value.endsWith('%')) {
                const num = parseFloat(value);
                if (!isNaN(num)) {
                    cue.size = num;
                    if (num !== 100) {
                        cue.region = null;
                    }
                }
            }
            break;
            
        case 'align':
            if (['start', 'center', 'end', 'left', 'right'].includes(value)) {
                cue.align = value;
            }
            break;
      }
    }
  }
