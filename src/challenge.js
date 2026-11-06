// Docs: docs/combat/challenges.md
// Boss challenges, the client's side (story/tricky-plan.md): a boss's challenge events become hazards (judged in
// src/rpg.js hazardHits like every boss hazard), a snare's combo is taken from the bound walk / jump / drop keys (or the
// arrow pad on touch) and sent as {t:'free'}, and the traps are drawn on whoever is caught: roots round a snared slime,
// a swap sign over a turned-round one, the combo over your own head, G2's first-time banner.
import { CHALLENGES, ARROWS, ARROW_GLYPH, SNARE_TICKS, SWAP_TICKS, PUNISH_KEEP_S, seedFor, comboFor } from './shared/challenge.js';
import { text } from './village.js';
import { audio } from './audio.js';
import { TOUCH } from './touch.js';
import { TAU } from './util.js';

const BANNER_S = 4.5; // G2's line stays this long
const KEY_DIR = { left: 0, right: 1, jump: 2, down: 3 }; // the key actions (src/shared/keys.js) that enter each arrow

export class Challenges {
  // rpg: src/rpg.js (its net, send, time, pop); keys: src/keys.js
  constructor(rpg, keys) {
    this.rpg = rpg;
    this.keys = keys;
    this.combo = null; // { arrows, i, wrongAt, at }: the snare we're in
    this.banner = null; // { text, at }
    this.punishUntil = -1; // (rpg.time) a snare failed: the boss's next hit does more
    this.bursts = []; // [x, y, at]: roots breaking apart
    this.pad = TOUCH ? this.buildPad() : null;
  }

  get time() {
    return this.rpg.time;
  }

  // ——— the boss's event → hazards (src/rpg.js hazardEvent) ———
  event(m, add) {
    const now = this.time;
    if (m.type === 'snare') {
      for (const [x, d] of m.list) {
        const at = now + d + m.warn;
        add({ type: 'snare', x, y: m.y, r: m.r, warnAt: now + d, at, dur: m.dur, end: at + m.dur + 0.5, len: m.len, seed: m.seed });
        this.rpg.later(at - now, () => audio.sfx('thornRain', { vol: 0.5 }));
      }
      audio.sfx('slashWarn', { vol: 0.5 });
    } else if (m.type === 'swap') {
      for (const [x, y, vx, vy, g, r, delay] of m.shots) add({ type: 'shot', style: 'swap', ch: 'swap', x, y, vx, vy, g, r, at: now + delay, end: now + delay + 4, pos: null });
      audio.sfx('fireball', { vol: 0.5 });
    }
  }

  // One of ours caught us (src/rpg.js step, on a fresh step): → the predicted edit ({tr} or {cs}), and the combo starts
  hit(ouch) {
    const h = ouch.trap;
    delete ouch.trap;
    if (ouch.kind === 'snare') {
      this.combo = { arrows: comboFor(seedFor(h.seed, this.rpg.net.id), h.len), i: 0, wrongAt: -9, at: this.time };
      audio.sfx('block');
      return { tr: SNARE_TICKS };
    }
    if (ouch.kind === 'swap') {
      audio.sfx('zap', { vol: 0.6 });
      return { cs: SWAP_TICKS };
    }
    return null;
  }

  // {t:'chal'} from the server
  receive(m) {
    if (m.a === 'first' && CHALLENGES[m.type]) this.banner = { text: CHALLENGES[m.type].banner, at: this.time };
    else if (m.a === 'freed' && m.id !== this.rpg.net.id) {
      const s = this.rpg.slimeOf(m.id);
      if (s) this.bursts.push([s.x, s.y, this.time]);
    }
  }

  // Every frame: a snare that ran out before the combo was in failed (or the server never agreed it caught us)
  update(me) {
    if (this.combo && !(me?.tr > 0)) {
      this.combo = null;
      if (me) {
        this.punishUntil = this.time + PUNISH_KEEP_S;
        this.rpg.pop(me.x, me.y - 80, 'TOO SLOW', '#ff6f91', 16);
        audio.sfx('shellBlock', { vol: 0.6 });
      }
    }
    if (this.pad) this.pad.hidden = !this.combo;
    this.bursts = this.bursts.filter((b) => this.time - b[2] < 0.6);
  }

