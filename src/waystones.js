// Docs: docs/places/waystones.md
// The waystones' client side (data: src/shared/waystones.js; the server attunes and moves you, server/rpg.js
// `way`): the stones themselves (Keeper menhirs like the Waystone in the ruins, src/ruins.js, but whole,
// with a gear ring that still turns when you're attuned), the prompt, the travel card (#ways in index.html)
// and the shimmer when someone comes or goes.
import { TAU, circle, ellipse, rand } from './util.js';
import { WAYSTONES, wayAt, wayById, sameIsle } from './shared/waystones.js';

const STONE = '#a99cb3', STONE_DARK = '#887a94', STONE_LIGHT = '#c4b8cc', CARVE = '#6d6078', MOSS = '#7aa05e', MOSS_DARK = '#5f8448';
const GLOW = '150,215,255';
const visible = (x0, x1, L, R) => x1 > L && x0 < R;

// Behind the slimes. near: the stone you're at · ways: the ids you're attuned to
export function drawWaystones(ctx, room, ground, L, R, time, near, ways = []) {
  for (const w of WAYSTONES) {
    if (w.room !== room || !visible(w.x - 90, w.x + 90, L, R)) continue;
    drawStone(ctx, w.x, ground + 2, time, w === near, ways.includes(w.id), w.isle);
  }
}

