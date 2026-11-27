// Flight physics: one clear job — how the Kitefin KF-7 actually flies.
// Throttle, pitch, bank, stall, fuel burn, landing and crash detection.
import { CONFIG } from './config.js';
import { RUNWAY } from './world.js';
import { terrainHeight } from './random.js';

export function createPlane() {
  return {
    x: 0,
    z: -600,
    altFt: CONFIG.startAltitudeFt,
    headingDeg: 0,
    pitchDeg: 0,
    rollDeg: 0,
    speedKts: CONFIG.startSpeedKts,
    throttle: 0.55,
    fuel: CONFIG.fuelCapacity,
    damage: 0,
    gearDown: false,
    flaps: false,
    verticalSpeedFps: 0,
    grounded: false,
    landed: false,
    crashed: false,
    message: '',
    messageTimer: 0,
  };
}

export function headingRad(plane) {
  return (plane.headingDeg * Math.PI) / 180;
}

export function updateFlight(plane, input, dt) {
  if (plane.crashed || plane.landed) return;
  const prevAlt = plane.altFt;

  // Throttle: W / S, or mouse wheel. Fuel only burns while the engine runs.
  if (input.throttleUp) plane.throttle = Math.min(1, plane.throttle + dt * 0.6);
  if (input.throttleDown) plane.throttle = Math.max(0, plane.throttle - dt * 0.6);
  if (input.wheelDelta !== 0) {
    plane.throttle = Math.max(0, Math.min(1, plane.throttle - input.wheelDelta * 0.0012));
    input.wheelDelta = 0;
  }
  plane.fuel = Math.max(0, plane.fuel - CONFIG.fuelBurnPerSec * plane.throttle * dt);
  if (plane.fuel <= 0) plane.throttle = 0;

  // Pitch: Up / Down arrows or mouse Y. Arcade convention: Up climbs, Down dives.
  const pitchTarget = (input.pitchUp ? 14 : 0) + (input.pitchDown ? -12 : 0) - input.mousePitch * 16;
  const rollTarget = (input.rollLeft ? -38 : 0) + (input.rollRight ? 38 : 0) + input.mouseRoll * 42;
  plane.pitchDeg += (pitchTarget - plane.pitchDeg) * Math.min(1, dt * 3.2);
  plane.rollDeg += (rollTarget - plane.rollDeg) * Math.min(1, dt * 3.2);

  // Airbrake (Space) and flaps (F) trade speed for control on approach.
  const drag = input.airbrake ? 46 : plane.flaps ? 18 : 8;
  const targetSpeed = 55 + plane.throttle * (CONFIG.maxSpeedKts - 55);
  plane.speedKts += (targetSpeed - plane.speedKts) * Math.min(1, dt * 0.45)
    - drag * dt * (plane.speedKts / 120);
  plane.speedKts = Math.max(0, plane.speedKts);

  // Turn rate grows with bank and falls off near stall. Right bank turns right.
  const stallFactor = plane.speedKts < CONFIG.stallSpeedKts
    ? Math.max(0.25, plane.speedKts / CONFIG.stallSpeedKts) : 1;
  plane.headingDeg = (plane.headingDeg
    + plane.rollDeg * CONFIG.turnRate * stallFactor * dt * (plane.speedKts / 110) + 360) % 360;

  // Climb and sink: pitch lifts, stall sinks, flaps soften the sink.
  const speedFps = plane.speedKts * 1.68781;
  let climbFps = Math.sin((plane.pitchDeg * Math.PI) / 180) * speedFps * 0.9;
  if (plane.speedKts < CONFIG.stallSpeedKts) {
    climbFps -= (CONFIG.stallSpeedKts - plane.speedKts) * 0.9;
    if (!plane.stallWarned) { plane.message = 'STALL! NOSE DOWN, FULL THROTTLE'; plane.messageTimer = 2; plane.stallWarned = true; }
  } else {
    plane.stallWarned = false;
  }
  if (plane.flaps) climbFps *= 0.82;
  plane.altFt += climbFps * dt;
  plane.verticalSpeedFps = (plane.altFt - prevAlt) / Math.max(dt, 0.001);

  // Move over the ground.
  const hdg = headingRad(plane);
  const groundSpeed = speedFps * Math.cos((plane.pitchDeg * Math.PI) / 180);
  plane.x += Math.sin(hdg) * groundSpeed * dt;
  plane.z += Math.cos(hdg) * groundSpeed * dt;

  // Valley wind: a steady push from the west, felt most at low speed.
  const windToDeg = (CONFIG.windFromDeg + 180) % 360;
  const windRad = (windToDeg * Math.PI) / 180;
  const windFps = CONFIG.windSpeedKts * 1.68781 * 0.28;
  plane.x += Math.sin(windRad) * windFps * dt;
  plane.z += Math.cos(windRad) * windFps * dt;

  // Soft valley walls: steer back instead of letting the pilot fly off the map.
  const r = Math.hypot(plane.x, plane.z - 2400);
  if (r > CONFIG.worldRadius) {
    plane.headingDeg = (Math.atan2(-plane.x, 2400 - plane.z) * 180) / Math.PI;
    plane.message = 'VALLEY EDGE — TURNING BACK';
    plane.messageTimer = 2;
  }

  // Ground contact: runway landing or crash.
  const ground = terrainHeight(plane.x, plane.z);
  if (plane.altFt <= ground + 2) {
    plane.altFt = ground + 2;
    const onRunway = Math.abs(plane.x - RUNWAY.x) < RUNWAY.halfWidth
      && plane.z > RUNWAY.zStart && plane.z < RUNWAY.zEnd;
    const aligned = Math.abs(((plane.headingDeg + 180) % 360) - 180) < 1
      || plane.headingDeg < 25 || plane.headingDeg > 335;
    const soft = plane.verticalSpeedFps > -420 && plane.speedKts < 105;
    if (onRunway && soft && plane.gearDown && aligned) {
      plane.landed = true;
      plane.grounded = true;
      plane.message = 'TOUCHDOWN ON RUNWAY 27';
      plane.messageTimer = 4;
    } else {
      plane.crashed = true;
      plane.damage = 100;
      plane.message = onRunway && !plane.gearDown
        ? 'CRASH — GEAR WAS UP' : 'CRASHED INTO THE VALLEY FLOOR';
      plane.messageTimer = 4;
    }
  }
  if (plane.messageTimer > 0) plane.messageTimer -= dt;
}

export function landingQuality(plane) {
  const vs = Math.abs(plane.verticalSpeedFps);
  const centre = 1 - Math.min(1, Math.abs(plane.x - RUNWAY.x) / RUNWAY.halfWidth);
  const soft = Math.max(0, 1 - vs / 420);
  return Math.round((soft * 0.6 + centre * 0.4) * 100);
}
