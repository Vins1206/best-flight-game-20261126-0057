// Seeded randomness and terrain height: one clear job — deterministic valley shape.
// Every screenshot and every play session sees the same Aeris Valley.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function nextRandom() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashNoise(x, z) {
  const s = Math.sin(x * 0.0016 + z * 0.0011) * 43758.5453;
  return s - Math.floor(s);
}

export function smoothNoise(x, z) {
  const xi = Math.floor(x / 900);
  const zi = Math.floor(z / 900);
  const xf = x / 900 - xi;
  const zf = z / 900 - zi;
  const a = hashNoise(xi, zi);
  const b = hashNoise(xi + 1, zi);
  const c = hashNoise(xi, zi + 1);
  const d = hashNoise(xi + 1, zi + 1);
  const u = xf * xf * (3 - 2 * xf);
  const v = zf * zf * (3 - 2 * zf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

// Rolling hills: flat near the runway strip, rising toward the valley walls.
export function terrainHeight(x, z) {
  const distRunway = Math.abs(x);
  const flat = Math.max(0, 1 - distRunway / 700);
  const hills = smoothNoise(x, z) * 260 + smoothNoise(x * 2.7 + 500, z * 2.7) * 90;
  const wall = Math.max(0, (Math.abs(x) - 2600) / 2600) * 900;
  const north = Math.max(0, (z - 5200) / 2000) * 700;
  return hills * (1 - flat * 0.85) + wall + north;
}

// Ridge silhouette for a distant mountain layer: peak height at screen offset t.
export function ridgeHeightAt(t, layer, seed) {
  const n = Math.sin(t * 0.011 + seed * 1.7 + layer * 2.3) * 0.5
    + Math.sin(t * 0.027 + seed * 3.1 + layer * 5.7) * 0.3
    + Math.sin(t * 0.061 + seed * 0.9 + layer * 1.1) * 0.2;
  return 0.45 + n * 0.55;
}
