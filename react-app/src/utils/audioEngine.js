/**
 * audioEngine.js
 * Web Audio API 8-bit sound effects — no audio files required.
 * All sounds are synthesized from oscillators.
 */

let audioCtx = null;

const getCtx = () => {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return null; }
  }
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
};

const playNote = (freq, duration, type = 'square', volume = 0.22) => {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration + 0.01);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.02);
  } catch (_) { /* audio is enhancement only */ }
};

const seq = (notes) =>
  notes.forEach(([f, d, t, type, vol]) =>
    setTimeout(() => playNote(f, d, type || 'square', vol || 0.22), t)
  );

export const sfx = {
  dialog:   () => playNote(523, 0.04, 'square', 0.11),
  cursor:   () => playNote(660, 0.05, 'square', 0.09),
  confirm:  () => seq([[784,0.07,0],[1047,0.12,80]]),
  cancel:   () => playNote(330, 0.10, 'square', 0.11),
  menuOpen: () => seq([[523,0.06,0],[660,0.10,55]]),

  hit:         () => seq([[200,0.06,0,'sawtooth',0.22],[140,0.10,55,'sawtooth',0.16]]),
  fireHit:     () => seq([[880,0.06,0,'sawtooth',0.20],[440,0.12,55,'sawtooth',0.15]]),
  waterHit:    () => seq([[200,0.08,0,'sine',0.18],[300,0.12,60,'sine',0.14]]),
  electricHit: () => seq([[1200,0.04,0,'square',0.25],[800,0.06,35,'square',0.20]]),
  specialHit:  () => seq([[440,0.08,0,'sine',0.20],[660,0.12,60,'sine',0.15]]),
  critical:    () => seq([[160,0.04,0,'sawtooth',0.35],[240,0.07,40,'sawtooth',0.30],[180,0.13,85,'sawtooth',0.25]]),
  faint:       () => seq([[400,0.14,0],[300,0.14,130],[220,0.14,260],[140,0.18,390]]),

  // Ascending arpeggio C-E-G-C when leveling up
  levelUp:  () => seq([[523,0.18,0],[659,0.18,140],[784,0.18,280],[1047,0.45,420]]),

  throwBall: () => seq([[880,0.08,0,'sine',0.14],[660,0.14,80,'sine',0.10]]),
  wobble:    () => playNote(200, 0.10, 'sine', 0.12),

  // Victory jingle for catching a Pokémon
  catchSuccess: () => seq([
    [523,0.14,0],[659,0.14,110],[784,0.14,210],
    [659,0.10,360],[784,0.10,460],[1047,0.4,560]
  ]),

  encounter: () => seq([[280,0.07,0,'sawtooth',0.26],[370,0.07,80,'sawtooth',0.26],[480,0.09,160,'sawtooth',0.26]]),

  // Soft chord at Pokémon Center
  heal: () => seq([[784,0.22,0,'sine',0.17],[988,0.22,200,'sine',0.17],[1175,0.40,400,'sine',0.17]]),

  item:   () => seq([[1047,0.12,0],[1319,0.26,130]]),
  xpTick: () => playNote(660, 0.024, 'square', 0.055),
  dmgPop: () => playNote(300, 0.04, 'square', 0.07),

  // Full medal fanfare
  badge: () => seq([
    [523,0.13,0],[659,0.13,110],[784,0.13,220],
    [988,0.13,330],[1175,0.13,440],[1319,0.55,550]
  ]),
};

// Call once on first user gesture to unlock AudioContext on iOS/Safari
export const initAudio = () => { getCtx(); };
