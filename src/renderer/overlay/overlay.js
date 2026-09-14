// src/renderer/overlay/overlay.js
// High-performance overlay canvas renderer with 240Hz Verlet physics.

const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

const { RopeSimulation } = require('../../shared/physics/rope-simulation');
const { RopeConfiguration, RopeLayout } = require('../../shared/physics/rope-configuration');
const { CharmCatalog, CharmColor, CollectionCordTint, getCharmById } = require('../../shared/charms/catalog');
const { ClassicCharms } = require('../../shared/charms/classic-charms');
const { Splitter } = require('../../shared/charms/splitter');
const { SoundPlayer } = require('../../shared/audio/synthesizer');
const { CustomCharmStore } = require('../../shared/charms/custom-store');

const canvas = document.getElementById('rope-canvas');
const ctx = canvas.getContext('2d', { alpha: true });

let width = window.innerWidth;
let height = window.innerHeight;
let dpr = window.devicePixelRatio || 1;

function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;
  dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
}
resizeCanvas();
window.addEventListener('resize', () => {
  resizeCanvas();
  if (sim) sim.resize({ width, height });
});

// Custom Charm Store & Charm Resolver
const customCharmStore = new CustomCharmStore();

function resolveCharm(charmId) {
  let charm = CharmCatalog.find(c => c.id === charmId);
  if (!charm) {
    try {
      const customs = customCharmStore.loadCharms();
      charm = customs.find(c => c.id === charmId);
    } catch (e) {}
  }
  return charm || CharmCatalog[0];
}

const customImageCache = {};
function getCustomImage(charm) {
  if (!charm || !charm.imagePath) return null;
  if (!customImageCache[charm.id]) {
    const img = new Image();
    img.src = `file://${charm.imagePath.replace(/\\/g, '/')}`;
    customImageCache[charm.id] = img;
  }
  return customImageCache[charm.id];
}

// App settings
let currentSettings = {
  overlay: {
    scale: 1.0,
    opacity: 1.0,
    charmId: 'daruma',
    isClickThrough: true
  },
  sound: {
    enabled: true,
    volume: 1.0
  }
};

let currentCharm = resolveCharm('daruma');
let svgCache = {}; // id -> { img, rasterCanvas, rasterSize, regions, beadDescriptions, loaded: bool }
const soundPlayer = new SoundPlayer();

// Initialize Simulation
const sim = new RopeSimulation({
  configuration: RopeConfiguration.fitted({ width, height }),
  anchor: RopeLayout.anchor({ width, height }),
  charmMetrics: {
    mass: currentCharm.mass,
    radiusRatio: currentCharm.radiusRatio,
    knotInset: currentCharm.knotInset || 0.94
  }
});

// Preload and analyze SVG charm
const RASTER_SIZE = 512;
const pendingLoads = {};

