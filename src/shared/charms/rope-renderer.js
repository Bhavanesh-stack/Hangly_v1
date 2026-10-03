// src/shared/charms/rope-renderer.js
// Dedicated high-performance rope renderers for Hangly charms:
// - Pirate Manila Rigging (Authentic 3-strand twisted hemp with golden whipping & brass fittings)
// - Conqueror's Haki Conduit (Obsidian cord with crackling crimson Haki lightning & aura)
// - Thousand Sunny Golden Thread (Radiant woven gold with shimmering glints)
// - Three-Sword Bushido Braid (Emerald & gold samurai sageo weave)
// - Oceanic Sailor Rigging (Navy blue & seafoam white nautical spiral)
// - Diable Jambe Flame Cord (Fiery magma gradient with rising heat embers)
// - Traditional Silk Cord (Smooth Japanese braided silk)
// - Minimalist Cable (Modern metallic monofilament)

const { CharmColor } = require('./catalog');

const RopeStyles = {
  PIRATE: 'pirate',
  HAKI: 'haki',
  GOLD: 'gold',
  BUSHIDO: 'bushido',
  OCEAN: 'ocean',
  FLAME: 'flame',
  SILK: 'silk',
  MINIMAL: 'minimal'
};

const RopeRenderer = {
  styles: RopeStyles,

  /**
   * Resamples discrete simulation polyline points into equidistant sub-points for smooth strand rendering.
   */
  resamplePoints(points, targetSpacing = 4) {
    if (!points || points.length < 2) return points || [];
    const res = [points[0]];
    let accumulated = 0;

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.001) continue;

      let walked = 0;
      while (walked + (targetSpacing - accumulated) <= dist) {
        walked += (targetSpacing - accumulated);
        const t = walked / dist;
        res.push({
          x: p1.x + dx * t,
          y: p1.y + dy * t
        });
        accumulated = 0;
      }
      accumulated += (dist - walked);
    }

    if (res.length < 2 && points.length >= 2) {
      res.push(points[points.length - 1]);
    }
    return res;
  },

  /**
   * Main entrypoint to draw the rope.
   */
  draw(ctx, { points, snapshot, style = 'silk', palette, time = 0, scale = 1.0 }) {
    if (!points || points.length < 2) return;

    const baseRadius = snapshot ? (snapshot.charmRadius || 30) : 30;
    const cordLen = snapshot ? (snapshot.cordLength || 100) : 100;
    const anchor = snapshot ? snapshot.anchor : points[0];
    const charmCenter = snapshot ? snapshot.charmCenter : points[points.length - 1];

    switch (style) {
      case RopeStyles.PIRATE:
        this.drawPirateRigging(ctx, points, { baseRadius, cordLen, anchor, charmCenter, palette, time, scale });
        break;
      case RopeStyles.HAKI:
        this.drawHakiConduit(ctx, points, { baseRadius, cordLen, anchor, charmCenter, palette, time, scale });
        break;
      case RopeStyles.GOLD:
        this.drawGoldenThread(ctx, points, { baseRadius, cordLen, anchor, charmCenter, palette, time, scale });
        break;
      case RopeStyles.BUSHIDO:
        this.drawBushidoBraid(ctx, points, { baseRadius, cordLen, anchor, charmCenter, palette, time, scale });
        break;
      case RopeStyles.OCEAN:
        this.drawOceanicRigging(ctx, points, { baseRadius, cordLen, anchor, charmCenter, palette, time, scale });
        break;
      case RopeStyles.FLAME:
        this.drawFlameCord(ctx, points, { baseRadius, cordLen, anchor, charmCenter, palette, time, scale });
        break;
      case RopeStyles.MINIMAL:
        this.drawMinimalCable(ctx, points, { baseRadius, cordLen, anchor, charmCenter, palette, time, scale });
        break;
      case RopeStyles.SILK:
      default:
        this.drawSilkCord(ctx, points, { baseRadius, cordLen, anchor, charmCenter, palette, time, scale });
        break;
    }
  },

  /**
   * Helper to build a standard Path2D from point array with optional normal offset.
   */
  buildPath(points, offsetX = 0, offsetY = 0) {
    const path = new Path2D();
    path.moveTo(points[0].x + offsetX, points[0].y + offsetY);
    for (let i = 1; i < points.length; i++) {
      path.lineTo(points[i].x + offsetX, points[i].y + offsetY);
    }
    return path;
  },

  // -------------------------------------------------------------
  // 1. PIRATE MANILA RIGGING (Authentic 3-Strand Twisted Hemp)
  // -------------------------------------------------------------
  drawPirateRigging(ctx, rawPoints, { baseRadius, anchor, charmCenter, time }) {
    const cordWidth = Math.max(3.2, baseRadius * 0.058);
    const ropePath = this.buildPath(rawPoints);
    const shadowPath = this.buildPath(rawPoints, 0, cordWidth * 0.9);

    ctx.save();

    // 1. Heavy nautical shadow
    ctx.strokeStyle = 'rgba(25, 12, 4, 0.25)';
    ctx.lineWidth = cordWidth * 2.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(shadowPath);

    ctx.strokeStyle = 'rgba(20, 8, 2, 0.35)';
    ctx.lineWidth = cordWidth * 1.5;
    ctx.stroke(shadowPath);

    // 2. Base Manila Hemp body (multi-stop realistic hemp tone)
    const baseGrad = ctx.createLinearGradient(anchor.x, anchor.y, charmCenter.x, charmCenter.y);
    baseGrad.addColorStop(0, '#8c5928');    // weathered anchor end
    baseGrad.addColorStop(0.3, '#d4a373');  // golden sun-bleached hemp
    baseGrad.addColorStop(0.7, '#c68b59');  // rich twisted core
    baseGrad.addColorStop(1, '#96612d');    // nautical knot connection

    ctx.strokeStyle = baseGrad;
    ctx.lineWidth = cordWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(ropePath);

    // 3. Realistic 3-Strand Helical Twisting with golden thread
    const pitch = cordWidth * 2.2;
    const across = cordWidth * 0.28;

    // Strand 1: Golden-tan fiber highlight
    ctx.save();
    ctx.strokeStyle = 'rgba(254, 240, 199, 0.55)';
    ctx.lineWidth = cordWidth * 0.42;
    ctx.setLineDash([pitch * 0.40, pitch * 0.60]);
    ctx.lineDashOffset = 0;
    ctx.stroke(this.buildPath(rawPoints, -across, -across * 0.5));
    ctx.restore();

    // Strand 2: Deep hemp groove shadow
    ctx.save();
    ctx.strokeStyle = 'rgba(60, 32, 10, 0.70)';
    ctx.lineWidth = cordWidth * 0.35;
    ctx.setLineDash([pitch * 0.32, pitch * 0.68]);
    ctx.lineDashOffset = pitch * 0.35;
    ctx.stroke(this.buildPath(rawPoints, across, across * 0.5));
    ctx.restore();

    // Strand 3: Golden pirate thread spiral (whipping thread running along the hemp)
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.85)';
    ctx.lineWidth = Math.max(1.0, cordWidth * 0.18);
    ctx.setLineDash([pitch * 0.18, pitch * 0.82]);
    ctx.lineDashOffset = pitch * 0.70;
    ctx.stroke(this.buildPath(rawPoints, 0, 0));
    ctx.restore();

    // 4. Nautical Whipping Bands (tightly wound gold/brass cord at top and bottom)
    const resampled = this.resamplePoints(rawPoints, 2.5);
    if (resampled.length > 10) {
      this.drawWhippingBand(ctx, resampled.slice(1, 7), cordWidth);
      this.drawWhippingBand(ctx, resampled.slice(-8, -2), cordWidth);
    }

    // 5. Weathered edge sheen
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 250, 220, 0.30)';
    ctx.lineWidth = Math.max(0.8, cordWidth * 0.2);
    ctx.stroke(this.buildPath(rawPoints, -cordWidth * 0.25, -cordWidth * 0.25));
    ctx.restore();

    ctx.restore();
  },

  /**
   * Draws a tightly wound nautical whipping band across a set of points.
   */
  drawWhippingBand(ctx, pts, cordWidth) {
    if (!pts || pts.length < 2) return;
    ctx.save();
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const perp = angle + Math.PI / 2;
      const w = cordWidth * 0.75;

      const x1 = p1.x - Math.cos(perp) * w;
      const y1 = p1.y - Math.sin(perp) * w;
      const x2 = p1.x + Math.cos(perp) * w;
      const y2 = p1.y + Math.sin(perp) * w;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = (i % 2 === 0) ? '#f59e0b' : '#b45309';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
    ctx.restore();
  },

  // -------------------------------------------------------------
  // 2. CONQUEROR'S HAKI CONDUIT (Dark Armament Aura & Lightning)
  // -------------------------------------------------------------
  drawHakiConduit(ctx, rawPoints, { baseRadius, anchor, charmCenter, time }) {
    const cordWidth = Math.max(2.8, baseRadius * 0.052);
    const ropePath = this.buildPath(rawPoints);
    const shadowPath = this.buildPath(rawPoints, 0, cordWidth * 0.8);
    const now = (time || performance.now()) * 0.001;

    ctx.save();

    // 1. Dark crimson ambient Haki aura glow
    const pulse = 0.5 + 0.5 * Math.sin(now * 5.0);
    ctx.save();
    ctx.strokeStyle = `rgba(220, 20, 60, ${0.35 + pulse * 0.35})`;
    ctx.lineWidth = cordWidth * (2.8 + pulse * 1.2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#ff1744';
    ctx.shadowBlur = 14 + pulse * 8;
    ctx.stroke(ropePath);
    ctx.restore();

    // 2. Shadow
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = cordWidth * 2.0;
    ctx.stroke(shadowPath);

    // 3. Obsidian Conduit Core
    const grad = ctx.createLinearGradient(anchor.x, anchor.y, charmCenter.x, charmCenter.y);
    grad.addColorStop(0, '#09090b');
    grad.addColorStop(0.5, '#18181b');
    grad.addColorStop(1, '#09090b');

    ctx.strokeStyle = grad;
    ctx.lineWidth = cordWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(ropePath);

    // 4. Crimson energy veins running along the cord
    const pitch = cordWidth * 1.8;
    ctx.save();
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = cordWidth * 0.40;
    ctx.setLineDash([pitch * 0.35, pitch * 0.65]);
    ctx.lineDashOffset = (now * 60) % pitch;
    ctx.stroke(this.buildPath(rawPoints, -cordWidth * 0.15, 0));
    ctx.restore();

    // 5. Dynamic Conqueror's Haki Lightning Sparks
    const resampled = this.resamplePoints(rawPoints, 8);
    if (resampled.length > 4) {
      ctx.save();
      ctx.strokeStyle = '#ffe4e6';
      ctx.shadowColor = '#ff1744';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 1.4;

      const sparkCount = 3;
      for (let s = 0; s < sparkCount; s++) {
        const seed = Math.sin(now * 12 + s * 99);
        if (seed > 0.3) {
          const idx = Math.floor(((Math.sin(now * 8 + s * 37) + 1) * 0.5) * (resampled.length - 2)) + 1;
          const pt = resampled[idx];
          if (pt) {
            const angle = Math.sin(now * 25 + s) * Math.PI;
            const len = 6 + Math.random() * 12;
            const jx = pt.x + Math.cos(angle) * (len * 0.5) + (Math.random() - 0.5) * 6;
            const jy = pt.y + Math.sin(angle) * (len * 0.5) + (Math.random() - 0.5) * 6;
            const ex = pt.x + Math.cos(angle) * len;
            const ey = pt.y + Math.sin(angle) * len;

            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y);
            ctx.lineTo(jx, jy);
            ctx.lineTo(ex, ey);
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    }

    ctx.restore();
  },

  // -------------------------------------------------------------
  // 3. THOUSAND SUNNY GOLDEN THREAD (Radiant Metallic Gold)
  // -------------------------------------------------------------
  drawGoldenThread(ctx, rawPoints, { baseRadius, anchor, charmCenter, time }) {
    const cordWidth = Math.max(2.6, baseRadius * 0.050);
    const ropePath = this.buildPath(rawPoints);
    const shadowPath = this.buildPath(rawPoints, 0, cordWidth * 0.85);
    const now = (time || performance.now()) * 0.001;

    ctx.save();

    // 1. Warm golden ambient sheen
    ctx.save();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
    ctx.lineWidth = cordWidth * 2.8;
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 10;
    ctx.stroke(ropePath);
    ctx.restore();

    // 2. Drop shadow
    ctx.strokeStyle = 'rgba(40, 25, 5, 0.25)';
    ctx.lineWidth = cordWidth * 2.2;
    ctx.stroke(shadowPath);

    // 3. Rich Metallic Gold Core
    const grad = ctx.createLinearGradient(anchor.x, anchor.y, charmCenter.x, charmCenter.y);
    grad.addColorStop(0, '#d97706');
    grad.addColorStop(0.3, '#fbbf24');
    grad.addColorStop(0.6, '#fef08a');
    grad.addColorStop(0.8, '#f59e0b');
    grad.addColorStop(1, '#b45309');

    ctx.strokeStyle = grad;
    ctx.lineWidth = cordWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(ropePath);

    // 4. Intricate braided gold shimmer
    const pitch = cordWidth * 1.6;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = cordWidth * 0.32;
    ctx.setLineDash([pitch * 0.25, pitch * 0.75]);
    ctx.lineDashOffset = (now * 25) % pitch;
    ctx.stroke(this.buildPath(rawPoints, -cordWidth * 0.2, -cordWidth * 0.2));
    ctx.restore();

    // 5. Traveling gold sparkle glints
    const resampled = this.resamplePoints(rawPoints, 12);
    if (resampled.length > 2) {
      const glintPos = ((now * 0.8) % 1.0);
      const idx = Math.floor(glintPos * (resampled.length - 1));
      const pt = resampled[idx];
      if (pt) {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#fef08a';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, cordWidth * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.restore();
  },

  // -------------------------------------------------------------
  // 4. THREE-SWORD BUSHIDO BRAID (Emerald & Gold Samurai Sageo)
  // -------------------------------------------------------------
  drawBushidoBraid(ctx, rawPoints, { baseRadius, anchor, charmCenter }) {
    const cordWidth = Math.max(3.0, baseRadius * 0.054);
    const ropePath = this.buildPath(rawPoints);
    const shadowPath = this.buildPath(rawPoints, 0, cordWidth * 0.85);

    ctx.save();

    // 1. Shadow
    ctx.strokeStyle = 'rgba(4, 30, 18, 0.35)';
    ctx.lineWidth = cordWidth * 2.4;
    ctx.stroke(shadowPath);

    // 2. Emerald Jade Body
    const grad = ctx.createLinearGradient(anchor.x, anchor.y, charmCenter.x, charmCenter.y);
    grad.addColorStop(0, '#064e3b');
    grad.addColorStop(0.5, '#059669');
    grad.addColorStop(1, '#064e3b');

    ctx.strokeStyle = grad;
    ctx.lineWidth = cordWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(ropePath);

    // 3. Samurai Diamond Cross-Braid Pattern (Tsuka-ito style)
    const pitch = cordWidth * 2.0;
    // Gold diamond wraps
    ctx.save();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = cordWidth * 0.38;
    ctx.setLineDash([pitch * 0.35, pitch * 0.65]);
    ctx.stroke(this.buildPath(rawPoints, -cordWidth * 0.18, 0));
    ctx.restore();

    // Jet black secondary wrap
    ctx.save();
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = cordWidth * 0.32;
    ctx.setLineDash([pitch * 0.35, pitch * 0.65]);
    ctx.lineDashOffset = pitch * 0.5;
    ctx.stroke(this.buildPath(rawPoints, cordWidth * 0.18, 0));
    ctx.restore();

    ctx.restore();
  },

  // -------------------------------------------------------------
  // 5. OCEANIC SAILOR RIGGING (Navy & Seafoam Nautical Spiral)
  // -------------------------------------------------------------
  drawOceanicRigging(ctx, rawPoints, { baseRadius, anchor, charmCenter }) {
    const cordWidth = Math.max(3.0, baseRadius * 0.055);
    const ropePath = this.buildPath(rawPoints);
    const shadowPath = this.buildPath(rawPoints, 0, cordWidth * 0.85);

    ctx.save();

    // 1. Ambient wave blue glow
    ctx.save();
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.20)';
    ctx.lineWidth = cordWidth * 2.6;
    ctx.shadowColor = '#0ea5e9';
    ctx.shadowBlur = 8;
    ctx.stroke(ropePath);
    ctx.restore();

    // 2. Drop shadow
    ctx.strokeStyle = 'rgba(3, 30, 50, 0.30)';
    ctx.lineWidth = cordWidth * 2.2;
    ctx.stroke(shadowPath);

    // 3. Deep Navy Core
    const grad = ctx.createLinearGradient(anchor.x, anchor.y, charmCenter.x, charmCenter.y);
    grad.addColorStop(0, '#0369a1');
    grad.addColorStop(0.5, '#0284c7');
    grad.addColorStop(1, '#075985');

    ctx.strokeStyle = grad;
    ctx.lineWidth = cordWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(ropePath);

    // 4. Seafoam White / Ivory Twisted Spiral
    const pitch = cordWidth * 2.1;
    ctx.save();
    ctx.strokeStyle = '#f0fdfa';
    ctx.lineWidth = cordWidth * 0.42;
    ctx.setLineDash([pitch * 0.40, pitch * 0.60]);
    ctx.stroke(this.buildPath(rawPoints, -cordWidth * 0.22, 0));
    ctx.restore();

    // 5. Bright Orange Tangerine Accent (Nami theme)
    ctx.save();
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = Math.max(0.8, cordWidth * 0.16);
    ctx.setLineDash([pitch * 0.20, pitch * 0.80]);
    ctx.lineDashOffset = pitch * 0.45;
    ctx.stroke(this.buildPath(rawPoints, cordWidth * 0.15, 0));
    ctx.restore();

    ctx.restore();
  },

  // -------------------------------------------------------------
  // 6. DIABLE JAMBE FLAME CORD (Fiery Magma & Heat Shimmer)
  // -------------------------------------------------------------
  drawFlameCord(ctx, rawPoints, { baseRadius, anchor, charmCenter, time }) {
    const cordWidth = Math.max(2.8, baseRadius * 0.052);
    const ropePath = this.buildPath(rawPoints);
    const now = (time || performance.now()) * 0.001;

    ctx.save();

    // 1. Fiery Heat Aura Glow
    const pulse = 0.5 + 0.5 * Math.sin(now * 6.0);
    ctx.save();
    ctx.strokeStyle = `rgba(249, 115, 22, ${0.4 + pulse * 0.3})`;
    ctx.lineWidth = cordWidth * (2.6 + pulse * 0.8);
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 12 + pulse * 6;
    ctx.stroke(ropePath);
    ctx.restore();

    // 2. Magma Core Gradient
    const grad = ctx.createLinearGradient(anchor.x, anchor.y, charmCenter.x, charmCenter.y);
    grad.addColorStop(0, '#991b1b');
    grad.addColorStop(0.4, '#dc2626');
    grad.addColorStop(0.7, '#f97316');
    grad.addColorStop(1, '#fef08a');

    ctx.strokeStyle = grad;
    ctx.lineWidth = cordWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(ropePath);

    // 3. Incandescent Yellow Core Spark
    const pitch = cordWidth * 1.5;
    ctx.save();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = cordWidth * 0.35;
    ctx.setLineDash([pitch * 0.35, pitch * 0.65]);
    ctx.lineDashOffset = (now * -40) % pitch;
    ctx.stroke(this.buildPath(rawPoints, 0, 0));
    ctx.restore();

    // 4. Floating flame ember particles
    const resampled = this.resamplePoints(rawPoints, 10);
    if (resampled.length > 2) {
      ctx.save();
      for (let i = 1; i < resampled.length - 1; i += 2) {
        const pt = resampled[i];
        const seed = Math.sin(now * 8 + i * 17);
        if (seed > 0.2) {
          const offX = Math.sin(now * 10 + i) * 6;
          const offY = -((now * 20 + i * 5) % 12);
          ctx.fillStyle = seed > 0.6 ? '#fef08a' : '#f97316';
          ctx.beginPath();
          ctx.arc(pt.x + offX, pt.y + offY, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    ctx.restore();
  },

  // -------------------------------------------------------------
  // 7. TRADITIONAL SILK CORD (Refined Japanese Braided Silk)
  // -------------------------------------------------------------
  drawSilkCord(ctx, rawPoints, { baseRadius, anchor, charmCenter, palette }) {
    const cordWidth = Math.max(1.8, baseRadius * 0.046);
    const ropePath = this.buildPath(rawPoints);
    const shadowPath = this.buildPath(rawPoints, 0, cordWidth * 0.8);

    const p = palette || {
      primary: CharmColor.rgb(0.85, 0.75, 0.45),
      secondary: CharmColor.rgb(0.65, 0.55, 0.30),
      deep: CharmColor.rgb(0.35, 0.25, 0.10),
      light: CharmColor.rgb(1.0, 0.95, 0.80)
    };

    ctx.save();

    // 1. Soft Shadow
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.lineWidth = cordWidth * 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(shadowPath);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.16)';
    ctx.lineWidth = cordWidth * 1.5;
    ctx.stroke(shadowPath);

    // 2. Body Gradient
    const grad = ctx.createLinearGradient(anchor.x, anchor.y, charmCenter.x, charmCenter.y);
    grad.addColorStop(0, CharmColor.toCss(p.secondary));
    grad.addColorStop(1, CharmColor.toCss(p.primary));

    ctx.strokeStyle = grad;
    ctx.lineWidth = cordWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(ropePath);

    // 3. Delicate Silk Strand Twists
    if (cordWidth > 1.4) {
      const pitch = cordWidth * 1.6;
      const across = cordWidth * 0.22;

      ctx.save();
      ctx.strokeStyle = CharmColor.toCss({ ...p.light, a: 0.35 });
      ctx.lineWidth = cordWidth * 0.50;
      ctx.setLineDash([pitch * 0.42, pitch * 0.58]);
      ctx.stroke(this.buildPath(rawPoints, -across, -across));
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = CharmColor.toCss({ ...p.deep, a: 0.45 });
      ctx.lineWidth = cordWidth * 0.42;
      ctx.setLineDash([pitch * 0.34, pitch * 0.66]);
      ctx.lineDashOffset = pitch * 0.5;
      ctx.stroke(this.buildPath(rawPoints, across, across));
      ctx.restore();
    }

    ctx.restore();
  },

  // -------------------------------------------------------------
  // 8. MINIMALIST CABLE (Clean Modern Metallic Wire)
  // -------------------------------------------------------------
  drawMinimalCable(ctx, rawPoints, { baseRadius, anchor, charmCenter }) {
    const cordWidth = Math.max(1.2, baseRadius * 0.028);
    const ropePath = this.buildPath(rawPoints);
    const shadowPath = this.buildPath(rawPoints, 0, cordWidth);

    ctx.save();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = cordWidth * 2.0;
    ctx.stroke(shadowPath);

    const grad = ctx.createLinearGradient(anchor.x, anchor.y, charmCenter.x, charmCenter.y);
    grad.addColorStop(0, '#94a3b8');
    grad.addColorStop(0.5, '#cbd5e1');
    grad.addColorStop(1, '#64748b');

    ctx.strokeStyle = grad;
    ctx.lineWidth = cordWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(ropePath);

    ctx.restore();
  },

  /**
   * Draws knot ring / nautical grommet matching the rope style.
   */
  drawKnotRing(ctx, snapshot, style = 'silk', palette) {
    if (!snapshot) return;
    const radius = snapshot.charmRadius;
    if (radius <= 1) return;

    const dirX = Math.cos(snapshot.charmAngle);
    const dirY = Math.sin(snapshot.charmAngle);
    const knotDist = radius * (snapshot.charmKnotInset || 0.94);
    const kx = snapshot.charmCenter.x - (dirX * knotDist);
    const ky = snapshot.charmCenter.y - (dirY * knotDist);
    const ringRadius = radius * 0.18;

    ctx.save();
    ctx.beginPath();
    ctx.arc(kx, ky, ringRadius, 0, Math.PI * 2);

    if (style === RopeStyles.PIRATE) {
      // Weathered Brass Pirate Grommet Ring
      const grad = ctx.createRadialGradient(kx - ringRadius * 0.3, ky - ringRadius * 0.3, ringRadius * 0.2, kx, ky, ringRadius);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.4, '#d97706');
      grad.addColorStop(0.8, '#78350f');
      grad.addColorStop(1, '#451a03');

      ctx.strokeStyle = grad;
      ctx.lineWidth = Math.max(2.0, radius * 0.09);
      ctx.stroke();

      // Inner highlight
      ctx.beginPath();
      ctx.arc(kx, ky, ringRadius * 0.85, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    } else if (style === RopeStyles.HAKI) {
      // Obsidian ring with Crimson Glow
      ctx.strokeStyle = '#dc2626';
      ctx.shadowColor = '#ff1744';
      ctx.shadowBlur = 8;
      ctx.lineWidth = Math.max(1.8, radius * 0.08);
      ctx.stroke();
    } else if (style === RopeStyles.GOLD) {
      // Shining Gold Ring
      ctx.strokeStyle = '#fbbf24';
      ctx.shadowColor = '#fde68a';
      ctx.shadowBlur = 6;
      ctx.lineWidth = Math.max(2.0, radius * 0.085);
      ctx.stroke();
    } else if (style === RopeStyles.BUSHIDO) {
      // Samurai Green & Gold fitting
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = Math.max(1.8, radius * 0.08);
      ctx.stroke();
    } else if (style === RopeStyles.FLAME) {
      // Fiery Ring
      ctx.strokeStyle = '#f97316';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 8;
      ctx.lineWidth = Math.max(1.8, radius * 0.08);
      ctx.stroke();
    } else {
      // Standard silk / classic loop
      const p = palette || { light: CharmColor.rgb(1, 1, 1) };
      ctx.strokeStyle = CharmColor.toCss({ ...p.light, a: 0.9 });
      ctx.lineWidth = Math.max(1, radius * 0.07);
      ctx.stroke();
    }

    ctx.restore();
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    RopeRenderer,
    RopeStyles
  };
}
