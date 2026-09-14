// src/shared/charms/custom-store.js
// Storage and manager for user-imported custom charms.

const fs = require('fs');
const path = require('path');

class CustomCharmStore {
  constructor(appDataPath) {
    this.baseDir = appDataPath ? path.join(appDataPath, 'Hangly', 'Charms') : path.join(__dirname, '..', '..', '..', 'user_charms');
    this.metadataFile = path.join(this.baseDir, 'charms.json');
    this.ensureDirectory();
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
        return JSON.parse(raw);
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
