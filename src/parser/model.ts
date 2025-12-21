/**
 * WebVTT Cue model
 */
export class Cue {
  id: string;
  startTime: number;
  endTime: number;
  pauseOnExit: boolean;
  vertical: "rl" | "lr" | null;
  snapToLines: boolean;
  line: number | "auto";
  lineAlign: "start" | "center" | "end" | null;
  position: number | "auto";
  positionAlign: "line-left" | "center" | "line-right" | "auto";
  size: number;
  align: "start" | "center" | "end" | "left" | "right";
  text: string;
  tree: any;
  region?: any;

  constructor() {
    this.id = '';
    this.startTime = 0;
    this.endTime = 0;
    this.pauseOnExit = false;
    this.vertical = null;
    this.snapToLines = true;
    this.line = 'auto';
    this.lineAlign = null;
    this.position = 'auto';
    this.positionAlign = 'auto';
    this.size = 100;
    this.align = 'center';
    this.text = '';
    this.tree = null;
  }
}

/**
 * WebVTT Region model
 */
export class Region {
  id: string;
  width: number;
  lines: number;
  regionAnchorX: number;
  regionAnchorY: number;
  viewportAnchorX: number;
  viewportAnchorY: number;
  scroll: "none" | "up";

  constructor() {
    this.id = '';
    this.width = 100;
    this.lines = 3;
    this.regionAnchorX = 0;
    this.regionAnchorY = 100;
    this.viewportAnchorX = 0;
    this.viewportAnchorY = 100;
    this.scroll = 'none';
  }
}

/**
 * WebVTT Stylesheet model
 */
export class Stylesheet {
  cssText: string;

  constructor(cssText: string = '') {
    this.cssText = cssText;
  }
}