function loadSvgCharm(charm) {
  if (svgCache[charm.id]) return Promise.resolve(svgCache[charm.id]);
  if (pendingLoads[charm.id]) return pendingLoads[charm.id];

  const promise = new Promise((resolve) => {
    const filename = charm.svgFile || `${charm.name}.svg`;
    const svgPath = path.join(__dirname, '..', '..', '..', 'assets', 'charms', filename);
    
    if (!fs.existsSync(svgPath)) {
      console.warn('SVG file not found:', svgPath);
      svgCache[charm.id] = { loaded: false };
      return resolve(svgCache[charm.id]);
    }

    let svgText = fs.readFileSync(svgPath, 'utf8');
    const vbMatch = svgText.match(/viewBox=["']([^"']+)["']/i);
    if (vbMatch) {
      const parts = vbMatch[1].trim().split(/[\s,]+/).map(Number);
      if (!/<svg[^>]+width=/i.test(svgText)) {
        svgText = svgText.replace(/<svg\b([^>]*)>/i, `<svg width="${parts[2]}" height="${parts[3]}" $1>`);
      }
    }

    const img = new Image();
    img.onload = () => {
      // Rasterize onto high-resolution offscreen canvas
      const offCanvas = document.createElement('canvas');
      offCanvas.width = RASTER_SIZE;
      offCanvas.height = RASTER_SIZE;
      const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });

      const natW = img.naturalWidth || img.width || RASTER_SIZE;
      const natH = img.naturalHeight || img.height || RASTER_SIZE;
      const longest = Math.max(natW, natH) || 1;
      const drawW = RASTER_SIZE * natW / longest;
      const drawH = RASTER_SIZE * natH / longest;
      const drawX = (RASTER_SIZE - drawW) / 2;
      const drawY = (RASTER_SIZE - drawH) / 2;

      offCtx.drawImage(img, drawX, drawY, drawW, drawH);
      const imgData = offCtx.getImageData(0, 0, RASTER_SIZE, RASTER_SIZE);

      const regions = Splitter.analyzeImageData(imgData, charm.beadCount || 0, charm.bodyRun !== undefined ? charm.bodyRun : charm.beadCount);
      const beadDescriptions = Splitter.computeBeadDescriptions(regions, charm.mass);

      const entry = {
        img,
        rasterCanvas: offCanvas,
        rasterSize: RASTER_SIZE,
        regions,
        beadDescriptions,
        loaded: true
      };
      svgCache[charm.id] = entry;
      delete pendingLoads[charm.id];
      resolve(entry);
    };

    img.onerror = () => {
      console.error('Failed to load image:', svgPath);
      svgCache[charm.id] = { loaded: false };
      delete pendingLoads[charm.id];
      resolve(svgCache[charm.id]);
    };

    img.src = `data:image/svg+xml;base64,${Buffer.from(svgText).toString('base64')}`;
  });

  pendingLoads[charm.id] = promise;
  return promise;
}

// Background preloading for all collection charms
function preloadCollectionCharms() {
  CharmCatalog.filter(c => c.type === 'svg').forEach(c => {
    loadSvgCharm(c);
  });
}
setTimeout(preloadCollectionCharms, 500);

function applyCharm(charm, isInitial = false) {
  if (!charm) return;
  currentCharm = charm;

  if (charm.type === 'svg') {
    loadSvgCharm(charm).then(entry => {
      if (entry.loaded && entry.regions) {
        sim.setCharmMetrics({
          mass: charm.mass,
          radiusRatio: charm.radiusRatio,
          knotInset: entry.regions.knotInset || charm.knotInset || 0.94
        });
        sim.setBeads(entry.beadDescriptions);
      } else {
        sim.setCharmMetrics({
          mass: charm.mass,
          radiusRatio: charm.radiusRatio,
          knotInset: charm.knotInset || 0.94
        });
        sim.setBeads([]);
      }
      if (!isInitial) {
        soundPlayer.play(charm.sound || 'wood', 0.8);
      }
    });
  } else if (charm.type === 'custom') {
    getCustomImage(charm);
    sim.setCharmMetrics({
      mass: charm.mass || 3.0,
      radiusRatio: charm.radiusRatio || 0.15,
      knotInset: charm.knotInset || 0.85
    });
    sim.setBeads([]);
    if (!isInitial) {
      soundPlayer.play(charm.sound || 'soft', 0.8);
    }
  } else {
    // Classic geometric charm
    sim.setCharmMetrics({
      mass: charm.mass,
      radiusRatio: charm.radiusRatio,
      knotInset: charm.knotInset || 0.90
    });
    sim.setBeads([]);
    if (!isInitial) {
      soundPlayer.play(charm.sound || 'glass', 0.8);
    }
  }
}

// Mouse interaction and hit testing
let isHovering = false;
let isDragging = false;
let lastPointerPos = { x: 0, y: 0 };
let lastPointerTime = performance.now();
let pointerVelocity = { x: 0, y: 0 };
let clickThroughState = true; // window is currently ignoring mouse

function setWindowIgnoreMouse(ignore) {
  if (clickThroughState !== ignore) {
    clickThroughState = ignore;
    ipcRenderer.send('set-ignore-mouse-events', ignore, { forward: true });
  }
}

