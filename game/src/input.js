// Keyboard + mouse controls: one clear job — every pilot input, in one place.
// W/S throttle, arrows pitch and bank, Space airbrake, G gear, F flaps, C camera, M mission.
export function createInput(canvas) {
  const input = {
    throttleUp: false,
    throttleDown: false,
    pitchUp: false,
    pitchDown: false,
    rollLeft: false,
    rollRight: false,
    airbrake: false,
    wheelDelta: 0,
    mousePitch: 0,
    mouseRoll: 0,
    mouseActive: false,
    pressed: {},
  };
  const keys = {};

  function keyDown(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    keys[e.key.toLowerCase()] = true;
    input.pressed[e.key.toLowerCase()] = true;
    syncKeys();
  }
  function keyUp(e) {
    keys[e.key.toLowerCase()] = false;
    syncKeys();
  }
  function syncKeys() {
    input.throttleUp = !!keys.w;
    input.throttleDown = !!keys.s;
    input.pitchUp = !!keys.arrowup;
    input.pitchDown = !!keys.arrowdown;
    input.rollLeft = !!keys.arrowleft;
    input.rollRight = !!keys.arrowright;
    input.airbrake = !!keys[' '];
  }
  function mouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    input.mouseRoll = Math.max(-1, Math.min(1, nx));
    input.mousePitch = Math.max(-1, Math.min(1, ny));
    input.mouseActive = true;
  }
  function wheel(e) {
    e.preventDefault();
    input.wheelDelta += e.deltaY;
  }
  function blur() {
    for (const k of Object.keys(keys)) keys[k] = false;
    input.mouseRoll = 0;
    input.mousePitch = 0;
    syncKeys();
  }
  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  window.addEventListener('blur', blur);
  canvas.addEventListener('mousemove', mouseMove);
  canvas.addEventListener('wheel', wheel, { passive: false });
  return input;
}

export function consumePress(input, key) {
  if (input.pressed[key]) {
    input.pressed[key] = false;
    return true;
  }
  return false;
}