  // A key press (src/main.js, before movement): true if it went into the combo
  key(e) {
    if (!this.combo || e.repeat) return false;
    const id = this.keys.of(e), dir = KEY_DIR[id];
    if (dir === undefined) return false;
    this.press(dir);
    return true;
  }

  press(dir) {
    const c = this.combo, net = this.rpg.net;
    if (!c || !(net.me.tr > 0)) return;
    if (c.arrows[c.i] !== dir) {
      c.i = 0; // a wrong key starts it over
      c.wrongAt = this.time;
      audio.sfx('error', { vol: 0.5 });
      return;
    }
    c.i++;
    audio.sfx('pickup', { vol: 0.4 });
    if (c.i < c.arrows.length) return;
    // all in: free at the newest input (the server checks the order and frees us there too)
    this.rpg.send({ t: 'free', s: net.seq, k: c.arrows });
    net.free(net.seq);
    this.combo = null;
    this.bursts.push([net.me.x, net.me.y, this.time]);
    audio.sfx('bubblePop');
  }

  // A boss's hit on us after a failed snare: the client only shows it (the server doubles it), so it lapses here too
  hurtByBoss() {
    this.punishUntil = -1;
  }

  // ——— drawing ———
  // Over the slimes (world space): list = [[slime, tr, cs], …] for everyone shown, our own last
  drawOver(ctx, list, mine) {
    const t = this.time;
    for (const [s, tr, cs] of list) {
      if (tr > 0) drawRoots(ctx, s.x, s.y, s.h ?? 40, t, tr / SNARE_TICKS);
      if (cs > 0) drawSwapSign(ctx, s.x, s.y - (s.h ?? 40) - (s === mine && this.combo ? 80 : 30), t, cs / SWAP_TICKS);
    }
    for (const [x, y, at] of this.bursts) drawBurst(ctx, x, y, (t - at) / 0.6);
    if (mine && this.punishUntil > t) {
      const p = 0.5 + 0.5 * Math.sin(t * 9);
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.35 * p;
      ctx.strokeStyle = '#ff5a7a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(mine.x, mine.y - (mine.h ?? 40) / 2, 34, (mine.h ?? 40) / 2 + 10, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    const c = this.combo, me = this.rpg.net.me;
    if (c && mine) drawCombo(ctx, mine.x, mine.y - (mine.h ?? 40) - 34, c, t, (me.tr | 0) / SNARE_TICKS);
  }

  // G2's banner (screen space, over the HUD)
  drawHud(ctx) {
    const b = this.banner;
    if (!b) return;
    const k = (this.time - b.at) / BANNER_S;
    if (k > 1) return (this.banner = null);
    ctx.save();
    ctx.globalAlpha = Math.min(1, k * 8, (1 - k) * 5);
    ctx.font = "700 17px Fredoka, 'Trebuchet MS', sans-serif";
    const w = ctx.measureText(b.text).width + 44, cy = 222;
    ctx.fillStyle = 'rgba(58,34,64,0.88)';
    ctx.strokeStyle = '#ffd06a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(480 - w / 2, cy - 19, w, 38, 19);
    ctx.fill();
    ctx.stroke();
    text(ctx, b.text, 480, cy + 1, 17, '#fff4d6');
    ctx.restore();
  }

  // ——— the arrow pad (touch): four big buttons over the game while snared ———
  buildPad() {
    const pad = document.createElement('div');
    pad.id = 'chpad';
    pad.hidden = true;
    ARROWS.forEach((name, dir) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `chpad-${name}`;
      b.textContent = ARROW_GLYPH[dir];
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.press(dir);
      });
      pad.append(b);
    });
    document.getElementById('stage').append(pad);
    return pad;
  }
}

