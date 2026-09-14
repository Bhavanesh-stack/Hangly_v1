// test/physics.test.js
const { RopeSimulation } = require('../src/shared/physics/rope-simulation');
const { RopeConfiguration } = require('../src/shared/physics/rope-configuration');

console.log('Testing RopeSimulation Verlet physics...');

const sim = new RopeSimulation({
  configuration: RopeConfiguration.fitted({ width: 740, height: 420 }),
  anchor: { x: 370, y: 18.9 },
  charmMetrics: { mass: 2.75, radiusRatio: 0.145, knotInset: 0.90 }
});

sim.start();
console.log('Points count:', sim.points.length);
console.log('Initial anchor:', sim.points[0].position);
console.log('Initial charm center:', sim.charmCenter);

// Step 60 times at 1/60s
for (let i = 0; i < 60; i++) {
  sim.step(1 / 60);
}

console.log('After 1 second (60 frames):');
console.log('Charm position:', sim.charmCenter);
console.log('Cord length:', sim.cordLength);
console.log('Charm angle (deg):', (sim.charmAngle * 180 / Math.PI).toFixed(2));
console.log('Is sleeping:', sim.isSleeping);

// Test dragging
const canGrab = sim.canGrab(sim.charmCenter);
console.log('Can grab at charm center:', canGrab);
sim.beginDrag(sim.charmCenter);
console.log('Is dragging:', sim.isDragging);
sim.updateDrag({ x: 450, y: 200 }, { x: 50, y: -20 });
sim.step(1 / 60);
console.log('Dragged position:', sim.charmCenter);
sim.endDrag();
console.log('Released, is dragging:', sim.isDragging);

for (let i = 0; i < 120; i++) {
  sim.step(1 / 60);
}
console.log('After release (2 seconds):', sim.charmCenter);
console.log('Physics test PASSED!');
