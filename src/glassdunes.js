// Docs: docs/places/glassdunes.md
// The Glass Dunes (room GLASSDUNES, src/shared/rpg.js; atlas Phase 9, A0): Amberdune's first wilds, the main trail east
// out of Caravanserai. Gold dunes, wind-polished sandstone shelves, and patches where lightning fused the sand to glass.
// West to east: the Dune Gate (two wind-carved sandstone pillars, a waystone; no mobs), the Wind Shelves (the side path
// down between two dunes to the Mirage Oasis, OASIS_GATE_X, open since A1), the Glass Fields (lightning glass glinting in
// the sand, slabs of it standing up: GDUNES_PLATFORMS 'glass'), the High Dunes, and at the east end the first bronze
// rings of the Buried Observatory showing out of the sand where the trail goes down its sunken steps (GDUNES_END_X).
// The caravan milestone (last in GDUNES_PLATFORMS, on top of a tall stack) is the find: every mile on it scratched out but
// the last. The sky is Caravanserai's (drawDuneSky, drawDuneAir: src/caravan.js).
import { H, TAU, mulberry32, circle, ellipse } from './util.js';
import { GDUNES_W, FIELD_GROUND, GDUNES_PLATFORMS, GDUNES_ZONES, OASIS_GATE_X, GDUNES_END_X, GDUNES_EXIT_X } from './shared/rpg.js';
import { drawDuneSky, drawDuneAir } from './caravan.js';

const GROUND = FIELD_GROUND;
const GATE_END = GDUNES_ZONES[0].x1;
const FIELDS = GDUNES_ZONES[2];
const STONE = GDUNES_PLATFORMS.find((p) => p.kind === 'milestone');
const visible = (x0, x1, L, R) => x1 > L && x0 < R;

