// rope-point.js
// Single Verlet particle and 2D vector helpers.

const Vec2 = {
  add(a, b) {
    return { x: a.x + b.x, y: a.y + b.y };
  },
  sub(a, b) {
    return { x: a.x - b.x, y: a.y - b.y };
  },
  mul(v, s) {
    return { x: v.x * s, y: v.y * s };
  },
  div(v, s) {
    return s !== 0 ? { x: v.x / s, y: v.y / s } : { x: 0, y: 0 };
  },
  magnitude(v) {
    return Math.hypot(v.x, v.y);
  },
  magnitudeSquared(v) {
    return (v.x * v.x) + (v.y * v.y);
  },
  distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  },
  distanceSquared(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return (dx * dx) + (dy * dy);
  },
  limited(v, limit) {
    const mag = Math.hypot(v.x, v.y);
    if (mag > limit && mag > 1e-12) {
      const scale = limit / mag;
      return { x: v.x * scale, y: v.y * scale };
    }
    return { x: v.x, y: v.y };
  },
  rotated(v, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: (v.x * cos) - (v.y * sin),
      y: (v.x * sin) + (v.y * cos)
    };
  },
  clamped(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }
};

class RopePoint {
  constructor(position, inverseMass = 1) {
    this.position = { x: position.x, y: position.y };
    this.previousPosition = { x: position.x, y: position.y };
    this.inverseMass = inverseMass;
  }

  get displacement() {
    return {
      x: this.position.x - this.previousPosition.x,
      y: this.position.y - this.previousPosition.y
    };
  }

  get isPinned() {
    return this.inverseMass === 0;
  }

  setVelocity(velocity, timeStep) {
    this.previousPosition = {
      x: this.position.x - (velocity.x * timeStep),
      y: this.position.y - (velocity.y * timeStep)
    };
  }

  static chain(configuration, anchor, charmMetrics, angle = 0) {
    const dir = Vec2.rotated({ x: 0, y: 1 }, angle);
    const lastIndex = configuration.pointCount - 1;
    const points = [];

    for (let index = 0; index <= lastIndex; index++) {
      let inverseMass = 1;
      if (index === 0) {
        inverseMass = 0;
      } else if (index === lastIndex) {
        inverseMass = 1 / Math.max(charmMetrics.mass || 2.6, 0.0001);
      }

      const offset = Vec2.mul(dir, index * configuration.segmentLength);
      const pos = Vec2.add(anchor, offset);
      points.push(new RopePoint(pos, inverseMass));
    }
    return points;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RopePoint, Vec2 };
}
