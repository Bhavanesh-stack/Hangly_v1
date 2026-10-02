// src/shared/charms/custom-store.js
// Storage and manager for user-imported custom charms.

const fs = require('fs');
const path = require('path');

class CustomCharmStore {
  constructor(appDataPath) {
    this.baseDir = this.resolveBaseDir(appDataPath);
    this.metadataFile = path.join(this.baseDir, 'charms.json');
    this.ensureDirectory();
  }

  resolveBaseDir(appDataPath) {
    if (appDataPath) {
      return path.join(appDataPath, 'Hangly', 'Charms');
    }

    try {
      const electron = require('electron');
      const app = electron.app || (electron.remote && electron.remote.app);
      if (app && app.getPath) {
        return path.join(app.getPath('userData'), 'Hangly', 'Charms');
      }
    } catch (e) {}

    // Check Windows APPDATA paths
    if (process.platform === 'win32' && process.env.APPDATA) {
      const candidates = [
        path.join(process.env.APPDATA, 'Hangly', 'Hangly', 'Charms'),
        path.join(process.env.APPDATA, 'hangly', 'Hangly', 'Charms'),
        path.join(process.env.APPDATA, 'Hangly', 'Charms'),
        path.join(process.env.APPDATA, 'hangly', 'Charms')
      ];
      for (const cand of candidates) {
        if (fs.existsSync(cand)) return cand;
      }
      return candidates[0];
    }

    return path.join(__dirname, '..', '..', '..', 'user_charms');
  }

  ensureDirectory() {
    try {
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true });
      }
      if (!fs.existsSync(this.metadataFile)) {
        fs.writeFileSync(this.metadataFile, JSON.stringify([], null, 2));
      }
    } catch (e) {
      console.error('Failed to init custom charm store directory:', e);
    }
  }

  loadCharms() {
    try {
      if (fs.existsSync(this.metadataFile)) {
        const raw = fs.readFileSync(this.metadataFile, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      // Check alternative AppData locations
      if (process.platform === 'win32' && process.env.APPDATA) {
        const altFiles = [
          path.join(process.env.APPDATA, 'Hangly', 'Hangly', 'Charms', 'charms.json'),
          path.join(process.env.APPDATA, 'hangly', 'Hangly', 'Charms', 'charms.json')
        ];
        for (const f of altFiles) {
          if (fs.existsSync(f)) {
            const parsed = JSON.parse(fs.readFileSync(f, 'utf8'));
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          }
        }
      }
    } catch (e) {
      console.error('Failed to load custom charms:', e);
    }
    return [];
  }

  saveCharm(charmData, imageBuffer, ext = '.png') {
    this.ensureDirectory();
    const id = 'custom_' + Date.now();
    const filename = `${id}${ext}`;
    const imagePath = path.join(this.baseDir, filename);

    fs.writeFileSync(imagePath, imageBuffer);

    const newEntry = {
      id,
      name: charmData.name || 'Custom Charm',
      category: 'custom',
      type: 'custom',
      imagePath: imagePath,
      mass: charmData.mass || 3.0,
      radiusRatio: charmData.radiusRatio || 0.15,
      knotInset: charmData.knotInset || 0.85,
      sound: charmData.sound || 'soft',
      createdAt: new Date().toISOString()
    };

    const charms = this.loadCharms();
    charms.unshift(newEntry);
    fs.writeFileSync(this.metadataFile, JSON.stringify(charms, null, 2));
    return newEntry;
  }

  deleteCharm(id) {
    let charms = this.loadCharms();
    const target = charms.find(c => c.id === id);
    if (target && target.imagePath && fs.existsSync(target.imagePath)) {
      try {
        fs.unlinkSync(target.imagePath);
      } catch (e) {
        console.error('Failed to delete image file:', e);
      }
    }
    charms = charms.filter(c => c.id !== id);
    fs.writeFileSync(this.metadataFile, JSON.stringify(charms, null, 2));
    return charms;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CustomCharmStore };
}
