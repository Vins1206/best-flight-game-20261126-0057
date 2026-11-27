// Aeris Valley Air Rally — game loop and screens: one clear job — run the sortie.
// Title, play, landed and crashed states; keyboard + mouse; shot poses for screenshots.
import { CONFIG, MISSIONS } from './config.js';
import { createPlane, updateFlight } from './flight.js';
import { createInput, consumePress } from './input.js';
import { createAudio } from './audio.js';
import { drawHUD, drawCockpitPanel, drawCockpitFrame } from './instruments.js';
import { drawScene, drawTargetMarker } from './render.js';
import { createMission, updateMission, missionGoalText, nextRingTarget, runwayTarget } from './missions.js';
import { applyShot, shotView } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number(params.get('seed') || 1);

let W = 1280;
let H = 800;
let view = 'chase';
let missionIndex = 0;
let plane = createPlane();
let mission = createMission(MISSIONS[0].id);
let input = createInput(canvas);
let audio = createAudio();
let lastTime = performance.now();
let timeSec = seedParam * 1.7;
let flashTimer = 0;

function resizeCanvas() {
  W = canvas.clientWidth || window.innerWidth;
  H = canvas.clientHeight || window.innerHeight;
  canvas.width = W;
  canvas.height = H;
}

function startMission(index) {
  missionIndex = index;
  plane = createPlane();
  mission = createMission(MISSIONS[index].id);
  mission.state = 'play';
  audio.startEngine();
  audio.clickSound();
}

function startShotMode() {
  view = shotView(shotName);
  mission = createMission('rings');
  mission.state = 'play';
  mission.timeLeft = 187;
  applyShot(shotName, plane, mission);
  timeSec = 4.2;
}

function drawTitle() {
  drawScene(ctx, plane, mission, view, W, H, timeSec);
  ctx.fillStyle = 'rgba(8,12,22,0.55)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffc93c';
  ctx.font = 'bold 54px monospace';
  ctx.fillText(CONFIG.title, W / 2, H * 0.22);
  ctx.fillStyle = '#eaf2ff';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('Fly the Kitefin KF-7 over Aeris Valley — rings, runway, valley sky.', W / 2, H * 0.22 + 40);
  ctx.font = '18px monospace';
  ctx.fillStyle = '#9fb4d8';
  ctx.fillText('A complete flight game: chase + cockpit views, lit instruments, 3 missions, fuel and damage.', W / 2, H * 0.22 + 70);
  MISSIONS.forEach((m, i) => {
    const y = H * 0.40 + i * 76;
    const selected = i === missionIndex;
    ctx.fillStyle = selected ? 'rgba(255,201,60,0.18)' : 'rgba(10,16,28,0.6)';
    ctx.fillRect(W / 2 - 360, y - 28, 720, 62);
    ctx.strokeStyle = selected ? '#ffc93c' : '#3d4c66';
    ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - 360, y - 28, 720, 62);
    ctx.fillStyle = selected ? '#ffc93c' : '#eaf2ff';
    ctx.font = 'bold 19px monospace';
    ctx.fillText(`${i + 1}. ${m.name}`, W / 2, y - 2);
    ctx.fillStyle = '#c8d6ee';
    ctx.font = '15px monospace';
    ctx.fillText(m.goal, W / 2, y + 22);
  });
  ctx.fillStyle = '#eaf2ff';
  ctx.font = '17px monospace';
  ctx.fillText('W/S throttle  •  Arrow keys pitch + bank  •  Mouse steers  •  Wheel throttle', W / 2, H * 0.40 + 3 * 76 + 30);
  ctx.fillText('SPACE airbrake  •  G gear  •  F flaps  •  C camera  •  M mission  •  ENTER fly  •  R restart', W / 2, H * 0.40 + 3 * 76 + 56);
  ctx.fillStyle = '#7dff9a';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('PRESS ENTER OR CLICK TO FLY  —  1 / 2 / 3 picks a mission', W / 2, H * 0.40 + 3 * 76 + 96);
  ctx.fillStyle = '#9fb4d8';
  ctx.font = '13px monospace';
  ctx.fillText('Original game by Vins1206 — no network, no files beyond this folder.', W / 2, H - 22);
}

function drawBanner(text, subtext, color) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(10,16,28,0.78)';
  const bw = Math.max(420, ctx.measureText(text).width + 80);
  ctx.fillRect(W / 2 - bw / 2, H * 0.3 - 46, bw, 108);
  ctx.strokeStyle = color || '#ffc93c';
  ctx.lineWidth = 2;
  ctx.strokeRect(W / 2 - bw / 2, H * 0.3 - 46, bw, 108);
  ctx.fillStyle = color || '#ffc93c';
  ctx.font = 'bold 30px monospace';
  ctx.fillText(text, W / 2, H * 0.3);
  ctx.fillStyle = '#eaf2ff';
  ctx.font = '18px monospace';
  ctx.fillText(subtext, W / 2, H * 0.3 + 32);
  ctx.restore();
}

