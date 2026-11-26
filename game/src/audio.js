// Synthesised sound: one clear job — engine hum, ring chimes and impacts.
// WebAudio oscillators only; no audio files, no network, starts on first pilot input.
export function createAudio() {
  const audio = {
    ctx: null,
    engineOsc: null,
    engineOsc2: null,
    engineGain: null,
    windGain: null,
    muted: false,
    started: false,
  };

  function ensureContext() {
    if (audio.ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      audio.ctx = new AC();
      audio.engineGain = audio.ctx.createGain();
      audio.engineGain.gain.value = 0;
      audio.engineGain.connect(audio.ctx.destination);
      audio.engineOsc = audio.ctx.createOscillator();
      audio.engineOsc.type = 'sawtooth';
      audio.engineOsc.frequency.value = 62;
      audio.engineOsc.connect(audio.engineGain);
      audio.engineOsc.start();
      audio.engineOsc2 = audio.ctx.createOscillator();
      audio.engineOsc2.type = 'square';
      audio.engineOsc2.frequency.value = 31;
      const g2 = audio.ctx.createGain();
      g2.gain.value = 0.4;
      audio.engineOsc2.connect(g2);
      g2.connect(audio.engineGain);
      audio.engineOsc2.start();
      audio.started = true;
      return true;
    } catch (err) {
      return false;
    }
  }

  function startEngine() {
    if (ensureContext() && audio.ctx.state === 'suspended') audio.ctx.resume();
  }

  function updateEngine(throttle, speedKts, crashed) {
    if (!audio.ctx || !audio.started) return;
    const target = crashed || audio.muted ? 0 : 0.05 + throttle * 0.09;
    audio.engineGain.gain.setTargetAtTime(target, audio.ctx.currentTime, 0.1);
    audio.engineOsc.frequency.setTargetAtTime(52 + throttle * 70 + speedKts * 0.25, audio.ctx.currentTime, 0.1);
    audio.engineOsc2.frequency.setTargetAtTime(26 + throttle * 35, audio.ctx.currentTime, 0.1);
  }

  function blip(freq, dur, type, vol) {
    if (!ensureContext() || audio.muted) return;
    const t = audio.ctx.currentTime;
    const osc = audio.ctx.createOscillator();
    const gain = audio.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(vol || 0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(audio.ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function ringChime() {
    blip(880, 0.35, 'sine', 0.2);
    setTimeout(() => blip(1318, 0.4, 'sine', 0.16), 90);
  }

  function thud() {
    blip(70, 0.5, 'triangle', 0.3);
    blip(45, 0.7, 'sine', 0.25);
  }

  function clickSound() {
    blip(1200, 0.06, 'square', 0.06);
  }

  return { startEngine, updateEngine, ringChime, thud, clickSound, audio };
}
