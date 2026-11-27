// Lit instruments and HUD: one clear job — everything the pilot reads.
// Altimeter, airspeed, compass, artificial horizon, fuel, throttle, gear and flaps.
import { CONFIG } from './config.js';

export function drawGauge(ctx, cx, cy, r, label, valueText, frac, color) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#101623';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#3d4c66';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r - 4, -Math.PI * 0.75, -Math.PI * 0.75 + Math.PI * 1.5 * frac);
  ctx.strokeStyle = color;
  ctx.lineWidth = 7;
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#eaf2ff';
  ctx.font = `bold ${Math.round(r * 0.52)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(valueText, cx, cy - 2);
  ctx.fillStyle = '#9fb4d8';
  ctx.font = `bold ${Math.round(r * 0.24)}px monospace`;
  ctx.fillText(label, cx, cy + r * 0.55);
  ctx.restore();
}

export function drawArtificialHorizon(ctx, cx, cy, r, pitchDeg, rollDeg) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.translate(cx, cy);
  ctx.rotate((-rollDeg * Math.PI) / 180);
  const pitchPx = (pitchDeg / 30) * r;
  ctx.fillStyle = '#3f7fd0';
  ctx.fillRect(-r, -r - pitchPx, r * 2, r + pitchPx);
  ctx.fillStyle = '#7a5a34';
  ctx.fillRect(-r, -pitchPx, r * 2, r + pitchPx);
  ctx.strokeStyle = '#f5f2e8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r, -pitchPx);
  ctx.lineTo(r, -pitchPx);
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#3d4c66';
  ctx.stroke();
  ctx.strokeStyle = '#ffc93c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 16, cy);
  ctx.lineTo(cx - 4, cy);
  ctx.moveTo(cx + 4, cy);
  ctx.lineTo(cx + 16, cy);
  ctx.moveTo(cx, cy - 4);
  ctx.lineTo(cx, cy + 4);
  ctx.stroke();
  ctx.fillStyle = '#9fb4d8';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ATTITUDE', cx, cy + r + 13);
  ctx.restore();
}

export function drawCompassStrip(ctx, w, headingDeg) {
  const cy = 66;
  const labels = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  ctx.save();
  ctx.fillStyle = 'rgba(10,16,28,0.72)';
  ctx.fillRect(w / 2 - 190, 34, 380, 62);
  ctx.strokeStyle = 'rgba(255,201,60,0.55)';
  ctx.lineWidth = 1;
  ctx.strokeRect(w / 2 - 190, 34, 380, 62);
  ctx.fillStyle = '#eaf2ff';
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'center';
  for (let d = -120; d <= 120; d += 15) {
    const x = w / 2 + d * 1.35;
    ctx.fillRect(x - 1, cy - 16, 2, 7);
  }
  // Cardinal points at their exact offsets, so N/E/S/W are always visible.
  for (let i = 0; i < 8; i++) {
    const cardDeg = i * 45;
    const delta = ((cardDeg - headingDeg + 540) % 360) - 180;
    if (Math.abs(delta) > 118) continue;
    const x = w / 2 + delta * 1.35;
    ctx.fillStyle = '#ffc93c';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(labels[i], x, cy + 16);
    ctx.fillRect(x - 1, cy - 16, 2, 12);
  }
  ctx.fillStyle = '#ffc93c';
  ctx.beginPath();
  ctx.moveTo(w / 2 - 7, 34);
  ctx.lineTo(w / 2 + 7, 34);
  ctx.lineTo(w / 2, 46);
  ctx.closePath();
  ctx.fill();
  ctx.font = 'bold 13px monospace';
  ctx.fillText(`HDG ${String(Math.round(headingDeg)).padStart(3, '0')}°`, w / 2, 30);
  ctx.restore();
}

export function drawHUD(ctx, plane, mission, score, timeLeft, w, h) {
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  // Top-left: altitude, speed, heading, vertical speed — big, lit, always readable.
  ctx.fillStyle = 'rgba(10,16,28,0.72)';
  ctx.fillRect(14, 14, 300, 126);
  ctx.strokeStyle = 'rgba(255,201,60,0.55)';
  ctx.strokeRect(14, 14, 300, 126);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffc93c';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('ALTITUDE', 28, 36);
  ctx.fillText('SPEED', 28, 66);
  ctx.fillText('HEADING', 28, 96);
  ctx.fillText('VERT', 28, 126);
  ctx.fillStyle = '#eaf2ff';
  ctx.font = 'bold 26px monospace';
  ctx.fillText(`${Math.round(plane.altFt).toLocaleString('en-US')} FT`, 130, 38);
  ctx.fillText(`${Math.round(plane.speedKts)} KT`, 130, 68);
  ctx.fillText(`${String(Math.round(plane.headingDeg)).padStart(3, '0')}°`, 130, 98);
  ctx.font = 'bold 20px monospace';
  const vsFpm = Math.round(plane.verticalSpeedFps * 60);
  ctx.fillText(`${vsFpm >= 0 ? '+' : ''}${vsFpm.toLocaleString('en-US')} FPM`, 130, 128);
  if (plane.speedKts < CONFIG.stallSpeedKts && plane.altFt > 60) {
    ctx.fillStyle = '#ff6b5e';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('⚠ STALL', 250, 68);
  }
  // Top-right: mission, score, timer, rings and wind — the sortie at a glance.
  ctx.fillStyle = 'rgba(10,16,28,0.72)';
  ctx.fillRect(w - 314, 14, 300, 118);
  ctx.strokeStyle = 'rgba(125,255,154,0.5)';
  ctx.strokeRect(w - 314, 14, 300, 118);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#7dff9a';
  ctx.font = 'bold 13px monospace';
  ctx.fillText(mission.def.name, w - 28, 36);
  ctx.fillStyle = '#eaf2ff';
  ctx.font = 'bold 24px monospace';
  ctx.fillText(`SCORE ${score}`, w - 28, 66);
  const mm = Math.floor(timeLeft / 60);
  const ss = String(Math.floor(timeLeft % 60)).padStart(2, '0');
  ctx.font = 'bold 18px monospace';
  ctx.fillStyle = timeLeft < 30 ? '#ff6b5e' : '#eaf2ff';
  ctx.fillText(`TIME ${mm}:${ss}`, w - 28, 94);
  ctx.fillStyle = '#ffc93c';
  ctx.font = 'bold 14px monospace';
  const ringsText = mission.rings.length
    ? `RINGS ${mission.ringsPassed}/${mission.rings.length}` : 'LAND IT SOFT';
  ctx.fillText(`${ringsText}  •  WIND ${CONFIG.windFromDeg}°/${CONFIG.windSpeedKts}KT`, w - 28, 120);
  drawCompassStrip(ctx, w, plane.headingDeg);
  // Fuel + throttle bars, bottom-left above the panel.
  const barY = h - 196;
  ctx.fillStyle = 'rgba(10,16,28,0.72)';
  ctx.fillRect(14, barY - 8, 220, 62);
  ctx.fillStyle = '#9fb4d8';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`FUEL ${Math.round(plane.fuel)}%`, 24, barY + 10);
  ctx.fillStyle = plane.fuel < 20 ? '#ff6b5e' : '#7dff9a';
  ctx.fillRect(24, barY + 16, 180 * (plane.fuel / 100), 8);
  ctx.fillStyle = '#9fb4d8';
  ctx.fillText(`THR ${Math.round(plane.throttle * 100)}%`, 24, barY + 36);
  ctx.fillStyle = '#ffb347';
  ctx.fillRect(24, barY + 42, 180 * plane.throttle, 8);
  ctx.restore();
}

export function drawCockpitFrame(ctx, w, h) {
  const panelTop = h - 168;
  ctx.save();
  ctx.fillStyle = '#0b0f18';
  // A-pillars and a centre post: the windshield reads as a cockpit, not a window.
  ctx.beginPath();
  ctx.moveTo(w * 0.045, panelTop);
  ctx.lineTo(w * 0.085, 0);
  ctx.lineTo(w * 0.115, 0);
  ctx.lineTo(w * 0.085, panelTop);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w * 0.955, panelTop);
  ctx.lineTo(w * 0.915, 0);
  ctx.lineTo(w * 0.885, 0);
  ctx.lineTo(w * 0.915, panelTop);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(w / 2 - 5, 0, 10, panelTop);
  ctx.fillRect(0, 0, w, 16);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(w * 0.085, 0, 3, panelTop);
  ctx.fillRect(w * 0.912, 0, 3, panelTop);
  ctx.restore();
}

export function drawCockpitPanel(ctx, plane, w, h) {
  const panelTop = h - 168;
  ctx.save();
  const grad = ctx.createLinearGradient(0, panelTop, 0, h);
  grad.addColorStop(0, '#1b2436');
  grad.addColorStop(1, '#0b0f18');
  ctx.fillStyle = grad;
  ctx.fillRect(0, panelTop, w, h - panelTop);
  // Warm wash along the panel's top edge — the instruments are lit.
  const wash = ctx.createLinearGradient(0, panelTop, 0, panelTop + 26);
  wash.addColorStop(0, 'rgba(255,179,71,0.28)');
  wash.addColorStop(1, 'rgba(255,179,71,0)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, panelTop, w, 26);
  ctx.strokeStyle = '#2b3a55';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, panelTop);
  ctx.lineTo(w, panelTop);
  ctx.stroke();
  const cy = panelTop + 78;
  drawGauge(ctx, w * 0.16, cy, 52, 'ALT FT', String(Math.round(plane.altFt)), Math.min(1, plane.altFt / 3000), '#ffb347');
  drawGauge(ctx, w * 0.30, cy, 52, 'SPD KT', String(Math.round(plane.speedKts)), Math.min(1, plane.speedKts / 220), '#7dff9a');
  drawArtificialHorizon(ctx, w * 0.44, cy, 52, plane.pitchDeg, plane.rollDeg);
  drawGauge(ctx, w * 0.58, cy, 52, 'FUEL %', String(Math.round(plane.fuel)), plane.fuel / 100, plane.fuel < 20 ? '#ff6b5e' : '#7dff9a');
  drawGauge(ctx, w * 0.72, cy, 52, 'HDG', String(Math.round(plane.headingDeg)).padStart(3, '0'), plane.headingDeg / 360, '#5fb4dd');
  // Gear and flaps lamps.
  ctx.textAlign = 'center';
  ctx.font = 'bold 13px monospace';
  const lamps = [
    { label: 'GEAR', on: plane.gearDown, color: '#7dff9a' },
    { label: 'FLAPS', on: plane.flaps, color: '#7dff9a' },
    { label: 'STALL', on: plane.speedKts < CONFIG.stallSpeedKts && plane.altFt > 60, color: '#ff6b5e' },
  ];
  lamps.forEach((lamp, i) => {
    const x = w * 0.84 + i * 52;
    ctx.beginPath();
    ctx.arc(x, cy - 18, 13, 0, Math.PI * 2);
    ctx.fillStyle = lamp.on ? lamp.color : '#2b3a55';
    if (lamp.on) { ctx.shadowColor = lamp.color; ctx.shadowBlur = 14; }
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#9fb4d8';
    ctx.fillText(lamp.label, x, cy + 16);
  });
  ctx.fillStyle = '#5f7396';
  ctx.font = '11px monospace';
  ctx.fillText('KITEFIN KF-7  •  AERIS VALLEY', w * 0.88, cy + 52);
  ctx.restore();
}
