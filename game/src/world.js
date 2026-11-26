// Aeris Valley world: one clear job — every fixed place in the valley.
// Runway 27, the ring course, the river, the lake, the town, the clouds.
import { mulberry32, terrainHeight } from './random.js';

export const RUNWAY = {
  name: 'RUNWAY 27',
  // A north-south strip centred on x = 0, heading 270 degrees on approach.
  x: 0,
  zStart: 700,
  zEnd: 1900,
  halfWidth: 55,
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
