// src/shared/charms/classic-charms.js
// Canvas vector drawing for classic geometric charms.

const { CharmColor } = require('./catalog');

const ClassicCharms = {
  draw(ctx, charm, center, radius, opacity = 1) {
    if (radius <= 1 || opacity <= 0.001) return;

    ctx.save();
    ctx.globalAlpha = opacity;

    switch (charm.id) {
      case 'circle':
        this.drawCircle(ctx, charm.palette, center, radius);
        break;
      case 'camera':
        this.drawCamera(ctx, charm.palette, center, radius);
        break;
      case 'star':
        this.drawStar(ctx, charm.palette, center, radius);
        break;
      case 'heart':
        this.drawHeart(ctx, charm.palette, center, radius);
        break;
      case 'diamond':
        this.drawDiamond(ctx, charm.palette, center, radius);
        break;
      default:
        this.drawCircle(ctx, charm.palette, center, radius);
        break;
    }

    ctx.restore();
  },

  drawCircle(ctx, palette, center, radius) {
    ctx.save();

    // Drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.34)';
    ctx.shadowBlur = radius * 0.30;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = radius * 0.16;

    // Body gradient
    const lightX = center.x - radius * 0.34;
    const lightY = center.y - radius * 0.44;
    const grad = ctx.createRadialGradient(lightX, lightY, 0, center.x, center.y, radius * 1.2);
    grad.addColorStop(0, CharmColor.toCss(palette.light));
    grad.addColorStop(0.5, CharmColor.toCss(palette.primary));
    grad.addColorStop(1, CharmColor.toCss(palette.secondary));

    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Reset shadow for details
    ctx.shadowColor = 'transparent';

    // Specular bloom highlight
    const bloomX = center.x - radius * 0.40;
    const bloomY = center.y - radius * 0.46;
    const bloomW = radius * 0.65;
    const bloomH = radius * 0.45;
    const bloomGrad = ctx.createRadialGradient(bloomX, bloomY, 0, bloomX, bloomY, radius * 0.7);
    bloomGrad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    bloomGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.beginPath();
    ctx.ellipse(bloomX, bloomY, bloomW, bloomH, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = bloomGrad;
    ctx.fill();

    // Rim
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)';
    ctx.lineWidth = Math.max(0.75, radius * 0.07);
    ctx.stroke();

    ctx.restore();
  },

  drawCamera(ctx, palette, center, radius) {
    ctx.save();
    const side = radius * 2;
    const left = center.x - radius;
    const top = center.y - radius;

    // Build path
    const path = new Path2D();
    // Body rounded rect: x: 0.03, y: 0.30, w: 0.94, h: 0.56, corner: 0.13
    const bx = left + 0.03 * side;
    const by = top + 0.30 * side;
    const bw = 0.94 * side;
    const bh = 0.56 * side;
    const br = 0.13 * side;
    path.roundRect(bx, by, bw, bh, br);

    // Viewfinder bump: x: 0.27, y: 0.18, w: 0.27, h: 0.14, corner: 0.05
    const vx = left + 0.27 * side;
    const vy = top + 0.18 * side;
    const vw = 0.27 * side;
    const vh = 0.14 * side;
    const vr = 0.05 * side;
    path.roundRect(vx, vy, vw, vh, vr);

    // Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.34)';
    ctx.shadowBlur = radius * 0.30;
    ctx.shadowOffsetY = radius * 0.16;

    // Body gradient
    const grad = ctx.createLinearGradient(left, top + 0.2 * side, left, top + 0.9 * side);
    grad.addColorStop(0, CharmColor.toCss(palette.light));
    grad.addColorStop(0.4, CharmColor.toCss(palette.primary));
    grad.addColorStop(1, CharmColor.toCss(palette.secondary));

    ctx.fillStyle = grad;
    ctx.fill(path);

    ctx.shadowColor = 'transparent';

    // Lens rings: center at 0.5, 0.58
    const lx = left + 0.5 * side;
    const ly = top + 0.58 * side;

    ctx.beginPath();
    ctx.arc(lx, ly, 0.205 * side, 0, Math.PI * 2);
    ctx.fillStyle = CharmColor.toCss(palette.deep);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(lx, ly, 0.150 * side, 0, Math.PI * 2);
    ctx.fillStyle = CharmColor.toCss(palette.secondary);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(lx, ly, 0.082 * side, 0, Math.PI * 2);
    ctx.fillStyle = CharmColor.toCss(palette.deep);
    ctx.fill();

    // Glint
    ctx.beginPath();
    ctx.ellipse(lx - 0.04 * side, ly - 0.04 * side, 0.04 * side, 0.025 * side, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fill();

    // Flash window
    ctx.beginPath();
    ctx.roundRect(left + 0.73 * side, top + 0.37 * side, 0.13 * side, 0.07 * side, 0.02 * side);
    ctx.fillStyle = CharmColor.toCss(palette.light);
    ctx.fill();

    // Rim
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = Math.max(0.75, radius * 0.06);
    ctx.stroke(path);

    ctx.restore();
  },

  drawStar(ctx, palette, center, radius) {
    ctx.save();
    const side = radius * 2;
    const left = center.x - radius;
    const top = center.y - radius;

    const cx = left + 0.5 * side;
    const cy = top + 0.52 * side;
    const outerR = 0.48 * side;
    const innerR = 0.205 * side;

    const createStarPath = (scale) => {
      const p = new Path2D();
      for (let i = 0; i < 10; i++) {
        const angle = (-Math.PI / 2) + (i * Math.PI / 5);
        const r = ((i % 2 === 0) ? outerR : innerR) * scale;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;
        if (i === 0) p.moveTo(px, py);
        else p.lineTo(px, py);
      }
      p.closePath();
      return p;
    };

    const mainStar = createStarPath(1.0);

    // Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.34)';
    ctx.shadowBlur = radius * 0.30;
    ctx.shadowOffsetY = radius * 0.16;

    // Body
    const grad = ctx.createRadialGradient(cx - outerR * 0.2, cy - outerR * 0.3, 0, cx, cy, outerR * 1.1);
    grad.addColorStop(0, CharmColor.toCss(palette.light));
    grad.addColorStop(0.5, CharmColor.toCss(palette.primary));
    grad.addColorStop(1, CharmColor.toCss(palette.secondary));

    ctx.fillStyle = grad;
    ctx.fill(mainStar);

    ctx.shadowColor = 'transparent';

    // Inner facet
    const facetStar = createStarPath(0.56);
    ctx.fillStyle = CharmColor.toCss(palette.light);
    ctx.globalAlpha = 0.6;
    ctx.fill(facetStar);
    ctx.globalAlpha = 1.0;

    // Rim
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = Math.max(0.75, radius * 0.06);
    ctx.stroke(mainStar);

    ctx.restore();
  },

  drawHeart(ctx, palette, center, radius) {
    ctx.save();
    const side = radius * 2;
    const left = center.x - radius;
    const top = center.y - radius;

    const p = new Path2D();
    const tip = { x: left + 0.5 * side, y: top + 0.94 * side };
    const dip = { x: left + 0.5 * side, y: top + 0.26 * side };

    p.moveTo(tip.x, tip.y);
    // Left flank
    p.bezierCurveTo(
      left + 0.30 * side, top + 0.74 * side,
      left + 0.03 * side, top + 0.56 * side,
      left + 0.03 * side, top + 0.35 * side
    );
    // Left lobe
    p.bezierCurveTo(
      left + 0.03 * side, top + 0.11 * side,
      left + 0.34 * side, top + 0.04 * side,
      dip.x, dip.y
    );
    // Right lobe
    p.bezierCurveTo(
      left + 0.66 * side, top + 0.04 * side,
      left + 0.97 * side, top + 0.11 * side,
      left + 0.97 * side, top + 0.35 * side
    );
    // Right flank
    p.bezierCurveTo(
      left + 0.97 * side, top + 0.56 * side,
      left + 0.70 * side, top + 0.74 * side,
      tip.x, tip.y
    );
    p.closePath();

    // Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.34)';
    ctx.shadowBlur = radius * 0.30;
    ctx.shadowOffsetY = radius * 0.16;

    // Body
    const grad = ctx.createRadialGradient(
      left + 0.35 * side, top + 0.30 * side, 0,
      center.x, center.y, radius * 1.2
    );
    grad.addColorStop(0, CharmColor.toCss(palette.light));
    grad.addColorStop(0.5, CharmColor.toCss(palette.primary));
    grad.addColorStop(1, CharmColor.toCss(palette.secondary));

    ctx.fillStyle = grad;
    ctx.fill(p);

    ctx.shadowColor = 'transparent';

    // Specular highlight
    const bloom = ctx.createRadialGradient(
      left + 0.28 * side, top + 0.24 * side, 0,
      left + 0.28 * side, top + 0.24 * side, radius * 0.45
    );
    bloom.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    bloom.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.save();
    ctx.clip(p);
    ctx.beginPath();
    ctx.ellipse(left + 0.28 * side, top + 0.24 * side, radius * 0.35, radius * 0.22, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fillStyle = bloom;
    ctx.fill();
    ctx.restore();

    // Rim
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
    ctx.lineWidth = Math.max(0.75, radius * 0.07);
    ctx.stroke(p);

    ctx.restore();
  },

  drawDiamond(ctx, palette, center, radius) {
    ctx.save();
    const side = radius * 2;
    const left = center.x - radius;
    const top = center.y - radius;

    const tableLeft = { x: left + 0.30 * side, y: top + 0.10 * side };
    const tableRight = { x: left + 0.70 * side, y: top + 0.10 * side };
    const girdleRight = { x: left + 0.96 * side, y: top + 0.40 * side };
    const girdleLeft = { x: left + 0.04 * side, y: top + 0.40 * side };
    const culet = { x: left + 0.50 * side, y: top + 0.94 * side };

    const silhouette = new Path2D();
    silhouette.moveTo(tableLeft.x, tableLeft.y);
    silhouette.lineTo(tableRight.x, tableRight.y);
    silhouette.lineTo(girdleRight.x, girdleRight.y);
    silhouette.lineTo(culet.x, culet.y);
    silhouette.lineTo(girdleLeft.x, girdleLeft.y);
    silhouette.closePath();

    // Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.34)';
    ctx.shadowBlur = radius * 0.30;
    ctx.shadowOffsetY = radius * 0.16;

    // Body
    const grad = ctx.createLinearGradient(center.x, top + 0.1 * side, center.x, top + 0.95 * side);
    grad.addColorStop(0, CharmColor.toCss(palette.light));
    grad.addColorStop(0.35, CharmColor.toCss(palette.primary));
    grad.addColorStop(1, CharmColor.toCss(palette.deep));

    ctx.fillStyle = grad;
    ctx.fill(silhouette);

    ctx.shadowColor = 'transparent';

    // Table
    const table = new Path2D();
    table.moveTo(tableLeft.x, tableLeft.y);
    table.lineTo(tableRight.x, tableRight.y);
    table.lineTo(left + 0.78 * side, top + 0.40 * side);
    table.lineTo(left + 0.22 * side, top + 0.40 * side);
    table.closePath();
    ctx.fillStyle = CharmColor.toCss(palette.light);
    ctx.globalAlpha = 0.55;
    ctx.fill(table);

    // Facet lines
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = CharmColor.toCss(palette.light);
    ctx.lineWidth = Math.max(0.75, 0.022 * side);
    ctx.beginPath();
    ctx.moveTo(girdleLeft.x, girdleLeft.y);
    ctx.lineTo(girdleRight.x, girdleRight.y);
    ctx.moveTo(left + 0.22 * side, top + 0.40 * side);
    ctx.lineTo(culet.x, culet.y);
    ctx.moveTo(left + 0.78 * side, top + 0.40 * side);
    ctx.lineTo(culet.x, culet.y);
    ctx.stroke();

    // Rim
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = Math.max(0.75, radius * 0.06);
    ctx.stroke(silhouette);

    ctx.restore();
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ClassicCharms };
}
