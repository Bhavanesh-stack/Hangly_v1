// src/shared/charms/catalog.js
// Catalog of built-in charms: collection (SVG) and classic geometric shapes.

const CharmColor = {
  rgb(r, g, b, a = 1) {
    return { r, g, b, a };
  },
  toCss(c) {
    if (!c) return 'rgba(255, 255, 255, 1)';
    const r = Math.round(c.r * 255);
    const g = Math.round(c.g * 255);
    const b = Math.round(c.b * 255);
    return `rgba(${r}, ${g}, ${b}, ${c.a !== undefined ? c.a : 1})`;
  },
  interpolate(c1, c2, t) {
    const clampT = Math.max(0, Math.min(1, t));
    return {
      r: c1.r + (c2.r - c1.r) * clampT,
      g: c1.g + (c2.g - c1.g) * clampT,
      b: c1.b + (c2.b - c1.b) * clampT,
      a: (c1.a ?? 1) + ((c2.a ?? 1) - (c1.a ?? 1)) * clampT
    };
  }
};

const CollectionCordTint = {
  primary: CharmColor.rgb(0.47, 0.34, 0.11),
  secondary: CharmColor.rgb(0.31, 0.22, 0.06),
  deep: CharmColor.rgb(0.16, 0.11, 0.03),
  light: CharmColor.rgb(0.78, 0.62, 0.30)
};

