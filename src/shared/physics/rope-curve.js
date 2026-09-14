// rope-curve.js
// The drawn cord as a quadratic spline measured by arc length.

const { Vec2 } = require('./rope-point');

class RopeCurve {
  constructor() {
    this.samples = [];
    this.cumulative = [];
  }

  get length() {
    return this.cumulative.length > 0 ? this.cumulative[this.cumulative.length - 1] : 0;
  }

  get isEmpty() {
    return this.samples.length < 2;
  }

  rebuild(points, end, samplesPerSegment = 4) {
    this.samples = [];
    this.cumulative = [];
    if (!points || points.length < 2) return;

    const first = points[0];
    this.samples.push({ x: first.x, y: first.y });

    if (points.length > 2) {
      let start = first;
      for (let index = 1; index < points.length - 1; index++) {
        const control = points[index];
        const finish = Vec2.mul(Vec2.add(points[index], points[index + 1]), 0.5);
        for (let step = 1; step <= samplesPerSegment; step++) {
          const fraction = step / samplesPerSegment;
          this.samples.push(RopeCurve.quadratic(start, control, finish, fraction));
        }
        start = finish;
      }
    }
    this.samples.push({ x: end.x, y: end.y });

    this.cumulative.push(0);
    let total = 0.0;
    for (let index = 1; index < this.samples.length; index++) {
      total += Vec2.distance(this.samples[index], this.samples[index - 1]);
      this.cumulative.push(total);
    }
  }

  static quadratic(start, control, end, fraction) {
    const inv = 1 - fraction;
    const toStart = Vec2.mul(start, inv * inv);
    const toControl = Vec2.mul(control, 2 * inv * fraction);
    const toEnd = Vec2.mul(end, fraction * fraction);
    return Vec2.add(Vec2.add(toStart, toControl), toEnd);
  }

  polyline(upToArc) {
    if (this.isEmpty) return [];
    const cut = Vec2.clamped(upToArc, 0, this.length);
    const result = [];
    for (let index = 0; index < this.samples.length; index++) {
      if (this.cumulative[index] >= cut) break;
      result.push(this.samples[index]);
    }
    result.push(this.point(cut));
    return result;
  }

  arcEnteringCircleAround(center, radius) {
    if (this.isEmpty) return 0;
    if (radius <= 0) return this.length;

    let index = this.samples.length - 1;
    while (index > 0) {
      const outer = Vec2.distance(this.samples[index - 1], center);
      if (outer < radius) {
        index--;
        continue;
      }
      const inner = Vec2.distance(this.samples[index], center);
      const span = outer - inner;
      const fraction = span > 1e-12 ? Vec2.clamped((outer - radius) / span, 0, 1) : 0;
      return this.cumulative[index - 1] + ((this.cumulative[index] - this.cumulative[index - 1]) * fraction);
    }
    return 0;
  }

  point(atArc) {
    if (this.isEmpty) return { x: 0, y: 0 };
    const target = Vec2.clamped(atArc, 0, this.length);
    const index = this.segmentIndex(target);
    const spanStart = this.cumulative[index];
    const spanLength = this.cumulative[index + 1] - spanStart;
    if (spanLength <= 1e-12) return this.samples[index];
    const fraction = (target - spanStart) / spanLength;
    const s0 = this.samples[index];
    const s1 = this.samples[index + 1];
    return Vec2.add(s0, Vec2.mul(Vec2.sub(s1, s0), fraction));
  }

  angle(atArc) {
    if (this.isEmpty) return Math.PI / 2;
    const target = Vec2.clamped(atArc, 0, this.length);
    const index = this.segmentIndex(target);
    const delta = Vec2.sub(this.samples[index + 1], this.samples[index]);
    if (Vec2.magnitudeSquared(delta) <= 1e-12) return Math.PI / 2;
    return Math.atan2(delta.y, delta.x);
  }

  arcNearestTo(location, near, window) {
    if (this.isEmpty) return 0;
    const lower = Vec2.clamped(near - window, 0, this.length);
    const upper = Vec2.clamped(near + window, 0, this.length);

    let best = near;
    let bestDist = Infinity;

    for (let index = 0; index < this.samples.length - 1; index++) {
      if (this.cumulative[index + 1] < lower || this.cumulative[index] > upper) continue;
      const { arc, distance } = this.closestPointOnSegment(index, location);
      if (distance < bestDist) {
        bestDist = distance;
        best = arc;
      }
    }
    return Vec2.clamped(best, lower, upper);
  }

  closestPointOnSegment(index, location) {
    const start = this.samples[index];
    const end = this.samples[index + 1];
    const span = Vec2.sub(end, start);
    const lenSq = Vec2.magnitudeSquared(span);
    if (lenSq <= 1e-12) {
      return { arc: this.cumulative[index], distance: Vec2.distance(start, location) };
    }
    const offset = Vec2.sub(location, start);
    const fraction = Vec2.clamped(((offset.x * span.x) + (offset.y * span.y)) / lenSq, 0, 1);
    const projected = Vec2.add(start, Vec2.mul(span, fraction));
    const arc = this.cumulative[index] + ((this.cumulative[index + 1] - this.cumulative[index]) * fraction);
    return { arc, distance: Vec2.distance(projected, location) };
  }

  segmentIndex(arc) {
    let low = 0;
    let high = this.cumulative.length - 1;
    while (low < high - 1) {
      const mid = Math.floor((low + high) / 2);
      if (this.cumulative[mid] <= arc) {
        low = mid;
      } else {
        high = mid;
      }
    }
    return Math.min(low, this.samples.length - 2);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RopeCurve };
}
