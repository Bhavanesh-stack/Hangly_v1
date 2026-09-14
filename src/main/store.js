// src/main/store.js
// Persistent application settings store.

const fs = require('fs');
const path = require('path');

const DefaultSettings = {
  overlay: {
    isEnabled: true,
    anchor: 'topTrailing', // 'topLeading', 'topCenter', 'topTrailing'
    scale: 1.0,
    opacity: 1.0,
    horizontalOffset: 12,
    verticalOffset: -12,
    isClickThrough: true,
    anchorsToScreenEdge: true,
    charmId: 'daruma'
  },
  sound: {
    enabled: true,
    volume: 1.0
  },
  startup: {
    launchAtLogin: false
  }
};

class SettingsStore {
  constructor(appDataPath) {
    this.dir = appDataPath ? path.join(appDataPath, 'Hangly') : path.join(__dirname, '..', '..', 'data');
    this.filepath = path.join(this.dir, 'settings.json');
    this.settings = this.load();
  }

  load() {
    try {
      if (!fs.existsSync(this.dir)) {
        fs.mkdirSync(this.dir, { recursive: true });
      }
      if (fs.existsSync(this.filepath)) {
        const data = fs.readFileSync(this.filepath, 'utf8');
        const parsed = JSON.parse(data);
        return {
          overlay: { ...DefaultSettings.overlay, ...(parsed.overlay || {}) },
          sound: { ...DefaultSettings.sound, ...(parsed.sound || {}) },
          startup: { ...DefaultSettings.startup, ...(parsed.startup || {}) }
        };
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    return JSON.parse(JSON.stringify(DefaultSettings));
  }

  save(newSettings) {
    try {
      if (!fs.existsSync(this.dir)) {
        fs.mkdirSync(this.dir, { recursive: true });
      }
      this.settings = {
        overlay: { ...this.settings.overlay, ...(newSettings.overlay || {}) },
        sound: { ...this.settings.sound, ...(newSettings.sound || {}) },
        startup: { ...this.settings.startup, ...(newSettings.startup || {}) }
      };
      fs.writeFileSync(this.filepath, JSON.stringify(this.settings, null, 2));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
    return this.settings;
  }

  reset() {
    this.settings = JSON.parse(JSON.stringify(DefaultSettings));
    try {
      fs.writeFileSync(this.filepath, JSON.stringify(this.settings, null, 2));
    } catch (e) {}
    return this.settings;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SettingsStore, DefaultSettings };
}
