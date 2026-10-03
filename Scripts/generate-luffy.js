// Scripts/generate-luffy.js
const fs = require('fs');
const path = require('path');

const imgPath = path.join('C:', 'Users', 'bhava', '.gemini', 'antigravity-ide', 'brain', 'b2d6b424-95ac-42a9-a7a7-b0fca259dfea', '.user_uploaded', 'media_1791043203999.jpg');
const base64Data = fs.readFileSync(imgPath).toString('base64');
const dataUri = `data:image/jpeg;base64,${base64Data}`;

const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg id="OnePiece_Luffy" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 94 165" width="94" height="165">
  <defs>

    <!-- ===== CORD GRADIENT ===== -->
    <linearGradient id="luffy-cord" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#4a0404"/>
      <stop offset="30%"  stop-color="#990000"/>
      <stop offset="70%"  stop-color="#d90429"/>
      <stop offset="100%" stop-color="#ff4d6d"/>
    </linearGradient>

    <!-- ===== GOLD GRADIENTS ===== -->
    <radialGradient id="luffy-gold" cx="38%" cy="28%" r="68%">
      <stop offset="0%"   stop-color="#fff0a0"/>
      <stop offset="35%"  stop-color="#f0c030"/>
      <stop offset="70%"  stop-color="#c88000"/>
      <stop offset="100%" stop-color="#6b3a00"/>
    </radialGradient>

    <radialGradient id="luffy-gold-bead" cx="35%" cy="28%" r="70%">
      <stop offset="0%"   stop-color="#ffffff"/>
      <stop offset="30%"  stop-color="#fff0a0"/>
      <stop offset="65%"  stop-color="#f0c030"/>
      <stop offset="100%" stop-color="#805500"/>
    </radialGradient>

    <!-- ===== RUBY BEAD ===== -->
    <radialGradient id="luffy-ruby-bead" cx="35%" cy="28%" r="70%">
      <stop offset="0%"   stop-color="#ffffff"/>
      <stop offset="35%"  stop-color="#ff4d6d"/>
      <stop offset="70%"  stop-color="#c9184a"/>
      <stop offset="100%" stop-color="#590d22"/>
    </radialGradient>

    <!-- ===== MEDALLION BEZEL ===== -->
    <radialGradient id="luffy-rim" cx="32%" cy="22%" r="80%">
      <stop offset="0%"   stop-color="#fff3b0"/>
      <stop offset="25%"  stop-color="#f0c030"/>
      <stop offset="55%"  stop-color="#c08010"/>
      <stop offset="80%"  stop-color="#7a4800"/>
      <stop offset="100%" stop-color="#3d1c00"/>
    </radialGradient>

    <!-- ===== DISC BACKGROUND GRADIENT ===== -->
    <radialGradient id="luffy-bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#ff0033"/>
      <stop offset="75%"  stop-color="#cc0029"/>
      <stop offset="100%" stop-color="#80001a"/>
    </radialGradient>

    <!-- ===== CLIP PATH — circular medallion (cx=47, cy=107, r=39) ===== -->
    <clipPath id="luffy-clip">
      <circle cx="47" cy="107" r="39"/>
    </clipPath>

    <!-- ===== DROP SHADOW ===== -->
    <filter id="luffy-shadow" x="-18%" y="-12%" width="136%" height="136%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#050510" flood-opacity="0.45"/>
    </filter>

  </defs>

  <!-- =====================================================
       SECTION 1 — SUSPENSION CORD  (y 0–50)
       ===================================================== -->

  <!-- Main braided silk cord -->
  <line x1="47" y1="0" x2="47" y2="48"
        stroke="url(#luffy-cord)" stroke-width="3.2" stroke-linecap="round"/>
  <!-- Gold highlight thread -->
  <line x1="46.2" y1="0" x2="46.2" y2="48"
        stroke="#f0c030" stroke-width="0.5" stroke-linecap="round" opacity="0.65"/>

  <!-- =====================================================
       BEAD 1 — Straw Gold Sphere (y ≈ 8–19)
       ===================================================== -->
  <path d="M43.5 8.5 Q47 10.5 50.5 8.5 L50 7.5 Q47 9.2 44 7.5 Z" fill="url(#luffy-gold)"/>
  <circle cx="47" cy="14" r="5.8" fill="url(#luffy-gold-bead)"/>
  <ellipse cx="45" cy="12" rx="2.2" ry="1.3" fill="#fff3b0" opacity="0.95"/>
  <path d="M43.5 19.5 Q47 17.5 50.5 19.5 L50 20.5 Q47 18.8 44 20.5 Z" fill="url(#luffy-gold)"/>

  <!-- =====================================================
       BEAD 2 — Ruby Sphere (y ≈ 24–37)
       ===================================================== -->
  <path d="M42.5 23 Q47 25 51.5 23 L51 22 Q47 23.8 43 22 Z" fill="url(#luffy-gold)"/>
  <circle cx="47" cy="30" r="7" fill="url(#luffy-ruby-bead)"/>
  <ellipse cx="45" cy="27.5" rx="2.6" ry="1.5" fill="#ff99aa" opacity="0.85"/>
  <circle cx="49.5" cy="31.5" r="1.0" fill="#f8e060" opacity="0.80"/>
  <path d="M42.5 37 Q47 35 51.5 37 L51 38 Q47 36.2 43 38 Z" fill="url(#luffy-gold)"/>

  <!-- =====================================================
       ATTACHMENT KNOT RING (y ≈ 42–50)
       ===================================================== -->
  <circle cx="47" cy="46" r="4.8" fill="none" stroke="url(#luffy-gold)" stroke-width="2.6"/>
  <circle cx="47" cy="46" r="2.2" fill="#1a0a00"/>
  <line x1="47" y1="42" x2="47" y2="50" stroke="url(#luffy-cord)" stroke-width="3.2" stroke-linecap="round"/>
  <circle cx="47" cy="46" r="4.8" fill="none" stroke="url(#luffy-gold)" stroke-width="2.2" opacity="0.9"/>

  <!-- =====================================================
       SECTION 2 — CIRCULAR MEDALLION  (center 47, 107, r=40)
       ===================================================== -->
  <g filter="url(#luffy-shadow)">

    <!-- Outer gold/bezel frame -->
    <circle cx="47" cy="107" r="40.5" fill="url(#luffy-rim)"/>
    <!-- Dark inner border line -->
    <circle cx="47" cy="107" r="39.3" fill="#120800"/>

    <!-- ===== CLIPPED CHARACTER ARTWORK ===== -->
    <g clip-path="url(#luffy-clip)">
      <!-- Background colored sunburst / circle -->
      <rect x="8" y="68" width="78" height="78" fill="url(#luffy-bg)"/>

      <!-- Inner ambient glow -->
      <circle cx="47" cy="107" r="38" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.25"/>

      <!-- The Character Image -->
      <image href="${dataUri}" x="8" y="68" width="78" height="78" preserveAspectRatio="xMidYMid slice"/>

      <!-- Subtle inner edge vignette -->
      <circle cx="47" cy="107" r="39" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="3"/>
    </g>

    <!-- Outer gold bezel border -->
    <circle cx="47" cy="107" r="39" fill="none" stroke="url(#luffy-gold)" stroke-width="1.8" opacity="0.96"/>
    <!-- Specular highlight arc -->
    <path d="M 26 72 A 38 38 0 0 1 68 72" fill="none" stroke="#ffffff" stroke-width="1.0" opacity="0.40"/>

  </g>

</svg>
`;

const destFile = path.join(__dirname, '..', 'Assets', 'Charms', 'Luffy.svg');
fs.writeFileSync(destFile, svgContent, 'utf8');
console.log(`Created Luffy character charm at ${destFile}`);
