// src/main/tray.js
// Windows System Tray (Taskbar Notification Area) Integration.

const { app, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const { CharmCatalog } = require('../shared/charms/catalog');

class HanglyTray {
  constructor(appContext) {
    this.ctx = appContext;
    this.tray = null;
    this.init();
  }

  init() {
    const iconPath = path.join(__dirname, '..', '..', 'assets', 'icons', 'hangly.ico');
    let icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      const pngPath = path.join(__dirname, '..', '..', 'assets', 'icons', 'hangly-icon-128.png');
      icon = nativeImage.createFromPath(pngPath).resize({ width: 16, height: 16 });
    }

    this.tray = new Tray(icon);
    this.tray.setToolTip('Hangly - A tiny piece of motion for your desktop');

    this.updateMenu();

    this.tray.on('double-click', () => {
      this.ctx.toggleOverlay();
    });
  }

  updateMenu() {
    const settings = this.ctx.settingsStore.settings;
    const isOverlayVisible = settings.overlay.isEnabled;
    const currentCharmId = settings.overlay.charmId;

    // Build Charm submenu
    const charmSubmenu = CharmCatalog.map(charm => ({
      label: charm.name,
      type: 'radio',
      checked: charm.id === currentCharmId,
      click: () => {
        this.ctx.setCharm(charm.id);
      }
    }));

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show Overlay',
        type: 'checkbox',
        checked: isOverlayVisible,
        accelerator: 'CmdOrCtrl+Shift+O',
        click: () => {
          this.ctx.toggleOverlay();
        }
      },
      {
        label: 'Charm',
        submenu: charmSubmenu
      },
      { type: 'separator' },
      {
        label: 'Charm Library…',
        accelerator: 'CmdOrCtrl+L',
        click: () => {
          this.ctx.openLibraryWindow();
        }
      },
      {
        label: 'Charm Studio…',
        accelerator: 'CmdOrCtrl+N',
        click: () => {
          this.ctx.openStudioWindow();
        }
      },
      { type: 'separator' },
      {
        label: 'Settings…',
        accelerator: 'CmdOrCtrl+,',
        click: () => {
          this.ctx.openSettingsWindow();
        }
      },
      { type: 'separator' },
      {
        label: 'Quit Hangly',
        accelerator: 'CmdOrCtrl+Q',
        click: () => {
          app.quit();
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HanglyTray };
}