window.addEventListener('mousemove', (e) => {
  const now = performance.now();
  const dt = Math.max(0.001, (now - lastPointerTime) / 1000);
  const currentPos = { x: e.clientX, y: e.clientY };

  pointerVelocity = {
    x: (currentPos.x - lastPointerPos.x) / dt,
    y: (currentPos.y - lastPointerPos.y) / dt
  };

  lastPointerPos = currentPos;
  lastPointerTime = now;

  if (isDragging) {
    sim.updateDrag(currentPos, pointerVelocity);
    return;
  }

  const hovering = sim.canGrab(currentPos);
  if (hovering !== isHovering) {
    isHovering = hovering;
    canvas.style.cursor = isHovering ? 'grab' : 'default';
    if (currentSettings.overlay.isClickThrough) {
      setWindowIgnoreMouse(!isHovering);
    }
  }
});

window.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  const pos = { x: e.clientX, y: e.clientY };
  if (sim.beginDrag(pos)) {
    isDragging = true;
    canvas.style.cursor = 'grabbing';
    setWindowIgnoreMouse(false);
    soundPlayer.play(currentCharm.sound || 'wood', 0.6);
  }
});

window.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    sim.endDrag();
    canvas.style.cursor = isHovering ? 'grab' : 'default';
    soundPlayer.play(currentCharm.sound || 'wood', Math.min(1.0, Math.hypot(pointerVelocity.x, pointerVelocity.y) / 800));
    if (currentSettings.overlay.isClickThrough && !isHovering) {
      setWindowIgnoreMouse(true);
    }
  }
});

window.addEventListener('mouseleave', () => {
  if (isDragging) {
    isDragging = false;
    sim.endDrag();
    canvas.style.cursor = 'default';
  }
  isHovering = false;
  if (currentSettings.overlay.isClickThrough) {
    setWindowIgnoreMouse(true);
  }
});

// Periodic hit-check for Windows when cursor is outside Electron window:
// Electron forwards mouse move, or we poll cursor position via IPC
ipcRenderer.on('cursor-screen-check', (event, cursorLocal) => {
  if (isDragging) return;
  const hovering = sim.canGrab(cursorLocal);
  if (hovering !== isHovering) {
    isHovering = hovering;
    canvas.style.cursor = isHovering ? 'grab' : 'default';
    if (currentSettings.overlay.isClickThrough) {
      setWindowIgnoreMouse(!isHovering);
    }
  }
});

// Drawing routine
function draw(snapshot) {
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  if (snapshot.points.length < 2) {
    ctx.restore();
    return;
  }

  const defaultPalette = {
    primary: CharmColor.rgb(0.85, 0.75, 0.45),
    secondary: CharmColor.rgb(0.65, 0.55, 0.30),
    deep: CharmColor.rgb(0.35, 0.25, 0.10),
    light: CharmColor.rgb(1.0, 0.95, 0.80)
  };
  const charmPalette = currentCharm.palette || defaultPalette;
  const cordPalette = currentCharm.cordTint || charmPalette;
  const charmCenter = snapshot.charmCenter;
  const charmRadius = snapshot.charmRadius;

  // 1. Ambient Glow
  drawAmbientGlow(charmCenter, charmRadius, charmPalette);

  // 2. Cord
  drawCord(snapshot, cordPalette);

  // 3. Beads
  drawBeads(snapshot);

  // 4. Charm
  drawCharm(snapshot);

  // 5. Knot ring
  drawKnot(snapshot, cordPalette);

  ctx.restore();
}

