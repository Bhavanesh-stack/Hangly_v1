// src/renderer/library/library.js
// Charm Library window controller: manages catalog browsing, real-time physics preview, customization, and charm activation.

const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

const { CharmCatalog, getCharmById } = require('../../shared/charms/catalog');
const { ClassicCharms } = require('../../shared/charms/classic-charms');
const { RopeSimulation } = require('../../shared/physics/rope-simulation');
const { RopeConfiguration } = require('../../shared/physics/rope-configuration');
const { getCharmSvgPath, getCharmLibraryJsonPath } = require('../../shared/charms/asset-resolver');
const { RopeRenderer } = require('../../shared/charms/rope-renderer');
const { SoundPlayer } = require('../../shared/audio/synthesizer');

// Load metadata manifest
let libraryMetadata = { charms: [] };
try {
  const jsonPath = getCharmLibraryJsonPath();
  if (jsonPath && fs.existsSync(jsonPath)) {
    libraryMetadata = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  }
} catch (e) {
  console.error('Failed to read CharmLibrary.json:', e);
}

// DOM Elements
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

// Edit Controls
const editSize = document.getElementById('edit-size');
const editSizeVal = document.getElementById('edit-size-val');
const editSound = document.getElementById('edit-sound');
const editRopeStyle = document.getElementById('edit-rope-style');
const editMass = document.getElementById('edit-mass');
const editMassVal = document.getElementById('edit-mass-val');
const btnTestSound = document.getElementById('btn-test-sound');
const btnResetCustom = document.getElementById('btn-reset-custom');

// Detail Preview Canvas
const detailCanvas = document.getElementById('detail-canvas');
const dctx = detailCanvas.getContext('2d');

// Audio Player
const soundPlayer = new SoundPlayer();
soundPlayer.preload();

// State
let activeHangingId = 'daruma';
let selectedCharm = getCharmById('daruma');
let activeCategory = 'all';
let customCharms = [];
let appSettings = { overlay: { charmCustomizations: {}, charmId: 'daruma' }, sound: { enabled: true, volume: 1.0 } };

// Initialize Preview Simulation
const previewSim = new RopeSimulation({
  configuration: RopeConfiguration.fitted({ width: 220, height: 240 }),
  anchor: { x: 110, y: 12 },
  charmMetrics: {
    mass: selectedCharm.mass || 3.0,
    radiusRatio: selectedCharm.radiusRatio || 0.15,
    knotInset: selectedCharm.knotInset || 0.94
  }
});
previewSim.start();

// Image Conversion Helpers (cached for snappy grid rendering)
const svgDataUrlCache = {};
function getSvgDataUrl(svgPath) {
  if (!svgPath) return '';
  if (svgDataUrlCache[svgPath]) return svgDataUrlCache[svgPath];
  try {
    if (!fs.existsSync(svgPath)) return '';
    let svgText = fs.readFileSync(svgPath, 'utf8');
    const vbMatch = svgText.match(/viewBox=["']([^"']+)["']/i);
    if (vbMatch && !/<svg[^>]+width=/i.test(svgText)) {
      const parts = vbMatch[1].trim().split(/[\s,]+/).map(Number);
      svgText = svgText.replace(/<svg\b([^>]*)>/i, `<svg width="${parts[2]}" height="${parts[3]}" $1>`);
    }
    const url = `data:image/svg+xml;base64,${Buffer.from(svgText).toString('base64')}`;
    svgDataUrlCache[svgPath] = url;
    return url;
  } catch (e) {
    return `file:///${svgPath.replace(/\\/g, '/')}`;
  }
}

