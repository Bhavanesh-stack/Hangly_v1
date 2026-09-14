// scripts/test-switch-charms.js
// Tests dynamic charm switching in overlay window for SVG and Classic charms.
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
    console.log('[OVERLAY LOG]', msg);
  });

  await win.loadFile(path.join(__dirname, '..', 'src', 'renderer', 'overlay', 'index.html'));

  const testCharmIds = ['daruma', 'nazar', 'manekiNeko', 'star', 'hamsa', 'heart', 'horseshoe'];

  for (const charmId of testCharmIds) {
    console.log(`\nTesting charm switch to: ${charmId}`);
    win.webContents.send('switch-charm', charmId);

    // Wait for load and simulation step
    await new Promise(r => setTimeout(r, 1200));

    const diag = await win.webContents.executeJavaScript(`
      (() => {
        const c = document.getElementById('rope-canvas');
        const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        let count = 0;
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] > 20) count++;
        }
        const cached = svgCache['${charmId}'];
        return {
          currentCharmId: currentCharm.id,
          cachedLoaded: cached ? cached.loaded : false,
          hasRaster: cached && !!cached.rasterCanvas,
          hasRegions: cached && !!cached.regions,
          beadCount: sim.beads.length,
          pixelCount: count
        };
      })()
    `);

    console.log(`  -> Charm "${charmId}" diagnostic:`, diag);
    if (diag.pixelCount < 500) {
      console.error(`  FAIL: Charm "${charmId}" did not render enough pixels!`);
      process.exit(1);
    }
  }

  console.log('\nAll tested charms (both SVG collection & Classic geometric) rendered successfully!');
  app.quit();
});