// isle: Frostpeak's stones wear snow and rime where Greenhollow's wear moss; Emberdeep's are dusted with ash,
// with glints of black glass and a warm crack low down
function drawStone(ctx, x, base, time, near, lit, isle = 'green') {
  const frost = isle === 'frost', ember = isle === 'ember';
  ctx.save();
  ctx.translate(x, base);
  const hum = lit ? 0.55 + 0.25 * Math.sin(time * 2.2) : 0;
  if (lit || near) {
    const g = ctx.createRadialGradient(0, -64, 6, 0, -64, 110);
    g.addColorStop(0, `rgba(${GLOW},${(lit ? 0.32 : 0.18) + (near ? 0.12 : 0)})`);
    g.addColorStop(1, `rgba(${GLOW},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(-120, -190, 240, 200);
  }
  ctx.fillStyle = 'rgba(40,25,60,0.18)';
  ellipse(ctx, 0, 0, 38, 6);
  // a squat menhir, a little shorter than the ruins' one
  ctx.fillStyle = STONE;
  ctx.beginPath();
  ctx.moveTo(-26, 0);
  ctx.quadraticCurveTo(-30, -70, -18, -116);
  ctx.quadraticCurveTo(-2, -132, 14, -120);
  ctx.quadraticCurveTo(28, -76, 25, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = STONE_LIGHT;
  ctx.beginPath();
  ctx.moveTo(-19, -5);
  ctx.quadraticCurveTo(-23, -70, -13, -110);
  ctx.quadraticCurveTo(-11, -70, -11, -5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = STONE_DARK;
  ctx.beginPath();
  ctx.moveTo(25, 0);
  ctx.quadraticCurveTo(28, -76, 14, -120);
  ctx.quadraticCurveTo(20, -76, 16, 0);
  ctx.closePath();
  ctx.fill();
  // the gear ring round its middle: a carving, or (attuned) a ring of light that turns slowly
  const gy = -66, r = 15, teeth = 10, rot = lit ? time * 0.4 : 0;
  ctx.strokeStyle = lit ? `rgba(${GLOW},${0.6 + hum * 0.4})` : near ? '#c9a24a' : CARVE;
  ctx.lineWidth = lit ? 2.6 : 2;
  if (lit) {
    ctx.shadowColor = `rgba(${GLOW},0.9)`;
    ctx.shadowBlur = 10;
  }
  ctx.beginPath();
  for (let i = 0; i <= teeth * 2; i++) {
    const a = rot + (i / (teeth * 2)) * TAU, rr = i % 2 ? r : r + 4, a2 = a + TAU / (teeth * 4);
    i ? ctx.lineTo(Math.cos(a) * rr, gy + Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, gy + Math.sin(a) * rr);
    ctx.lineTo(Math.cos(a2) * rr, gy + Math.sin(a2) * rr);
  }
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, gy, r * 0.38, 0, TAU);
  ctx.stroke();
  ctx.shadowBlur = 0;
  // a little road carved below: three dots and a line, the Keepers' road
  ctx.strokeStyle = CARVE;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-10, -32);
  ctx.lineTo(10, -32);
  ctx.stroke();
  ctx.fillStyle = CARVE;
  for (const dx of [-10, 0, 10]) circle(ctx, dx, -26, 1.6);
  // moss over the shady side and the top (on Frostpeak: rime down the windward side, a cap of snow and a drift)
  if (ember) {
    ctx.fillStyle = 'rgba(176,168,170,0.8)'; // ash settled on the ledges of the stone
    for (let y = -112; y < -10; y += 14) ellipse(ctx, -16 + Math.sin(y * 0.12) * 4, y, 6, 2.4, -0.2);
    ctx.fillStyle = '#b8b0b2';
    ellipse(ctx, -2, -123, 15, 5, -0.3);
    ctx.fillStyle = '#4a3c44'; // a drift of black sand round its foot
    ellipse(ctx, 0, -1, 34, 6);
    ctx.fillStyle = `rgba(255,150,80,${0.35 + 0.2 * Math.sin(time * 1.7)})`; // the warm crack
    ctx.fillRect(10, -24, 2, 14);
    ctx.fillStyle = 'rgba(30,24,40,0.8)'; // black glass
    for (const [gx, gy] of [[-14, -90], [8, -48], [-6, -14]]) {
      ctx.beginPath();
      ctx.moveTo(gx, gy - 4);
      ctx.lineTo(gx + 3, gy);
      ctx.lineTo(gx, gy + 3);
      ctx.lineTo(gx - 3, gy);
      ctx.closePath();
      ctx.fill();
    }
  } else if (frost) {
    ctx.fillStyle = 'rgba(236,246,255,0.85)';
    for (let y = -112; y < -10; y += 13) circle(ctx, -20 + Math.sin(y * 0.1) * 3, y, 3.5 + Math.sin(y) * 1.2);
    ctx.fillStyle = '#f6fbff';
    ellipse(ctx, -2, -123, 17, 7, -0.3);
    ellipse(ctx, 0, -1, 34, 7);
    ctx.fillStyle = 'rgba(200,225,245,0.8)';
    for (const dx of [-8, 0, 7]) ctx.fillRect(dx - 1, -118, 2, 6 + Math.abs(dx) * 0.3); // little icicles under the cap
  } else {
    ctx.fillStyle = MOSS;
    for (let y = -112; y < -10; y += 13) circle(ctx, -19 + Math.sin(y * 0.1) * 3, y, 5 + Math.sin(y) * 1.5);
    ctx.fillStyle = MOSS_DARK;
    ellipse(ctx, -3, -124, 13, 5, -0.3);
    ellipse(ctx, 0, -2, 30, 5);
  }
  // motes of light drifting up off an attuned stone
  if (lit) {
    for (let i = 0; i < 5; i++) {
      const k = (time * 0.35 + i / 5) % 1;
      ctx.fillStyle = `rgba(${GLOW},${0.8 * Math.sin(k * Math.PI)})`;
      circle(ctx, Math.sin(i * 2.3 + time) * 18, gy - k * 90, 1.6 + (i % 2));
    }
  }
  ctx.restore();
}

// What E does at the stone you're at (for the prompt above your slime), or null
export function wayPrompt(me, ways = []) {
  const at = wayAt(me);
  if (!at) return null;
  if (!ways.includes(at.id)) return 'attune to the waystone';
  return ways.some((id) => id !== at.id && wayById(id) && sameIsle(wayById(id), at)) ? 'travel by waystone' : 'the waystone hums (find another)';
}
// Beacons over the stones in this room
export const wayBeacons = (room, ground, me) => WAYSTONES.filter((w) => w.room === room).map((w) => ({ x: w.x, y: ground - 150, near: w === wayAt(me) }));

// The travel card: one button per other stone you know. go(id) sends the trip.
export class WayCard {
  constructor(go) {
    this.go = go;
    this.el = document.getElementById('ways');
    this.list = document.getElementById('ways-list');
    document.getElementById('ways-no').onclick = () => this.close();
  }
  get isOpen() {
    return !this.el.hidden;
  }
  open(at, ways) {
    document.getElementById('ways-text').textContent = `The ${at.name} waystone hums. Where to?`;
    this.list.replaceChildren(
      ...ways.filter((id) => id !== at.id).map(wayById).filter((w) => w && sameIsle(w, at)).map((w) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = w.name;
        b.onclick = () => {
          this.close();
          this.go(w.id);
        };
        return b;
      }),
    );
    this.el.hidden = false;
  }
  close() {
    this.el.hidden = true;
  }
}

// A shimmer where a slime vanished or appeared (particles: src/particles.js)
export function shimmer(particles, x, y) {
  for (let i = 0; i < 22; i++) {
    const a = rand(0, TAU), v = rand(30, 140);
    particles.add({ x: x + rand(-14, 14), y: y - rand(4, 44), vx: Math.cos(a) * v * 0.5, vy: -rand(60, 200), g: -40, drag: 2, size: rand(2.5, 5), color: i % 3 ? '#bfe8ff' : '#fff6c8', shape: 'sparkle', vr: rand(-6, 6), life: rand(0.5, 0.9) });
  }
}