function drawEndScreen() {
  const win = mission.resultText.startsWith('LANDED');
  drawBanner(
    win ? 'SORTIE COMPLETE' : 'SORTIE OVER',
    `${mission.resultText}   •   SCORE ${mission.resultScore}   •   Press R to fly again`,
    win ? '#7dff9a' : '#ff6b5e',
  );
}

function announce(text) {
  if (statusEl) statusEl.textContent = text;
}

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  timeSec += dt;
  if (flashTimer > 0) flashTimer -= dt;

  if (consumePress(input, 'enter') || consumePress(input, ' ')) {
    if (mission.state === 'title') startMission(missionIndex);
  }
  if (consumePress(input, '1') && mission.state === 'title') missionIndex = 0;
  if (consumePress(input, '2') && mission.state === 'title') missionIndex = 1;
  if (consumePress(input, '3') && mission.state === 'title') missionIndex = 2;
  if (consumePress(input, 'm')) {
    if (mission.state === 'title') missionIndex = (missionIndex + 1) % MISSIONS.length;
    else startMission((missionIndex + 1) % MISSIONS.length);
  }
  if (consumePress(input, 'r')) startMission(missionIndex);
  if (consumePress(input, 'c')) view = view === 'chase' ? 'cockpit' : 'chase';
  if (consumePress(input, 'g') && mission.state === 'play') {
    plane.gearDown = !plane.gearDown;
    plane.message = plane.gearDown ? 'GEAR DOWN' : 'GEAR UP';
    plane.messageTimer = 1.5;
    audio.clickSound();
  }
  if (consumePress(input, 'f') && mission.state === 'play') {
    plane.flaps = !plane.flaps;
    plane.message = plane.flaps ? 'FLAPS DOWN' : 'FLAPS UP';
    plane.messageTimer = 1.5;
    audio.clickSound();
  }
  if (consumePress(input, 'enter') && mission.state === 'over') startMission(missionIndex);

  if (mission.state === 'play') {
    const beforeRings = mission.ringsPassed;
    updateFlight(plane, input, dt);
    updateMission(mission, plane, dt, () => audio.ringChime(), () => audio.thud());
    if (mission.ringsPassed > beforeRings) flashTimer = 0.4;
    if (plane.crashed) audio.thud();
    audio.updateEngine(plane.throttle, plane.speedKts, plane.crashed);
    announce(`Altitude ${Math.round(plane.altFt)} feet, speed ${Math.round(plane.speedKts)} knots, heading ${Math.round(plane.headingDeg)} degrees. Score ${mission.score}.`);
  }

  // Mouse click on the title also launches.
  canvas.onclick = () => {
    if (mission.state === 'title') startMission(missionIndex);
    audio.startEngine();
  };

  drawScene(ctx, plane, mission, view, W, H, timeSec);
  const target = mission.kind === 'landing' || mission.ringsPassed >= mission.rings.length
    ? runwayTarget() : nextRingTarget(mission);
  if (mission.state === 'play' && target) drawTargetMarker(ctx, plane, target, W, H, H * 0.42 - plane.pitchDeg * 3, plane.pitchDeg * 1.5);
  if (view === 'cockpit') {
    drawCockpitFrame(ctx, W, H);
    drawCockpitPanel(ctx, plane, W, H);
  }
  drawHUD(ctx, plane, mission, mission.score, mission.timeLeft, W, H);

  if (mission.state === 'title') drawTitle();
  if (mission.state === 'over') drawEndScreen();
  if (plane.message && plane.messageTimer > 0) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff3c4';
    ctx.font = 'bold 20px monospace';
    ctx.shadowColor = '#ff9d00';
    ctx.shadowBlur = 12;
    ctx.fillText(plane.message, W / 2, H * 0.2);
    ctx.restore();
  }
  if (flashTimer > 0) {
    ctx.fillStyle = `rgba(255,201,60,${flashTimer * 0.5})`;
    ctx.fillRect(0, 0, W, H);
  }
  // Mission goal reminder, bottom centre — above the panel in chase view only.
  if (mission.state === 'play' && view === 'chase') {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(10,16,28,0.6)';
    ctx.fillRect(W / 2 - 330, H - 34, 660, 24);
    ctx.fillStyle = '#c8d6ee';
    ctx.font = '13px monospace';
    ctx.fillText(missionGoalText(mission), W / 2, H - 17);
    ctx.restore();
  }
  requestAnimationFrame(frame);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
if (shotName) {
  startShotMode();
} else {
  plane.altFt = 900;
  plane.z = 1200;
}
requestAnimationFrame(frame);