function drawAmbientGlow(center, radius, palette) {
  if (radius < 2) return;
  const glowR = radius * 1.7;
  const c = palette.primary;
  const grad = ctx.createRadialGradient(center.x, center.y, radius * 0.8, center.x, center.y, glowR);
  grad.addColorStop(0, `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, 0.20)`);
  grad.addColorStop(0.5, `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, 0.08)`);
  grad.addColorStop(1, `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, 0)`);

  ctx.beginPath();
  ctx.arc(center.x, center.y, glowR, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
}

function drawCord(snapshot, palette) {
  const points = sim.curve.polyline(snapshot.cordLength);
  if (points.length < 2) return;

  const cordWidth = Math.max(1.5, snapshot.charmRadius * 0.046);

  // Path generator
  const createPath = (dx = 0, dy = 0) => {
    const p = new Path2D();
    p.moveTo(points[0].x + dx, points[0].y + dy);
    for (let i = 1; i < points.length; i++) {
      p.lineTo(points[i].x + dx, points[i].y + dy);
    }
    return p;
  };

  const ropePath = createPath();
  const shadowPath = createPath(0, cordWidth * 0.8);

  // Shadow 1
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.10)';
  ctx.lineWidth = cordWidth * 2.6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke(shadowPath);

  // Shadow 2
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.14)';
  ctx.lineWidth = cordWidth * 1.5;
  ctx.stroke(shadowPath);
  ctx.restore();

  // Cord body gradient
  ctx.save();
  const grad = ctx.createLinearGradient(snapshot.anchor.x, snapshot.anchor.y, snapshot.charmCenter.x, snapshot.charmCenter.y);
  grad.addColorStop(0, CharmColor.toCss(palette.secondary));
  grad.addColorStop(1, CharmColor.toCss(palette.primary));

  ctx.strokeStyle = grad;
  ctx.lineWidth = cordWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke(ropePath);

  // Cord twist
  if (cordWidth > 1.4) {
    const pitch = cordWidth * 1.5;
    const across = cordWidth * 0.20;

    // Light strand
    ctx.save();
    ctx.strokeStyle = CharmColor.toCss({ ...palette.light, a: 0.30 });
    ctx.lineWidth = cordWidth * 0.55;
    ctx.setLineDash([pitch * 0.42, pitch * 0.58]);
    ctx.stroke(createPath(-across, -across));
    ctx.restore();

    // Deep strand
    ctx.save();
    ctx.strokeStyle = CharmColor.toCss({ ...palette.deep, a: 0.45 });
    ctx.lineWidth = cordWidth * 0.45;
    ctx.setLineDash([pitch * 0.34, pitch * 0.66]);
    ctx.lineDashOffset = pitch * 0.5;
    ctx.stroke(createPath(across, across));
    ctx.restore();
  }

  // Highlight along edge
  ctx.save();
  ctx.strokeStyle = CharmColor.toCss({ ...palette.light, a: 0.38 });
  ctx.lineWidth = Math.max(0.75, cordWidth * 0.3);
  ctx.stroke(createPath(-cordWidth * 0.18, -cordWidth * 0.18));
  ctx.restore();

  ctx.restore();
}

function drawBeads(snapshot) {
  if (!snapshot.beads || snapshot.beads.length === 0) return;
  const cacheEntry = svgCache[currentCharm.id];

  snapshot.beads.forEach((bead, index) => {
    ctx.save();
    ctx.translate(bead.position.x, bead.position.y);
    ctx.rotate(bead.angle - Math.PI / 2);

    if (cacheEntry && cacheEntry.loaded && cacheEntry.rasterCanvas && cacheEntry.regions && cacheEntry.regions.beads && cacheEntry.regions.beads[index]) {
      // Draw SVG bead slice from offscreen raster canvas
      const r = cacheEntry.regions.beads[index];
      const rSize = cacheEntry.rasterSize || 512;

      const sx = r.x * rSize;
      const sy = r.y * rSize;
      const sw = r.width * rSize;
      const sh = r.height * rSize;

      ctx.drawImage(cacheEntry.rasterCanvas, sx, sy, sw, sh, -bead.size.width / 2, -bead.size.height / 2, bead.size.width, bead.size.height);
    } else {
      // Generic smooth bead
      const radius = Math.min(bead.size.width, bead.size.height) / 2;
      const p = currentCharm.palette || {
        light: CharmColor.rgb(1, 1, 1),
        primary: CharmColor.rgb(0.8, 0.8, 0.8),
        secondary: CharmColor.rgb(0.5, 0.5, 0.5)
      };
      const grad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius);
      grad.addColorStop(0, CharmColor.toCss(p.light));
      grad.addColorStop(0.6, CharmColor.toCss(p.primary));
      grad.addColorStop(1, CharmColor.toCss(p.secondary));

      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  });
}

