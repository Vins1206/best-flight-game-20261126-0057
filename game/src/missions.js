// Missions: one clear job — the sortie state machine.
// Ring Rally, Runway Landing and Free Flight; scoring, rings, timer, win and loss.
import { CONFIG, MISSIONS } from './config.js';
import { RING_COURSE, RUNWAY } from './world.js';
import { landingQuality } from './flight.js';

export function createMission(kindId) {
  const def = MISSIONS.find((m) => m.id === kindId) || MISSIONS[0];
  return {
    def,
    kind: def.id,
    rings: def.id === 'rings'
      ? RING_COURSE.map((r) => ({ ...r, passed: false }))
      : def.id === 'free'
        ? RING_COURSE.map((r) => ({ ...r, passed: false }))
        : [],
    nextRing: 0,
    ringsPassed: 0,
    score: 0,
    timeLeft: CONFIG.sortieSeconds,
    state: 'title',
    resultText: '',
    resultScore: 0,
    landedQuality: 0,
  };
}

export function missionGoalText(mission) {
  return mission.def.goal;
}

export function updateMission(mission, plane, dt, onRing, onLand) {
  if (mission.state !== 'play') return;
  mission.timeLeft -= dt;
  if (mission.timeLeft <= 0) {
    mission.timeLeft = 0;
    mission.state = 'over';
    mission.resultText = `TIME UP — ${mission.ringsPassed} RING${mission.ringsPassed === 1 ? '' : 'S'} FLOWN`;
    mission.resultScore = mission.score;
    return;
  }
  if (plane.crashed) {
    mission.state = 'over';
    mission.resultText = 'SORTIE LOST — THE KITEFIN IS DOWN';
    mission.resultScore = mission.score;
    return;
  }
  if (plane.landed) {
    const q = landingQuality(plane);
    mission.landedQuality = q;
    const bonus = Math.round((CONFIG.landingScore * q) / 100);
    if (!mission.landingScored) {
      mission.score += bonus;
      mission.landingScored = true;
    }
    mission.state = 'over';
    mission.resultText = `LANDED ON RUNWAY 27 — QUALITY ${q}%  (+${bonus})`;
    mission.resultScore = mission.score;
    if (onLand) onLand(q, bonus);
    return;
  }
  // Ring checks: the next ring in the course, or any ring in Free Flight.
  const rings = mission.rings;
  for (let i = 0; i < rings.length; i++) {
    const ring = rings[i];
    if (ring.passed) continue;
    if (mission.kind !== 'free' && i !== mission.nextRing) continue;
    const dx = plane.x - ring.x;
    const dz = plane.z - ring.z;
    const dy = plane.altFt - ring.y;
    const dist = Math.sqrt(dx * dx + dz * dz + dy * dy);
    if (dist < CONFIG.ringRadiusFt) {
      ring.passed = true;
      mission.ringsPassed += 1;
      mission.nextRing = i + 1;
      const timeBonus = Math.max(0, Math.round(mission.timeLeft / 10));
      mission.score += CONFIG.ringScore + timeBonus;
      plane.message = `RING ${mission.ringsPassed} — +${CONFIG.ringScore + timeBonus}`;
      plane.messageTimer = 2;
      if (onRing) onRing(ring, mission.ringsPassed);
      if (mission.kind === 'free') {
        // Free Flight respawns the ring further along the valley.
        setTimeout(() => { ring.passed = false; }, 1);
        ring.x += (Math.random() - 0.5) * 400;
        ring.z += 900;
        ring.y = 480 + Math.random() * 320;
      }
      if (mission.kind === 'rings' && mission.ringsPassed >= rings.length) {
        plane.message = 'ALL RINGS! NOW LAND ON RUNWAY 27';
        plane.messageTimer = 4;
      }
    }
  }
}

export function nextRingTarget(mission) {
  if (!mission.rings.length) return null;
  if (mission.kind === 'free') return mission.rings.find((r) => !r.passed) || mission.rings[0];
  return mission.rings[mission.nextRing] || null;
}

export function runwayTarget() {
  return { x: RUNWAY.x, z: (RUNWAY.zStart + RUNWAY.zEnd) / 2, y: 40, label: 'RWY 27' };
}
