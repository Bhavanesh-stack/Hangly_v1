// Scripts/create-onepiece-charms.js
// Creates high-resolution, perfectly-formatted SVG charms for One Piece Straw Hat Pirates:
// Luffy, Zoro, Nami, Sanji.

const fs = require('fs');
const path = require('path');

const userUploadedDir = path.join('C:', 'Users', 'bhava', '.gemini', 'antigravity-ide', 'brain', 'b2d6b424-95ac-42a9-a7a7-b0fca259dfea', '.user_uploaded');
const charmsDir = path.join(__dirname, '..', 'Assets', 'Charms');

const characters = [
  {
    id: 'luffy',
    name: 'Luffy',
    file: 'Luffy.svg',
    imgFile: 'media_1791043203999.jpg',
    cordColors: ['#4a0404', '#990000', '#d90429', '#ff4d6d'],
    bead1: { name: 'Straw Gold', fill: 'url(#luffy-gold-bead)', highlight: '#fff3b0' },
    bead2: { name: 'Ruby Meat', fill: 'url(#luffy-ruby-bead)', highlight: '#ff99aa' },
    bgGrad: ['#ff0033', '#cc0029', '#80001a'],
    bezelColors: ['#fff3b0', '#f0c030', '#c08010', '#7a4800', '#3d1c00'],
    sound: 'drum',
    accent: '#ff0033'
  },
  {
    id: 'zoro',
    name: 'Zoro',
    file: 'Zoro.svg',
    imgFile: 'media_1791043203773.jpg',
    cordColors: ['#062410', '#0f5224', '#1b8a3e', '#2ecc71'],
    bead1: { name: 'Gold Earring', fill: 'url(#zoro-gold-bead)', highlight: '#fff3b0' },
    bead2: { name: 'Emerald Jade', fill: 'url(#zoro-jade-bead)', highlight: '#a8ffc8' },
    bgGrad: ['#00b040', '#007028', '#003814'],
    bezelColors: ['#e0ffe8', '#2ecc71', '#1e824c', '#0f4d25', '#062410'],
    sound: 'slash',
    accent: '#2ecc71'
  },
  {
    id: 'nami',
    name: 'Nami',
    file: 'Nami.svg',
    imgFile: 'media_1791043203801.jpg',
    cordColors: ['#4d1f00', '#993d00', '#e65c00', '#ff8533'],
    bead1: { name: 'Gold Beri', fill: 'url(#nami-gold-bead)', highlight: '#fff3b0' },
    bead2: { name: 'Mikan Pearl', fill: 'url(#nami-orange-bead)', highlight: '#ffe0cc' },
    bgGrad: ['#ff6600', '#cc4400', '#802200'],
    bezelColors: ['#fff3b0', '#ffd700', '#d4af37', '#8a6d1c', '#4a3805'],
    sound: 'coin',
    accent: '#ff8533'
  },
  {
    id: 'sanji',
    name: 'Sanji',
    file: 'Sanji.svg',
    imgFile: 'media_1791043203957.jpg',
    cordColors: ['#040e21', '#0d2552', '#1a448c', '#2968cc'],
    bead1: { name: 'All Blue Lapis', fill: 'url(#sanji-blue-bead)', highlight: '#a0c8ff' },
    bead2: { name: 'Rose Heart', fill: 'url(#sanji-heart-bead)', highlight: '#ffcce0' },
    bgGrad: ['#0033aa', '#002277', '#001144'],
    bezelColors: ['#ffeaa7', '#fdcb6e', '#e17055', '#2d3436', '#0f1419'],
    sound: 'kick',
    accent: '#1a448c'
  }
];

if (!fs.existsSync(charmsDir)) {
  fs.mkdirSync(charmsDir, { recursive: true });
}

