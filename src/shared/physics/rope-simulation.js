// rope-simulation.js
// Verlet rope with distance-constraint relaxation and bead dynamics.

const { Vec2, RopePoint } = require('./rope-point');
const { RopeConfiguration, RopeLayout } = require('./rope-configuration');
const { RopeCurve } = require('./rope-curve');
const { RopeBead } = require('./rope-bead');

class RopeSimulation {
  constructor(options = {}) {
    this.configuration = options.configuration || RopeConfiguration.default;
    this.anchor = options.anchor || { x: 0, y: 0 };
    this.charmMetrics = options.charmMetrics || { mass: 2.6, radiusRatio: 0.126, knotInset: 0.90 };

    this.points = [];
    this.beads = [];
    this.beadDescriptions = [];
    this.curve = new RopeCurve();

    this.cordEnd = { x: 0, y: 0 };
    this.cordLength = 0;
    this.charmOrientation = Math.PI / 2;

    this.isRunning = false;
    this.isSleeping = false;
    this.stillFrames = 0;
    this.accumulator = 0;

    this.dragIndex = null;
    this.dragTarget = { x: 0, y: 0 };
    this.dragVelocity = { x: 0, y: 0 };

    this.reset();
  }

  get isDragging() {
    return this.dragIndex !== null;
  }

  get charmRadius() {
    return this.configuration.totalLength * this.charmMetrics.radiusRatio;
  }

  get charmCenter() {
    return this.points.length > 0 ? this.points[this.points.length - 1].position : { ...this.anchor };
  }

  get charmAngle() {
    return this.charmOrientation;
  }

  get knotDistance() {
    return this.charmRadius * this.charmMetrics.knotInset;
  }

  setCharmMetrics(metrics) {
    this.charmMetrics = { ...this.charmMetrics, ...metrics };
    this.rebuildBeads(true);
    this.wake();
  }

  setBeads(descriptions) {
    this.beadDescriptions = descriptions || [];
    this.rebuildBeads(false);
    this.wake();
  }

  start() {
    if (this.isRunning) return;
    if (this.points.length === 0) this.reset();
    this.accumulator = 0;
    this.isRunning = true;
    this.wake();
  }

  stop() {
    this.isRunning = false;
    this.accumulator = 0;
  }

  wake() {
    this.isSleeping = false;
    this.stillFrames = 0;
  }

  reset(angle = this.configuration.initialAngle) {
    this.points = RopePoint.chain(this.configuration, this.anchor, this.charmMetrics, angle);
    this.accumulator = 0;
    this.dragIndex = null;
    this.dragVelocity = { x: 0, y: 0 };
    this.rebuildBeads(false);
    this.wake();
  }

  resize(canvasSize) {
    const fitted = RopeConfiguration.fitted(canvasSize);
    const needsRebuild = this.points.length !== fitted.pointCount;

    this.configuration = fitted;
    this.anchor = RopeLayout.anchor(canvasSize);

    if (needsRebuild) {
      this.reset();
    } else {
      this.rebuildBeads(true);
      this.wake();
    }
  }

  step(deltaTime) {
    if (!this.isRunning || deltaTime <= 0 || this.isSleeping) return;

    this.accumulator = Math.min(this.accumulator + deltaTime, this.configuration.maxFrameDuration);
    const timeStep = this.configuration.fixedTimeStep;

    while (this.accumulator >= timeStep) {
      this.advance(timeStep);
      this.accumulator -= timeStep;
    }
    this.updateSleepState();
  }

  advance(timeStep) {
    this.enforceAnchor();
    this.integrate(timeStep);
    this.driveDraggedPoint(timeStep);

    let relaxations = 0;
    let residual = Infinity;
    while (relaxations < this.configuration.constraintIterations &&
           residual >= this.configuration.convergenceTolerance) {
      residual = this.solveDistanceConstraints();
      relaxations++;
    }

    this.enforceMaximumStretch();
    this.refreshCord();
    this.advanceBeads(timeStep);

    // Safety: ensure chain does not get inverted or stuck above anchor
    if (!this.isDragging && this.points.length > 1) {
      const last = this.points[this.points.length - 1];
      if (last.position.y < this.anchor.y + 10) {
        this.reset();
      }
    }
  }

