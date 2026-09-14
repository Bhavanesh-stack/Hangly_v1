// scripts/test-screenshot.js
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 740,
    height: 420,
    show: false,
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });

  win.webContents.on('console-message', (e, level, msg) => {
    console.log('[BROWSER]', msg);
  });

  await win.loadFile(path.join(__dirname, '..', 'src', 'renderer', 'overlay', 'index.html'));

  win.webContents.send('switch-charm', 'sunflower');

  // Wait 2 seconds for rasterization and physics animation
  await new Promise(r => setTimeout(r, 2000));

  const image = await win.capturePage();
  const outPath = path.join(__dirname, '..', 'overlay-sunflower.png');
  fs.writeFileSync(outPath, image.toPNG());
  console.log('Saved screenshot to:', outPath);

  app.quit();
});
