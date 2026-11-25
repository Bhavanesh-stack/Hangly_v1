// src/main/main.js
// Main process for Hangly Windows desktop application.

const { app, BrowserWindow, ipcMain, screen, nativeImage, powerMonitor } = require('electron');
const path = require('path');
const { SettingsStore } = require('./store');
const { HanglyTray } = require('./tray');
const { CustomCharmStore } = require('../shared/charms/custom-store');

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let overlayWindow = null;
let settingsWindow = null;
let libraryWindow = null;
let studioWindow = null;
let tray = null;
let cursorPollInterval = null;
let isScreenLocked = false;
let lockTimestamp = 0;
let wasDesktopInaccessible = false;

const settingsStore = new SettingsStore(app.getPath('userData'));
const customCharmStore = new CustomCharmStore(app.getPath('userData'));

const BASE_WIDTH = 740;
const BASE_HEIGHT = 420;

function calculateOverlayBounds() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { overlay } = settingsStore.settings;

  const scale = overlay.scale || 1.0;
  const width = Math.round(BASE_WIDTH * scale);
  const height = Math.round(BASE_HEIGHT * scale);

  const bounds = overlay.anchorsToScreenEdge
    ? primaryDisplay.bounds
    : primaryDisplay.workArea;

  let x = bounds.x;
  let y = bounds.y + (overlay.verticalOffset || 0);

  switch (overlay.anchor) {
    case 'topLeading': // Top Left
      x = bounds.x + (overlay.horizontalOffset || 12);
      break;
    case 'topCenter': // Top Center
      x = bounds.x + Math.round((bounds.width - width) / 2) + (overlay.horizontalOffset || 0);
      break;
    case 'topTrailing': // Top Right (Default)
    default:
      x = bounds.x + bounds.width - width - (overlay.horizontalOffset || 12);
      break;
  }

  // Safety clamp to ensure overlay always stays visible on screen
  const minVisible = Math.min(200, width / 2);
  x = Math.max(bounds.x - width + minVisible, Math.min(bounds.x + bounds.width - minVisible, x));
  y = Math.max(bounds.y - 30, Math.min(bounds.y + bounds.height - 120, y));

  return { x, y, width, height };
}

function createOverlayWindow() {
  if (overlayWindow) return;

  const initialBounds = calculateOverlayBounds();

  overlayWindow = new BrowserWindow({
    ...initialBounds,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    focusable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false
    }
  });

  overlayWindow.setAlwaysOnTop(true, 'screen-saver');
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  applyOverlayWindowSettings();

  overlayWindow.loadFile(path.join(__dirname, '..', 'renderer', 'overlay', 'index.html'));

  overlayWindow.webContents.on('did-finish-load', () => {
    overlayWindow.webContents.send('init-settings', settingsStore.settings);
  });

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });

  // Start cursor monitor poll to detect hovering when clicks are forwarded
  startCursorPolling();
}

function applyOverlayWindowSettings() {
  if (!overlayWindow || overlayWindow.isDestroyed()) return;
  const { overlay } = settingsStore.settings;
  const opacity = typeof overlay.opacity === 'number'
    ? Math.max(0.2, Math.min(1.0, overlay.opacity))
    : 1.0;
  overlayWindow.setOpacity(opacity);

  if (overlay.isClickThrough) {
    overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  } else {
    overlayWindow.setIgnoreMouseEvents(false);
  }
}

function restoreOverlayAfterUnlock() {
  if (isScreenLocked || !settingsStore.settings.overlay.isEnabled) return;
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    createOverlayWindow();
    return;
  }

  overlayWindow.showInactive();
  // Toggle alwaysOnTop so Windows DWM re-asserts HWND_TOPMOST after lock screen / UAC
  overlayWindow.setAlwaysOnTop(false);
  overlayWindow.setAlwaysOnTop(true, 'screen-saver');
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  repositionOverlay();
  applyOverlayWindowSettings();
  overlayWindow.moveTop();
  overlayWindow.webContents.invalidate();
  overlayWindow.webContents.send('screen-unlocked');
}

