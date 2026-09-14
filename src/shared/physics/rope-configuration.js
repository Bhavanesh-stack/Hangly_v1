// rope-configuration.js
// Tunable physical constants for the rope solver.

class RopeConfiguration {
  constructor(options = {}) {
    this.segmentCount = options.segmentCount ?? 20;
    this.segmentLength = options.segmentLength ?? 11;
    this.gravity = options.gravity ?? 2000;
    this.damping = options.damping ?? 0.999;
    this.constraintIterations = options.constraintIterations ?? 256;
    this.stretchPasses = options.stretchPasses ?? 256;
    this.convergenceTolerance = options.convergenceTolerance ?? 0.05;
    this.maxStretchRatio = options.maxStretchRatio ?? 1.02;
    this.fixedTimeStep = options.fixedTimeStep ?? (1.0 / 240.0);
    this.maxFrameDuration = options.maxFrameDuration ?? 0.1;
    this.maximumSpeed = options.maximumSpeed ?? 6000;
    this.maximumReachRatio = options.maximumReachRatio ?? 0.98;
    this.restSpeed = options.restSpeed ?? 4.0;
    this.framesBeforeSleep = options.framesBeforeSleep ?? 60;
    this.initialAngle = options.initialAngle ?? 0.38;
  }

  get pointCount() {
    return this.segmentCount + 1;
  }

  get totalLength() {
    return this.segmentCount * this.segmentLength;
  }

  static get default() {
    return new RopeConfiguration();
  }

  static fitted(canvasSize) {
    const config = new RopeConfiguration();
    const usableLength = Math.max(40, canvasSize.height * RopeLayout.lengthFraction);
    config.segmentLength = usableLength / config.segmentCount;
    return config;
  }
}

const RopeLayout = {
  lengthFraction: 0.69,
  anchorFraction: 0.045,
  grabPadding: 12.0,
  anchor(size) {
    return {
      x: size.width / 2,
      y: size.height * this.anchorFraction
    };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RopeConfiguration, RopeLayout };
}
