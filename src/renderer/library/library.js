// src/renderer/library/library.js
const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

const { CharmCatalog, getCharmById } = require('../../shared/charms/catalog');
const { ClassicCharms } = require('../../shared/charms/classic-charms');
const { RopeSimulation } = require('../../shared/physics/rope-simulation');
const { RopeConfiguration } = require('../../shared/physics/rope-configuration');
const { getCharmSvgPath, getCharmLibraryJsonPath } = require('../../shared/charms/asset-resolver');

// Load metadata
let libraryMetadata = { charms: [] };
try {
  const jsonPath = getCharmLibraryJsonPath();
  if (jsonPath && fs.existsSync(jsonPath)) {
    libraryMetadata = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  }
} catch (e) {
  console.error('Failed to read CharmLibrary.json:', e);
}

const charmGrid = document.getElementById('charm-grid');
const detailName = document.getElementById('detail-name');
const detailCategory = document.getElementById('detail-category');
const detailRegion = document.getElementById('detail-region');
const detailDesc = document.getElementById('detail-desc');
const detailTags = document.getElementById('detail-tags');
const detailMass = document.getElementById('detail-mass');
const detailSound = document.getElementById('detail-sound');
const detailBeads = document.getElementById('detail-beads');
const btnHang = document.getElementById('btn-hang-charm');

const detailCanvas = document.getElementById('detail-canvas');
const dctx = detailCanvas.getContext('2d');

let activeHangingId = 'daruma';
let selectedCharm = getCharmById('daruma');
let activeCategory = 'all';
let customCharms = [];

// Preview Simulation
const previewSim = new RopeSimulation({
  configuration: RopeConfiguration.fitted({ width: 220, height: 240 }),
  anchor: { x: 110, y: 12 },
  charmMetrics: {
    mass: selectedCharm.mass,
    radiusRatio: selectedCharm.radiusRatio,
    knotInset: selectedCharm.knotInset || 0.94
  }
});
previewSim.start();

function getMetadata(id) {
  return libraryMetadata.charms.find(c => c.id === id) || {};
}

function getAllCharms() {
  return [...CharmCatalog, ...customCharms];
}

function renderGrid() {
  charmGrid.innerHTML = '';
  const list = getAllCharms().filter(c => {
    if (activeCategory === 'all') return true;
    return c.category === activeCategory;
  });

  list.forEach(charm => {
    const meta = getMetadata(charm.id);
    const card = document.createElement('div');
    card.className = 'charm-card';
    if (charm.id === selectedCharm.id) card.classList.add('selected');
    if (charm.id === activeHangingId) card.classList.add('active-hanging');

function getSvgDataUrl(svgPath) {
  try {
    let svgText = fs.readFileSync(svgPath, 'utf8');
    const vbMatch = svgText.match(/viewBox=["']([^"']+)["']/i);
    if (vbMatch && !/<svg[^>]+width=/i.test(svgText)) {
      const parts = vbMatch[1].trim().split(/[\s,]+/).map(Number);
      svgText = svgText.replace(/<svg\b([^>]*)>/i, `<svg width="${parts[2]}" height="${parts[3]}" $1>`);
    }
    return `data:image/svg+xml;base64,${Buffer.from(svgText).toString('base64')}`;
  } catch (e) {
    return `file://${svgPath.replace(/\\/g, '/')}`;
  }
}

    const iconWrap = document.createElement('div');
    iconWrap.className = 'card-icon-wrap';

    if (charm.type === 'svg') {
      const img = document.createElement('img');
      const filename = charm.svgFile || `${charm.name}.svg`;
      const svgPath = getCharmSvgPath(filename);
      img.src = getSvgDataUrl(svgPath);
      iconWrap.appendChild(img);
    } else if (charm.type === 'custom') {
      const img = document.createElement('img');
      img.src = `file://${charm.imagePath.replace(/\\/g, '/')}`;
      iconWrap.appendChild(img);
    } else {
      // Draw geometric mini canvas
      const mini = document.createElement('canvas');
      mini.width = 64;
      mini.height = 64;
      const mctx = mini.getContext('2d');
      ClassicCharms.draw(mctx, charm, { x: 32, y: 32 }, 26);
      iconWrap.appendChild(mini);
    }

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = charm.name;

    const subtitle = document.createElement('div');
    subtitle.className = 'card-subtitle';
    subtitle.textContent = meta.region || (charm.type === 'classic' ? 'Geometric' : 'Custom');

    card.appendChild(iconWrap);
    card.appendChild(title);
    card.appendChild(subtitle);

    card.addEventListener('click', () => {
      selectCharm(charm);
      renderGrid();
    });

    charmGrid.appendChild(card);
  });
}