function text(ctx, str, x, y, size, color) {
  ctx.font = `700 ${size}px Fredoka, 'Trebuchet MS', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// seeded scenery: dunes behind (big soft humps), glints of lightning glass in the Glass Fields, dry scrub
const dunes = (() => {
  const r = mulberry32(921);
  const out = [];
  for (let x = -100; x < GDUNES_W + 300; x += 260 + r() * 200) out.push({ x, w: 360 + r() * 300, h: 70 + r() * 90 });
  return out;
})();
const glints = (() => {
  const r = mulberry32(927);
  return Array.from({ length: 60 }, () => ({ x: FIELDS.x0 - 200 + r() * (FIELDS.x1 - FIELDS.x0 + 1000), y: r(), w: 10 + r() * 26, p: r() * TAU, branch: r() < 0.4 }));
})();
const scrub = (() => {
  const r = mulberry32(931);
  return Array.from({ length: 34 }, () => ({ x: GATE_END + r() * (GDUNES_W - GATE_END - 300), s: 0.6 + r() * 0.7 }));
})();

// Everything on the Glass Dunes behind the slimes
export function drawGlassDunes(ctx, camX, viewW, time) {
  ctx.save();
  ctx.translate(camX, 0);
  drawDuneSky(ctx, camX, time, GDUNES_W);
  ctx.restore();
  const L = camX - 140, R = camX + viewW + 140;
  for (const d of dunes) if (visible(d.x - d.w / 2, d.x + d.w / 2, L, R)) drawBackDune(ctx, d);
  drawSand(ctx, Math.max(0, L), Math.min(GDUNES_W, R), time);
  for (const g of glints) if (visible(g.x - 30, g.x + 30, L, R)) drawGlint(ctx, g, time);
  for (const sc of scrub) if (visible(sc.x - 20, sc.x + 20, L, R)) drawScrub(ctx, sc, time);
  if (visible(0, GATE_END + 60, L, R)) drawDuneGate(ctx, time);
  if (visible(OASIS_GATE_X - 160, OASIS_GATE_X + 160, L, R)) drawOasisSlip(ctx, time);
  for (const p of GDUNES_PLATFORMS) {
    if (!visible(p.x - 60, p.x + p.w + 60, L, R)) continue;
    if (p.kind === 'shelf') drawShelf(ctx, p);
    else if (p.kind === 'glass') drawGlassSlab(ctx, p, time);
  }
  if (visible(STONE.x - 80, STONE.x + STONE.w + 80, L, R)) drawMilestone(ctx, time);
  if (visible(GDUNES_END_X - 260, GDUNES_W, L, R)) drawObservatoryEdge(ctx, time);
  if (visible(GDUNES_EXIT_X, GDUNES_EXIT_X + 200, L, R)) drawSign(ctx, GDUNES_EXIT_X + 90, 'Caravanserai', -1, time);
  ctx.save();
  ctx.translate(camX, 0);
  drawDuneAir(ctx, camX, time);
  ctx.restore();
}

// a big soft dune behind the trail: lit side and shadow side, a sharp crest
function drawBackDune(ctx, d) {
  const { x, w, h } = d, b = GROUND - 30;
  ctx.fillStyle = '#e8c088';
  ctx.beginPath();
  ctx.moveTo(x - w / 2, b + 30);
  ctx.quadraticCurveTo(x - w * 0.15, b - h * 1.3, x + w * 0.05, b - h);
  ctx.quadraticCurveTo(x + w * 0.25, b - h * 0.6, x + w / 2, b + 30);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(184,120,70,0.35)'; // the shadow side
  ctx.beginPath();
  ctx.moveTo(x + w * 0.05, b - h);
  ctx.quadraticCurveTo(x + w * 0.25, b - h * 0.6, x + w / 2, b + 30);
  ctx.lineTo(x + w * 0.1, b + 30);
  ctx.quadraticCurveTo(x + w * 0.12, b - h * 0.4, x + w * 0.05, b - h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,240,210,0.6)'; // the crest, catching the sun
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.2, b - h * 0.86);
  ctx.quadraticCurveTo(x - w * 0.05, b - h * 1.04, x + w * 0.05, b - h);
  ctx.stroke();
}

function drawSand(ctx, L, R, time) {
  if (R <= L) return;
  const g = ctx.createLinearGradient(0, GROUND - 6, 0, H);
  g.addColorStop(0, '#e8c48a');
  g.addColorStop(1, '#c8965a');
  ctx.fillStyle = g;
  ctx.fillRect(L, GROUND - 4, R - L, H - GROUND + 4);
  ctx.fillStyle = '#f2d8a4';
  ctx.beginPath();
  ctx.roundRect(L - 4, GROUND - 6, R - L + 8, 10, 5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(160,104,56,0.3)'; // wind ripples
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let x = Math.floor(L / 40) * 40; x < R; x += 40) {
    for (const y of [GROUND + 14, GROUND + 34, GROUND + 58]) {
      ctx.moveTo(x, y + ((x / 40) % 3) * 3);
      ctx.quadraticCurveTo(x + 12, y - 3, x + 26, y + ((x / 40) % 3) * 3);
    }
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,240,214,0.5)'; // sand blowing off the top, low
  for (let x = Math.floor(L / 90) * 90; x < R; x += 90) {
    const k = (time * 0.8 + x * 0.01) % 1;
    ellipse(ctx, x + k * 60, GROUND - 4 - k * 6, 14 * (1 - k), 1.6);
  }
}

// a glint of lightning glass in the sand: a branching clear streak, flashing now and then
function drawGlint(ctx, g, time) {
  const y = GROUND + 8 + g.y * 60, f = 0.3 + 0.7 * Math.max(0, Math.sin(time * 1.4 + g.p));
  ctx.strokeStyle = `rgba(214,238,246,${0.4 + 0.5 * f})`;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(g.x, y);
  ctx.lineTo(g.x + g.w * 0.5, y - 2);
  ctx.lineTo(g.x + g.w, y + 1);
  if (g.branch) {
    ctx.moveTo(g.x + g.w * 0.5, y - 2);
    ctx.lineTo(g.x + g.w * 0.6, y + 6);
  }
  ctx.stroke();
  if (f > 0.9) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    circle(ctx, g.x + g.w * 0.5, y - 2, 1.8);
  }
}

// dry scrub: a tuft of grey-green grass, a dead thornbush
function drawScrub(ctx, sc, time) {
  const s = sc.s, sw = Math.sin(time * 1.2 + sc.x) * 2;
  ctx.strokeStyle = '#9a9a6a';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = -3; i <= 3; i++) {
    ctx.moveTo(sc.x + i * 2 * s, GROUND);
    ctx.quadraticCurveTo(sc.x + i * 4 * s + sw, GROUND - 10 * s, sc.x + i * 6 * s + sw, GROUND - (14 + Math.abs(i) * -1) * s);
  }
  ctx.stroke();
}

// The Dune Gate: two tall sandstone pillars, wind-carved into waists and knuckles, banded red and gold, a fallen lintel
// leaning between them
function drawDuneGate(ctx, time) {
  for (const x of [130, 560]) {
    ctx.fillStyle = '#d8945a';
    ctx.strokeStyle = '#9a5a32';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 34, GROUND);
    ctx.quadraticCurveTo(x - 18, GROUND - 60, x - 30, GROUND - 120);
    ctx.quadraticCurveTo(x - 16, GROUND - 180, x - 34, GROUND - 230);
    ctx.lineTo(x + 34, GROUND - 236);
    ctx.quadraticCurveTo(x + 20, GROUND - 180, x + 30, GROUND - 120);
    ctx.quadraticCurveTo(x + 18, GROUND - 60, x + 34, GROUND);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(244,214,138,0.6)'; // the bands
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (const y of [40, 90, 150, 200]) {
      ctx.moveTo(x - 30, GROUND - y);
      ctx.quadraticCurveTo(x, GROUND - y - 6, x + 30, GROUND - y);
    }
    ctx.stroke();
  }
  ctx.save(); // the fallen lintel, leaning
  ctx.translate(300, GROUND - 40);
  ctx.rotate(-0.12);
  ctx.fillStyle = '#c8845a';
  ctx.strokeStyle = '#9a5a32';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-120, -26, 240, 32, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(244,240,226,0.6)'; // sand drifted on it
  ctx.beginPath();
  ctx.ellipse(-40, -26, 70, 6, 0, Math.PI, 0);
  ctx.fill();
  ctx.restore();
}

// The side path down to the Mirage Oasis: a low saddle between two dunes, the sand sliding away into it, palm tops showing
// over the far side and a strip of green; a little cairn with a blue rag tied on it (Asra's marker)
function drawOasisSlip(ctx, time) {
  const x = OASIS_GATE_X;
  ctx.fillStyle = '#6a9a5a';
  for (const [dx, h] of [[-40, 70], [10, 92], [56, 64]]) { // palm tops, beyond
    ctx.strokeStyle = '#8a6a48';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + dx, GROUND - 50);
    ctx.quadraticCurveTo(x + dx + 6, GROUND - h * 0.7, x + dx + 2, GROUND - h);
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.6 + Math.sin(time + i + dx) * 0.05;
      ctx.beginPath();
      ctx.ellipse(x + dx + 2 + Math.cos(a) * 14, GROUND - h + Math.sin(a) * 8 + 6, 16, 4, a, 0, TAU);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#e0b880'; // the two dunes either side, and the slip between
  ctx.beginPath();
  ctx.moveTo(x - 150, GROUND);
  ctx.quadraticCurveTo(x - 110, GROUND - 90, x - 50, GROUND - 50);
  ctx.quadraticCurveTo(x, GROUND - 16, x + 50, GROUND - 48);
  ctx.quadraticCurveTo(x + 110, GROUND - 92, x + 150, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(184,120,70,0.3)';
  ctx.beginPath();
  ctx.moveTo(x - 50, GROUND - 50);
  ctx.quadraticCurveTo(x, GROUND - 16, x + 50, GROUND - 48);
  ctx.lineTo(x + 30, GROUND);
  ctx.lineTo(x - 30, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#9a8a78'; // the cairn
  for (const [dy, r] of [[0, 9], [-12, 7], [-22, 5]]) circle(ctx, x + 80, GROUND - 6 + dy, r);
  ctx.fillStyle = '#4a7ac8';
  ctx.beginPath();
  ctx.moveTo(x + 80, GROUND - 26);
  ctx.quadraticCurveTo(x + 92 + Math.sin(time * 3) * 3, GROUND - 30, x + 98, GROUND - 22 + Math.sin(time * 4) * 2);
  ctx.lineTo(x + 82, GROUND - 22);
  ctx.closePath();
  ctx.fill();
  drawSign(ctx, x - 96, 'Mirage Oasis', 1, time);
}

// A sandstone shelf: a wind-polished ledge on a narrow waisted stack
function drawShelf(ctx, p) {
  const { x, y, w } = p;
  ctx.fillStyle = '#c8845a';
  ctx.strokeStyle = '#9a5a32';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.3, GROUND);
  ctx.quadraticCurveTo(x + w * 0.42, (y + GROUND) / 2, x + w * 0.2, y + 14);
  ctx.lineTo(x + w * 0.8, y + 14);
  ctx.quadraticCurveTo(x + w * 0.58, (y + GROUND) / 2, x + w * 0.7, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e0a070';
  ctx.beginPath();
  ctx.moveTo(x - 6, y + 4);
  ctx.quadraticCurveTo(x + w / 2, y - 10, x + w + 6, y + 4);
  ctx.quadraticCurveTo(x + w / 2, y + 22, x - 6, y + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(244,214,138,0.6)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 6, y + 6);
  ctx.quadraticCurveTo(x + w / 2, y, x + w - 6, y + 6);
  ctx.stroke();
}

// A slab of lightning glass standing up out of the sand, greenish and clear, branching inside, flat enough on top to stand on
function drawGlassSlab(ctx, p, time) {
  const { x, y, w } = p;
  ctx.fillStyle = 'rgba(190,220,214,0.75)';
  ctx.strokeStyle = '#6a8a8a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 10, GROUND);
  ctx.lineTo(x, y + 4);
  ctx.lineTo(x + 18, y);
  ctx.lineTo(x + w - 14, y);
  ctx.lineTo(x + w, y + 8);
  ctx.lineTo(x + w - 18, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; // the branching inside
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y + 6);
  ctx.lineTo(x + w * 0.44, y + 40);
  ctx.lineTo(x + w * 0.56, y + 70);
  ctx.moveTo(x + w * 0.44, y + 40);
  ctx.lineTo(x + w * 0.28, y + 60);
  ctx.moveTo(x + w * 0.56, y + 70);
  ctx.lineTo(x + w * 0.7, y + 90);
  ctx.stroke();
  const f = Math.max(0, Math.sin(time * 1.1 + x));
  ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * f})`;
  ctx.fillRect(x + 20, y + 2, w - 40, 3);
}

