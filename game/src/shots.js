// Screenshot scenes: one clear job — deterministic staged poses for real renders.
// Each shot starts the game mid-flight in a named pose; the browser renders the live game.
export function applyShot(shot, plane, mission) {
  const presets = {
    cover: {
      x: -320, z: -100, altFt: 560, headingDeg: 6, pitchDeg: -2, rollDeg: -6,
      speedKts: 132, throttle: 0.72, fuel: 82,
    },
    rings: {
      x: -330, z: 500, altFt: 480, headingDeg: 4, pitchDeg: -1, rollDeg: 10,
      speedKts: 148, throttle: 0.8, fuel: 76,
    },
    landing: {
      x: 24, z: 260, altFt: 150, headingDeg: 0, pitchDeg: -4, rollDeg: 2,
      speedKts: 88, throttle: 0.42, fuel: 61, gearDown: true, flaps: true,
    },
    cockpit: {
      x: 260, z: 2100, altFt: 640, headingDeg: -14, pitchDeg: -3, rollDeg: -12,
      speedKts: 126, throttle: 0.66, fuel: 70,
    },
  };
  const preset = presets[shot] || presets.cover;
  Object.assign(plane, preset);
  plane.message = shot === 'rings' ? 'RING 1 — FLY THROUGH THE GOLD' : '';
  plane.messageTimer = shot === 'rings' ? 3 : 0;
  if (shot === 'rings') mission.nextRing = 0;
  if (shot === 'landing') {
    mission.ringsPassed = 6;
    mission.nextRing = 6;
    mission.score = 740;
  }
  if (shot === 'cover') mission.score = 240;
  if (shot === 'cockpit') mission.score = 410;
  return preset;
}

export function shotView(shot) {
  return shot === 'cockpit' ? 'cockpit' : 'chase';
}
