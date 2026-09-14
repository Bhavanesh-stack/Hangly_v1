const { app, BrowserWindow } = require('electron');
const path = require('path');
const { CharmCatalog } = require('../src/shared/charms/catalog');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 740,
    height: 420,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false
    }
  });

  await win.loadFile(path.join(__dirname, '..', 'src', 'renderer', 'overlay', 'index.html'));

  console.log('Testing all 17 charms dynamically in overlay window...');
  const results = [];

  for (const charm of CharmCatalog) {
    win.webContents.send('switch-charm', charm.id);
    await new Promise(r => setTimeout(r, 600));

    const diag = await win.webContents.executeJavaScript(`
      (() => {
        for (let i = 0; i < 20; i++) sim.step(1/60);
        const c = document.getElementById('rope-canvas');
        const snap = sim.snapshot();
        draw(snap);
        const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        let count = 0;
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] > 20) count++;
        }
        const cached = svgCache['${charm.id}'];
        return {
          id: '${charm.id}',
          name: '${charm.name}',
          type: '${charm.type}',
          pixelCount: count,
          charmCenterY: Math.round(snap.charmCenter.y),
          cachedLoaded: cached ? cached.loaded : false,
          beadsOnSim: sim.beads.length
        };
      })()
    `);

    console.log('  [' + diag.type.toUpperCase() + '] ' + diag.name.padEnd(16) + ' -> pixels: ' + diag.pixelCount + ', centerY: ' + diag.charmCenterY + ', beads: ' + diag.beadsOnSim);
    results.push(diag);
  }

  const failures = results.filter(r => r.pixelCount < 1000 || r.charmCenterY < 100);
  if (failures.length > 0) {
    console.error('\nFAILURES detected:', failures);
  } else {
    console.log('\nALL 17 CHARMS RENDER BEAUTIFULLY!');
  }

  app.quit();
});
