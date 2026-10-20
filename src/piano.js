// Docs: docs/places/piano.md
// The Music House: a room whose floor is a giant keyboard (layout in src/shared/sim.js). Landing on a key
// plays its note for everyone in the room — your own landings straight from prediction, everyone else's
// from the server's {t:'note'} messages. Notes are synthesised with Web Audio (a soft, toy-piano tone).
import { W, H, circle, ellipse } from './util.js';
import { text } from './village.js';
import { ROOMS, PIANO, KEY_W, BLACK_KEYS, whiteMidi, PIANO_EXIT_X } from './shared/sim.js';

const ROOM = ROOMS[PIANO];
const FLOOR = ROOM.ground;
const WHITE_KEYS = ROOM.width / KEY_W;
const KEY_COLORS = ['#ff9fb8', '#ffb38a', '#fff1a8', '#a6f5c9', '#9fd8ff', '#c9b6ff', '#ffb3e6'];
const FONT = "Fredoka, 'Trebuchet MS', sans-serif";

export class Piano {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.lit = new Map(); // midi → time it was last played (keys dip and glow)
    this.notes = []; // floating ♪: { x, y, at, color }
    this.time = 0;
  }

  // From a user gesture (the login click): browsers only allow audio after one
  unlock() {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.32;
        const comp = this.ctx.createDynamicsCompressor(); // lots of slimes landing at once shouldn't clip
        this.master.connect(comp).connect(this.ctx.destination);
      } catch {
        return;
      }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  // Play note `midi`, landed on at world x; listenerX pans it left/right of you.
  play(midi, x, listenerX) {
    this.lit.set(midi, this.time);
    const color = KEY_COLORS[(midi * 5) % KEY_COLORS.length];
    this.notes.push({ x, y: FLOOR - 50, at: this.time, color, drift: Math.random() * 2 - 1 });
    if (this.notes.length > 40) this.notes.shift();
    const ac = this.ctx;
    if (!ac || ac.state !== 'running') return;
    const t = ac.currentTime, f = 440 * 2 ** ((midi - 69) / 12);
    const env = ac.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(1, t + 0.006);
    env.gain.exponentialRampToValueAtTime(0.35, t + 0.18);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    const tone = ac.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = Math.min(9000, f * 6);
    const pan = ac.createStereoPanner();
    pan.pan.value = Math.max(-0.8, Math.min(0.8, (x - listenerX) / 600));
    env.connect(tone).connect(pan).connect(this.master);
    for (const [mult, type, gain] of [[1, 'triangle', 0.55], [1, 'sine', 0.35], [2, 'sine', 0.12], [3, 'sine', 0.05]]) {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type;
      o.frequency.value = f * mult;
      o.detune.value = (Math.random() - 0.5) * 4;
      g.gain.value = gain;
      o.connect(g).connect(env);
      o.start(t);
      o.stop(t + 1.7);
    }
  }

  update(dt) {
    this.time += dt;
    this.notes = this.notes.filter((n) => this.time - n.at < 2);
  }

  glow(midi) {
    const at = this.lit.get(midi);
    return at === undefined ? 0 : Math.max(0, 1 - (this.time - at) / 0.6);
  }

  // The room (camera applied): walls, then the keyboard floor
  draw(ctx, camX) {
    const L = camX - 10, R = camX + W + 10;
    // walls: a cosy night-time concert room, with a slow scroll of staff lines
    const g = ctx.createLinearGradient(0, 0, 0, FLOOR);
    g.addColorStop(0, '#3b2d6b');
    g.addColorStop(1, '#6a4f9c');
    ctx.fillStyle = g;
    ctx.fillRect(L, 0, R - L, FLOOR);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let x = Math.floor(L / 120) * 120; x < R; x += 120) ctx.fillRect(x, 0, 60, FLOOR);
    // stars / fairy lights along the ceiling
    for (let x = Math.floor(L / 48) * 48; x < R; x += 48) {
      const tw = 0.5 + 0.5 * Math.sin(this.time * 2 + x * 0.3);
      ctx.fillStyle = `rgba(255,226,140,${0.4 + 0.6 * tw})`;
      circle(ctx, x + 24, 22 + Math.sin(x * 0.05) * 8, 3);
    }
    ctx.strokeStyle = 'rgba(255,240,220,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = Math.floor(L / 48) * 48; x < R; x += 48) {
      ctx.moveTo(x, 22 + Math.sin(x * 0.05) * 8);
      ctx.lineTo(x + 48, 22 + Math.sin((x + 48) * 0.05) * 8);
    }
    ctx.stroke();
    // a giant musical staff across the wall
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      ctx.moveTo(L, 130 + i * 22);
      ctx.lineTo(R, 130 + i * 22);
    }
    ctx.stroke();
    // banner
    if (L < 700 && R > 260) {
      ctx.fillStyle = '#ff9fb8';
      ctx.beginPath();
      ctx.roundRect(330, 260, 300, 44, 22);
      ctx.fill();
      text(ctx, 'Jump on the keys!', 480, 283, 20, '#ffffff');
    }
    // spotlights
    for (const sx of [480, 1440]) {
      if (sx < L - 300 || sx > R + 300) continue;
      const beam = ctx.createLinearGradient(0, 0, 0, FLOOR);
      beam.addColorStop(0, 'rgba(255,240,200,0.18)');
      beam.addColorStop(1, 'rgba(255,240,200,0.02)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(sx - 20, 0);
      ctx.lineTo(sx + 20, 0);
      ctx.lineTo(sx + 220, FLOOR);
      ctx.lineTo(sx - 220, FLOOR);
      ctx.closePath();
      ctx.fill();
    }
    this.drawExit(ctx);

    // white keys: the floor. The top face is where you stand; the front face fills the screen below.
    for (let i = Math.max(0, Math.floor(L / KEY_W)); i < Math.min(WHITE_KEYS, Math.ceil(R / KEY_W)); i++) {
      const x = i * KEY_W, midi = whiteMidi(i), k = this.glow(midi);
      const dip = k * 5;
      ctx.fillStyle = '#d9d2e6';
      ctx.fillRect(x, FLOOR - 4 + dip, KEY_W, H - FLOOR + 4);
      ctx.fillStyle = '#fffdf8';
      ctx.beginPath();
      ctx.roundRect(x + 1.5, FLOOR - 4 + dip, KEY_W - 3, H - FLOOR, [3, 3, 8, 8]);
      ctx.fill();
      if (k > 0) {
        ctx.fillStyle = KEY_COLORS[(midi * 5) % KEY_COLORS.length];
        ctx.globalAlpha = k * 0.8;
        ctx.beginPath();
        ctx.roundRect(x + 1.5, FLOOR - 4 + dip, KEY_W - 3, H - FLOOR, [3, 3, 8, 8]);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillRect(x + 4, FLOOR - 3 + dip, KEY_W - 8, 3);
      if (midi % 12 === 0) text(ctx, `C${midi / 12 - 1}`, x + KEY_W / 2, H - 18 + dip, 14, '#a08bb3');
    }
    // black keys: raised blocks sitting on the boundaries
    for (const b of BLACK_KEYS) {
      if (b.x + b.w < L || b.x > R) continue;
      const k = this.glow(b.midi), dip = k * 4;
      ctx.fillStyle = '#1f1b2e';
      ctx.beginPath();
      ctx.roundRect(b.x, b.y + dip, b.w, FLOOR - b.y + 10, [5, 5, 3, 3]);
      ctx.fill();
      ctx.fillStyle = k > 0 ? KEY_COLORS[(b.midi * 5) % KEY_COLORS.length] : '#3a3550';
      ctx.globalAlpha = k > 0 ? 0.4 + 0.6 * k : 1;
      ctx.beginPath();
      ctx.roundRect(b.x + 3, b.y + 2 + dip, b.w - 6, 8, 3);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // Floating notes, drawn over the players
  drawNotes(ctx) {
    ctx.save();
    ctx.font = `700 22px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const n of this.notes) {
      const k = (this.time - n.at) / 2;
      ctx.globalAlpha = Math.min(1, (1 - k) * 2);
      ctx.fillStyle = n.color;
      ctx.strokeStyle = 'rgba(40,30,70,0.5)';
      ctx.lineWidth = 3;
      const x = n.x + Math.sin(k * 8 + n.drift) * 8 + n.drift * 20 * k, y = n.y - k * 90;
      ctx.strokeText(k < 0.5 ? '♪' : '♫', x, y);
      ctx.fillText(k < 0.5 ? '♪' : '♫', x, y);
    }
    ctx.restore();
  }

  drawExit(ctx) {
    const x = PIANO_EXIT_X;
    ctx.fillStyle = '#2d2a3e';
    ctx.beginPath();
    ctx.roundRect(x - 26, FLOOR - 88, 52, 88, [26, 26, 0, 0]);
    ctx.fill();
    ctx.fillStyle = '#5b4a6b';
    ctx.beginPath();
    ctx.roundRect(x - 21, FLOOR - 83, 42, 83, [21, 21, 0, 0]);
    ctx.fill();
    ctx.fillStyle = '#ffd36b';
    circle(ctx, x + 11, FLOOR - 40, 2.5);
    ctx.fillStyle = 'rgba(79,191,134,0.9)';
    ctx.beginPath();
    ctx.roundRect(x - 22, FLOOR - 114, 44, 18, 5);
    ctx.fill();
    text(ctx, 'EXIT', x, FLOOR - 104.5, 12, '#ffffff');
  }
}

// The Music House, seen from the village (drawn by village.js)
export function drawMusicHouse(ctx, doorX, ground, time) {
  const w = 300, x = doorX - w / 2, top = ground - 150;
  // body
  ctx.fillStyle = '#5b4a8b';
  ctx.beginPath();
  ctx.roundRect(x, top, w, ground - top + 4, [12, 12, 0, 0]);
  ctx.fill();
  // roof shaped like a grand piano's lid, propped open
  ctx.fillStyle = '#2d2a3e';
  ctx.beginPath();
  ctx.moveTo(x - 14, top + 6);
  ctx.bezierCurveTo(x + 40, top - 40, x + w * 0.6, top - 30, x + w + 20, top - 92);
  ctx.lineTo(x + w + 24, top - 82);
  ctx.bezierCurveTo(x + w * 0.65, top - 10, x + 60, top - 10, x - 14, top + 14);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#c9b6ff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + w - 20, top);
  ctx.lineTo(x + w - 4, top - 70); // the prop stick
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ellipse(ctx, x + w * 0.45, top - 22, 60, 6, -0.25);
  // a band of piano keys across the front
  const kw = 20, ky = top + 16;
  for (let i = 0; i * kw < w - 20; i++) {
    ctx.fillStyle = '#fffdf8';
    ctx.fillRect(x + 10 + i * kw, ky, kw - 2, 34);
  }
  ctx.fillStyle = '#1f1b2e';
  for (let i = 0; i * kw < w - 30; i++) if ([0, 1, 3, 4, 5].includes(i % 7)) ctx.fillRect(x + 10 + i * kw + kw - 6, ky, 10, 20);
  // round windows with warm light
  for (const wx of [x + 50, x + w - 50]) {
    ctx.fillStyle = '#2d2a3e';
    circle(ctx, wx, top + 82, 19);
    ctx.fillStyle = `rgba(255,226,140,${0.8 + 0.2 * Math.sin(time * 2 + wx)})`;
    circle(ctx, wx, top + 82, 15);
    ctx.fillStyle = '#5b4a6b';
    ctx.font = `700 18px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('♪', wx, top + 83);
  }
  // door
  ctx.fillStyle = '#2d2a3e';
  ctx.beginPath();
  ctx.roundRect(doorX - 28, ground - 84, 56, 84, [28, 28, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#ff9fb8';
  ctx.beginPath();
  ctx.roundRect(doorX - 23, ground - 79, 46, 79, [23, 23, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#ffd36b';
  circle(ctx, doorX + 12, ground - 38, 3);
  // sign
  ctx.fillStyle = '#fffaf0';
  ctx.strokeStyle = '#c9b6ff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(doorX - 62, ground - 116, 124, 24, 8);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'Music House', doorX, ground - 103.5, 14, '#5b4a8b');
  // notes drifting out of the top like chimney smoke
  ctx.font = `700 18px ${FONT}`;
  for (let i = 0; i < 4; i++) {
    const k = (time * 0.3 + i / 4) % 1;
    ctx.globalAlpha = Math.sin(k * Math.PI) * 0.9;
    ctx.fillStyle = KEY_COLORS[i * 2];
    ctx.fillText(i % 2 ? '♫' : '♪', x + w * 0.3 + Math.sin(k * 6 + i) * 14 + k * 30, top - 30 - k * 80);
  }
  ctx.globalAlpha = 1;
}
