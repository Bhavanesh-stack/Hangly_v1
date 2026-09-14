// src/renderer/studio/studio.js
const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

const { RopeSimulation } = require('../../shared/physics/rope-simulation');
const { RopeConfiguration } = require('../../shared/physics/rope-configuration');
const { SoundPlayer } = require('../../shared/audio/synthesizer');

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const dropContent = document.getElementById('drop-content');
const imagePreview = document.getElementById('image-preview');

const charmName = document.getElementById('charm-name');
const charmSound = document.getElementById('charm-sound');
const charmMass = document.getElementById('charm-mass');
const massVal = document.getElementById('mass-val');
const charmScale = document.getElementById('charm-scale');
const scaleVal = document.getElementById('scale-val');
const btnSave = document.getElementById('btn-save');

const canvas = document.getElementById('studio-canvas');
const ctx = canvas.getContext('2d');

let loadedImage = null;
let rawFileBuffer = null;
let rawExt = '.png';
const soundPlayer = new SoundPlayer();

// Live Preview Simulation
const sim = new RopeSimulation({
  configuration: RopeConfiguration.fitted({ width: 320, height: 380 }),
  anchor: { x: 160, y: 16 },
  charmMetrics: {
    mass: 3.0,
    radiusRatio: 0.15,
    knotInset: 0.85
  }
});
sim.start();

// Drop zone interactions
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    handleFile(e.dataTransfer.files[0]);
  }
});

fileInput.addEventListener('change', () => {
  if (fileInput.files && fileInput.files[0]) {
    handleFile(fileInput.files[0]);
  }
});

function handleFile(file) {
  rawExt = path.extname(file.name) || '.png';
  const reader = new FileReader();
  reader.onload = (event) => {
    const dataUrl = event.target.result;
    const base64 = dataUrl.split(',')[1];
    rawFileBuffer = base64;

    const img = new Image();
    img.onload = () => {
      loadedImage = img;
      imagePreview.src = dataUrl;
      imagePreview.style.display = 'block';
      dropContent.style.display = 'none';
      btnSave.disabled = false;

      const baseName = path.basename(file.name, rawExt);
      if (baseName && baseName !== 'image') {
        charmName.value = baseName;
      }
      sim.reset();
      soundPlayer.play(charmSound.value, 0.7);
    };
    img.src = dataUrl;
  };
  reader.readAsDataURL(file);
}

// Slider listeners
charmMass.addEventListener('input', () => {
  const val = (charmMass.value / 10).toFixed(1);
  massVal.textContent = val;
  sim.setCharmMetrics({ mass: parseFloat(val) });
});

charmScale.addEventListener('input', () => {
  const val = (charmScale.value / 100).toFixed(2);
  scaleVal.textContent = val;
  sim.setCharmMetrics({ radiusRatio: parseFloat(val) });
});

charmSound.addEventListener('change', () => {
  soundPlayer.play(charmSound.value, 0.8);
});

btnSave.addEventListener('click', async () => {
  if (!rawFileBuffer) return;

  btnSave.disabled = true;
  btnSave.textContent = 'Saving…';

  const charmData = {
    name: charmName.value.trim() || 'Custom Charm',
    sound: charmSound.value,
    mass: parseFloat((charmMass.value / 10).toFixed(1)),
    radiusRatio: parseFloat((charmScale.value / 100).toFixed(2)),
    knotInset: 0.85
  };

  const saved = await ipcRenderer.invoke('save-custom-charm', charmData, rawFileBuffer, rawExt);
  await ipcRenderer.invoke('select-charm', saved.id);

  btnSave.textContent = 'Charm Hung on Desktop!';
  setTimeout(() => {
    btnSave.textContent = 'Save & Hang Charm';
    btnSave.disabled = false;
  }, 2000);
});

// Interactive Rope Simulation Loop
let lastTime = performance.now();

function loop(time) {
  const dt = Math.min(0.1, (time - lastTime) / 1000);
  lastTime = time;

  sim.step(dt);
  const snap = sim.snapshot();

  ctx.clearRect(0, 0, 320, 380);

  // Draw rope
  const pts = sim.curve.polyline(snap.cordLength);
  if (pts.length > 1) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.strokeStyle = '#c79e4d';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Draw charm
  const c = snap.charmCenter;
  const r = snap.charmRadius;
  const angle = snap.charmAngle - Math.PI / 2;

  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(angle);

  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = r * 0.3;
  ctx.shadowOffsetY = r * 0.15;

  if (loadedImage) {
    const naturalW = loadedImage.naturalWidth || loadedImage.width;
    const naturalH = loadedImage.naturalHeight || loadedImage.height;
    const longest = Math.max(naturalW, naturalH);
    const dw = (r * 2) * (naturalW / longest);
    const dh = (r * 2) * (naturalH / longest);
    ctx.drawImage(loadedImage, -dw / 2, -dh / 2, dw, dh);
  } else {
    // Placeholder sphere
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = '#4f380f';
    ctx.fill();
    ctx.strokeStyle = '#c79e4d';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.restore();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Mouse drag on canvas
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  sim.beginDrag(pos);
  soundPlayer.play(charmSound.value, 0.5);
});

window.addEventListener('mousemove', (e) => {
  if (sim.isDragging) {
    const rect = canvas.getBoundingClientRect();
    const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    sim.updateDrag(pos, { x: 0, y: 0 });
  }
});

window.addEventListener('mouseup', () => {
  if (sim.isDragging) {
    sim.endDrag();
    soundPlayer.play(charmSound.value, 0.7);
  }
});
