import { Region } from './model.ts';
import { createDiagnostic, DiagnosticCode, DiagnosticSeverity, type Diagnostic } from './diagnostics.ts';

/**
 * Parses region settings.
 * @param {string} input - The settings string (e.g. "id:fred width:50%")
 * @returns {{ region: Region; diagnostics: Diagnostic[] }}
 */
export function parseRegionSettings(input: string): { region: Region; diagnostics: Diagnostic[] } {
  const region = new Region();
  const diagnostics: Diagnostic[] = [];
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
          } else {
            diagnostics.push(createDiagnostic(
              DiagnosticSeverity.Error,
              DiagnosticCode.BLOCK_UNEXPECTED,
              'Invalid REGION width setting',
              0,
              0,
              setting
            ));
          }
        } else {
          diagnostics.push(createDiagnostic(
            DiagnosticSeverity.Error,
            DiagnosticCode.BLOCK_UNEXPECTED,
            'Invalid REGION width setting',
            0,
            0,
            setting
          ));
        }
        break;
        
      case 'lines':
        if (/^\d+$/.test(value)) {
          region.lines = parseInt(value, 10);
        } else {
          diagnostics.push(createDiagnostic(
            DiagnosticSeverity.Error,
            DiagnosticCode.BLOCK_UNEXPECTED,
            'Invalid REGION lines setting',
            0,
            0,
            setting
          ));
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
                    if (x < 0 || x > 100 || y < 0 || y > 100) {
                      diagnostics.push(createDiagnostic(
                        DiagnosticSeverity.Error,
                        DiagnosticCode.BLOCK_UNEXPECTED,
                        'Invalid REGION anchor setting',
                        0,
                        0,
                        setting
                      ));
                      break;
                    }
                    if (name === 'regionanchor') {
                        region.regionAnchorX = x;
                        region.regionAnchorY = y;
                    } else {
                        region.viewportAnchorX = x;
                        region.viewportAnchorY = y;
                    }
                } else {
                    diagnostics.push(createDiagnostic(
                      DiagnosticSeverity.Error,
                      DiagnosticCode.BLOCK_UNEXPECTED,
                      'Invalid REGION anchor setting',
                      0,
                      0,
                      setting
                    ));
                }
            }
            else {
              diagnostics.push(createDiagnostic(
                DiagnosticSeverity.Error,
                DiagnosticCode.BLOCK_UNEXPECTED,
                'Invalid REGION anchor setting',
                0,
                0,
                setting
              ));
            }
        }
        else {
          diagnostics.push(createDiagnostic(
            DiagnosticSeverity.Error,
            DiagnosticCode.BLOCK_UNEXPECTED,
            'Invalid REGION anchor setting',
            0,
            0,
            setting
          ));
        }
        break;
        
      case 'scroll':
        if (value === 'up') {
          region.scroll = 'up';
        } else {
          diagnostics.push(createDiagnostic(
            DiagnosticSeverity.Error,
            DiagnosticCode.BLOCK_UNEXPECTED,
            'Invalid REGION scroll setting',
            0,
            0,
            setting
          ));
        }
        break;

      default:
        diagnostics.push(createDiagnostic(
          DiagnosticSeverity.Error,
          DiagnosticCode.BLOCK_UNEXPECTED,
          'Unknown REGION setting',
          0,
          0,
          setting
        ));
        break;
    }
  }
  
  return { region, diagnostics };
}