function getLocalImageDataUrl(imagePath) {
  try {
    if (imagePath && fs.existsSync(imagePath)) {
      const ext = path.extname(imagePath).toLowerCase().replace('.', '') || 'png';
      const mime = ext === 'svg' ? 'image/svg+xml' : (ext === 'webp' ? 'image/webp' : (ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'));
      const b64 = fs.readFileSync(imagePath).toString('base64');
      return `data:${mime};base64,${b64}`;
    }
  } catch (e) {}
  return imagePath ? `file:///${imagePath.replace(/\\/g, '/')}` : '';
}

function getMetadata(id) {
  return (libraryMetadata.charms && libraryMetadata.charms.find(c => c.id === id)) || {};
}

function getAllCharms() {
  return [...CharmCatalog, ...customCharms];
}

function getCharmCustomization(charmId) {
  return (appSettings.overlay && appSettings.overlay.charmCustomizations && appSettings.overlay.charmCustomizations[charmId]) || null;
}

function getEffectiveMetrics(charm) {
  if (!charm) return { scale: 1.0, sound: 'soft', ropeStyle: 'silk', mass: 3.0, radiusRatio: 0.15, knotInset: 0.94 };
  const custom = getCharmCustomization(charm.id);
  const scale = (custom && custom.scale !== undefined) ? custom.scale : 1.0;
  const sound = (custom && custom.sound) ? custom.sound : (charm.sound || 'soft');
  const ropeStyle = (custom && custom.ropeStyle) ? custom.ropeStyle : (charm.ropeStyle || 'silk');
  const mass = (custom && custom.mass !== undefined) ? custom.mass : (charm.mass || 3.0);
  const radiusRatio = (charm.radiusRatio || 0.15) * scale;
  return { scale, sound, ropeStyle, mass, radiusRatio, knotInset: charm.knotInset || 0.94 };
}

function saveCurrentCharmCustomization() {
  if (!selectedCharm) return;
  if (!appSettings.overlay) appSettings.overlay = {};
  if (!appSettings.overlay.charmCustomizations) appSettings.overlay.charmCustomizations = {};

  const scale = parseInt(editSize.value, 10) / 100;
  const sound = editSound.value;
  const ropeStyle = editRopeStyle.value;
  const mass = parseFloat(editMass.value);

  appSettings.overlay.charmCustomizations[selectedCharm.id] = {
    scale,
    sound,
    ropeStyle,
    mass
  };

  ipcRenderer.invoke('save-settings', {
    overlay: {
      charmCustomizations: appSettings.overlay.charmCustomizations
    }
  });
}

function renderGrid() {
  if (!charmGrid) return;
  charmGrid.innerHTML = '';
  const list = getAllCharms().filter(c => {
    if (activeCategory === 'all') return true;
    return c.category === activeCategory;
  });

  list.forEach(charm => {
    const meta = getMetadata(charm.id);
    const card = document.createElement('div');
    card.className = 'charm-card';
    if (selectedCharm && charm.id === selectedCharm.id) card.classList.add('selected');
    if (charm.id === activeHangingId) card.classList.add('active-hanging');

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
      img.src = getLocalImageDataUrl(charm.imagePath);
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
    subtitle.textContent = meta.region || (charm.type === 'geometric' ? 'Geometric' : (charm.type === 'svg' ? 'Hangly Collection' : 'Custom'));

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

// Detail Canvas Preview Image
let previewImg = new Image();
let previewImgReady = false;
previewImg.onload = () => {
  previewImgReady = true;
};
previewImg.onerror = () => {
  previewImgReady = false;
};

function updatePreviewImg() {
  if (!selectedCharm) return;
  previewImgReady = false;
  if (selectedCharm.type === 'svg') {
    const filename = selectedCharm.svgFile || `${selectedCharm.name}.svg`;
    const svgPath = getCharmSvgPath(filename);
    previewImg.src = getSvgDataUrl(svgPath);
  } else if (selectedCharm.type === 'custom') {
    previewImg.src = getLocalImageDataUrl(selectedCharm.imagePath);
  } else {
    previewImg.src = '';
  }
}

function selectCharm(charm) {
  if (!charm) return;
  selectedCharm = charm;
  const meta = getMetadata(charm.id);
  const metrics = getEffectiveMetrics(charm);

  if (detailName) detailName.textContent = charm.name;
  if (detailCategory) detailCategory.textContent = charm.category ? charm.category.toUpperCase() : 'CHARM';
  if (detailRegion) detailRegion.textContent = meta.region || (charm.type === 'geometric' ? 'Geometric Classic' : 'Custom Upload');
  if (detailDesc) detailDesc.textContent = meta.description || 'A unique charm with its own weight, swing dynamics, and acoustic resonance.';

  if (detailMass) detailMass.textContent = metrics.mass.toFixed(2);
  if (detailSound) detailSound.textContent = metrics.sound.toUpperCase();
  if (detailBeads) detailBeads.textContent = charm.beadCount !== undefined ? charm.beadCount : 0;

  // Update edit form values
  if (editSize) {
    editSize.value = Math.round(metrics.scale * 100);
    if (editSizeVal) editSizeVal.textContent = `${editSize.value}%`;
  }
  if (editSound) editSound.value = metrics.sound;
  if (editRopeStyle) editRopeStyle.value = metrics.ropeStyle || 'silk';
  if (editMass) {
    editMass.value = metrics.mass.toFixed(1);
    if (editMassVal) editMassVal.textContent = `${metrics.mass.toFixed(2)}`;
  }

  if (detailTags) {
    detailTags.innerHTML = '';
    const tags = meta.tags || [charm.category || 'charm', metrics.sound || 'glass'];
    tags.forEach(t => {
      const span = document.createElement('span');
      span.className = 'tag-badge';
      span.textContent = t;
      detailTags.appendChild(span);
    });
  }

  previewSim.setCharmMetrics({
    mass: metrics.mass,
    radiusRatio: metrics.radiusRatio,
    knotInset: metrics.knotInset
  });
  previewSim.reset();
  updatePreviewImg();
}

// Edit Section Event Listeners
if (editSize) {
  editSize.addEventListener('input', () => {
    if (editSizeVal) editSizeVal.textContent = `${editSize.value}%`;
    const scale = parseInt(editSize.value, 10) / 100;
    const effectiveRadiusRatio = (selectedCharm.radiusRatio || 0.15) * scale;

    previewSim.setCharmMetrics({
      radiusRatio: effectiveRadiusRatio,
      mass: parseFloat(editMass.value) || selectedCharm.mass,
      knotInset: selectedCharm.knotInset || 0.94
    });
  });
  editSize.addEventListener('change', () => {
    saveCurrentCharmCustomization();
  });
}

if (editSound) {
  editSound.addEventListener('change', () => {
    if (detailSound) detailSound.textContent = editSound.value.toUpperCase();
    soundPlayer.play(editSound.value, 0.9);
    saveCurrentCharmCustomization();
  });
}

if (editRopeStyle) {
  editRopeStyle.addEventListener('change', () => {
    saveCurrentCharmCustomization();
  });
}

if (btnTestSound) {
  btnTestSound.addEventListener('click', () => {
    soundPlayer.play(editSound.value, 0.95);
  });
}

if (editMass) {
  editMass.addEventListener('input', () => {
    const val = parseFloat(editMass.value);
    if (editMassVal) editMassVal.textContent = val.toFixed(2);
    if (detailMass) detailMass.textContent = val.toFixed(2);
    previewSim.setCharmMetrics({
      mass: val
    });
  });
  editMass.addEventListener('change', () => {
    saveCurrentCharmCustomization();
  });
}

if (btnResetCustom) {
  btnResetCustom.addEventListener('click', () => {
    if (appSettings.overlay && appSettings.overlay.charmCustomizations) {
      delete appSettings.overlay.charmCustomizations[selectedCharm.id];
      ipcRenderer.invoke('save-settings', {
        overlay: {
          charmCustomizations: appSettings.overlay.charmCustomizations
        }
      });
    }
    selectCharm(selectedCharm);
  });
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

if (btnHang) {
  btnHang.addEventListener('click', () => {
    activeHangingId = selectedCharm.id;
    saveCurrentCharmCustomization();
    const metrics = getEffectiveMetrics(selectedCharm);
    soundPlayer.play(metrics.sound || 'wood', 0.95);
    ipcRenderer.invoke('select-charm', selectedCharm.id);
    renderGrid();
  });
}

// Load settings & custom charms
Promise.all([
  ipcRenderer.invoke('get-settings'),
  ipcRenderer.invoke('get-custom-charms')
]).then(([settings, customs]) => {
  if (settings) {
    appSettings = settings;
    if (settings.overlay && settings.overlay.charmId) {
      activeHangingId = settings.overlay.charmId;
    }
  }
  customCharms = customs || [];
  const found = getAllCharms().find(c => c.id === activeHangingId) || getAllCharms()[0];
  if (found) selectCharm(found);
  renderGrid();
}).catch(err => {
  console.error('Failed to load settings in library:', err);
  renderGrid();
});

// Detail Canvas Preview Loop
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
    const metrics = getEffectiveMetrics(selectedCharm);
    const ropeStyle = editRopeStyle ? editRopeStyle.value : (metrics.ropeStyle || 'silk');
    RopeRenderer.draw(dctx, {
      points: pts,
      snapshot: snap,
      style: ropeStyle,
      palette: selectedCharm.palette,
      time: performance.now(),
      scale: 1.0
    });
    if (selectedCharm.type !== 'svg') {
      RopeRenderer.drawKnotRing(dctx, snap, ropeStyle, selectedCharm.palette);
    }
  }

  // Draw charm
  const c = snap.charmCenter;
  const r = snap.charmRadius;

  if (selectedCharm.type === 'svg' || selectedCharm.type === 'custom') {
    dctx.save();
    dctx.translate(c.x, c.y);
    dctx.rotate(snap.charmAngle - Math.PI / 2);
    if (previewImgReady && previewImg.complete && previewImg.naturalWidth > 0) {
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
if (detailCanvas) {
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
}
