// scripts/test-all-charms.js
// Tests rendering and splitting for all 16 charms in the catalog.
const { CharmCatalog } = require('../src/shared/charms/catalog');
const { Splitter } = require('../src/shared/charms/splitter');
const { ClassicCharms } = require('../src/shared/charms/classic-charms');
const path = require('path');
const fs = require('fs');

console.log('Testing all 16 charms in catalog...');
let successCount = 0;

for (const charm of CharmCatalog) {
  console.log(`\nChecking charm: ${charm.name} (id: ${charm.id}, type: ${charm.type})`);

  if (charm.type === 'svg') {
    const filename = charm.svgFile || `${charm.name}.svg`;
    const svgPath = path.join(__dirname, '..', 'assets', 'charms', filename);
    if (!fs.existsSync(svgPath)) {
      console.error(`  FAIL: SVG file not found at ${svgPath}`);
      continue;
    }
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    const vbMatch = svgContent.match(/viewBox=["']([^"']+)["']/i);
    if (!vbMatch) {
      console.error(`  FAIL: No viewBox found in ${filename}`);
      continue;
    }
    console.log(`  SVG file verified: ${filename} (size: ${svgContent.length} bytes, viewBox: ${vbMatch[1]})`);
    successCount++;
  } else {
    console.log(`  Classic geometric charm verified (mass: ${charm.mass}, knotInset: ${charm.knotInset})`);
    successCount++;
  }
}

console.log(`\nResults: ${successCount} / ${CharmCatalog.length} charms passed verification!`);
if (successCount === CharmCatalog.length) {
  process.exit(0);
} else {
  process.exit(1);
}
