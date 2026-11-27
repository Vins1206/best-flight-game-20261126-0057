// Aeris Valley world: one clear job — every fixed place in the valley.
// Runway 27, the ring course, the river, the lake, the town, the clouds,
// the west coastline and sea, shaded hills, the control tower.
import { mulberry32, terrainHeight } from './random.js';

export const RUNWAY = {
  name: 'RUNWAY 27',
  // A north-south strip centred on x = 0, heading 270 degrees on approach.
  x: 0,
  zStart: 700,
  zEnd: 1900,
  halfWidth: 65,
  headingDeg: 270,
};

export const RING_COURSE = [
  { x: -350, z: 900, y: 480, label: '1' },
  { x: 420, z: 1700, y: 620, label: '2' },
  { x: -620, z: 2600, y: 540, label: '3' },
  { x: 180, z: 3500, y: 760, label: '4' },
  { x: -480, z: 4400, y: 680, label: '5' },
  { x: 60, z: 5300, y: 820, label: '6' },
];

export const LAKE = { x: -1500, z: 2900, rx: 900, rz: 620 };

export const TOWN = { x: 950, z: 1500, blocks: 26 };

export const LIGHTHOUSE = { x: -2100, z: 800, y: 0 };

// The valley's west edge is a coastline: sea west of x = -2600, sand at the shore.
export const SEA = { x0: -9000, x1: -2600, z0: -1500, z1: 6500 };
export const BEACH = { x0: -2600, x1: -2380, z0: -1500, z1: 6500 };

// Control tower beside Runway 27, west side of the strip.
export const TOWER = { x: -190, z: 1250 };

// Shaded hills: low distant mounds across the valley floor, clear of the
// runway, the lake and the sea — rolling terrain, not foreground balloons.
export function buildHills() {
  const rng = mulberry32(20261127);
  const hills = [];
  for (let i = 0; i < 18; i++) {
    const x = (rng() > 0.5 ? 1 : -1) * (800 + rng() * 3000);
    const z = 2200 + rng() * 3800;
    if (x < -2300) continue;
    const dx = x - LAKE.x;
    const dz = z - LAKE.z;
    if ((dx * dx) / (LAKE.rx * LAKE.rx) + (dz * dz) / (LAKE.rz * LAKE.rz) < 1.2) continue;
    hills.push({ x, z, r: 200 + rng() * 180, h: 90 + rng() * 110 });
  }
  return hills;
}

export function buildRiverPoints() {
  const points = [];
  for (let z = -1500; z <= 6500; z += 250) {
    const x = -1150 + Math.sin(z * 0.00045) * 620 + Math.sin(z * 0.0013) * 160;
    points.push({ x, z, y: terrainHeight(x, z) + 4 });
  }
  return points;
}

export function buildClouds() {
  const rng = mulberry32(20261126);
  const clouds = [];
  for (let i = 0; i < 26; i++) {
    clouds.push({
      x: (rng() - 0.5) * 14000,
      z: -1200 + rng() * 8000,
      y: 1400 + rng() * 900,
      size: 260 + rng() * 520,
      drift: 6 + rng() * 10,
    });
  }
  return clouds;
}

export function buildTownBlocks() {
  const rng = mulberry32(77);
  const blocks = [];
  for (let i = 0; i < TOWN.blocks; i++) {
    blocks.push({
      x: TOWN.x + (rng() - 0.5) * 900,
      z: TOWN.z + (rng() - 0.5) * 800,
      w: 60 + rng() * 90,
      d: 50 + rng() * 80,
      h: 40 + rng() * 90,
      roof: rng() > 0.5 ? '#b5503c' : '#4a6b8a',
    });
  }
  return blocks;
}

export function buildBirds() {
  const rng = mulberry32(41);
  const birds = [];
  for (let i = 0; i < 9; i++) {
    birds.push({
      x: (rng() - 0.5) * 5000,
      z: 400 + rng() * 4200,
      y: 500 + rng() * 500,
      phase: rng() * 6.28,
      speed: 0.4 + rng() * 0.5,
    });
  }
  return birds;
}

// Valley pines: fixed positions, clear of the runway strip and the lake.
export function buildTrees() {
  const rng = mulberry32(2026);
  const trees = [];
  for (let i = 0; i < 64; i++) {
    const x = (rng() - 0.5) * 9000;
    const z = -800 + rng() * 6800;
    if (Math.abs(x) < 220 && z > 400 && z < 2200) continue;
    if (x < -2400) continue; // Pines grow on land, not in the sea.
    const dx = x - LAKE.x;
    const dz = z - LAKE.z;
    if ((dx * dx) / (LAKE.rx * LAKE.rx) + (dz * dz) / (LAKE.rz * LAKE.rz) < 1.1) continue;
    trees.push({ x, z, s: 0.7 + rng() * 0.9 });
  }
  return trees;
}

// Patchwork fields: fixed world rectangles in crop colours.
export const FIELD_PATCHES = [
  { x0: -2600, z0: 400, x1: -1700, z1: 1300, color: '#c2a95e' },
  { x0: 700, z0: 300, x1: 1500, z1: 1100, color: '#8fbf5a' },
  { x0: -1500, z0: 2100, x1: -700, z1: 2900, color: '#a8894a' },
  { x0: 600, z0: 2400, x1: 1400, z1: 3200, color: '#7fae62' },
  { x0: -2400, z0: 3400, x1: -1500, z1: 4200, color: '#c2a95e' },
  { x0: 800, z0: 3800, x1: 1700, z1: 4600, color: '#5d8a4a' },
  { x0: -900, z0: 4700, x1: 200, z1: 5500, color: '#8fbf5a' },
];

// Farm road: town to the runway threshold.
export function buildRoadPoints() {
  const points = [];
  for (let t = 0; t <= 1.0001; t += 0.1) {
    const x = 950 + (0 - 950) * t + Math.sin(t * 3.1) * 120;
    const z = 1500 + (700 - 1500) * t;
    points.push({ x, z, y: terrainHeight(x, z) + 3 });
  }
  return points;
}