function startCursorPolling() {
  if (cursorPollInterval) clearInterval(cursorPollInterval);

  cursorPollInterval = setInterval(() => {
    if (!overlayWindow || overlayWindow.isDestroyed()) return;
    try {
      const cursor = screen.getCursorScreenPoint();

      // Fallback unlock detection if Windows missed powerMonitor unlock-screen
      if (isScreenLocked && Date.now() - lockTimestamp > 1500) {
        isScreenLocked = false;
        wasDesktopInaccessible = false;
        restoreOverlayAfterUnlock();
        return;
      }

      if (wasDesktopInaccessible) {
        wasDesktopInaccessible = false;
        restoreOverlayAfterUnlock();
        return;
      }

      if (isScreenLocked || !overlayWindow.isVisible()) return;
      const winBounds = overlayWindow.getBounds();

      if (
        cursor.x >= winBounds.x &&
        cursor.x <= winBounds.x + winBounds.width &&
        cursor.y >= winBounds.y &&
        cursor.y <= winBounds.y + winBounds.height
      ) {
        const local = {
          x: cursor.x - winBounds.x,
          y: cursor.y - winBounds.y
        };
        overlayWindow.webContents.send('cursor-screen-check', local);
      }
    } catch (err) {
      // Windows throws when desktop is locked or on secure desktop (UAC)
      wasDesktopInaccessible = true;
    }
  }, 33); // ~30Hz polling
}

function repositionOverlay() {
  if (!overlayWindow || overlayWindow.isDestroyed()) return;
  const newBounds = calculateOverlayBounds();
  overlayWindow.setBounds(newBounds);
}

function syncOverlayVisibility() {
  const isEnabled = settingsStore.settings.overlay.isEnabled;
  if (isEnabled) {
    if (!overlayWindow || overlayWindow.isDestroyed()) {
      createOverlayWindow();
    } else {
      overlayWindow.showInactive();
      overlayWindow.setAlwaysOnTop(true, 'screen-saver');
      overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      repositionOverlay();
      applyOverlayWindowSettings();
    }
  } else {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.hide();
    }
  }
}

function toggleOverlay() {
  const current = settingsStore.settings.overlay.isEnabled;
  settingsStore.save({ overlay: { isEnabled: !current } });
  syncOverlayVisibility();
  if (tray) tray.updateMenu();
}

function setCharm(charmId) {
  settingsStore.save({ overlay: { charmId } });
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    const customs = customCharmStore.loadCharms();
    const customCharm = customs.find(c => c.id === charmId);
    overlayWindow.webContents.send('switch-charm', charmId, customCharm);
    overlayWindow.webContents.send('update-settings', settingsStore.settings);
  }
  if (tray) tray.updateMenu();
}

// Window Management: Settings
function openSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 560,
    height: 600,
    title: 'Hangly Settings',
    autoHideMenuBar: true,
    resizable: false,
    maximizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  settingsWindow.loadFile(path.join(__dirname, '..', 'renderer', 'settings', 'index.html'));

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

// Window Management: Charm Library
function openLibraryWindow() {
  if (libraryWindow) {
    libraryWindow.focus();
    return;
  }

  libraryWindow = new BrowserWindow({
    width: 820,
    height: 600,
    title: 'Charm Library',
    autoHideMenuBar: true,
    resizable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  libraryWindow.loadFile(path.join(__dirname, '..', 'renderer', 'library', 'index.html'));

  libraryWindow.on('closed', () => {
    libraryWindow = null;
  });
}

// Window Management: Charm Studio
function openStudioWindow() {
  if (studioWindow) {
    studioWindow.focus();
    return;
  }

  studioWindow = new BrowserWindow({
    width: 720,
    height: 540,
    title: 'Charm Studio',
    autoHideMenuBar: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  studioWindow.loadFile(path.join(__dirname, '..', 'renderer', 'studio', 'index.html'));

  studioWindow.on('closed', () => {
    studioWindow = null;
  });
}

// IPC Handlers
ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isDestroyed()) {
    win.setIgnoreMouseEvents(ignore, options);
  }
});

ipcMain.handle('get-settings', () => {
  return settingsStore.settings;
});

ipcMain.handle('save-settings', (event, newSettings) => {
  const updated = settingsStore.save(newSettings);
  syncOverlayVisibility();
  repositionOverlay();
  applyOverlayWindowSettings();
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.webContents.send('update-settings', updated);
  }
  if (tray) tray.updateMenu();

  // Startup shortcut
  if (newSettings.startup && typeof newSettings.startup.launchAtLogin === 'boolean') {
    app.setLoginItemSettings({
      openAtLogin: newSettings.startup.launchAtLogin
    });
  }

  return updated;
});

ipcMain.handle('reset-settings', () => {
  const reset = settingsStore.reset();
  syncOverlayVisibility();
  repositionOverlay();
  applyOverlayWindowSettings();
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.webContents.send('update-settings', reset);
  }
  if (tray) tray.updateMenu();
  return reset;
});