// An arrow (a rounded triangle) pointing dir (0 left, 1 right, 2 up, 3 down), centred on x, y
function arrow(ctx, x, y, dir, size) {
  const a = [Math.PI, 0, -Math.PI / 2, Math.PI / 2][dir];
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.beginPath();
  ctx.moveTo(size * 0.62, 0);
  ctx.lineTo(-size * 0.42, -size * 0.55);
  ctx.lineTo(-size * 0.42, size * 0.55);
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.22;
  ctx.stroke();
  ctx.fill();
  ctx.restore();
}

// The combo over your head: a row of arrow keys (done ones green), the one to press glowing, a bar for the time left
function drawCombo(ctx, x, y, c, t, left) {
  const n = c.arrows.length, S = 26, G = 5, w = n * S + (n - 1) * G;
  const shake = t - c.wrongAt < 0.25 ? Math.sin(t * 90) * 5 * (1 - (t - c.wrongAt) / 0.25) : 0;
  const x0 = x - w / 2 + shake;
  ctx.save();
  ctx.fillStyle = 'rgba(48,30,56,0.78)';
  ctx.beginPath();
  ctx.roundRect(x0 - 8, y - S / 2 - 8, w + 16, S + 24, 12);
  ctx.fill();
  c.arrows.forEach((d, i) => {
    const bx = x0 + i * (S + G), done = i < c.i, now = i === c.i;
    const wrong = t - c.wrongAt < 0.25;
    ctx.fillStyle = done ? '#7fd88f' : now ? (wrong ? '#ff8fa3' : '#fff4d6') : 'rgba(255,255,255,0.22)';
    ctx.strokeStyle = now ? `rgba(255,208,106,${0.6 + 0.4 * Math.sin(t * 12)})` : 'rgba(255,255,255,0.5)';
    ctx.lineWidth = now ? 3 : 1.5;
    ctx.beginPath();
    ctx.roundRect(bx, y - S / 2, S, S, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = ctx.strokeStyle = done ? '#2e6b3a' : now ? '#5b3a6b' : 'rgba(255,255,255,0.85)';
    arrow(ctx, bx + S / 2, y, d, 9);
  });
  // the time left
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(x0, y + S / 2 + 6, w, 4);
  ctx.fillStyle = left > 0.35 ? '#ffd06a' : '#ff6f91';
  ctx.fillRect(x0, y + S / 2 + 6, w * Math.max(0, Math.min(1, left)), 4);
  ctx.restore();
}

// Roots wrapped round a snared slime (x, y: its feet), loosening as the time runs out
function drawRoots(ctx, x, y, h, t, left) {
  const W = 30, sway = Math.sin(t * 3) * 1.5;
  ctx.save();
  ctx.lineCap = 'round';
  // the gnarled base
  ctx.fillStyle = '#7a5a3e';
  ctx.beginPath();
  ctx.ellipse(x, y + 1, W + 8, 7, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#9a7652';
  ctx.beginPath();
  ctx.ellipse(x - 4, y - 1, W, 4, 0, 0, TAU);
  ctx.fill();
  // vines winding up and round the body
  const reach = h * (0.55 + 0.25 * Math.min(1, left * 1.5));
  for (let i = 0; i < 4; i++) {
    const s = i % 2 ? 1 : -1, x0 = x + (i - 1.5) * 14;
    ctx.strokeStyle = '#4f7d43';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.bezierCurveTo(x0 + s * 30, y - reach * 0.3, x - s * 34 + sway, y - reach * 0.6, x + s * 10, y - reach);
    ctx.stroke();
    ctx.strokeStyle = '#8fc06a';
    ctx.lineWidth = 2;
    ctx.stroke();
    // a thorn or two along it
    ctx.fillStyle = '#efe2b4';
    for (const f of [0.35, 0.7]) {
      const px = x0 + (x + s * 10 - x0) * f + s * 18 * Math.sin(f * Math.PI), py = y - reach * f;
      ctx.beginPath();
      ctx.moveTo(px - 3, py);
      ctx.lineTo(px + s * 6, py - 4);
      ctx.lineTo(px + 1, py + 3);
      ctx.closePath();
      ctx.fill();
    }
  }
  // a little leaf on top
  ctx.fillStyle = '#9fd47a';
  ctx.beginPath();
  ctx.ellipse(x + 6, y - reach - 3, 7, 4, -0.5, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// Turned round: a sign over the slime with two arrows trading places, and a ring for the time left
function drawSwapSign(ctx, x, y, t, left) {
  const bob = Math.sin(t * 6) * 2, R = 20;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.fillStyle = 'rgba(150,104,214,0.92)';
  ctx.strokeStyle = '#fff4fb';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#ffd06a';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(0, 0, R + 4, -Math.PI / 2, -Math.PI / 2 + TAU * Math.max(0, Math.min(1, left)));
  ctx.stroke();
  // two curved arrows chasing each other round
  ctx.rotate(t * 2.2);
  ctx.strokeStyle = ctx.fillStyle = '#ffffff';
  ctx.lineWidth = 3;
  for (const a of [0, Math.PI]) {
    ctx.beginPath();
    ctx.arc(0, 0, 10, a + 0.3, a + 2.5);
    ctx.stroke();
    const hx = Math.cos(a + 2.5) * 10, hy = Math.sin(a + 2.5) * 10, d = a + 2.5 + Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(hx + Math.cos(d) * 5, hy + Math.sin(d) * 5);
    ctx.lineTo(hx + Math.cos(d + 2.3) * 5, hy + Math.sin(d + 2.3) * 5);
    ctx.lineTo(hx + Math.cos(d - 2.3) * 5, hy + Math.sin(d - 2.3) * 5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// Roots snapping apart (broke free)
function drawBurst(ctx, x, y, k) {
  if (k > 1) return;
  ctx.save();
  ctx.globalAlpha = 1 - k;
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI * (i / 7), d = 10 + 40 * k;
    ctx.fillStyle = i % 2 ? '#8fc06a' : '#9a7652';
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * d, y - 12 + Math.sin(a) * d + 30 * k * k, 6, 3, a, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

// The snare hazard on the floor (src/hazards.js DRAW): a ring of roots twitching under the mark, then springing up
export function drawSnareHz(ctx, h, now) {
  const x = h.x, y = h.y ?? 450, r = h.r;
  if (now < h.at) {
    const k = Math.max(0, Math.min(1, (now - h.warnAt) / Math.max(0.05, h.at - h.warnAt)));
    const pulse = 0.5 + 0.5 * Math.sin(now * (8 + 12 * k));
    ctx.fillStyle = `rgba(122,90,62,${0.25 + 0.35 * k})`;
    ctx.beginPath();
    ctx.ellipse(x, y + 1, r, 8, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = `rgba(255,84,112,${0.35 + 0.5 * k * pulse})`;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 6]);
    ctx.lineDashOffset = now * 30;
    ctx.beginPath();
    ctx.ellipse(x, y + 1, r, 8, 0, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    // root tips poking up, more as it nears
    ctx.strokeStyle = '#5f8f4e';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const px = x - r * 0.8 + (i / 5) * r * 1.6, up = (4 + 10 * k) * (0.6 + 0.4 * Math.sin(now * 14 + i * 2));
      ctx.beginPath();
      ctx.moveTo(px, y + 2);
      ctx.quadraticCurveTo(px + 4, y - up / 2, px + (i % 2 ? 3 : -3), y - up);
      ctx.stroke();
    }
    return;
  }
  // sprung: a clump of roots shooting up, then sinking back
  const live = h.at + h.dur, f = now > live ? Math.min(1, (now - live) / Math.max(0.05, h.end - live)) : 0;
  const rise = Math.min(1, (now - h.at) / 0.1) * (1 - f);
  ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const px = x - r * 0.9 + (i / 6) * r * 1.8, tall = (36 + 22 * Math.sin(i * 2.3 + 1)) * rise, s = i % 2 ? 1 : -1;
    ctx.strokeStyle = '#4f7d43';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(px, y + 2);
    ctx.quadraticCurveTo(px + s * 12, y - tall * 0.6, px - s * 4, y - tall);
    ctx.stroke();
    ctx.strokeStyle = '#8fc06a';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.fillStyle = '#7a5a3e';
  ctx.beginPath();
  ctx.ellipse(x, y + 2, r + 6, 7, 0, 0, TAU);
  ctx.fill();
}
