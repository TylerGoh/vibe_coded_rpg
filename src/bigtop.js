// Docs: docs/places/rides.md
// The Big Top on the client (F3): the tent's inside (drawBigTop, behind the slimes: the striped canvas, the crowd on the
// stands, the ring and its trampolines dipping under whoever's on them, the trapeze rig, the cannon, the cushions), and
// Ringmaster Fizz's show (BigTop.update / drawShow), which runs on the server's clock (src/shared/bigtop.js showAt) so
// everyone in the tent sees the same act at the same moment. The performers are ordinary Slimes posed by the show clock;
// the lights go down behind them, never over the players. Sounds: the show's drums, the cannon, the crowd, and a boing
// when you bounce.
import { H, TAU, mulberry32, circle, ellipse, clamp } from './util.js';
import { text } from './village.js';
import { Slime } from './slime.js';
import { BIGTOP, BIGTOP_GROUND, BIGTOP_EXIT_X, BIGTOP_PLATFORMS, RING_X, RING_R, TRAMPS, showAt, nextShow, actAt } from './shared/bigtop.js';

const G = BIGTOP_GROUND;
const RED = '#c23f57', CREAM = '#f6dcc4', GOLD = '#f2c14e', PLUM = '#3a2a50';
const BULBS = ['#ffe28a', '#ff9fb8', '#9fe3ff', '#c4f59a', '#d6b4ff'];
const POLES = [RING_X - RING_R - 20, RING_X + RING_R + 20];
const BARS = [RING_X - 150, RING_X + 150], RIG_Y = 36, ROPE = 118; // the two trapezes
const CANNON = { x: RING_X + RING_R - 40, y: G - 20, a: -2.55 }; // (its barrel points up and west)
const CUSHIONS_X = RING_X - RING_R + 70;
const smooth = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));
const lerp = (a, b, k) => a + (b - a) * k;
const visible = (x0, x1, L, R) => x1 > L && x0 < R;

// the crowd on the stands (behind the benches)
const crowd = (() => {
  const r = mulberry32(5150), out = [];
  for (const [x0, x1] of [[200, 600], [1360, 1760]]) for (let row = 0; row < 3; row++) for (let x = x0 + row * 14; x < x1; x += 30 + r() * 10) out.push({ x, y: 300 - row * 34, hue: Math.floor(r() * 360), p: r() * TAU });
  return out;
})();