ipcMain.handle('select-charm', (event, charmId) => {
  if (!settingsStore.settings.overlay.isEnabled) {
    settingsStore.save({ overlay: { isEnabled: true } });
  }
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    createOverlayWindow();
  } else {
    overlayWindow.showInactive();
    overlayWindow.setAlwaysOnTop(true, 'screen-saver');
  }
  setCharm(charmId);
  return settingsStore.settings;
});

ipcMain.handle('get-custom-charms', () => {
  return customCharmStore.loadCharms();
});

ipcMain.handle('save-custom-charm', (event, charmData, imageBase64, ext) => {
  const buffer = Buffer.from(imageBase64, 'base64');
  const entry = customCharmStore.saveCharm(charmData, buffer, ext);
  return entry;
});

ipcMain.handle('delete-custom-charm', (event, id) => {
  return customCharmStore.deleteCharm(id);
});

// Maintenance & Product Lifecycle IPC Handlers
ipcMain.handle('install-shortcuts', () => {
  try {
    const installScript = path.join(__dirname, '..', '..', 'scripts', 'install.js');
    const { execSync } = require('child_process');
    execSync(`node "${installScript}"`, { stdio: 'pipe' });
    return { success: true, message: 'Desktop & Start Menu shortcuts successfully created!' };
  } catch (err) {
    return { success: false, message: `Failed to install shortcuts: ${err.message}` };
  }
});

ipcMain.handle('check-update', () => {
  try {
    const rootDir = path.resolve(__dirname, '..', '..');
    const { execSync } = require('child_process');
    execSync('git fetch', { cwd: rootDir, stdio: 'pipe' });
    const status = execSync('git status -uno', { cwd: rootDir, encoding: 'utf8' });
    if (status.includes('Your branch is behind') || status.includes('have diverged')) {
      return { success: true, hasUpdate: true, message: 'Update available on GitHub! Run Update-Hangly.cmd or Hangly.cmd to pull and rebuild.' };
    }
    return { success: true, hasUpdate: false, message: 'You are running the latest version of Hangly.' };
  } catch (err) {
    return { success: false, message: `Update check failed: ${err.message}` };
  }
});

ipcMain.handle('uninstall-app', () => {
  try {
    const uninstallScript = path.join(__dirname, '..', '..', 'scripts', 'uninstall.js');
    const { spawn } = require('child_process');
    // Spawn detached uninstaller and quit immediately
    const child = spawn('node', [uninstallScript], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
    setTimeout(() => {
      app.quit();
    }, 400);
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// App Lifecycle
app.whenReady().then(() => {
  tray = new HanglyTray({
    settingsStore,
    customCharmStore,
    toggleOverlay,
    setCharm,
    openSettingsWindow,
    openLibraryWindow,
    openStudioWindow
  });

  if (settingsStore.settings.overlay.isEnabled) {
    createOverlayWindow();
  }

  screen.on('display-metrics-changed', () => {
    repositionOverlay();
  });

  screen.on('display-added', () => {
    repositionOverlay();
  });

  screen.on('display-removed', () => {
    repositionOverlay();
  });

  powerMonitor.on('lock-screen', () => {
    isScreenLocked = true;
    lockTimestamp = Date.now();
    if (overlayWindow && !overlayWindow.isDestroyed() && overlayWindow.isVisible()) {
      overlayWindow.hide();
    }
  });

  powerMonitor.on('unlock-screen', () => {
    isScreenLocked = false;
    wasDesktopInaccessible = false;
    restoreOverlayAfterUnlock();
    // Re-apply after Windows DWM finishes transitioning from the lock screen
    setTimeout(() => {
      if (!isScreenLocked) restoreOverlayAfterUnlock();
    }, 350);
    setTimeout(() => {
      if (!isScreenLocked) restoreOverlayAfterUnlock();
    }, 1000);
  });

  powerMonitor.on('suspend', () => {
    isScreenLocked = true;
    lockTimestamp = Date.now();
    if (overlayWindow && !overlayWindow.isDestroyed() && overlayWindow.isVisible()) {
      overlayWindow.hide();
    }
  });

  powerMonitor.on('resume', () => {
    isScreenLocked = false;
    wasDesktopInaccessible = false;
    restoreOverlayAfterUnlock();
    setTimeout(() => {
      if (!isScreenLocked) restoreOverlayAfterUnlock();
    }, 350);
    setTimeout(() => {
      if (!isScreenLocked) restoreOverlayAfterUnlock();
    }, 1000);
  });
});

app.on('window-all-closed', (e) => {
  // Stay running in system tray on Windows
  e.preventDefault();
});

app.on('will-quit', () => {
  if (cursorPollInterval) clearInterval(cursorPollInterval);
  if (tray) tray.destroy();
});