function drawCharm(snapshot) {
  const center = snapshot.charmCenter;
  const radius = snapshot.charmRadius;
  const rotation = snapshot.charmAngle - (Math.PI / 2);

  if (currentCharm.type === 'svg') {
    const entry = svgCache[currentCharm.id];
    if (entry && entry.loaded && entry.rasterCanvas) {
      ctx.save();
      ctx.translate(center.x, center.y);
      ctx.rotate(rotation);

      // Contact drop shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = radius * 0.30;
      ctx.shadowOffsetY = radius * 0.16;

      const rSize = entry.rasterSize || 512;

      if (entry.regions && entry.regions.body) {
        const body = entry.regions.body;
        const sx = body.x * rSize;
        const sy = body.y * rSize;
        const sw = body.width * rSize;
        const sh = body.height * rSize;

        const longest = Math.max(body.width, body.height) || 1;
        const dw = (radius * 2) * (body.width / longest);
        const dh = (radius * 2) * (body.height / longest);

        ctx.drawImage(entry.rasterCanvas, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);
      } else {
        const dw = radius * 2;
        const dh = radius * 2;
        ctx.drawImage(entry.rasterCanvas, 0, 0, rSize, rSize, -dw / 2, -dh / 2, dw, dh);
      }

      ctx.restore();
    }
  } else if (currentCharm.type === 'custom') {
    const customImg = getCustomImage(currentCharm);
    if (customImg && customImg.complete && customImg.naturalWidth > 0) {
      ctx.save();
      ctx.translate(center.x, center.y);
      ctx.rotate(rotation);

      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = radius * 0.30;
      ctx.shadowOffsetY = radius * 0.16;

      const longest = Math.max(customImg.naturalWidth, customImg.naturalHeight) || 1;
      const dw = (radius * 2) * (customImg.naturalWidth / longest);
      const dh = (radius * 2) * (customImg.naturalHeight / longest);

      ctx.drawImage(customImg, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();
    }
  } else {
    // Geometric classic charm
    ClassicCharms.draw(ctx, currentCharm, center, radius, 1.0);
  }
}

function drawKnot(snapshot, palette) {
  const radius = snapshot.charmRadius;
  if (radius <= 1) return;
  if (currentCharm.type === 'svg') return; // SVG has its own loop

  const dirX = Math.cos(snapshot.charmAngle);
  const dirY = Math.sin(snapshot.charmAngle);
  const knotDist = radius * snapshot.charmKnotInset;
  const kx = snapshot.charmCenter.x - (dirX * knotDist);
  const ky = snapshot.charmCenter.y - (dirY * knotDist);
  const ringRadius = radius * 0.2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(kx, ky, ringRadius, 0, Math.PI * 2);
  ctx.strokeStyle = CharmColor.toCss({ ...palette.light, a: 0.9 });
  ctx.lineWidth = Math.max(1, radius * 0.07);
  ctx.stroke();
  ctx.restore();
}

// Animation Clock
let lastFrameTime = performance.now();

function frameLoop(time) {
  const dt = Math.min(0.1, (time - lastFrameTime) / 1000);
  lastFrameTime = time;

  sim.step(dt);
  const snapshot = sim.snapshot();
  draw(snapshot);

  requestAnimationFrame(frameLoop);
}

// Start simulation and animation clock immediately
sim.start();
applyCharm(currentCharm, true);
requestAnimationFrame(frameLoop);

// IPC Handlers
ipcRenderer.on('init-settings', (event, settings) => {
  currentSettings = settings;
  if (settings.sound) {
    soundPlayer.volume = settings.sound.volume ?? 1.0;
    soundPlayer.enabled = settings.sound.enabled ?? true;
  }
  const charm = resolveCharm(settings.overlay.charmId);
  applyCharm(charm, true);
});

ipcRenderer.on('update-settings', (event, newSettings) => {
  currentSettings = newSettings;
  if (newSettings.sound) {
    soundPlayer.volume = newSettings.sound.volume ?? 1.0;
    soundPlayer.enabled = newSettings.sound.enabled ?? true;
  }
  if (newSettings.overlay.charmId !== currentCharm.id) {
    const charm = resolveCharm(newSettings.overlay.charmId);
    applyCharm(charm, false);
  }
});

ipcRenderer.on('switch-charm', (event, charmId) => {
  const charm = resolveCharm(charmId);
  applyCharm(charm, false);
});
