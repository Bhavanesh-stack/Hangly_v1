// Scripts/make-helm-charm.js
// Uses Electron canvas to process the ship wheel image into a transparent, perfectly framed charm SVG.

const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });

  await win.loadURL('about:blank');

  const imgPath = path.join('C:', 'Users', 'bhava', '.gemini', 'antigravity-ide', 'brain', 'b2d6b424-95ac-42a9-a7a7-b0fca259dfea', '.user_uploaded', 'media_1791044003252.png');
  const base64 = fs.readFileSync(imgPath).toString('base64');

  const result = await win.webContents.executeJavaScript(`
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, c.width, c.height);
        const data = imgData.data;
        const w = c.width;
        const h = c.height;

        // Sample background color from top-left corner
        const bgR = data[0];
        const bgG = data[1];
        const bgB = data[2];

        // Breadth-first search / flood fill transparency from border edges
        const visited = new Uint8Array(w * h);
        const queue = [];

        // Add borders to queue
        for (let x = 0; x < w; x++) {
          queue.push(x, 0);
          queue.push(x, h - 1);
          visited[0 * w + x] = 1;
          visited[(h - 1) * w + x] = 1;
        }
        for (let y = 0; y < h; y++) {
          queue.push(0, y);
          queue.push(w - 1, y);
          visited[y * w + 0] = 1;
          visited[y * w + (w - 1)] = 1;
        }

        let head = 0;
        while (head < queue.length) {
          const cx = queue[head++];
          const cy = queue[head++];
          const idx = (cy * w + cx) * 4;

          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // Check if close to background color (within threshold)
          const diff = Math.max(Math.abs(r - bgR), Math.abs(g - bgG), Math.abs(b - bgB));
          if (diff < 32) {
            data[idx + 3] = 0; // Make transparent

            // Check neighbors
            const neighbors = [
              [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]
            ];
            for (const [nx, ny] of neighbors) {
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                const nPos = ny * w + nx;
                if (!visited[nPos]) {
                  visited[nPos] = 1;
                  queue.push(nx, ny);
                }
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);

        // Find bounding box of remaining content
        let minX = w, maxX = 0, minY = h, maxY = 0;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const a = data[(y * w + x) * 4 + 3];
            if (a > 20) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        const cropW = maxX - minX + 1;
        const cropH = maxY - minY + 1;
        const cropSize = Math.max(cropW, cropH);

        const outCanvas = document.createElement('canvas');
        outCanvas.width = cropSize;
        outCanvas.height = cropSize;
        const outCtx = outCanvas.getContext('2d');

        const offsetX = (cropSize - cropW) / 2;
        const offsetY = (cropSize - cropH) / 2;
        outCtx.drawImage(c, minX, minY, cropW, cropH, offsetX, offsetY, cropW, cropH);

        resolve(outCanvas.toDataURL('image/png'));
      };
      img.src = 'data:image/png;base64,' + '${base64}';
    })
  `);

  const pngBase64 = result.replace(/^data:image\/png;base64,/, '');
  const outPngPath = path.join(__dirname, '..', 'Assets', 'Charms', 'OnePiece_Helm.png');
  fs.writeFileSync(outPngPath, Buffer.from(pngBase64, 'base64'));
  console.log('Saved transparent OnePiece_Helm.png');

  // Now create the full SVG Charm with top suspension cord, Straw Hat beads, and the Ship Wheel
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg id="OnePiece_Helm" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 94 165" width="94" height="165">
  <defs>

    <!-- ===== CORD GRADIENT ===== -->
    <linearGradient id="helm-cord" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#3b0202"/>
      <stop offset="30%"  stop-color="#800000"/>
      <stop offset="65%"  stop-color="#d90429"/>
      <stop offset="100%" stop-color="#3b0202"/>
    </linearGradient>

    <!-- ===== GOLD GRADIENTS ===== -->
    <radialGradient id="helm-gold" cx="38%" cy="28%" r="68%">
      <stop offset="0%"   stop-color="#fff3b0"/>
      <stop offset="35%"  stop-color="#f0c030"/>
      <stop offset="70%"  stop-color="#c88000"/>
      <stop offset="100%" stop-color="#6b3a00"/>
    </radialGradient>

    <!-- ===== STRAW HAT BEAD ===== -->
    <radialGradient id="helm-straw-bead" cx="35%" cy="28%" r="70%">
      <stop offset="0%"   stop-color="#ffffff"/>
      <stop offset="35%"  stop-color="#ffd000"/>
      <stop offset="70%"  stop-color="#e69500"/>
      <stop offset="100%" stop-color="#805000"/>
    </radialGradient>

    <!-- ===== LOG POSE COMPASS BEAD ===== -->
    <radialGradient id="helm-compass-bead" cx="35%" cy="28%" r="70%">
      <stop offset="0%"   stop-color="#ffffff"/>
      <stop offset="30%"  stop-color="#cce6ff"/>
      <stop offset="65%"  stop-color="#3385ff"/>
      <stop offset="100%" stop-color="#003380"/>
    </radialGradient>

    <!-- ===== DROP SHADOW ===== -->
    <filter id="helm-shadow" x="-20%" y="-15%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="3.5" flood-color="#000008" flood-opacity="0.50"/>
    </filter>

    <!-- ===== SHIP WHEEL GLOW ===== -->
    <filter id="helm-glow" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="1.0" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>

  </defs>

  <!-- =====================================================
       SECTION 1 — SUSPENSION CORD  (y 0–48)
       ===================================================== -->

  <!-- Main braided pirate rope -->
  <line x1="47" y1="0" x2="47" y2="48"
        stroke="url(#helm-cord)" stroke-width="3.4" stroke-linecap="round"/>
  <!-- Gold highlight thread -->
  <line x1="46.2" y1="0" x2="46.2" y2="48"
        stroke="#f0c030" stroke-width="0.5" stroke-linecap="round" opacity="0.7"/>

  <!-- =====================================================
       BEAD 1 — Straw Hat Gold Sphere (y ≈ 8–19)
       ===================================================== -->
  <path d="M43.5 8.5 Q47 10.5 50.5 8.5 L50 7.5 Q47 9.2 44 7.5 Z" fill="url(#helm-gold)"/>
  <circle cx="47" cy="14" r="5.8" fill="url(#helm-straw-bead)"/>
  <!-- Red ribbon band on straw bead -->
  <path d="M41.8 14 Q47 16 52.2 14" stroke="#d90429" stroke-width="1.6" fill="none"/>
  <ellipse cx="45" cy="12" rx="2.2" ry="1.3" fill="#ffffff" opacity="0.94"/>
  <path d="M43.5 19.5 Q47 17.5 50.5 19.5 L50 20.5 Q47 18.8 44 20.5 Z" fill="url(#helm-gold)"/>

  <!-- =====================================================
       BEAD 2 — Log Pose Compass Sphere (y ≈ 24–37)
       ===================================================== -->
  <path d="M42.5 23 Q47 25 51.5 23 L51 22 Q47 23.8 43 22 Z" fill="url(#helm-gold)"/>
  <circle cx="47" cy="30" r="7" fill="url(#helm-compass-bead)"/>
  <!-- Glass needle glint -->
  <line x1="44" y1="28" x2="50" y2="32" stroke="#ffffff" stroke-width="1.0" opacity="0.8"/>
  <ellipse cx="45" cy="27.5" rx="2.6" ry="1.5" fill="#ffffff" opacity="0.90"/>
  <circle cx="49.5" cy="31.5" r="1.0" fill="#f8e060" opacity="0.80"/>
  <path d="M42.5 37 Q47 35 51.5 37 L51 38 Q47 36.2 43 38 Z" fill="url(#helm-gold)"/>

  <!-- =====================================================
       ATTACHMENT KNOT RING (y ≈ 42–50)
       ===================================================== -->
  <circle cx="47" cy="46" r="4.8" fill="none" stroke="url(#helm-gold)" stroke-width="2.6"/>
  <circle cx="47" cy="46" r="2.2" fill="#150500"/>
  <line x1="47" y1="42" x2="47" y2="50" stroke="url(#helm-cord)" stroke-width="3.4" stroke-linecap="round"/>
  <circle cx="47" cy="46" r="4.8" fill="none" stroke="url(#helm-gold)" stroke-width="2.2" opacity="0.92"/>

  <!-- =====================================================
       SECTION 2 — PIRATE SHIP HELM (WHEEL) BODY (y ≈ 50–165)
       ===================================================== -->
  <g filter="url(#helm-shadow)">

    <!-- Top spoke connecting ring -->
    <path d="M45.5 49 L48.5 49 L48 56 L46 56 Z" fill="url(#helm-gold)"/>

    <!-- The Pirate Ship Wheel Image with Straw Hat Jolly Roger -->
    <g transform="translate(47, 107)">
      <image href="${result}" x="-41" y="-41" width="82" height="82" preserveAspectRatio="xMidYMid meet"/>
    </g>

  </g>

</svg>
`;

  const svgDest = path.join(__dirname, '..', 'Assets', 'Charms', 'OnePiece_Helm.svg');
  fs.writeFileSync(svgDest, svgContent, 'utf8');
  console.log('Saved OnePiece_Helm.svg successfully!');

  // Also create a Luffy variant with the helm
  const luffySvgDest = path.join(__dirname, '..', 'Assets', 'Charms', 'Luffy.svg');
  fs.writeFileSync(luffySvgDest, svgContent, 'utf8');
  console.log('Updated Luffy.svg to use One Piece Ship Wheel design!');

  app.quit();
});
