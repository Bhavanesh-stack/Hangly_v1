// scripts/make-ico.js
const fs = require('fs');
const path = require('path');

const pngPath = path.join(__dirname, '..', 'assets', 'icons', 'hangly-icon-256.png');
const icoPath = path.join(__dirname, '..', 'assets', 'icons', 'hangly.ico');

if (fs.existsSync(pngPath)) {
  const pngBuffer = fs.readFileSync(pngPath);
  
  // Create an ICO containing the 256x256 PNG
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // reserved
  icoHeader.writeUInt16LE(1, 2); // ICO type
  icoHeader.writeUInt16LE(1, 4); // 1 image

  const entry = Buffer.alloc(16);
  entry.writeUInt8(0, 0); // width: 256 = 0
  entry.writeUInt8(0, 1); // height: 256 = 0
  entry.writeUInt8(0, 2); // color count
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(pngBuffer.length, 8); // image size
  entry.writeUInt32LE(6 + 16, 12); // image offset

  const icoBuffer = Buffer.concat([icoHeader, entry, pngBuffer]);
  fs.writeFileSync(icoPath, icoBuffer);
  console.log('Successfully generated', icoPath);
} else {
  console.error('PNG not found:', pngPath);
}