// The caravan milestone on the tall stack: a squat carved stone, its face cut with mile marks in rows, every one of them
// scratched through but the last, and below that a little caravan of three figures
function drawMilestone(ctx, time) {
  const p = STONE, cx = p.x + p.w / 2;
  ctx.fillStyle = '#c8845a'; // the stack it sits on
  ctx.strokeStyle = '#9a5a32';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 30, GROUND);
  ctx.quadraticCurveTo(cx - 14, (p.y + GROUND) / 2, cx - 34, p.y + 4);
  ctx.lineTo(cx + 34, p.y + 4);
  ctx.quadraticCurveTo(cx + 14, (p.y + GROUND) / 2, cx + 30, GROUND);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e0a070';
  ctx.beginPath();
  ctx.roundRect(p.x, p.y - 4, p.w, 9, 4);
  ctx.fill();
  ctx.fillStyle = '#b8a48a'; // the milestone
  ctx.strokeStyle = '#6a5a48';
  ctx.beginPath();
  ctx.moveTo(cx - 16, p.y - 4);
  ctx.lineTo(cx - 14, p.y - 42);
  ctx.quadraticCurveTo(cx, p.y - 50, cx + 14, p.y - 42);
  ctx.lineTo(cx + 16, p.y - 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#5a4a3a';
  ctx.lineWidth = 1;
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 4; i++) {
      const mx = cx - 9 + i * 6, my = p.y - 40 + row * 9;
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(mx, my + 5);
      ctx.stroke();
      if (!(row === 2 && i === 3)) { // scratched through, all but the last
        ctx.beginPath();
        ctx.moveTo(mx - 2, my + 4);
        ctx.lineTo(mx + 2, my + 1);
        ctx.stroke();
      }
    }
  }
  ctx.fillStyle = '#5a4a3a'; // a little caravan cut below
  for (const dx of [-7, 0, 7]) circle(ctx, cx + dx, p.y - 10, 1.6);
  ctx.fillStyle = `rgba(255,240,200,${0.2 + 0.2 * Math.sin(time * 2)})`;
  circle(ctx, cx + 9, p.y - 22, 2);
}