// ——— the tent's inside ———
function drawCanvas(ctx, L, R, time, dark) {
  ctx.fillStyle = PLUM;
  ctx.fillRect(L, 0, R - L, G);
  for (let x = Math.floor(L / 60) * 60; x < R; x += 60) {
    ctx.fillStyle = (x / 60) % 2 ? RED : CREAM;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(x, 40);
    ctx.lineTo(x + 60, 40);
    ctx.lineTo(x + 60, G);
    ctx.lineTo(x, G);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // the floor: boards, with sawdust thrown over them
  ctx.fillStyle = '#8a5f42';
  ctx.fillRect(L, G, R - L, H - G);
  ctx.fillStyle = '#9c6d4c';
  for (let y = G + 14; y < H; y += 22) ctx.fillRect(L, y, R - L, 3);
  ctx.fillStyle = 'rgba(232,199,154,0.35)';
  ctx.fillRect(L, G, R - L, 8);
  // the roof: stripes running up into the dark from the valance
  for (let x = Math.floor(L / 80) * 80; x < R; x += 80) {
    ctx.fillStyle = (x / 80) % 2 ? '#8e2f45' : '#b99a88';
    ctx.beginPath();
    ctx.moveTo(x, 40);
    ctx.lineTo(x + 80, 40);
    ctx.lineTo(RING_X + (x + 80 - RING_X) * 0.3, -60);
    ctx.lineTo(RING_X + (x - RING_X) * 0.3, -60);
    ctx.fill();
  }
  // the valance and string lights
  for (let x = Math.floor(L / 40) * 40; x < R; x += 40) {
    ctx.fillStyle = (x / 40) % 2 ? GOLD : '#8a6fc4';
    ctx.beginPath();
    ctx.moveTo(x, 40);
    ctx.lineTo(x + 40, 40);
    ctx.quadraticCurveTo(x + 20, 64, x, 40);
    ctx.fill();
  }
  for (let x = Math.floor(L / 36) * 36; x < R; x += 36) {
    ctx.fillStyle = BULBS[((x / 36) + Math.floor(time * 2)) % BULBS.length];
    ctx.globalAlpha = dark ? 0.5 : 1;
    circle(ctx, x, 76 + Math.sin(x * 0.05) * 6, 3);
  }
  ctx.globalAlpha = 1;
}
function drawStands(ctx, time, show) {
  // the crowd: little jellies bobbing, cheering harder in the show
  for (const c of crowd) {
    const bob = Math.abs(Math.sin(time * (show ? 6 : 2) + c.p)) * (show ? 7 : 2);
    ctx.fillStyle = `hsl(${c.hue},45%,${show ? 42 : 58}%)`;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y - 12 - bob, 13, 12, 0, Math.PI, 0);
    ctx.lineTo(c.x + 13, c.y - bob);
    ctx.lineTo(c.x - 13, c.y - bob);
    ctx.fill();
    ctx.fillStyle = 'rgba(40,30,60,0.6)';
    circle(ctx, c.x - 4, c.y - 14 - bob, 1.6);
    circle(ctx, c.x + 4, c.y - 14 - bob, 1.6);
  }
  // the stands' backs
  for (const [x0, x1] of [[190, 610], [1350, 1770]]) {
    ctx.fillStyle = '#6b4a3a';
    ctx.fillRect(x0, 302, x1 - x0, 10);
    ctx.fillRect(x0, 268, x1 - x0, 6);
  }
}
function drawBench(ctx, p) {
  ctx.fillStyle = '#7d5634';
  ctx.fillRect(p.x + 8, p.y, 8, G - p.y);
  ctx.fillRect(p.x + p.w - 16, p.y, 8, G - p.y);
  ctx.fillStyle = '#b98a5c';
  ctx.beginPath();
  ctx.roundRect(p.x, p.y, p.w, 9, 3);
  ctx.fill();
  ctx.fillStyle = '#d9b183';
  ctx.fillRect(p.x + 2, p.y, p.w - 4, 3);
}
function drawRing(ctx) {
  ctx.fillStyle = '#e8c79a';
  ellipse(ctx, RING_X, G - 2, RING_R, 20);
  ctx.strokeStyle = RED;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.ellipse(RING_X, G - 2, RING_R, 20, 0, Math.PI, TAU);
  ctx.stroke();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(RING_X, G - 6, RING_R - 4, 17, 0, Math.PI, TAU);
  ctx.stroke();
  // the back curtain the acts come in through
  ctx.fillStyle = '#7a2440';
  ctx.beginPath();
  ctx.roundRect(RING_X - 70, 170, 140, G - 190, [70, 70, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#9a3352';
  ctx.fillRect(RING_X - 4, 180, 8, G - 200);
  ctx.fillStyle = GOLD;
  for (let i = 0; i < 9; i++) circle(ctx, RING_X - 64 + i * 16, 186 + Math.abs(i - 4) * 3, 3);
}
function drawRig(ctx, swing) {
  ctx.strokeStyle = '#8a6a4a';
  ctx.lineWidth = 8;
  for (const x of POLES) {
    ctx.beginPath();
    ctx.moveTo(x, -20);
    ctx.lineTo(x, G);
    ctx.stroke();
  }
  ctx.strokeStyle = '#a4785a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(POLES[0], RIG_Y);
  ctx.lineTo(POLES[1], RIG_Y);
  ctx.stroke();
  // the trapezes
  BARS.forEach((bx, i) => {
    const a = swing[i], ex = bx + Math.sin(a) * ROPE, ey = RIG_Y + Math.cos(a) * ROPE;
    ctx.strokeStyle = 'rgba(255,244,230,0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx - 14, RIG_Y);
    ctx.lineTo(ex - 14 * Math.cos(a), ey + 14 * Math.sin(a));
    ctx.moveTo(bx + 14, RIG_Y);
    ctx.lineTo(ex + 14 * Math.cos(a), ey - 14 * Math.sin(a));
    ctx.stroke();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(ex - 15 * Math.cos(a), ey + 15 * Math.sin(a));
    ctx.lineTo(ex + 15 * Math.cos(a), ey - 15 * Math.sin(a));
    ctx.stroke();
  });
}
function drawCannon(ctx, kick) {
  const { x, y, a } = CANNON;
  ctx.save();
  ctx.translate(x, y - 20);
  ctx.rotate(a);
  ctx.translate(-kick * 8, 0);
  ctx.fillStyle = '#8a6fc4';
  ctx.beginPath();
  ctx.roundRect(-20, -17, 92, 34, 14);
  ctx.fill();
  ctx.fillStyle = GOLD;
  ctx.fillRect(56, -19, 10, 38);
  ctx.fillRect(10, -18, 6, 36);
  ctx.fillStyle = '#ffe28a';
  for (const [sx, sy] of [[30, -6], [42, 6]]) circle(ctx, sx, sy, 3);
  ctx.restore();
  for (const dx of [-16, 16]) {
    ctx.fillStyle = '#7d5634';
    circle(ctx, x + dx, y - 6, 15);
    ctx.fillStyle = GOLD;
    circle(ctx, x + dx, y - 6, 4);
  }
}
function drawCushions(ctx) {
  for (const [dx, dy, c] of [[-40, 0, '#ff9fb8'], [0, 0, '#9fe3ff'], [40, 0, '#ffd36e'], [-20, -16, '#b9e58c'], [20, -16, '#d6b4ff'], [0, -30, '#ffb38a']]) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.roundRect(CUSHIONS_X + dx - 24, G - 18 + dy, 48, 18, 9);
    ctx.fill();
  }
}
// a trampoline: its frame, legs, springs, and the mat, dipping under whoever's close above it
function drawTramp(ctx, p, dip) {
  ctx.fillStyle = '#5c7fc4';
  ctx.fillRect(p.x + 8, p.y, 7, G - p.y);
  ctx.fillRect(p.x + p.w - 15, p.y, 7, G - p.y);
  ctx.fillStyle = '#7fa8ff';
  ctx.beginPath();
  ctx.roundRect(p.x - 4, p.y - 4, p.w + 8, 9, 4);
  ctx.fill();
  ctx.fillStyle = '#2f2a48';
  ctx.beginPath();
  ctx.moveTo(p.x + 6, p.y);
  ctx.quadraticCurveTo(p.x + p.w / 2, p.y + dip * 2, p.x + p.w - 6, p.y);
  ctx.lineTo(p.x + p.w - 6, p.y + 2);
  ctx.quadraticCurveTo(p.x + p.w / 2, p.y + 2 + dip * 2, p.x + 6, p.y + 2);
  ctx.fill();
  ctx.fillStyle = '#ffe28a';
  for (let i = 0; i < 6; i++) circle(ctx, p.x + 10 + i * ((p.w - 20) / 5), p.y + 1, 2);
}

// ——— the show ———
const PERF = [ // the performers: Fizz, the Tumbling Trio, the Flying Wobbles, Bombo
  { id: 'fizz', hue: 350, acc: ['ringmaster'] },
  { id: 't0', hue: 200, acc: [] },
  { id: 't1', hue: 290, acc: [] },
  { id: 't2', hue: 45, acc: [] },
  { id: 'flyer', hue: 160, acc: [] },
  { id: 'catcher', hue: 20, acc: [] },
  { id: 'bombo', hue: 0, acc: [] },
];
const SWING_W = TAU / 2.6;
const barEnd = (i, a) => ({ x: BARS[i] + Math.sin(a) * ROPE, y: RIG_Y + Math.cos(a) * ROPE });
const swings = (t) => [0.62 * Math.sin(SWING_W * t), -0.62 * Math.sin(SWING_W * t)];
const RELEASE = 33.2, FLIGHT = 1.0, DROP = 39;
const FIRE = 50, FLY = 1.6;
// the show's sounds: [seconds in, sfx]
const CUES = [[0, 'drumroll'], [1.6, 'cymbal'], [9, 'fairStart'], [RELEASE - 1.2, 'drumroll'], [RELEASE + FLIGHT, 'cymbal'], [RELEASE + FLIGHT + 0.2, 'cheer'], [46.5, 'drumroll'], [FIRE, 'boom'], [FIRE + FLY, 'cheer'], [58, 'prize'], [58.4, 'cheer']];

// where each performer is t seconds into the show: { x, y, rot, a (alpha), facing, air, hang } or null (offstage)
function poseOf(id, t) {
  const fade = (t0, t1) => clamp(Math.min((t - t0) / 0.6, (t1 - t) / 0.6), 0, 1);
  if (id === 'fizz') {
    const x = t < 8 ? RING_X : t < 9 ? lerp(RING_X, RING_X - 290, smooth(t - 8)) : t < 57 ? RING_X - 290 : t < 58 ? lerp(RING_X - 290, RING_X, smooth(t - 57)) : RING_X;
    return { x, y: G, a: fade(0, 70), facing: t > 8 && t < 57 ? 1 : x < RING_X ? 1 : -1 };
  }
  if (id[0] === 't') {
    const i = +id[1], tx = TRAMPS[i].x + TRAMPS[i].w / 2;
    if (t >= 58) return bowPose(i + 1, t);
    if (t < 9 || t > 25) return null;
    if (t < 10) return { x: lerp(RING_X, tx, smooth(t - 9)), y: G, a: fade(9, 25), facing: tx > RING_X ? 1 : -1 };
    const P = 1.25, u = ((t - 10) / P + i / 3) % 1, n = Math.floor((t - 10) / P + i / 3), h = (190 + 50 * ((n + i) % 2)) * 4 * u * (1 - u);
    const flip = (n + i) % 2 ? TAU * smooth((u - 0.2) / 0.6) * (i === 1 ? -1 : 1) : 0;
    return t > 24 ? { x: lerp(tx, RING_X, smooth(t - 24)), y: G, a: fade(9, 25), facing: 1 } : { x: tx, y: TRAMPS[i].y - h, rot: flip, a: 1, air: u > 0.04 && u < 0.96, facing: 1 };
  }
  if (id === 'flyer' || id === 'catcher') {
    if (t >= 58) return bowPose(id === 'flyer' ? 4 : 5, t);
    if (t < 25 || t > 42) return null;
    const sw = swings(t), mine = id === 'flyer' ? 0 : 1;
    if (t < 27) return { x: lerp(RING_X, BARS[mine], smooth((t - 25) / 2)), y: G, a: fade(25, 42), facing: 1 };
    if (t < 28) { // up the rope
      const e = barEnd(mine, sw[mine]);
      return { x: lerp(BARS[mine], e.x, smooth(t - 27)), y: lerp(G, e.y + 44, smooth(t - 27)), a: 1, air: true, facing: 1 };
    }
    const hangFrom = (e) => ({ x: e.x, y: e.y + 2, rot: Math.PI, a: 1, hang: true, facing: 1 });
    if (id === 'catcher') return t < DROP ? hangFrom(barEnd(1, sw[1])) : dropPose(barEnd(1, sw[1]), t, -40);
    if (t < RELEASE) return hangFrom(barEnd(0, sw[0]));
    if (t < RELEASE + FLIGHT) { // let go: a somersault across to the catcher's hands
      const k = (t - RELEASE) / FLIGHT, a = barEnd(0, swings(RELEASE)[0]), b = barEnd(1, swings(RELEASE + FLIGHT)[1]);
      return { x: lerp(a.x, b.x, k), y: lerp(a.y + 2, b.y + 84, k) - Math.sin(Math.PI * k) * 90, rot: Math.PI + 3 * Math.PI * k, a: 1, air: true, facing: 1 }; // (a somersault and a half, upright into the catcher's hands)
    }
    const e = barEnd(1, sw[1]);
    return t < DROP ? { x: e.x, y: e.y + 84, rot: 0, a: 1, air: true, facing: -1 } : dropPose({ x: e.x, y: e.y + 84 }, t, 40);
  }
  if (id === 'bombo') {
    if (t >= 58) return bowPose(6, t);
    if (t < 42 || t > 57) return null;
    const muzzle = { x: CANNON.x + Math.cos(CANNON.a) * 70, y: CANNON.y - 20 + Math.sin(CANNON.a) * 70 };
    if (t < 46) return { x: lerp(RING_X, CANNON.x - 30, smooth((t - 42) / 4)), y: G, a: fade(42, 57), facing: 1 };
    if (t < 47) return { x: lerp(CANNON.x - 30, muzzle.x, smooth(t - 46)), y: lerp(G, muzzle.y, smooth(t - 46)) - Math.sin(Math.PI * (t - 46)) * 40, a: 1 - smooth(t - 46), air: true, facing: 1 };
    if (t < FIRE) return null; // (in the cannon)
    if (t < FIRE + FLY) {
      const k = (t - FIRE) / FLY;
      return { x: lerp(muzzle.x, CUSHIONS_X, k), y: lerp(muzzle.y, G - 30, k) - Math.sin(Math.PI * k) * 260, rot: -TAU * 2 * k, a: 1, air: true, facing: -1 };
    }
    if (t < FIRE + FLY + 0.6) return { x: CUSHIONS_X, y: G - 30 - Math.sin(Math.PI * ((t - FIRE - FLY) / 0.6)) * 40, a: 1, air: true, facing: 1 };
    return { x: lerp(CUSHIONS_X, RING_X, smooth((t - FIRE - FLY - 3) / 2)), y: G, a: fade(42, 57), facing: 1 };
  }
  return null;
}
function dropPose(from, t, dx) { // into the net (there is a net), a bounce, and off
  const k = t - DROP;
  if (k < 0.5) return { x: from.x + dx * k, y: lerp(from.y, NET_Y, k * k * 4), rot: 0, a: 1, air: true, facing: 1 };
  if (k < 1.1) return { x: from.x + dx * 0.5, y: NET_Y - Math.sin(Math.PI * ((k - 0.5) / 0.6)) * 50, a: 1, air: true, facing: 1 };
  return { x: from.x + dx * 0.5, y: NET_Y, a: clamp((42 - t) / 0.8, 0, 1), facing: 1 };
}
const NET_Y = 352;
function bowPose(i, t) { // everyone in a line for the bow, hopping in turn, then off
  const x = RING_X + (i - 3) * 72, hop = Math.max(0, Math.sin((t - 58) * 4 - i * 0.7)) * 26;
  return { x, y: G - hop, a: clamp((70 - t) / 1.5, 0, 1) * clamp((t - 58) / 0.5, 0, 1), air: hop > 1, facing: 1 };
}

// ——— the client's Big Top ———
export class BigTop {
  constructor({ audio }) {
    this.audio = audio;
    this.perf = new Map(PERF.map((p) => {
      const s = new Slime(p.hue);
      s.accessories = p.acc;
      return [p.id, s];
    }));
    this.lastT = -1;
    this.lastVy = 0;
    this.confetti = [];
  }

  // each frame in the Big Top: the show's poses and sounds, and a boing when you bounce off a trampoline
  update(dt, tick, me) {
    const t = tick === null ? -1 : showAt(tick);
    if (t >= 0 && this.lastT >= 0 && t > this.lastT) for (const [at, sfx] of CUES) if (this.lastT < at && t >= at) this.audio.sfx(sfx);
    this.lastT = t;
    this.t = t;
    this.tick = tick;
    for (const [id, s] of this.perf) {
      const p = t >= 0 ? (id === 'fizz' && t >= 58 ? { ...bowPose(0, t), a: clamp((70 - t) / 1.5, 0, 1) } : poseOf(id, t)) : null;
      s.pose = p;
      if (!p) continue;
      s.animate(dt, { x: p.x, y: p.y, vx: 0, vy: p.air ? -200 : 0, grounded: !p.air, facing: p.facing ?? 1 });
    }
    if (t >= 58 && t < 66 && Math.random() < dt * 22) this.confetti.push({ x: RING_X + (Math.random() - 0.5) * 900, y: -10, vy: 60 + Math.random() * 60, c: BULBS[Math.floor(Math.random() * BULBS.length)], r: Math.random() * TAU });
    for (const c of this.confetti) {
      c.y += c.vy * dt;
      c.r += dt * 4;
    }
    this.confetti = this.confetti.filter((c) => c.y < G);
    if (me?.room === BIGTOP) {
      const onTramp = TRAMPS.some((p) => Math.abs(me.y - p.y) < 24 && me.x >= p.x - 20 && me.x <= p.x + p.w + 20);
      if (this.lastVy > 200 && me.vy < 0 && onTramp) this.audio.sfx('boing', { vol: clamp(-me.vy / 1250, 0.3, 1) });
      this.lastVy = me.vy;
    }
  }

  // the tent behind the slimes: the canvas, the stands, the ring, the rig, the trampolines (dipping under the slimes on
  // them), the cannon; then, in a show, the lights down and the performers in their spots
  draw(ctx, camX, viewW, time, slimes) {
    const L = camX - 80, R = camX + viewW + 80, t = this.t ?? -1, show = t >= 0;
    drawCanvas(ctx, L, R, time, show);
    drawStands(ctx, time, show);
    for (const p of BIGTOP_PLATFORMS) if (p.kind === 'bench' && visible(p.x, p.x + p.w, L, R)) drawBench(ctx, p);
    drawRing(ctx);
    drawCushions(ctx);
    drawRig(ctx, show ? swings(t) : [0.12 * Math.sin(time * 1.3), 0.1 * Math.sin(time * 1.1 + 1)]);
    for (const p of TRAMPS) {
      let dip = 0;
      for (const s of slimes) if (s.x >= p.x && s.x <= p.x + p.w && s.y <= p.y + 1 && s.y > p.y - 30) dip = Math.max(dip, 10 * (1 - (p.y - s.y) / 30));
      for (const [id, s] of this.perf) if (id[0] === 't' && s.pose && Math.abs(s.pose.x - (p.x + p.w / 2)) < 4 && s.pose.y > p.y - 30) dip = Math.max(dip, 10 * (1 - (p.y - s.pose.y) / 30));
      drawTramp(ctx, p, dip);
    }
    drawCannon(ctx, show && t >= FIRE && t < FIRE + 0.4 ? 1 - (t - FIRE) / 0.4 : 0);
    if (show && t >= 25 && t < 42) { // the net (there is a net)
      ctx.strokeStyle = 'rgba(255,244,230,0.5)';
      ctx.lineWidth = 1;
      for (let x = BARS[0] - 130; x <= BARS[1] + 130; x += 14) {
        ctx.beginPath();
        ctx.moveTo(x, NET_Y);
        ctx.lineTo(x + 7, NET_Y + 8);
        ctx.lineTo(x + 14, NET_Y);
        ctx.stroke();
      }
    }
    // the board by the flap
    const next = this.tick == null ? null : nextShow(this.tick);
    ctx.fillStyle = '#8a6a4a';
    ctx.fillRect(BIGTOP_EXIT_X + 74, G - 60, 4, 60);
    ctx.fillStyle = PLUM;
    ctx.beginPath();
    ctx.roundRect(BIGTOP_EXIT_X + 40, G - 100, 72, 42, 8);
    ctx.fill();
    text(ctx, show ? 'SHOW ON' : 'NEXT SHOW', BIGTOP_EXIT_X + 76, G - 88, 9, GOLD);
    text(ctx, show ? 'NOW!' : next === null ? '...' : `${Math.floor(next / 60)}:${String(Math.floor(next % 60)).padStart(2, '0')}`, BIGTOP_EXIT_X + 76, G - 70, 13, show ? '#ff9fb8' : '#fff4e6');
    // the flap out
    ctx.fillStyle = '#ffd98a';
    ctx.beginPath();
    ctx.roundRect(BIGTOP_EXIT_X - 40, G - 120, 80, 120, [40, 40, 0, 0]);
    ctx.fill();
    ctx.fillStyle = RED;
    ctx.fillRect(BIGTOP_EXIT_X - 46, G - 120, 14, 120);
    ctx.fillRect(BIGTOP_EXIT_X + 32, G - 120, 14, 120);
    if (!show) return;
    // the lights down (behind the performers and the players, never over them), and the spotlights
    const k = clamp(Math.min(t / 1.5, (70 - t) / 2), 0, 1);
    ctx.fillStyle = `rgba(16,8,34,${0.5 * k})`;
    ctx.fillRect(L, -80, R - L, H + 80);
    const focus = [...this.perf.values()].filter((s) => s.pose && s.pose.a > 0.2).map((s) => s.pose);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const f of focus.slice(0, 4)) {
      ctx.fillStyle = `rgba(255,236,190,${0.12 * k})`;
      ctx.beginPath();
      ctx.moveTo(f.x - 20, -40);
      ctx.lineTo(f.x + 20, -40);
      ctx.lineTo(f.x + 60, G);
      ctx.lineTo(f.x - 60, G);
      ctx.fill();
      ellipse(ctx, f.x, G - 2, 64, 12);
    }
    ctx.restore();
  }
  // the performers and Fizz's line (after the tent, before the players)
  drawShow(ctx) {
    const t = this.t ?? -1;
    if (t < 0) return;
    for (const [id, s] of this.perf) {
      const p = s.pose;
      if (!p || p.a <= 0.01) continue;
      ctx.save();
      ctx.globalAlpha = clamp(p.a, 0, 1);
      if (p.rot) {
        const cy = p.hang ? p.y : p.y - s.h / 2;
        ctx.translate(p.x, cy);
        ctx.rotate(p.rot);
        ctx.translate(-p.x, -cy);
      }
      s.draw(ctx);
      ctx.restore();
    }
    for (const c of this.confetti) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.r);
      ctx.fillStyle = c.c;
      ctx.fillRect(-4, -2, 8, 4);
      ctx.restore();
    }
    // Fizz's line, for a few seconds into each act
    const act = actAt(t), fizz = this.perf.get('fizz').pose;
    if (act && fizz && t - act.at < 6.5) bubble(ctx, fizz.x, fizz.y - 96, act.says);
  }
}
function bubble(ctx, x, y, str) {
  ctx.font = "700 12px Fredoka, 'Trebuchet MS', sans-serif";
  const words = str.split(' '), lines = [];
  let line = '';
  for (const w of words) {
    const tryL = line ? `${line} ${w}` : w;
    if (ctx.measureText(tryL).width > 230 && line) {
      lines.push(line);
      line = w;
    } else line = tryL;
  }
  lines.push(line);
  const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 24, h = lines.length * 16 + 12;
  ctx.fillStyle = 'rgba(255,244,230,0.96)';
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h, w, h, 12);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 6, y);
  ctx.lineTo(x + 6, y);
  ctx.lineTo(x, y + 9);
  ctx.fill();
  lines.forEach((l, i) => text(ctx, l, x, y - h + 14 + i * 16, 12, '#5b4a6b'));
}
export { BIGTOP };
