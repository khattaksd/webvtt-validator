/**
 * WebVTT Cue model
 */
export class Cue {
  constructor() {
    this.id = '';
    this.startTime = 0;
    this.endTime = 0;
    this.pauseOnExit = false;
    this.vertical = null; // "rl" | "lr" | null
    this.snapToLines = true;
    this.line = 'auto'; // number | "auto"
    this.lineAlign = null; // "start" | "center" | "end" | null
    this.position = 'auto'; // number | "auto"
    this.positionAlign = 'auto'; // "line-left" | "center" | "line-right" | "auto"
    this.size = 100;
    this.align = 'center'; // "start" | "center" | "end" | "left" | "right"
    this.text = '';
    this.tree = null; // Parsed node tree
  }
}

/**
 * WebVTT Region model
 */
export class Region {
  constructor() {
    this.id = '';
    this.width = 100;
    this.lines = 3;
    this.regionAnchorX = 0;
    this.regionAnchorY = 100;
    this.viewportAnchorX = 0;
    this.viewportAnchorY = 100;
    this.scroll = 'none'; // "none" | "up"
  }
}

/**
 * WebVTT Stylesheet model
 */
export class Stylesheet {
  constructor(cssText = '') {
    this.cssText = cssText;
    // Future: parsed rules
  }
}