  enforceAnchor() {
    if (this.points.length === 0) return;
    this.points[0].position = { x: this.anchor.x, y: this.anchor.y };
    this.points[0].previousPosition = { x: this.anchor.x, y: this.anchor.y };
  }

  integrate(timeStep) {
    const gravityStep = { x: 0, y: this.configuration.gravity * timeStep * timeStep };
    const damping = this.configuration.damping;
    const displacementLimit = this.configuration.maximumSpeed * timeStep;

    for (let index = 0; index < this.points.length; index++) {
      if (index === this.dragIndex || this.points[index].inverseMass === 0) continue;

      const p = this.points[index];
      const disp = Vec2.limited(Vec2.mul(p.displacement, damping), displacementLimit);
      p.previousPosition = { x: p.position.x, y: p.position.y };
      p.position = Vec2.add(Vec2.add(p.position, disp), gravityStep);
    }
  }

  driveDraggedPoint(timeStep) {
    if (this.dragIndex === null) return;
    const current = this.points[this.dragIndex].position;
    const travelLimit = this.configuration.maximumSpeed * timeStep;
    const delta = Vec2.limited(Vec2.sub(this.dragTarget, current), travelLimit);
    this.points[this.dragIndex].position = Vec2.add(current, delta);
    this.points[this.dragIndex].setVelocity(this.dragVelocity, timeStep);
  }

  solveDistanceConstraints() {
    const restLength = this.configuration.segmentLength;
    let largestCorrection = 0.0;
    for (let index = 0; index < this.points.length - 1; index++) {
      const correction = this.solveLink(index, index + 1, restLength);
      largestCorrection = Math.max(largestCorrection, correction);
    }
    return largestCorrection;
  }

  solveLink(indexA, indexB, restLength) {
    const invA = this.effectiveInverseMass(indexA);
    const invB = this.effectiveInverseMass(indexB);
    const totalInv = invA + invB;
    if (totalInv <= 0) return 0;

    const delta = Vec2.sub(this.points[indexB].position, this.points[indexA].position);
    const dist = Vec2.magnitude(delta);
    if (dist <= 1e-12) return 0;

    const factor = (dist - restLength) / dist / totalInv;
    const correction = Vec2.mul(delta, factor);

    this.points[indexA].position = Vec2.add(this.points[indexA].position, Vec2.mul(correction, invA));
    this.points[indexB].position = Vec2.sub(this.points[indexB].position, Vec2.mul(correction, invB));

    return Math.max(Vec2.magnitude(Vec2.mul(correction, invA)), Vec2.magnitude(Vec2.mul(correction, invB)));
  }

  enforceMaximumStretch() {
    const limit = this.configuration.segmentLength * this.configuration.maxStretchRatio;

    for (let pass = 0; pass < this.configuration.stretchPasses; pass++) {
      let corrected = false;
      for (let index = 0; index < this.points.length - 1; index++) {
        if (this.clampLink(index, limit)) {
          corrected = true;
        }
      }
      if (!corrected) break;
    }
  }

  clampLink(index, limit) {
    const lower = index;
    const upper = index + 1;
    const invLower = this.effectiveInverseMass(lower);
    const invUpper = this.effectiveInverseMass(upper);
    const totalInv = invLower + invUpper;
    if (totalInv <= 0) return false;

    const delta = Vec2.sub(this.points[upper].position, this.points[lower].position);
    const dist = Vec2.magnitude(delta);
    if (dist <= limit || dist <= 1e-12) return false;

    const factor = (dist - limit) / dist / totalInv;
    const correction = Vec2.mul(delta, factor);
    this.points[lower].position = Vec2.add(this.points[lower].position, Vec2.mul(correction, invLower));
    this.points[upper].position = Vec2.sub(this.points[upper].position, Vec2.mul(correction, invUpper));
    return true;
  }

