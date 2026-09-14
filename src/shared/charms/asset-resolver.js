// src/shared/charms/asset-resolver.js
// Robust asset path resolver that handles case-sensitivity, ASAR archives, and dev environments.

const path = require('path');
const fs = require('fs');

function findExistingPath(candidates) {
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch (e) {}
  }
  return candidates[0];
}

function getCharmSvgPath(filename) {
  if (!filename) return null;

  const baseNames = [
    filename,
    filename.toLowerCase(),
    filename.charAt(0).toUpperCase() + filename.slice(1)
  ];

  const searchDirs = [
    path.join(__dirname, '..', '..', '..', 'Assets', 'Charms'),
    path.join(__dirname, '..', '..', '..', 'assets', 'charms'),
    path.join(__dirname, '..', '..', 'Assets', 'Charms'),
    path.join(__dirname, '..', '..', 'assets', 'charms'),
    path.join(process.cwd(), 'Assets', 'Charms'),
    path.join(process.cwd(), 'assets', 'charms')
  ];

  if (process.resourcesPath) {
    searchDirs.push(
      path.join(process.resourcesPath, 'app.asar', 'Assets', 'Charms'),
      path.join(process.resourcesPath, 'app.asar', 'assets', 'charms'),
      path.join(process.resourcesPath, 'Assets', 'Charms'),
      path.join(process.resourcesPath, 'assets', 'charms')
    );
  }

  // Check each dir with each casing variant
  for (const dir of searchDirs) {
    for (const name of baseNames) {
      const full = path.join(dir, name);
      try {
        if (fs.existsSync(full)) return full;
      } catch (e) {}
    }
    // Also try case-insensitive directory listing match
    try {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        const match = files.find(f => f.toLowerCase() === filename.toLowerCase());
        if (match) return path.join(dir, match);
      }
    } catch (e) {}
  }

  // Fallback to default relative
  return path.join(__dirname, '..', '..', '..', 'Assets', 'Charms', filename);
}

function getCharmLibraryJsonPath() {
  const candidates = [
    path.join(__dirname, '..', '..', '..', 'Assets', 'CharmLibrary.json'),
    path.join(__dirname, '..', '..', '..', 'assets', 'CharmLibrary.json'),
    path.join(__dirname, '..', '..', 'Assets', 'CharmLibrary.json'),
    path.join(__dirname, '..', '..', 'assets', 'CharmLibrary.json'),
    path.join(process.cwd(), 'Assets', 'CharmLibrary.json'),
    path.join(process.cwd(), 'assets', 'CharmLibrary.json')
  ];
  if (process.resourcesPath) {
    candidates.push(
      path.join(process.resourcesPath, 'app.asar', 'Assets', 'CharmLibrary.json'),
      path.join(process.resourcesPath, 'app.asar', 'assets', 'CharmLibrary.json'),
      path.join(process.resourcesPath, 'Assets', 'CharmLibrary.json'),
      path.join(process.resourcesPath, 'assets', 'CharmLibrary.json')
    );
  }
  return findExistingPath(candidates);
}

function getIconPath(filename) {
  const candidates = [
    path.join(__dirname, '..', '..', '..', 'Assets', 'Icons', filename),
    path.join(__dirname, '..', '..', '..', 'assets', 'icons', filename),
    path.join(__dirname, '..', '..', 'Assets', 'Icons', filename),
    path.join(__dirname, '..', '..', 'assets', 'icons', filename),
    path.join(process.cwd(), 'Assets', 'Icons'),
    path.join(process.cwd(), 'assets', 'icons')
  ];
  if (process.resourcesPath) {
    candidates.push(
      path.join(process.resourcesPath, 'app.asar', 'Assets', 'Icons', filename),
      path.join(process.resourcesPath, 'app.asar', 'assets', 'icons', filename),
      path.join(process.resourcesPath, 'Assets', 'Icons', filename),
      path.join(process.resourcesPath, 'assets', 'icons', filename)
    );
  }
  return findExistingPath(candidates);
}

module.exports = {
  getCharmSvgPath,
  getCharmLibraryJsonPath,
  getIconPath
};
