// rope-bead.js
// Bead particle riding on the cord.

class RopeBead {
  constructor(options) {
    this.position = { x: options.position.x, y: options.position.y };
    this.previousPosition = { x: options.previousPosition.x, y: options.previousPosition.y };
    this.arc = options.arc ?? 0;
    this.restOffset = options.restOffset ?? 0;
    this.spacingRadius = options.spacingRadius ?? 10;
    this.size = { width: options.size?.width ?? 20, height: options.size?.height ?? 20 };
    this.mass = options.mass ?? 0.5;
    this.angle = options.angle ?? (Math.PI / 2);
  }

  get displacement() {
    return {
      x: this.position.x - this.previousPosition.x,
      y: this.position.y - this.previousPosition.y
    };
  }

  get slideLimit() {
    return this.spacingRadius * 0.6;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RopeBead };
}