const CharmCatalog = [
  // --- The Hangly Collection (SVG) ---
  {
    id: 'daruma',
    name: 'Daruma',
    category: 'luck',
    type: 'svg',
    svgFile: 'Daruma.svg',
    mass: 3.65,
    radiusRatio: 0.154,
    knotInset: 0.94,
    sound: 'wood',
    beadCount: 3,
    bodyRun: 3,
    palette: {
      primary: CharmColor.rgb(0.88, 0.12, 0.12),
      secondary: CharmColor.rgb(0.62, 0.06, 0.06),
      deep: CharmColor.rgb(0.38, 0.03, 0.03),
      light: CharmColor.rgb(1.00, 0.50, 0.40)
    },
    cordTint: CollectionCordTint
  },
  {
    id: 'nazar',
    name: 'Nazar boncuğu',
    category: 'protection',
    type: 'svg',
    svgFile: 'Nazar Boncuğu.svg',
    mass: 2.75,
    radiusRatio: 0.145,
    knotInset: 0.94,
    sound: 'glass',
    beadCount: 3,
    bodyRun: 3,
    palette: {
      primary: CharmColor.rgb(0.10, 0.22, 0.68),
      secondary: CharmColor.rgb(0.06, 0.12, 0.42),
      deep: CharmColor.rgb(0.03, 0.06, 0.25),
      light: CharmColor.rgb(0.42, 0.58, 0.95)
    },
    cordTint: CollectionCordTint
  },
  {
    id: 'manekiNeko',
    name: 'Maneki-neko',
    category: 'luck',
    type: 'svg',
    svgFile: 'Maneki-neko.svg',
    mass: 3.45,
    radiusRatio: 0.167,
    knotInset: 0.94,
    sound: 'wood',
    beadCount: 2,
    bodyRun: 2,
    palette: {
      primary: CharmColor.rgb(0.97, 0.95, 0.90),
      secondary: CharmColor.rgb(0.82, 0.78, 0.70),
      deep: CharmColor.rgb(0.55, 0.50, 0.42),
      light: CharmColor.rgb(1.00, 1.00, 1.00)
    },
    cordTint: CollectionCordTint
  },
  {
    id: 'hamsa',
    name: 'Hamsa',
    category: 'protection',
    type: 'svg',
    svgFile: 'Hamsa.svg',
    mass: 3.05,
    radiusRatio: 0.158,
    knotInset: 0.94,
    sound: 'metal',
    beadCount: 3,
    bodyRun: 3,
    palette: {
      primary: CharmColor.rgb(0.15, 0.24, 0.60),
      secondary: CharmColor.rgb(0.09, 0.14, 0.42),
      deep: CharmColor.rgb(0.05, 0.08, 0.26),
      light: CharmColor.rgb(0.50, 0.62, 0.95)
    },
    cordTint: CollectionCordTint
  },
  {
    id: 'nimbuMirchi',
    name: 'Nimbu-mirchi',
    category: 'protection',
    type: 'svg',
    svgFile: 'Nimbu-mirchi.svg',
    mass: 2.85,
    radiusRatio: 0.152,
    knotInset: 0.94,
    sound: 'soft',
    beadCount: 0,
    bodyRun: 0,
    palette: {
      primary: CharmColor.rgb(0.98, 0.84, 0.18),
      secondary: CharmColor.rgb(0.85, 0.62, 0.08),
      deep: CharmColor.rgb(0.55, 0.38, 0.03),
      light: CharmColor.rgb(1.00, 0.96, 0.62)
    },
    cordTint: CollectionCordTint
  },
  {
    id: 'ghanta',
    name: 'Ghanta',
    category: 'ritual',
    type: 'svg',
    svgFile: 'Ghanta.svg',
    mass: 4.05,
    radiusRatio: 0.150,
    knotInset: 0.94,
    sound: 'bell',
    beadCount: 1,
    bodyRun: 1,
    palette: {
      primary: CharmColor.rgb(0.76, 0.45, 0.22),
      secondary: CharmColor.rgb(0.55, 0.30, 0.13),
      deep: CharmColor.rgb(0.32, 0.17, 0.07),
      light: CharmColor.rgb(0.98, 0.78, 0.55)
    },
    cordTint: CollectionCordTint
  },
  {
    id: 'drishtiBommai',
    name: 'Drishti bommai',
    category: 'protection',
    type: 'svg',
    svgFile: 'Dhrishti bomma.svg',
    mass: 3.25,
    radiusRatio: 0.164,
    knotInset: 0.94,
    sound: 'wood',
    beadCount: 3,
    bodyRun: 3,
    palette: {
      primary: CharmColor.rgb(0.86, 0.14, 0.12),
      secondary: CharmColor.rgb(0.62, 0.08, 0.08),
      deep: CharmColor.rgb(0.36, 0.04, 0.05),
      light: CharmColor.rgb(1.00, 0.55, 0.45)
    },
    cordTint: CollectionCordTint
  },
  {
    id: 'panchangJie',
    name: 'Pánchángjié',
    category: 'luck',
    type: 'svg',
    svgFile: 'Pánchang Jié.svg',
    mass: 2.45,
    radiusRatio: 0.160,
    knotInset: 0.94,
    sound: 'soft',
    beadCount: 3,
    bodyRun: 3,
    palette: {
      primary: CharmColor.rgb(0.88, 0.14, 0.18),
      secondary: CharmColor.rgb(0.62, 0.08, 0.10),
      deep: CharmColor.rgb(0.36, 0.04, 0.06),
      light: CharmColor.rgb(1.00, 0.62, 0.60)
    },
    cordTint: CollectionCordTint
  },
  {
    id: 'horseshoe',
    name: 'Horseshoe',
    category: 'luck',
    type: 'svg',
    svgFile: 'Horseshoe.svg',
    mass: 3.85,
    radiusRatio: 0.151,
    knotInset: 0.94,
    sound: 'metal',
    beadCount: 2,
    bodyRun: 2,
    palette: {
      primary: CharmColor.rgb(0.58, 0.60, 0.64),
      secondary: CharmColor.rgb(0.38, 0.40, 0.44),
      deep: CharmColor.rgb(0.20, 0.21, 0.24),
      light: CharmColor.rgb(0.88, 0.90, 0.93)
    },
    cordTint: CollectionCordTint
  },
  {
    id: 'scarab',
    name: 'Scarab',
    category: 'protection',
    type: 'svg',
    svgFile: 'Scarab.svg',
    mass: 3.15,
    radiusRatio: 0.146,
    knotInset: 0.94,
    sound: 'glass',
    beadCount: 3,
    bodyRun: 3,
    palette: {
      primary: CharmColor.rgb(0.20, 0.74, 0.76),
      secondary: CharmColor.rgb(0.10, 0.50, 0.55),
      deep: CharmColor.rgb(0.05, 0.30, 0.34),
      light: CharmColor.rgb(0.70, 0.95, 0.94)
    },
    cordTint: CollectionCordTint
  },
  {
    id: 'himmeli',
    name: 'Himmeli',
    category: 'ritual',
    type: 'svg',
    svgFile: 'Himmeli.svg',
    mass: 2.35,
    radiusRatio: 0.169,
    knotInset: 0.94,
    sound: 'soft',
    beadCount: 0,
    bodyRun: 2,
    palette: {
      primary: CharmColor.rgb(0.82, 0.64, 0.26),
      secondary: CharmColor.rgb(0.60, 0.44, 0.14),
      deep: CharmColor.rgb(0.36, 0.26, 0.07),
      light: CharmColor.rgb(0.99, 0.90, 0.60)
    },
    cordTint: CollectionCordTint
  },
  {
    id: 'sunflower',
    name: 'Sunflower',
    category: 'luck',
    type: 'svg',
    svgFile: 'sunflower.svg',
    mass: 3.20,
    radiusRatio: 0.160,
    knotInset: 0.94,
    sound: 'wood',
    beadCount: 3,
    bodyRun: 3,
    palette: {
      primary: CharmColor.rgb(0.96, 0.74, 0.10),
      secondary: CharmColor.rgb(0.82, 0.50, 0.08),
      deep: CharmColor.rgb(0.38, 0.20, 0.05),
      light: CharmColor.rgb(1.00, 0.92, 0.45)
    },
    cordTint: CollectionCordTint
  },

  // --- The Classics (Geometric Vector) ---
  {
    id: 'circle',
    name: 'Bead',
    category: 'classic',
    type: 'geometric',
    mass: 2.6,
    radiusRatio: 0.126,
    knotInset: 0.90,
    sound: 'glass',
    beadCount: 0,
    palette: {
      primary: CharmColor.rgb(0.49, 0.42, 0.95),
      secondary: CharmColor.rgb(0.33, 0.26, 0.78),
      deep: CharmColor.rgb(0.22, 0.16, 0.55),
      light: CharmColor.rgb(0.78, 0.74, 1.00)
    }
  },
  {
    id: 'camera',
    name: 'Camera',
    category: 'classic',
    type: 'geometric',
    mass: 4.2,
    radiusRatio: 0.170,
    knotInset: 0.68,
    sound: 'metal',
    beadCount: 0,
    palette: {
      primary: CharmColor.rgb(0.36, 0.38, 0.43),
      secondary: CharmColor.rgb(0.20, 0.22, 0.26),
      deep: CharmColor.rgb(0.09, 0.10, 0.12),
      light: CharmColor.rgb(0.74, 0.77, 0.82)
    }
  },
  {
    id: 'star',
    name: 'Star',
    category: 'classic',
    type: 'geometric',
    mass: 2.2,
    radiusRatio: 0.157,
    knotInset: 0.90,
    sound: 'metal',
    beadCount: 0,
    palette: {
      primary: CharmColor.rgb(1.00, 0.78, 0.25),
      secondary: CharmColor.rgb(0.93, 0.58, 0.10),
      deep: CharmColor.rgb(0.62, 0.35, 0.03),
      light: CharmColor.rgb(1.00, 0.93, 0.70)
    }
  },
  {
    id: 'heart',
    name: 'Heart',
    category: 'classic',
    type: 'geometric',
    mass: 2.9,
    radiusRatio: 0.149,
    knotInset: 0.68,
    sound: 'soft',
    beadCount: 0,
    palette: {
      primary: CharmColor.rgb(0.95, 0.27, 0.35),
      secondary: CharmColor.rgb(0.78, 0.13, 0.25),
      deep: CharmColor.rgb(0.50, 0.06, 0.14),
      light: CharmColor.rgb(1.00, 0.72, 0.75)
    }
  },
  {
    id: 'diamond',
    name: 'Diamond',
    category: 'classic',
    type: 'geometric',
    mass: 3.4,
    radiusRatio: 0.142,
    knotInset: 0.80,
    sound: 'glass',
    beadCount: 0,
    palette: {
      primary: CharmColor.rgb(0.62, 0.88, 0.97),
      secondary: CharmColor.rgb(0.35, 0.68, 0.88),
      deep: CharmColor.rgb(0.18, 0.42, 0.62),
      light: CharmColor.rgb(0.90, 0.98, 1.00)
    }
  }
];

function getCharmById(id) {
  return CharmCatalog.find(c => c.id === id) || CharmCatalog[0];
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CharmCatalog,
    CharmColor,
    CollectionCordTint,
    getCharmById
  };
}