  effectiveInverseMass(index) {
    return index === this.dragIndex ? 0 : this.points[index].inverseMass;
  }

  updateSleepState() {
    if (this.dragIndex !== null) {
      this.stillFrames = 0;
      return;
    }

    const speedLimit = this.configuration.restSpeed * this.configuration.fixedTimeStep;
    const movingPoints = this.points.some(p => Vec2.magnitude(p.displacement) > speedLimit);
    const movingBeads = this.beads.some(b => Vec2.magnitude(b.displacement) > speedLimit);

    if (movingPoints || movingBeads) {
      this.stillFrames = 0;
      return;
    }

    this.stillFrames++;
    if (this.stillFrames >= this.configuration.framesBeforeSleep) {
      this.isSleeping = true;
    }
  }

  // --- Dragging ---

  canGrab(location) {
    if (this.points.length === 0) return false;
    const charmPos = this.points[this.points.length - 1].position;
    const radius = this.charmRadius + RopeLayout.grabPadding;
    return Vec2.distance(charmPos, location) <= radius;
  }

  beginDrag(location) {
    if (this.points.length === 0 || !this.canGrab(location)) return false;
    this.dragIndex = this.points.length - 1;
    this.dragTarget = { x: location.x, y: location.y };
    this.dragVelocity = { x: 0, y: 0 };
    this.wake();
    return true;
  }

  updateDrag(location, velocity) {
    if (this.dragIndex === null) return;
    this.dragTarget = this.reachableTarget(location);
    this.dragVelocity = Vec2.limited(velocity, this.configuration.maximumSpeed);
  }

  reachableTarget(location) {
    const reach = this.configuration.totalLength * this.configuration.maximumReachRatio;
    const offset = Vec2.sub(location, this.anchor);
    const dist = Vec2.magnitude(offset);
    if (dist > reach && dist > 1e-12) {
      return Vec2.add(this.anchor, Vec2.mul(Vec2.div(offset, dist), reach));
    }
    return location;
  }

  endDrag() {
    this.dragIndex = null;
    this.dragVelocity = { x: 0, y: 0 };
  }

  // --- Beads & Cord ---

  refreshCord() {
    if (this.points.length < 2) return;
    this.curve.rebuild(this.points.map(p => p.position), this.charmCenter);
    this.cordLength = this.curve.arcEnteringCircleAround(this.charmCenter, this.knotDistance);
    this.cordEnd = this.curve.point(this.cordLength);

    const delta = Vec2.sub(this.charmCenter, this.cordEnd);
    if (Vec2.magnitudeSquared(delta) > 1e-12) {
      this.charmOrientation = Math.atan2(delta.y, delta.x);
    }
  }

  rebuildBeads(preservingMotion) {
    const radius = this.charmRadius;
    this.refreshCord();
    if (!this.beadDescriptions || this.beadDescriptions.length === 0 || radius <= 0 || this.points.length < 2) {
      this.beads = [];
      this.applyMasses();
      return;
    }

    const drawnLength = this.curve.isEmpty ? (this.configuration.totalLength - this.knotDistance) : this.cordLength;

    this.beads = this.beadDescriptions.map((desc, index) => {
      const restOffset = desc.offset * radius;
      const arc = Vec2.clamped(drawnLength - restOffset, 0, Math.max(drawnLength, 0));
      const existing = (preservingMotion && index < this.beads.length) ? this.beads[index] : null;
      const pos = existing ? existing.position : this.curve.point(arc);

      return new RopeBead({
        position: pos,
        previousPosition: existing ? existing.previousPosition : pos,
        arc: existing ? existing.arc : arc,
        restOffset: restOffset,
        spacingRadius: desc.spacingRatio * radius,
        size: {
          width: desc.size.width * radius,
          height: desc.size.height * radius
        },
        mass: desc.mass,
        angle: existing ? existing.angle : this.curve.angle(arc)
      });
    });

    this.applyMasses();
  }

