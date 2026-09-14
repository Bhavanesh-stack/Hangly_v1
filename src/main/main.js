// src/main/main.js
// Main process for Hangly Windows desktop application.

const { app, BrowserWindow, ipcMain, screen, nativeImage } = require('electron');
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
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });

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

function startCursorPolling() {
  if (cursorPollInterval) clearInterval(cursorPollInterval);

  cursorPollInterval = setInterval(() => {
    if (!overlayWindow || overlayWindow.isDestroyed()) return;
    const cursor = screen.getCursorScreenPoint();
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
  }, 33); // ~30Hz polling
}

function repositionOverlay() {
  if (!overlayWindow || overlayWindow.isDestroyed()) return;
  const newBounds = calculateOverlayBounds();
  overlayWindow.setBounds(newBounds);
}

function toggleOverlay() {
  const current = settingsStore.settings.overlay.isEnabled;
  settingsStore.save({ overlay: { isEnabled: !current } });

  if (!current) {
    if (!overlayWindow) {
      createOverlayWindow();
    } else {
      overlayWindow.show();
    }
  } else {
    if (overlayWindow) {
      overlayWindow.hide();
    }
  }
  if (tray) tray.updateMenu();
}

function setCharm(charmId) {
  settingsStore.save({ overlay: { charmId } });
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.webContents.send('switch-charm', charmId);
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
  repositionOverlay();
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
  repositionOverlay();
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.webContents.send('update-settings', reset);
  }
  if (tray) tray.updateMenu();
  return reset;
});

ipcMain.handle('select-charm', (event, charmId) => {
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

// App Lifecycle
app.whenReady().then(() => {
  tray = new HanglyTray({
    settingsStore,
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
});

app.on('window-all-closed', (e) => {
  // Stay running in system tray on Windows
  e.preventDefault();
});

app.on('will-quit', () => {
  if (cursorPollInterval) clearInterval(cursorPollInterval);
  if (tray) tray.destroy();
});
