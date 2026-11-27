// Scene rendering: one clear job — the chase view over Aeris Valley.
// Sky, sun, clouds, mountain ridges, fields, river, lake, town, runway, rings, aircraft.
import { CONFIG, PALETTE } from './config.js';
import { ridgeHeightAt, terrainHeight } from './random.js';
import { LAKE, LIGHTHOUSE, RING_COURSE, RUNWAY, FIELD_PATCHES, buildRiverPoints, buildClouds, buildTownBlocks, buildBirds, buildTrees, buildRoadPoints } from './world.js';

const RIVER_POINTS = buildRiverPoints();
const CLOUDS = buildClouds();
const TOWN_BLOCKS = buildTownBlocks();
const BIRDS = buildBirds();
const TREES = buildTrees();
const ROAD_POINTS = buildRoadPoints();
const FOCAL = 760;

export function project(plane, wx, wy, wz, w, h, horizonY, pitchOffset) {
  const hdg = (plane.headingDeg * Math.PI) / 180;
  const dx = wx - plane.x;
  const dz = wz - plane.z;
  const depth = dx * Math.sin(hdg) + dz * Math.cos(hdg);
  if (depth < 24) return null;
  const lateral = dx * Math.cos(hdg) - dz * Math.sin(hdg);
  const scale = FOCAL / depth;
  return {
    x: w / 2 + lateral * scale,
    y: horizonY - (wy - plane.altFt) * scale + pitchOffset,
    scale,
    depth,
  };
}

export function drawSky(ctx, plane, w, h, horizonY, timeSec) {
  const grad = ctx.createLinearGradient(0, 0, 0, horizonY + 40);
  grad.addColorStop(0, PALETTE.skyTop);
  grad.addColorStop(0.55, PALETTE.skyMid);
  grad.addColorStop(1, PALETTE.skyLow);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, horizonY + 40);
  // Low golden sun, drifting slowly with the heading so the light feels alive.
  const sunX = w * 0.72 + Math.sin((plane.headingDeg * Math.PI) / 180) * 60;
  const sunY = horizonY - 150;
  const glow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 190);
  glow.addColorStop(0, PALETTE.sunCore);
  glow.addColorStop(0.35, PALETTE.sunGlow);
  glow.addColorStop(1, 'rgba(255,179,71,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - 200, sunY - 200, 400, 400);
  ctx.fillStyle = PALETTE.sunCore;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 34, 0, Math.PI * 2);
  ctx.fill();
  void timeSec;
}

export function drawRidges(ctx, plane, w, horizonY) {
  const layers = [
    { color: PALETTE.mountainFar, base: 150, seed: 3, shift: 0.35 },
    { color: PALETTE.mountainNear, base: 95, seed: 11, shift: 0.7 },
  ];
  for (const layer of layers) {
    ctx.fillStyle = layer.color;
    ctx.beginPath();
    ctx.moveTo(0, horizonY + 2);
    const offset = plane.headingDeg * 6 * layer.shift + plane.x * 0.02 * layer.shift;
    for (let x = 0; x <= w; x += 14) {
      const peak = ridgeHeightAt(x + offset, layer.seed, layer.seed);
      ctx.lineTo(x, horizonY - peak * layer.base);
    }
    ctx.lineTo(w, horizonY + 2);
    ctx.closePath();
    ctx.fill();
  }
  // Snow caps on the far ridge.
  ctx.fillStyle = 'rgba(245,248,255,0.85)';
  const offset = plane.headingDeg * 6 * 0.35 + plane.x * 0.007;
  for (let x = 40; x < w; x += 130) {
    const peak = ridgeHeightAt(x + offset, 3, 3);
    if (peak > 0.72) {
      ctx.beginPath();
      ctx.moveTo(x - 26, horizonY - peak * 150 + 26);
      ctx.lineTo(x, horizonY - peak * 150);
      ctx.lineTo(x + 26, horizonY - peak * 150 + 26);
      ctx.closePath();
      ctx.fill();
    }
  }
}

