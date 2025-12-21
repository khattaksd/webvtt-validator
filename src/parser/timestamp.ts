/**
 * Parses a WebVTT timestamp.
 * Format: MM:SS.mmm or HH:MM:SS.mmm
 * @param {string} input
 * @returns {number|null} Seconds (float) or null if invalid
 */
export function parseTimestamp(input: string): number | null {
  // Regex for strict WebVTT timestamp
  // Groups:
  // 1: Hours (optional)
  // 2: Minutes (must be 2 digits if hours present, otherwise 2 digits)
  // 3: Seconds (2 digits)
  // 4: Milliseconds (3 digits)
  
  // Actually, let's parse manually or use a strict regex.
  // Spec:
  // 1. Collect a sequence of characters that are ASCII digits. (Hours or Minutes)
  // ... It's complicated to do purely char-by-char here without a scanner reference, 
  // but usually timestamp parsing happens on a substring.
  
  // Let's use a regex that matches the spec grammar:
  // (?:(\d{2,}):)?(\d{2}):(\d{2})\.(\d{3})
  // Wait, Hours can be 1 or more digits.
  // Minutes must be 2 digits and < 60.
  // Seconds must be 2 digits and < 60.
  // Milliseconds 3 digits.
  
  const match = /^(\d+)?:?(\d{2}):(\d{2})\.(\d{3})$/.exec(input);
  
  if (!match) {
    return null;
  }
  
  const [_, p1, p2, p3, p4] = match;
  
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  let ms = 0;
  
  if (p1) {
    // HH:MM:SS.mmm format
    hours = parseInt(p1, 10);
    minutes = parseInt(p2, 10);
    seconds = parseInt(p3, 10);
    
    // Spec validation: minutes < 60, seconds < 60
    if (minutes > 59 || seconds > 59) return null;
  } else {
    // MM:SS.mmm format?
    // Wait, regex above expects 4 parts if p1 is present.
    // If input is MM:SS.mmm, match will fail if we force colon for p1.
    // Actually the regex above `^(\d+)?:?(\d{2}):(\d{2})\.(\d{3})$` is slightly ambiguous for MM:SS vs HH:MM:SS
    
    // Let's split by colon.
    const parts = input.split(':');
    
    if (parts.length === 2) {
        // MM:SS.mmm
        const [mm, ssmmm] = parts;
        if (!/^\d{2}$/.test(mm)) return null; // Minutes must be 2 chars in MM:SS form? Spec says: "most meaningful units... 2 digits"
        // Actually spec says: 
        // 4. Collect WebVTT timestamp:
        //    ...
        //    If mode is "minutes", let value be number ... > 59 is error? No, minutes can be > 59 in MM:SS form.
        
        minutes = parseInt(mm, 10);
        
        const ssParts = ssmmm.split('.');
        if (ssParts.length !== 2) return null;
        const [ss, mmm] = ssParts;
        
        if (!/^\d{2}$/.test(ss)) return null;
        if (!/^\d{3}$/.test(mmm)) return null;
        
        seconds = parseInt(ss, 10);
        ms = parseInt(mmm, 10);
        
        if (seconds > 59) return null;
        
    } else if (parts.length === 3) {
        // HH:MM:SS.mmm
        const [hh, mm, ssmmm] = parts;
        
        if (!/^\d{2,}$/.test(hh)) return null; // Hours at least 2 digits? Spec says "one or more". Wait.
        // Spec: "Collect a sequence of characters that are ASCII digits... If length < 2, set mode to hours"
        // Actually the grammar is:
        // timestamp -> (hours ":")? minutes ":" seconds "." milliseconds
        // hours -> 2 or more digits (actually just 1+ is parsed but usually 2)
        
        hours = parseInt(hh, 10);
        
        if (!/^\d{2}$/.test(mm)) return null;
        minutes = parseInt(mm, 10);
        if (minutes > 59) return null;
        
        const ssParts = ssmmm.split('.');
        if (ssParts.length !== 2) return null;
        const [ss, mmm] = ssParts;
        
        if (!/^\d{2}$/.test(ss)) return null;
        if (!/^\d{3}$/.test(mmm)) return null;
        
        seconds = parseInt(ss, 10);
        ms = parseInt(mmm, 10);
        
        if (seconds > 59) return null;
    } else {
        return null;
    }
  }
  
  return (hours * 3600) + (minutes * 60) + seconds + (ms / 1000);
}
