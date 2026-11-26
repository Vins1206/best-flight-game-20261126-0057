// Aeris Valley config: one clear job — every tunable number for the flight game.
// Original game: "Aeris Valley Air Rally" — a prop-plane rally over a volcanic island valley.
export const CONFIG = {
  title: 'AERIS VALLEY AIR RALLY',
  planeName: 'Kitefin KF-7',
  valleyName: 'Aeris Valley',
  runwayName: 'RUNWAY 27',
  // Flight envelope (arcade, knots and feet).
  maxSpeedKts: 210,
  cruiseSpeedKts: 120,
  stallSpeedKts: 58,
  maxThrottle: 1,
  climbRate: 26,
  turnRate: 0.55,
  fuelCapacity: 100,
  fuelBurnPerSec: 0.55,
  sortieSeconds: 240,
  ringRadiusFt: 90,
  ringScore: 100,
  landingScore: 500,
  // World scale: 1 unit = 1 foot on the ground plane.
  worldRadius: 9000,
  groundLevel: 0,
  startAltitudeFt: 420,
  startSpeedKts: 110,
};

export const MISSIONS = [
  {
    id: 'rings',
    name: 'RING RALLY',
    short: 'Rings',
    goal: 'Fly through all 6 golden rings in order, then land on Runway 27.',
    rings: 6,
  },
  {
    id: 'landing',
    name: 'RUNWAY LANDING',
    short: 'Landing',
    goal: 'Line up with Runway 27, drop the gear (G), flare slow and touch down soft.',
    rings: 0,
  },
  {
    id: 'free',
    name: 'FREE FLIGHT',
    short: 'Free',
    goal: 'Explore Aeris Valley. Rings respawn — chase them before the fuel runs out.',
    rings: 99,
  },
];

export const PALETTE = {
  skyTop: '#1d4e89',
  skyMid: '#7fb2e5',
  skyLow: '#ffd9a0',
  sunCore: '#fff3c4',
  sunGlow: '#ffb347',
  mountainFar: '#6d7fa8',
  mountainNear: '#3f5a44',
  groundFar: '#7fae62',
  groundNear: '#4c7a3d',
  fieldA: '#8fbf5a',
  fieldB: '#c2a95e',
  fieldC: '#5d8a4a',
  river: '#5fb4dd',
  lake: '#4f9fd8',
  runway: '#3a3f46',
  runwayLine: '#f5f2e8',
  ringGold: '#ffc93c',
  ringGlow: '#ff9d00',
  hudAmber: '#ffb347',
  hudGreen: '#7dff9a',
  hudRed: '#ff6b5e',
  panelDark: '#141a24',
  panelGlow: '#2b3a55',
};