export function drawGround(ctx, plane, w, h, horizonY, pitchOffset) {
  const grad = ctx.createLinearGradient(0, horizonY, 0, h);
  grad.addColorStop(0, PALETTE.groundFar);
  grad.addColorStop(1, PALETTE.groundNear);
  ctx.fillStyle = grad;
  ctx.fillRect(0, horizonY, w, h - horizonY);
  // Perspective field strips: alternating crop colours marching to the horizon.
  for (let row = 0; row < 9; row++) {
    const depthNear = 260 + row * row * 55;
    const depthFar = 260 + (row + 1) * (row + 1) * 55;
    const yNear = project(plane, plane.x, 0, plane.z + depthNear, w, h, horizonY, pitchOffset);
    const yFar = project(plane, plane.x, 0, plane.z + depthFar, w, h, horizonY, pitchOffset);
    if (!yNear || !yFar) continue;
    const colors = [PALETTE.fieldA, PALETTE.fieldB, PALETTE.fieldC];
    ctx.fillStyle = colors[row % 3];
    ctx.globalAlpha = 0.5;
    ctx.fillRect(0, yFar.y, w, Math.max(2, yNear.y - yFar.y));
    ctx.globalAlpha = 1;
  }
  // Patchwork fields: fixed crop rectangles, projected onto the valley floor.
  for (const patch of FIELD_PATCHES) {
    const corners = [
      project(plane, patch.x0, terrainHeight(patch.x0, patch.z0) + 2, patch.z0, w, h, horizonY, pitchOffset),
      project(plane, patch.x1, terrainHeight(patch.x1, patch.z0) + 2, patch.z0, w, h, horizonY, pitchOffset),
      project(plane, patch.x1, terrainHeight(patch.x1, patch.z1) + 2, patch.z1, w, h, horizonY, pitchOffset),
      project(plane, patch.x0, terrainHeight(patch.x0, patch.z1) + 2, patch.z1, w, h, horizonY, pitchOffset),
    ];
    if (corners.some((c) => !c)) continue;
    ctx.fillStyle = patch.color;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (const c of corners.slice(1)) ctx.lineTo(c.x, c.y);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // Farm road: town to the runway threshold.
  ctx.strokeStyle = '#8a7a5a';
  ctx.lineCap = 'round';
  ctx.beginPath();
  let roadStarted = false;
  for (const p of ROAD_POINTS) {
    const s = project(plane, p.x, p.y, p.z, w, h, horizonY, pitchOffset);
    if (!s) continue;
    ctx.lineWidth = Math.max(1.5, 2200 / s.depth);
    if (!roadStarted) { ctx.moveTo(s.x, s.y); roadStarted = true; } else ctx.lineTo(s.x, s.y);
  }
  ctx.stroke();
  // Lake: a flat blue ellipse on the valley floor, west of the course.
  const lake = project(plane, LAKE.x, 6, LAKE.z, w, h, horizonY, pitchOffset);
  if (lake && lake.depth < 9000) {
    ctx.fillStyle = PALETTE.lake;
    ctx.beginPath();
    ctx.ellipse(lake.x, lake.y, LAKE.rx * lake.scale * 0.9, LAKE.rz * lake.scale * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(lake.x - 40 * lake.scale, lake.y - 6 * lake.scale, LAKE.rx * lake.scale * 0.4, LAKE.rz * lake.scale * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // River: a winding blue ribbon down the valley.
  ctx.strokeStyle = PALETTE.river;
  ctx.lineCap = 'round';
  ctx.beginPath();
  let started = false;
  for (const p of RIVER_POINTS) {
    const s = project(plane, p.x, p.y, p.z, w, h, horizonY, pitchOffset);
    if (!s) continue;
    ctx.lineWidth = Math.max(1.5, 2600 / s.depth);
    if (!started) { ctx.moveTo(s.x, s.y); started = true; } else ctx.lineTo(s.x, s.y);
  }
  ctx.stroke();
}

export function drawTrees(ctx, plane, w, h, horizonY, pitchOffset) {
  for (const t of TREES) {
    const base = project(plane, t.x, terrainHeight(t.x, t.z), t.z, w, h, horizonY, pitchOffset);
    if (!base || base.depth > 7500) continue;
    const s = Math.max(2, 5200 / base.depth) * t.s;
    ctx.fillStyle = '#2c4a26';
    ctx.beginPath();
    ctx.moveTo(base.x, base.y - s * 2.2);
    ctx.lineTo(base.x - s * 0.8, base.y);
    ctx.lineTo(base.x + s * 0.8, base.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3f6b34';
    ctx.beginPath();
    ctx.moveTo(base.x, base.y - s * 2.2);
    ctx.lineTo(base.x - s * 0.45, base.y - s * 0.7);
    ctx.lineTo(base.x + s * 0.45, base.y - s * 0.7);
    ctx.closePath();
    ctx.fill();
  }
}

export function drawRunway(ctx, plane, w, h, horizonY, pitchOffset) {
  const corners = [
    project(plane, RUNWAY.x - RUNWAY.halfWidth, 4, RUNWAY.zStart, w, h, horizonY, pitchOffset),
    project(plane, RUNWAY.x + RUNWAY.halfWidth, 4, RUNWAY.zStart, w, h, horizonY, pitchOffset),
    project(plane, RUNWAY.x + RUNWAY.halfWidth, 4, RUNWAY.zEnd, w, h, horizonY, pitchOffset),
    project(plane, RUNWAY.x - RUNWAY.halfWidth, 4, RUNWAY.zEnd, w, h, horizonY, pitchOffset),
  ];
  if (corners.some((c) => !c)) return;
  ctx.fillStyle = PALETTE.runway;
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (const c of corners.slice(1)) ctx.lineTo(c.x, c.y);
  ctx.closePath();
  ctx.fill();
  // Centreline dashes and the big 27 threshold numbers.
  ctx.strokeStyle = PALETTE.runwayLine;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let z = RUNWAY.zStart + 120; z < RUNWAY.zEnd - 60; z += 220) {
    const a = project(plane, RUNWAY.x, 5, z, w, h, horizonY, pitchOffset);
    const b = project(plane, RUNWAY.x, 5, z + 110, w, h, horizonY, pitchOffset);
    if (a && b) { ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); }
  }
  ctx.stroke();
  const num = project(plane, RUNWAY.x, 6, RUNWAY.zStart + 70, w, h, horizonY, pitchOffset);
  if (num) {
    ctx.fillStyle = PALETTE.runwayLine;
    ctx.font = `bold ${Math.max(12, Math.round(9000 / num.depth))}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('27', num.x, num.y);
  }
  // Edge lights down both sides, green threshold, red far end, PAPI on approach.
  for (let z = RUNWAY.zStart + 60; z <= RUNWAY.zEnd; z += 150) {
    for (const side of [-1, 1]) {
      const light = project(plane, RUNWAY.x + side * (RUNWAY.halfWidth + 8), 6, z, w, h, horizonY, pitchOffset);
      if (!light) continue;
      ctx.fillStyle = '#fff3c4';
      ctx.shadowColor = '#fff3c4';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(light.x, light.y, Math.max(1.5, 2600 / light.depth), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  const threshold = project(plane, RUNWAY.x, 6, RUNWAY.zStart + 24, w, h, horizonY, pitchOffset);
  const thresholdR = project(plane, RUNWAY.x + RUNWAY.halfWidth, 6, RUNWAY.zStart + 24, w, h, horizonY, pitchOffset);
  if (threshold && thresholdR) {
    ctx.strokeStyle = '#7dff9a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(2 * threshold.x - thresholdR.x, threshold.y);
    ctx.lineTo(thresholdR.x, thresholdR.y);
    ctx.stroke();
  }
  for (let i = 0; i < 4; i++) {
    const papi = project(plane, RUNWAY.x + 92 + i * 22, 10, RUNWAY.zStart + 300, w, h, horizonY, pitchOffset);
    if (!papi) continue;
    ctx.fillStyle = i < 2 ? '#ff6b5e' : '#f5f2e8';
    const ps = Math.max(2, 3200 / papi.depth);
    ctx.fillRect(papi.x - ps / 2, papi.y - ps / 2, ps, ps);
  }
  // Hangars beside the strip.
  for (const hx of [-150, 150]) {
    const hangar = project(plane, RUNWAY.x + hx, 30, RUNWAY.zStart + 320, w, h, horizonY, pitchOffset);
    if (!hangar) continue;
    const s = Math.max(4, 5200 / hangar.depth);
    ctx.fillStyle = '#8a94a6';
    ctx.fillRect(hangar.x - s, hangar.y - s * 0.7, s * 2, s * 0.7);
    ctx.fillStyle = '#b5503c';
    ctx.fillRect(hangar.x - s, hangar.y - s * 0.7, s * 2, s * 0.18);
  }
}

export function drawTown(ctx, plane, w, h, horizonY, pitchOffset) {
  for (const b of TOWN_BLOCKS) {
    const base = project(plane, b.x, terrainHeight(b.x, b.z), b.z, w, h, horizonY, pitchOffset);
    if (!base || base.depth > 8000) continue;
    const s = Math.max(3, 9000 / base.depth);
    const bw = (b.w / 70) * s * 2;
    const bh = (b.h / 50) * s * 1.2;
    ctx.fillStyle = '#d8d2c4';
    ctx.fillRect(base.x - bw / 2, base.y - bh, bw, bh);
    ctx.fillStyle = b.roof;
    ctx.beginPath();
    ctx.moveTo(base.x - bw / 2, base.y - bh);
    ctx.lineTo(base.x, base.y - bh - s * 0.5);
    ctx.lineTo(base.x + bw / 2, base.y - bh);
    ctx.closePath();
    ctx.fill();
  }
}

export function drawLighthouse(ctx, plane, w, h, horizonY, pitchOffset) {
  const base = project(plane, LIGHTHOUSE.x, terrainHeight(LIGHTHOUSE.x, LIGHTHOUSE.z), LIGHTHOUSE.z, w, h, horizonY, pitchOffset);
  if (!base || base.depth > 9000) return;
  const s = Math.max(3, 9000 / base.depth);
  ctx.fillStyle = '#f5f2e8';
  ctx.fillRect(base.x - s * 0.4, base.y - s * 3.2, s * 0.8, s * 3.2);
  ctx.fillStyle = '#c23b2e';
  ctx.fillRect(base.x - s * 0.4, base.y - s * 2.4, s * 0.8, s * 0.5);
  ctx.fillRect(base.x - s * 0.4, base.y - s * 1.2, s * 0.8, s * 0.5);
  ctx.fillStyle = '#ffc93c';
  ctx.beginPath();
  ctx.arc(base.x, base.y - s * 3.4, s * 0.5, 0, Math.PI * 2);
  ctx.fill();
}

export function drawClouds(ctx, plane, w, h, horizonY, pitchOffset, timeSec) {
  for (const c of CLOUDS) {
    const drifted = { ...c, x: c.x + timeSec * c.drift };
    const p = project(plane, drifted.x, drifted.y, drifted.z, w, h, horizonY, pitchOffset);
    if (!p || p.depth < 400 || p.depth > 12000) continue;
    const s = c.size * p.scale * 0.9;
    if (s < 4) continue;
    // Shaded base first, then the lit top — clouds with volume, not flat blobs.
    ctx.fillStyle = 'rgba(185,200,224,0.85)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + s * 0.1, s, s * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, s, s * 0.32, 0, 0, Math.PI * 2);
    ctx.ellipse(p.x - s * 0.5, p.y + s * 0.08, s * 0.6, s * 0.24, 0, 0, Math.PI * 2);
    ctx.ellipse(p.x + s * 0.5, p.y + s * 0.08, s * 0.6, s * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawBirds(ctx, plane, w, h, horizonY, pitchOffset, timeSec) {
  ctx.strokeStyle = '#2b2b2b';
  ctx.lineWidth = 2;
  for (const b of BIRDS) {
    const bx = b.x + Math.sin(timeSec * b.speed + b.phase) * 300;
    const p = project(plane, bx, b.y, b.z, w, h, horizonY, pitchOffset);
    if (!p || p.depth > 6000) continue;
    const s = Math.max(2, 2600 / p.depth);
    const flap = Math.sin(timeSec * 9 + b.phase) * s * 0.5;
    ctx.beginPath();
    ctx.moveTo(p.x - s, p.y + flap);
    ctx.quadraticCurveTo(p.x, p.y - s * 0.4, p.x + s, p.y + flap);
    ctx.stroke();
  }
}

export function drawRings(ctx, plane, mission, w, h, horizonY, pitchOffset, timeSec) {
  const rings = mission.rings.length ? mission.rings : RING_COURSE.map((r) => ({ ...r, passed: false }));
  for (let i = 0; i < rings.length; i++) {
    const ring = rings[i];
    const isNext = mission.kind !== 'free' ? i === mission.nextRing : !ring.passed;
    const p = project(plane, ring.x, ring.y, ring.z, w, h, horizonY, pitchOffset);
    if (!p || p.depth < 30 || p.depth > 9000) continue;
    const r = Math.max(4, CONFIG.ringRadiusFt * p.scale);
    const pulse = 1 + Math.sin(timeSec * 3 + i) * 0.05;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(pulse, pulse);
    // Torus shading: dark outer rim, gold body, lit top arc — a ring, not a flat circle.
    ctx.lineWidth = Math.max(4, r * 0.22);
    ctx.strokeStyle = ring.passed ? 'rgba(46,110,62,0.9)' : 'rgba(150,90,0,0.9)';
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.92, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = Math.max(3, r * 0.13);
    ctx.strokeStyle = ring.passed ? 'rgba(125,255,154,0.95)' : isNext ? PALETTE.ringGold : 'rgba(255,201,60,0.5)';
    ctx.shadowColor = ring.passed ? '#7dff9a' : PALETTE.ringGlow;
    ctx.shadowBlur = isNext ? 22 : 8;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.92, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.lineWidth = Math.max(2, r * 0.04);
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.92, 0, Math.PI * 1.05, Math.PI * 1.65);
    ctx.stroke();
    if (isNext) {
      ctx.fillStyle = '#fff3c4';
      ctx.font = `bold ${Math.min(30, Math.max(12, Math.round(r * 0.32)))}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ring.label, 0, 0);
      ctx.textBaseline = 'alphabetic';
    }
    ctx.restore();
  }
}

export function drawTargetMarker(ctx, plane, target, w, h, horizonY, pitchOffset) {
  if (!target) return;
  const p = project(plane, target.x, target.y, target.z, w, h, horizonY, pitchOffset);
  const cx = p ? p.x : w / 2 + (target.x > plane.x ? 200 : -200);
  const cy = p ? p.y : horizonY - 120;
  const dist = Math.round(Math.hypot(target.x - plane.x, target.z - plane.z));
  ctx.save();
  ctx.strokeStyle = '#ffc93c';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(w / 2, h * 0.42);
  ctx.lineTo(cx, cy);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#ffc93c';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`▸ ${target.label}  ${dist.toLocaleString('en-US')} FT`, cx, cy - 18);
  ctx.restore();
}

export function drawAircraft(ctx, plane, w, h, timeSec) {
  const cx = w / 2;
  const cy = h * 0.58 + plane.pitchDeg * 2.2;
  const bank = (plane.rollDeg * Math.PI) / 180;
  const scale = 1.35 + plane.speedKts / 1200;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(bank * 0.55);
  ctx.scale(scale, scale);
  // Prop blur disc ahead of the nose.
  const prop = 26 + Math.sin(timeSec * 40) * 2;
  ctx.fillStyle = 'rgba(200,214,238,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, -58, prop, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  // Wings: red-white livery, rounded tips.
  ctx.fillStyle = '#c23b2e';
  ctx.beginPath();
  ctx.moveTo(-118, 6);
  ctx.quadraticCurveTo(-118, -12, -96, -14);
  ctx.lineTo(-16, -8);
  ctx.lineTo(-16, 10);
  ctx.lineTo(-96, 12);
  ctx.quadraticCurveTo(-118, 12, -118, 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c23b2e';
  ctx.beginPath();
  ctx.moveTo(118, 6);
  ctx.quadraticCurveTo(118, -12, 96, -14);
  ctx.lineTo(16, -8);
  ctx.lineTo(16, 10);
  ctx.lineTo(96, 12);
  ctx.quadraticCurveTo(118, 12, 118, 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f5f2e8';
  ctx.fillRect(-96, -14, 80, 6);
  ctx.fillRect(16, -14, 80, 6);
  // Tailplane and fin.
  ctx.fillStyle = '#8a2a20';
  ctx.beginPath();
  ctx.moveTo(-52, 44);
  ctx.lineTo(-14, 30);
  ctx.lineTo(-14, 46);
  ctx.lineTo(-52, 54);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(52, 44);
  ctx.lineTo(14, 30);
  ctx.lineTo(14, 46);
  ctx.lineTo(52, 54);
  ctx.closePath();
  ctx.fill();
  // Fuselage: cream body, red cheatline, glowing canopy.
  ctx.fillStyle = '#f5f2e8';
  ctx.beginPath();
  ctx.moveTo(0, -72);
  ctx.quadraticCurveTo(20, -40, 17, 10);
  ctx.quadraticCurveTo(15, 52, 0, 58);
  ctx.quadraticCurveTo(-15, 52, -17, 10);
  ctx.quadraticCurveTo(-20, -40, 0, -72);
  ctx.closePath();
  ctx.fill();
  // Sunlit top of the fuselage and a shaded belly — the aircraft reads as built.
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.ellipse(-3, -38, 7, 26, 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(60,20,12,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 34, 12, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c23b2e';
  ctx.fillRect(-16, -6, 32, 7);
  const canopy = ctx.createLinearGradient(0, -66, 0, -28);
  canopy.addColorStop(0, '#bfe6ff');
  canopy.addColorStop(1, '#2b6cb0');
  ctx.fillStyle = canopy;
  ctx.beginPath();
  ctx.ellipse(0, -46, 11, 19, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3d4c66';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -46, 11, 19, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Navigation lights: green right, red left, white tail — all lit.
  ctx.fillStyle = '#7dff9a';
  ctx.shadowColor = '#7dff9a';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(112, -2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff6b5e';
  ctx.shadowColor = '#ff6b5e';
  ctx.beginPath();
  ctx.arc(-112, -2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ctx.shadowColor = '#fff3c4';
  ctx.beginPath();
  ctx.arc(0, 56, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Registration on the fuselage.
  ctx.fillStyle = '#1d2b45';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('KF-7', 0, 34);
  ctx.restore();
  // Wingtip trails: fading white ribbons streaming back — speed you can see.
  if (plane.speedKts > 70 && !plane.grounded) {
    const trailLen = 60 + plane.speedKts * 0.35;
    for (const side of [-1, 1]) {
      for (let i = 0; i < 7; i++) {
        const t = i / 7;
        const alpha = 0.4 * (1 - t);
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
        ctx.lineWidth = 5 * (1 - t) + 1;
        ctx.beginPath();
        ctx.moveTo(cx + side * 112 * scale + side * t * 26, cy + 4 + t * trailLen * 0.6);
        ctx.lineTo(cx + side * 112 * scale + side * (t + 0.14) * 26, cy + 4 + (t + 0.14) * trailLen * 0.6);
        ctx.stroke();
      }
    }
  }
  // Ground shadow: a soft ellipse tracking the terrain below.
  const ground = terrainHeight(plane.x, plane.z);
  const heightAbove = Math.max(0, plane.altFt - ground);
  const shadowScale = Math.max(0.25, 1 - heightAbove / 2400);
  ctx.save();
  ctx.globalAlpha = 0.22 * shadowScale;
  ctx.fillStyle = '#0b0f18';
  ctx.beginPath();
  ctx.ellipse(cx + plane.rollDeg * 0.8, h * 0.86, 90 * shadowScale, 16 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawScene(ctx, plane, mission, view, w, h, timeSec) {
  const horizonY = h * 0.42 - plane.pitchDeg * 3;
  const pitchOffset = plane.pitchDeg * 1.5;
  drawSky(ctx, plane, w, h, horizonY, timeSec);
  drawRidges(ctx, plane, w, horizonY);
  drawGround(ctx, plane, w, h, horizonY, pitchOffset);
  drawTrees(ctx, plane, w, h, horizonY, pitchOffset);
  drawRunway(ctx, plane, w, h, horizonY, pitchOffset);
  drawTown(ctx, plane, w, h, horizonY, pitchOffset);
  drawLighthouse(ctx, plane, w, h, horizonY, pitchOffset);
  drawClouds(ctx, plane, w, h, horizonY, pitchOffset, timeSec);
  drawBirds(ctx, plane, w, h, horizonY, pitchOffset, timeSec);
  drawRings(ctx, plane, mission, w, h, horizonY, pitchOffset, timeSec);
  if (view === 'chase') drawAircraft(ctx, plane, w, h, timeSec);
}