// The Glass Dunes' east end: the first bronze rings of the Buried Observatory standing out of the sand ahead, green-gold,
// the trail going down its sunken steps between them
function drawObservatoryEdge(ctx, time) {
  const x = GDUNES_END_X;
  for (const [dx, r, a] of [[-120, 110, -0.2], [60, 150, 0.15]]) {
    ctx.strokeStyle = '#7a6a3a';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.ellipse(x + dx, GROUND + 30, r, r * 0.95, a, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
    ctx.strokeStyle = '#c8a050';
    ctx.lineWidth = 5;
    ctx.stroke();
  }
  ctx.fillStyle = '#9a8a6a'; // the top of the sunken steps
  for (let i = 0; i < 3; i++) ctx.fillRect(x - 40 + i * 8, GROUND - 6 + i * 6, 80 - i * 16, 5);
  drawSign(ctx, x - 150, 'Buried Observatory', 1, time);
}

// A post with an arrow board (dir: 1 pointing east, -1 west)
function drawSign(ctx, x, label, dir, time) {
  ctx.fillStyle = '#5a4030';
  ctx.fillRect(x - 3, GROUND - 92, 6, 94);
  ctx.save();
  ctx.translate(x, GROUND - 76);
  ctx.rotate(Math.sin(time * 1.6 + x) * 0.03);
  ctx.scale(dir, 1);
  ctx.fillStyle = '#e8d0a0';
  ctx.strokeStyle = '#8a6a48';
  ctx.lineWidth = 2;
  ctx.font = "700 12px Fredoka, 'Trebuchet MS', sans-serif";
  const tw = Math.max(110, ctx.measureText(label).width + 30);
  ctx.beginPath();
  ctx.moveTo(-tw / 2, -12);
  ctx.lineTo(tw / 2 - 6, -12);
  ctx.lineTo(tw / 2 + 6, 0);
  ctx.lineTo(tw / 2 - 6, 12);
  ctx.lineTo(-tw / 2, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.scale(dir, 1);
  text(ctx, label, 0, 1, 12, '#4a3424');
  ctx.restore();
}
export { drawSign as drawDuneSign };
