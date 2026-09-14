// src/renderer/settings/settings.js
const { ipcRenderer } = require('electron');

// Tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    const tabId = `tab-${btn.dataset.tab}`;
    const targetPane = document.getElementById(tabId);
    if (targetPane) targetPane.classList.add('active');
  });
});

// Controls
const overlayEnabled = document.getElementById('overlay-enabled');
const soundEnabled = document.getElementById('sound-enabled');
const soundVolume = document.getElementById('sound-volume');
const volumeVal = document.getElementById('volume-val');
const launchAtLogin = document.getElementById('launch-at-login');

const segBtns = document.querySelectorAll('.seg-btn');
const overlayScale = document.getElementById('overlay-scale');
const scaleVal = document.getElementById('scale-val');
const overlayOpacity = document.getElementById('overlay-opacity');
const opacityVal = document.getElementById('opacity-val');
const overlayOffsetX = document.getElementById('overlay-offset-x');
const offsetXVal = document.getElementById('offset-x-val');
const overlayOffsetY = document.getElementById('overlay-offset-y');
const offsetYVal = document.getElementById('offset-y-val');

const clickThrough = document.getElementById('click-through');
const screenEdge = document.getElementById('screen-edge');
const btnReset = document.getElementById('btn-reset');

let settings = {};

function populate(s) {
  settings = s;

  overlayEnabled.checked = !!s.overlay.isEnabled;
  soundEnabled.checked = !!s.sound.enabled;
  soundVolume.value = Math.round((s.sound.volume ?? 1.0) * 100);
  volumeVal.textContent = `${soundVolume.value}%`;
  launchAtLogin.checked = !!s.startup.launchAtLogin;

  segBtns.forEach(b => {
    b.classList.toggle('active', b.dataset.anchor === s.overlay.anchor);
  });

  overlayScale.value = Math.round((s.overlay.scale ?? 1.0) * 100);
  scaleVal.textContent = `${(overlayScale.value / 100).toFixed(1)}x`;

  overlayOpacity.value = Math.round((s.overlay.opacity ?? 1.0) * 100);
  opacityVal.textContent = `${overlayOpacity.value}%`;

  overlayOffsetX.value = s.overlay.horizontalOffset ?? 12;
  offsetXVal.textContent = `${overlayOffsetX.value} px`;

  overlayOffsetY.value = s.overlay.verticalOffset ?? -12;
  offsetYVal.textContent = `${overlayOffsetY.value} px`;

  clickThrough.checked = !!s.overlay.isClickThrough;
  screenEdge.checked = !!s.overlay.anchorsToScreenEdge;
}

// Load initial settings
ipcRenderer.invoke('get-settings').then(populate);

function save() {
  const updated = {
    overlay: {
      isEnabled: overlayEnabled.checked,
      scale: overlayScale.value / 100,
      opacity: overlayOpacity.value / 100,
      horizontalOffset: parseInt(overlayOffsetX.value, 10),
      verticalOffset: parseInt(overlayOffsetY.value, 10),
      isClickThrough: clickThrough.checked,
      anchorsToScreenEdge: screenEdge.checked
    },
    sound: {
      enabled: soundEnabled.checked,
      volume: soundVolume.value / 100
    },
    startup: {
      launchAtLogin: launchAtLogin.checked
    }
  };

  ipcRenderer.invoke('save-settings', updated).then(populate);
}

// Bind Events
overlayEnabled.addEventListener('change', save);
soundEnabled.addEventListener('change', save);

soundVolume.addEventListener('input', () => {
  volumeVal.textContent = `${soundVolume.value}%`;
});
soundVolume.addEventListener('change', save);

launchAtLogin.addEventListener('change', save);

segBtns.forEach(b => {
  b.addEventListener('click', () => {
    segBtns.forEach(btn => btn.classList.remove('active'));
    b.classList.add('active');
    ipcRenderer.invoke('save-settings', {
      overlay: { anchor: b.dataset.anchor }
    }).then(populate);
  });
});

overlayScale.addEventListener('input', () => {
  scaleVal.textContent = `${(overlayScale.value / 100).toFixed(1)}x`;
});
overlayScale.addEventListener('change', save);

overlayOpacity.addEventListener('input', () => {
  opacityVal.textContent = `${overlayOpacity.value}%`;
});
overlayOpacity.addEventListener('change', save);

overlayOffsetX.addEventListener('input', () => {
  offsetXVal.textContent = `${overlayOffsetX.value} px`;
});
overlayOffsetX.addEventListener('change', save);

overlayOffsetY.addEventListener('input', () => {
  offsetYVal.textContent = `${overlayOffsetY.value} px`;
});
overlayOffsetY.addEventListener('change', save);

clickThrough.addEventListener('change', save);
screenEdge.addEventListener('change', save);

btnReset.addEventListener('click', () => {
  if (confirm('Reset all settings to default values?')) {
    ipcRenderer.invoke('reset-settings').then(populate);
  }
});