  applyMasses() {
    const last = this.points.length - 1;
    if (last <= 0) return;

    for (let index = 0; index <= last; index++) {
      if (index === 0) {
        this.points[index].inverseMass = 0;
      } else if (index === last) {
        this.points[index].inverseMass = 1 / Math.max(this.charmMetrics.mass, 0.0001);
      } else {
        this.points[index].inverseMass = 1;
      }
    }

    if (this.beads.length === 0 || this.configuration.segmentLength <= 1e-12) return;

    const load = new Array(this.points.length).fill(0);
    for (const bead of this.beads) {
      const pos = Vec2.clamped(bead.arc / this.configuration.segmentLength, 0, last);
      const lower = Math.floor(pos);
      const upper = Math.min(lower + 1, last);
      const fraction = pos - lower;
      load[lower] += bead.mass * (1 - fraction);
      load[upper] += bead.mass * fraction;
    }

    for (let index = 1; index <= last; index++) {
      if (load[index] > 0) {
        const base = (index === last) ? this.charmMetrics.mass : 1;
        this.points[index].inverseMass = 1 / Math.max(base + load[index], 0.0001);
      }
    }
  }

  advanceBeads(timeStep) {
    if (this.beads.length === 0 || this.curve.isEmpty) return;

    const gravityStep = { x: 0, y: this.configuration.gravity * timeStep * timeStep };
    const damping = this.configuration.damping;
    const displacementLimit = this.configuration.maximumSpeed * timeStep;
    const drawnLength = this.cordLength;

    for (let index = 0; index < this.beads.length; index++) {
      const bead = this.beads[index];
      const carried = Vec2.limited(Vec2.mul(bead.displacement, damping), displacementLimit);
      const predicted = Vec2.add(Vec2.add(bead.position, carried), gravityStep);

      const rest = Vec2.clamped(drawnLength - bead.restOffset, 0, drawnLength);
      const window = bead.slideLimit + bead.spacingRadius + this.configuration.segmentLength;
      let arc = this.curve.arcNearestTo(predicted, bead.arc, window);
      arc += (rest - arc) * 0.05; // beadTetherStiffness
      bead.arc = Vec2.clamped(arc, rest - bead.slideLimit, rest + bead.slideLimit);
    }

    this.separateBeads(drawnLength);

    for (let index = 0; index < this.beads.length; index++) {
      const bead = this.beads[index];
      bead.previousPosition = { x: bead.position.x, y: bead.position.y };
      bead.position = this.curve.point(bead.arc);
      bead.angle = this.curve.angle(bead.arc);
    }
  }

  separateBeads(cordLength) {
    const last = this.beads.length - 1;
    if (last < 0) return;

    for (let pass = 0; pass < 2; pass++) {
      this.beads[last].arc = Math.min(this.beads[last].arc, cordLength - this.beads[last].spacingRadius);
      if (last <= 0) return;

      for (let index = last - 1; index >= 0; index--) {
        const minGap = this.beads[index].spacingRadius + this.beads[index + 1].spacingRadius;
        const gap = this.beads[index + 1].arc - this.beads[index].arc;
        if (gap < minGap) {
          this.beads[index].arc -= (minGap - gap);
        }
      }
      this.beads[0].arc = Math.max(this.beads[0].arc, this.beads[0].spacingRadius);
    }
  }

  snapshot() {
    return {
      points: this.points.map(p => ({ x: p.position.x, y: p.position.y })),
      anchor: { x: this.anchor.x, y: this.anchor.y },
      charmCenter: { ...this.charmCenter },
      charmRadius: this.charmRadius,
      charmAngle: this.charmAngle,
      charmKnotInset: this.charmMetrics.knotInset,
      cordEnd: { ...this.cordEnd },
      cordLength: this.cordLength,
      beads: this.beads.map(b => ({
        position: { ...b.position },
        angle: b.angle,
        size: { ...b.size }
      })),
      isDragging: this.isDragging,
      isSleeping: this.isSleeping
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RopeSimulation };
}
