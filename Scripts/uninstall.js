// scripts/uninstall.js
// Completely removes Hangly, its user data, preferences, caches, and autostart registry keys.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== Hangly Complete Application Uninstaller ===\n');

// 1. Terminate running instances
console.log('1. Stopping running Hangly instances...');
try {
  if (process.platform === 'win32') {
    execSync('taskkill /F /IM Hangly.exe 2>nul', { stdio: 'ignore' });
    execSync('taskkill /F /IM electron.exe 2>nul', { stdio: 'ignore' });
  }
} catch (e) {}

// 2. Remove Windows Autostart Registry entry
if (process.platform === 'win32') {
  console.log('2. Removing Windows startup registry entries...');
  try {
    execSync('reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v Hangly /f 2>nul', { stdio: 'ignore' });
  } catch (e) {}
}

// 3. Remove AppData directories (settings, custom charms, caches)
console.log('3. Deleting application data, custom charms, and preferences...');
const targets = [];

if (process.platform === 'win32' && process.env.APPDATA) {
  targets.push(path.join(process.env.APPDATA, 'Hangly'));
  targets.push(path.join(process.env.APPDATA, 'hangly'));
}

if (process.platform === 'darwin') {
  const home = process.env.HOME || '';
  targets.push(path.join(home, 'Library', 'Application Support', 'Hangly'));
  targets.push(path.join(home, 'Library', 'Preferences', 'com.hangly.Hangly.plist'));
}

for (const target of targets) {
  try {
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
      console.log(`   ✓ Deleted: ${target}`);
    }
  } catch (err) {
    console.warn(`   ⚠ Could not delete ${target}: ${err.message}`);
  }
}

// 4. Remove Desktop Shortcuts if present
if (process.platform === 'win32' && process.env.USERPROFILE) {
  const desktopShortcut = path.join(process.env.USERPROFILE, 'Desktop', 'Hangly.lnk');
  try {
    if (fs.existsSync(desktopShortcut)) {
      fs.unlinkSync(desktopShortcut);
      console.log(`   ✓ Removed Desktop shortcut: ${desktopShortcut}`);
    }
  } catch (e) {}
}

console.log('\n✓ Hangly application and all associated data have been completely deleted.');