function selectCharm(charm) {
  selectedCharm = charm;
  const meta = getMetadata(charm.id);

  detailName.textContent = charm.name;
  detailCategory.textContent = charm.category ? charm.category.toUpperCase() : 'CHARM';
  detailRegion.textContent = meta.region || (charm.type === 'classic' ? 'Geometric Classic' : 'Custom Upload');
  detailDesc.textContent = meta.description || 'A unique charm with its own weight, swing dynamics, and acoustic resonance.';

  detailMass.textContent = charm.mass.toFixed(2);
  detailSound.textContent = (charm.sound || 'soft').toUpperCase();
  detailBeads.textContent = charm.beadCount !== undefined ? charm.beadCount : 0;

  detailTags.innerHTML = '';
  const tags = meta.tags || [charm.category, charm.sound || 'glass'];
  tags.forEach(t => {
    const span = document.createElement('span');
    span.className = 'tag-badge';
    span.textContent = t;
    detailTags.appendChild(span);
  });

  previewSim.setCharmMetrics({
    mass: charm.mass,
    radiusRatio: charm.radiusRatio,
    knotInset: charm.knotInset || 0.94
  });
  previewSim.reset();
  updatePreviewImg();
}

// Category filter chips
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeCategory = chip.dataset.cat;
    renderGrid();
  });
});

btnHang.addEventListener('click', () => {
  activeHangingId = selectedCharm.id;
  ipcRenderer.invoke('select-charm', selectedCharm.id);
  renderGrid();
});

// Load settings & custom charms
Promise.all([
  ipcRenderer.invoke('get-settings'),
  ipcRenderer.invoke('get-custom-charms')
]).then(([settings, customs]) => {
  activeHangingId = settings.overlay.charmId;
  customCharms = customs || [];
  const found = getAllCharms().find(c => c.id === activeHangingId);
  if (found) selectCharm(found);
  renderGrid();
});

// Detail Canvas Preview Loop
let previewImg = new Image();

function updatePreviewImg() {
  if (selectedCharm.type === 'svg') {
    const filename = selectedCharm.svgFile || `${selectedCharm.name}.svg`;
    const svgPath = getCharmSvgPath(filename);
    previewImg.src = getSvgDataUrl(svgPath);
  } else if (selectedCharm.type === 'custom') {
    previewImg.src = `file://${selectedCharm.imagePath.replace(/\\/g, '/')}`;
  }
}

let lastLoop = performance.now();
function previewLoop(time) {
  const dt = Math.min(0.1, (time - lastLoop) / 1000);
  lastLoop = time;

  previewSim.step(dt);
  const snap = previewSim.snapshot();

  dctx.clearRect(0, 0, 220, 240);

  // Draw rope
  const pts = previewSim.curve.polyline(snap.cordLength);
  if (pts.length > 1) {
    dctx.beginPath();
    dctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) dctx.lineTo(pts[i].x, pts[i].y);
    dctx.strokeStyle = '#c79e4d';
    dctx.lineWidth = 2.5;
    dctx.stroke();
  }

  // Draw charm
  const c = snap.charmCenter;
  const r = snap.charmRadius;

  if (selectedCharm.type === 'svg' || selectedCharm.type === 'custom') {
    dctx.save();
    dctx.translate(c.x, c.y);
    dctx.rotate(snap.charmAngle - Math.PI / 2);
    if (previewImg.complete && previewImg.naturalWidth > 0) {
      const longest = Math.max(previewImg.naturalWidth, previewImg.naturalHeight);
      const dw = (r * 2) * (previewImg.naturalWidth / longest);
      const dh = (r * 2) * (previewImg.naturalHeight / longest);
      dctx.drawImage(previewImg, -dw / 2, -dh / 2, dw, dh);
    }
    dctx.restore();
  } else {
    ClassicCharms.draw(dctx, selectedCharm, c, r);
  }

  requestAnimationFrame(previewLoop);
}
requestAnimationFrame(previewLoop);

// Interactive nudge on preview canvas
detailCanvas.addEventListener('mousedown', (e) => {
  const rect = detailCanvas.getBoundingClientRect();
  const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  previewSim.beginDrag(pos);
});
window.addEventListener('mousemove', (e) => {
  if (previewSim.isDragging) {
    const rect = detailCanvas.getBoundingClientRect();
    const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    previewSim.updateDrag(pos, { x: 0, y: 0 });
  }
});
window.addEventListener('mouseup', () => {
  if (previewSim.isDragging) {
    previewSim.endDrag();
  }
});