for (const char of characters) {
  const imgPath = path.join(userUploadedDir, char.imgFile);
  if (!fs.existsSync(imgPath)) {
    console.error(`Missing image file for ${char.name} at ${imgPath}`);
    continue;
  }

  const base64Data = fs.readFileSync(imgPath).toString('base64');
  const dataUri = `data:image/jpeg;base64,${base64Data}`;

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg id="OnePiece_${char.name}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 94 165" width="94" height="165">
  <defs>

    <!-- ===== CORD GRADIENT ===== -->
    <linearGradient id="${char.id}-cord" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="${char.cordColors[0]}"/>
      <stop offset="30%"  stop-color="${char.cordColors[1]}"/>
      <stop offset="70%"  stop-color="${char.cordColors[2]}"/>
      <stop offset="100%" stop-color="${char.cordColors[3]}"/>
    </linearGradient>

    <!-- ===== GOLD GRADIENTS ===== -->
    <radialGradient id="${char.id}-gold" cx="38%" cy="28%" r="68%">
      <stop offset="0%"   stop-color="#fff0a0"/>
      <stop offset="35%"  stop-color="#f0c030"/>
      <stop offset="70%"  stop-color="#c88000"/>
      <stop offset="100%" stop-color="#6b3a00"/>
    </radialGradient>

    <radialGradient id="${char.id}-gold-bead" cx="35%" cy="28%" r="70%">
      <stop offset="0%"   stop-color="#ffffff"/>
      <stop offset="30%"  stop-color="#fff0a0"/>
      <stop offset="65%"  stop-color="#f0c030"/>
      <stop offset="100%" stop-color="#805500"/>
    </radialGradient>

    <!-- ===== CHARACTER THEMED BEAD GRADIENTS ===== -->
    <radialGradient id="${char.id}-ruby-bead" cx="35%" cy="28%" r="70%">
      <stop offset="0%"   stop-color="#ffffff"/>
      <stop offset="35%"  stop-color="#ff4d6d"/>
      <stop offset="70%"  stop-color="#c9184a"/>
      <stop offset="100%" stop-color="#590d22"/>
    </radialGradient>

    <radialGradient id="${char.id}-jade-bead" cx="35%" cy="28%" r="70%">
      <stop offset="0%"   stop-color="#e8fff0"/>
      <stop offset="35%"  stop-color="#2ecc71"/>
      <stop offset="70%"  stop-color="#16a085"/>
      <stop offset="100%" stop-color="#0a3d24"/>
    </radialGradient>

    <radialGradient id="${char.id}-orange-bead" cx="35%" cy="28%" r="70%">
      <stop offset="0%"   stop-color="#ffffff"/>
      <stop offset="35%"  stop-color="#ffaa40"/>
      <stop offset="70%"  stop-color="#e65c00"/>
      <stop offset="100%" stop-color="#662200"/>
    </radialGradient>

    <radialGradient id="${char.id}-blue-bead" cx="35%" cy="28%" r="70%">
      <stop offset="0%"   stop-color="#ffffff"/>
      <stop offset="35%"  stop-color="#54a0ff"/>
      <stop offset="70%"  stop-color="#2e86de"/>
      <stop offset="100%" stop-color="#0a235c"/>
    </radialGradient>

    <radialGradient id="${char.id}-heart-bead" cx="35%" cy="28%" r="70%">
      <stop offset="0%"   stop-color="#ffffff"/>
      <stop offset="35%"  stop-color="#ff9ff3"/>
      <stop offset="70%"  stop-color="#f368e0"/>
      <stop offset="100%" stop-color="#6c1b63"/>
    </radialGradient>

    <!-- ===== MEDALLION BEZEL ===== -->
    <radialGradient id="${char.id}-rim" cx="32%" cy="22%" r="80%">
      <stop offset="0%"   stop-color="${char.bezelColors[0]}"/>
      <stop offset="25%"  stop-color="${char.bezelColors[1]}"/>
      <stop offset="55%"  stop-color="${char.bezelColors[2]}"/>
      <stop offset="80%"  stop-color="${char.bezelColors[3]}"/>
      <stop offset="100%" stop-color="${char.bezelColors[4]}"/>
    </radialGradient>

    <!-- ===== DISC BACKGROUND GRADIENT ===== -->
    <radialGradient id="${char.id}-bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="${char.bgGrad[0]}"/>
      <stop offset="75%"  stop-color="${char.bgGrad[1]}"/>
      <stop offset="100%" stop-color="${char.bgGrad[2]}"/>
    </radialGradient>

    <!-- ===== CLIP PATH — circular medallion (cx=47, cy=107, r=39) ===== -->
    <clipPath id="${char.id}-clip">
      <circle cx="47" cy="107" r="39"/>
    </clipPath>

    <!-- ===== DROP SHADOW ===== -->
    <filter id="${char.id}-shadow" x="-18%" y="-12%" width="136%" height="136%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#050510" flood-opacity="0.45"/>
    </filter>

  </defs>

  <!-- =====================================================
       SECTION 1 — SUSPENSION CORD  (y 0–50)
       ===================================================== -->

  <!-- Main braided silk cord -->
  <line x1="47" y1="0" x2="47" y2="48"
        stroke="url(#${char.id}-cord)" stroke-width="3.2" stroke-linecap="round"/>
  <!-- Gold highlight thread -->
  <line x1="46.2" y1="0" x2="46.2" y2="48"
        stroke="#f0c030" stroke-width="0.5" stroke-linecap="round" opacity="0.65"/>

  <!-- =====================================================
       BEAD 1 (y ≈ 8–19)
       ===================================================== -->
  <path d="M43.5 8.5 Q47 10.5 50.5 8.5 L50 7.5 Q47 9.2 44 7.5 Z" fill="url(#${char.id}-gold)"/>
  <circle cx="47" cy="14" r="5.8" fill="${char.bead1.fill}"/>
  <ellipse cx="45" cy="12" rx="2.2" ry="1.3" fill="${char.bead1.highlight}" opacity="0.95"/>
  <path d="M43.5 19.5 Q47 17.5 50.5 19.5 L50 20.5 Q47 18.8 44 20.5 Z" fill="url(#${char.id}-gold)"/>

  <!-- =====================================================
       BEAD 2 (y ≈ 24–37)
       ===================================================== -->
  <path d="M42.5 23 Q47 25 51.5 23 L51 22 Q47 23.8 43 22 Z" fill="url(#${char.id}-gold)"/>
  <circle cx="47" cy="30" r="7" fill="${char.bead2.fill}"/>
  <ellipse cx="45" cy="27.5" rx="2.6" ry="1.5" fill="${char.bead2.highlight}" opacity="0.85"/>
  <circle cx="49.5" cy="31.5" r="1.0" fill="#f8e060" opacity="0.80"/>
  <path d="M42.5 37 Q47 35 51.5 37 L51 38 Q47 36.2 43 38 Z" fill="url(#${char.id}-gold)"/>

  <!-- =====================================================
       ATTACHMENT KNOT RING (y ≈ 42–50)
       ===================================================== -->
  <circle cx="47" cy="46" r="4.8" fill="none" stroke="url(#${char.id}-gold)" stroke-width="2.6"/>
  <circle cx="47" cy="46" r="2.2" fill="#1a0a00"/>
  <line x1="47" y1="42" x2="47" y2="50" stroke="url(#${char.id}-cord)" stroke-width="3.2" stroke-linecap="round"/>
  <circle cx="47" cy="46" r="4.8" fill="none" stroke="url(#${char.id}-gold)" stroke-width="2.2" opacity="0.9"/>

  <!-- =====================================================
       SECTION 2 — CIRCULAR MEDALLION  (center 47, 107, r=40)
       ===================================================== -->
  <g filter="url(#${char.id}-shadow)">

    <!-- Outer gold/bezel frame -->
    <circle cx="47" cy="107" r="40.5" fill="url(#${char.id}-rim)"/>
    <!-- Dark inner border line -->
    <circle cx="47" cy="107" r="39.3" fill="#120800"/>

    <!-- ===== CLIPPED CHARACTER ARTWORK ===== -->
    <g clip-path="url(#${char.id}-clip)">
      <!-- Background colored sunburst / circle -->
      <rect x="8" y="68" width="78" height="78" fill="url(#${char.id}-bg)"/>

      <!-- Inner ambient glow -->
      <circle cx="47" cy="107" r="38" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.25"/>

      <!-- The Character Image -->
      <image href="${dataUri}" x="8" y="68" width="78" height="78" preserveAspectRatio="xMidYMid slice"/>

      <!-- Subtle inner edge vignette -->
      <circle cx="47" cy="107" r="39" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="3"/>
    </g>

    <!-- Outer gold bezel border -->
    <circle cx="47" cy="107" r="39" fill="none" stroke="url(#${char.id}-gold)" stroke-width="1.8" opacity="0.96"/>
    <!-- Specular highlight arc -->
    <path d="M 26 72 A 38 38 0 0 1 68 72" fill="none" stroke="#ffffff" stroke-width="1.0" opacity="0.40"/>

  </g>

</svg>
`;

  const destFile = path.join(charmsDir, char.file);
  fs.writeFileSync(destFile, svgContent, 'utf8');
  console.log(`Created ${char.name} charm at ${destFile} (${svgContent.length} bytes)`);
}

console.log('One Piece edition charms successfully created!');
