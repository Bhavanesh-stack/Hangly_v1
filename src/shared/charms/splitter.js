// src/shared/charms/splitter.js
// Separates SVG charm body from the beads threaded above it using row-profile analysis.

const Splitter = {
  analysisPixels: 320,
  cordWidthFraction: 0.085,
  edgeWidthFraction: 0.25,
  alphaThreshold: 8,

  // Analyze an HTML5 ImageData object
  analyzeImageData(imageData, beadCount, bodyRun = beadCount) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;

    const rows = [];
    let contentMinX = width, contentMaxX = 0;
    let contentMinY = height, contentMaxY = 0;

    for (let y = 0; y < height; y++) {
      let minX = width;
      let maxX = -1;
      const rowOffset = y * width * 4;

      for (let x = 0; x < width; x++) {
        const alpha = data[rowOffset + (x * 4) + 3];
        if (alpha > this.alphaThreshold) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }

      if (maxX >= minX) {
        const rowWidth = maxX - minX + 1;
        rows.push({ y, minX, maxX, width: rowWidth });
        if (minX < contentMinX) contentMinX = minX;
        if (maxX > contentMaxX) contentMaxX = maxX;
        if (y < contentMinY) contentMinY = y;
        if (y > contentMaxY) contentMaxY = y;
      } else {
        rows.push({ y, minX: 0, maxX: 0, width: 0 });
      }
    }

    if (contentMaxY < contentMinY) {
      // Empty image
      return null;
    }

    const contentWidth = contentMaxX - contentMinX + 1;
    const cordWidth = this.cordWidthFraction * contentWidth;

    // Identify solid runs
    const runs = [];
    let inRun = false;
    let runStart = 0;

    for (let y = 0; y < height; y++) {
      const isSolid = rows[y].width >= cordWidth;
      if (isSolid && !inRun) {
        inRun = true;
        runStart = y;
      } else if (!isSolid && inRun) {
        inRun = false;
        runs.push({ first: runStart, last: y - 1 });
      }
    }
    if (inRun) {
      runs.push({ first: runStart, last: height - 1 });
    }

    if (runs.length <= bodyRun) {
      // Fallback: whole content is the charm body
      const bodyW = (contentMaxX - contentMinX + 1) / width;
      const bodyH = (contentMaxY - contentMinY + 1) / height;
      return {
        body: {
          x: contentMinX / width,
          y: contentMinY / height,
          width: bodyW,
          height: bodyH
        },
        beads: [],
        knotInset: bodyH / Math.max(bodyW, bodyH)
      };
    }

    // Trim runs
    const trimmedBeads = [];
    for (let i = 0; i < beadCount && i < runs.length; i++) {
      const run = runs[i];
      let maxW = 0;
      for (let y = run.first; y <= run.last; y++) {
        if (rows[y].width > maxW) maxW = rows[y].width;
      }

      const threshold = maxW * this.edgeWidthFraction;
      let trimmedFirst = run.first;
      while (trimmedFirst <= run.last && rows[trimmedFirst].width < threshold) trimmedFirst++;
      let trimmedLast = run.last;
      while (trimmedLast >= run.first && rows[trimmedLast].width < threshold) trimmedLast--;

      if (trimmedLast >= trimmedFirst) {
        let bMinX = width, bMaxX = 0;
        for (let y = trimmedFirst; y <= trimmedLast; y++) {
          if (rows[y].minX < bMinX) bMinX = rows[y].minX;
          if (rows[y].maxX > bMaxX) bMaxX = rows[y].maxX;
        }
        trimmedBeads.push({
          x: bMinX / width,
          y: trimmedFirst / height,
          width: (bMaxX - bMinX + 1) / width,
          height: (trimmedLast - trimmedFirst + 1) / height
        });
      }
    }

    // Body from bodyRun to contentMaxY
    const bodyFirst = runs[bodyRun].first;
    let bMinX = width, bMaxX = 0;
    for (let y = bodyFirst; y <= contentMaxY; y++) {
      if (rows[y].width > 0) {
        if (rows[y].minX < bMinX) bMinX = rows[y].minX;
        if (rows[y].maxX > bMaxX) bMaxX = rows[y].maxX;
      }
    }

    const bodyRect = {
      x: bMinX / width,
      y: bodyFirst / height,
      width: (bMaxX - bMinX + 1) / width,
      height: (contentMaxY - bodyFirst + 1) / height
    };

    const longest = Math.max(bodyRect.width, bodyRect.height);
    const knotInset = longest > 0 ? (bodyRect.height / longest) : 0.94;

    return {
      body: bodyRect,
      beads: trimmedBeads,
      knotInset: Math.min(0.98, Math.max(0.6, knotInset))
    };
  },

  // Calculate bead descriptions for simulation
  computeBeadDescriptions(regions, charmMass) {
    if (!regions || !regions.beads || regions.beads.length === 0) return [];
    const longest = Math.max(regions.body.width, regions.body.height);
    if (longest <= 0) return [];
    const scale = 2 / longest;

    return regions.beads.map(rect => {
      const size = {
        width: rect.width * scale,
        height: rect.height * scale
      };
      const radius = Math.sqrt(size.width * size.height) / 2;
      const offset = (regions.body.y - (rect.y + rect.height / 2)) * scale;
      const mass = Math.max(0.05, charmMass * Math.pow(radius, 3) * 6.0);
      return {
        size,
        offset,
        mass,
        spacingRatio: size.height / 2
      };
    });
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Splitter };
}
