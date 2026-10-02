// src/main/tray.js
// Windows System Tray (Taskbar Notification Area) Integration.

const { app, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const { CharmCatalog } = require('../shared/charms/catalog');
const { getIconPath } = require('../shared/charms/asset-resolver');

class HanglyTray {
  constructor(appContext) {
    this.ctx = appContext;
    this.tray = null;
    this.init();
  }

  init() {
    const iconPath = getIconPath('hangly.ico');
    let icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      const pngPath = getIconPath('hangly-icon-128.png');
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

    if (this.ctx.customCharmStore) {
      const customs = this.ctx.customCharmStore.loadCharms();
      if (customs && customs.length > 0) {
        charmSubmenu.push({ type: 'separator' });
        customs.forEach(c => {
          charmSubmenu.push({
            label: `${c.name} (Custom)`,
            type: 'radio',
            checked: c.id === currentCharmId,
            click: () => {
              this.ctx.setCharm(c.id);
            }
          });
        });
      }
    }

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
        label: 'Create Desktop Shortcut',
        click: () => {
          try {
            const installScript = path.join(__dirname, '..', '..', 'scripts', 'install.js');
            const { execSync } = require('child_process');
            execSync(`node "${installScript}"`, { stdio: 'pipe' });
          } catch (e) {}
        }
      },
      {
        label: 'Check for Updates…',
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
