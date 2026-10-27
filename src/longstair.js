// Docs: docs/places/oldice.md
// The Long Stair (room LONGSTAIR, data in src/shared/rpg.js): the approach to Fenrir's den. No mobs and no combat;
// everything that makes it frightening is drawn here (and heard: the `longstair` music scene, given stairDepth by
// src/main.js), never step() and never a cutscene. A stair the ice-cutters cut down into clear ice and never
// finished, landing by landing (the floor you walk is each landing; the flights you came down are cut into the
// wall behind you). How far east YOU are (stairDepth: 0 at the way in, 1 at the den's door) sets everything: the
// wolf's shape in the clear ice wall beside you grows (first a shadow, then the curve of its back, then an eye
// that opens as you pass it and watches you), its breath frosts the ice from the other side, the cutters'
// lanterns are out below you one by one, the roof comes down, and the ice frosts over the stair behind you (art
// only: the door back always works). At the east end the den's door: a sheet of ice over an arch that cracks by
// itself as you come near (and holds until the den is there: FENRIR_DOOR_OPEN), with a sign beside it: both levels
// (finalTag) and a live count of slimes on the stair. Fenrir's one line (FENRIR_LINE, sent by the server: say) is a
// pale bubble out of the ice.
import { W, H, TAU, mulberry32, circle, ellipse, clamp } from './util.js';
import { LONGSTAIR_W, LONGSTAIR_EXIT_X, FENRIR_DEN_X, FENRIR_DEN, FENRIR_DEN_NAME, FROST_TOP, FINAL_MIN_PLAYERS, finalTag, FIELD_GROUND, DENS } from './shared/rpg.js';
import { glow as softGlow } from './glow.js';

const GROUND = FIELD_GROUND;
const glow = (ctx, x, y, rx, ry, rgb, a = 1) => softGlow(ctx, x, y, rx, ry, rgb, a, 0.85, 0.4, 0.3);
const FONT = "Fredoka, 'Trebuchet MS', sans-serif";
const smooth = (v) => (v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v));
// the door opens only once FB2 (c) gives the den its DENS row; until then the ice cracks but holds
const FENRIR_DOOR_OPEN = DENS.some((d) => d.room === FENRIR_DEN);

// 0 at the way in, 1 at the den's door: how deep down the stair a slime at x is
export const stairDepth = (x) => clamp((x - 260) / (FENRIR_DEN_X - 460), 0, 1);

function text(ctx, str, x, y, size, color, align = 'center', weight = 700) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}
function mixc(a, b, k, al = 1) {
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * k));
  return al === 1 ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${al})`;
}

// ——— seeded scenery ———
const R0 = mulberry32(5101);
const LANDING_W = 330; // one landing of the stair: a flight down, then a lantern post
const LANDINGS = Array.from({ length: Math.floor((FENRIR_DEN_X - 300) / LANDING_W) }, (_, i) => 300 + i * LANDING_W);
const lanterns = LANDINGS.map((x) => ({ x: x + 70, th: stairDepth(x + 70), p: R0() * TAU }));
const lit = new Float32Array(lanterns.length).fill(1);
// the wolf, far behind the ice wall (a slow parallax: it stays beside you the whole way down)
const WOLF_F = 0.25, WOLF_X = 900;
const BREATH_S = 4.6; // one breath, in and out
// the eye: a fixed spot in the wall that opens as you pass it
const EYE_WX = FENRIR_DEN_X - 700;
// bubbles and cracks in the clear ice wall
const flaws = Array.from({ length: 60 }, () => ({ x: R0() * LONGSTAIR_W, y: 60 + R0() * 340, r: 1 + R0() * 3, l: R0() < 0.3 ? 20 + R0() * 40 : 0, a: R0() * TAU }));
const motes = Array.from({ length: 30 }, () => ({ x: R0() * W, y: R0() * 420, v: 6 + R0() * 8, p: R0() * TAU, s: 1 + R0() * 1.2, k: R0() }));

let lastT = null, eyeOpen = 0, crackK = 0;
let says = null; // Fenrir's line: { text, at }
export function say(text, time) {
  says = { text, at: time };
}
// how far into a breath out the wolf is (0..1: frost on the ice blooms, then fades)
const breathOut = (time) => {
  const c = (time % BREATH_S) / BREATH_S;
  return c < 0.4 ? 0 : Math.sin(((c - 0.4) / 0.6) * Math.PI);
};

// Everything behind the slimes. me: our own state (null when offline), here: slimes in the room (us included)
export function drawLongStair(ctx, camX, viewW, time, me, here) {
  const mx = me?.x ?? 0, k = stairDepth(mx), dt = lastT === null ? 0 : clamp(time - lastT, 0, 0.1);
  lastT = time;
  // lanterns go out below you one by one, and behind you too the deeper you are; the eye opens once you're past it
  lanterns.forEach((l, i) => {
    const want = l.th < 1 - k ? 1 : 0;
    lit[i] += (want - lit[i]) * Math.min(1, dt * (want ? 2 : 1.2));
  });
  eyeOpen += ((mx > EYE_WX - 160 ? 1 : 0) - eyeOpen) * Math.min(1, dt * 0.8);
  const near = smooth(clamp((mx - (FENRIR_DEN_X - 560)) / 380, 0, 1));
  crackK += (near - crackK) * Math.min(1, dt * 1.5);
  const L = camX - 80, R = camX + viewW + 80;
  ctx.save();
  ctx.translate(camX, 0);
  drawSky(ctx, k);
  drawWolf(ctx, camX, k, time, me ? me.x - camX : W / 2);
  drawIceSheet(ctx, k, time);
  ctx.restore();
  drawFlaws(ctx, L, R);
  for (const x of LANDINGS) if (x + 40 > L && x - 220 < R) drawFlight(ctx, x, k);
  drawRoof(ctx, L, R, k);
  lanterns.forEach((l, i) => l.x > L - 60 && l.x < R + 60 && drawLantern(ctx, l, lit[i], time));
  drawDoor(ctx, crackK, time);
  if (Math.abs(FENRIR_DEN_X - 250 - camX - viewW / 2) < viewW / 2 + 160) drawSign(ctx, FENRIR_DEN_X - 250, here, time);
  drawFloor(ctx, Math.max(0, L), Math.min(LONGSTAIR_W, R));
  if (LONGSTAIR_EXIT_X + 420 > L) drawFrostBehind(ctx, k, time);
}

// The cold above the stair: a dim blue at the way in, falling to black near the den
function drawSky(ctx, k) {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, mixc([10, 26, 60], [2, 4, 12], k));
  g.addColorStop(1, mixc([30, 64, 120], [6, 14, 34], k));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// The wolf behind the ice, bigger and nearer the deeper you are: a shadow, then the curve of its back, then (past
// EYE_WX) an eye that opens and follows you. It breathes; each breath out frosts the ice in front of its muzzle
function drawWolf(ctx, camX, k, time, sx) {
  const bx = WOLF_X - camX * WOLF_F, s = 0.6 + 0.75 * smooth(k), cy = GROUND - 120 * s;
  const br = Math.sin((time / BREATH_S) * TAU) * 0.03;
  // a cold glow in the ice behind it, so its shape shows against something
  glow(ctx, bx + 40 * s, cy - 20 * s, 620 * s, 230 * s, '70,120,200', 0.12 + 0.2 * smooth(k * 1.5));
  ctx.save();
  ctx.translate(bx, cy);
  ctx.scale(s * (1 + br), s * (1 - br * 0.5));
  // the shadow: a great dark mass lying along the floor of the ice, head to the east
  const a = 0.2 + 0.45 * smooth(k * 1.4);
  ctx.fillStyle = `rgba(0,2,8,${a})`;
  ellipse(ctx, 0, 30, 420, 130);
  ellipse(ctx, 360, -20, 150, 95);
  ellipse(ctx, -380, 60, 140, 70);
  // the curve of its back: a ridge of rimed fur along the top of it
  const back = smooth((k - 0.25) / 0.35);
  if (back > 0.01) {
    ctx.strokeStyle = `rgba(4,8,20,${0.8 * back})`;
    ctx.lineWidth = 34;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-480, 80);
    ctx.bezierCurveTo(-300, -120, 160, -150, 380, -100);
    ctx.stroke();
    ctx.strokeStyle = `rgba(200,225,255,${0.35 * back})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-470, 62);
    ctx.bezierCurveTo(-300, -136, 160, -166, 380, -118);
    ctx.stroke();
    // fur at the ridge, stirring as it breathes: dark tufts, rimed at the tips
    for (let i = 1; i < 15; i++) {
      const u = i / 15, v = 1 - u, bz = (a, b, c, d) => v * v * v * a + 3 * v * v * u * b + 3 * v * u * u * c + u * u * u * d;
      const x = bz(-480, -300, 160, 380), y = bz(80, -120, -150, -100) - 10; // (on the ridge's curve)
      const tip = [x + 2 + Math.sin(time * 0.8 + i) * 2, y - 16];
      ctx.fillStyle = `rgba(4,8,20,${0.85 * back})`;
      ctx.beginPath();
      ctx.moveTo(x - 9, y + 8);
      ctx.lineTo(...tip);
      ctx.lineTo(x + 9, y + 8);
      ctx.fill();
      ctx.fillStyle = `rgba(210,232,255,${0.4 * back})`;
      circle(ctx, tip[0], tip[1] + 2, 1.6);
    }
    // an ear, laid back
    ctx.fillStyle = `rgba(2,4,12,${0.85 * back})`;
    ctx.beginPath();
    ctx.moveTo(330, -110);
    ctx.lineTo(300, -190);
    ctx.lineTo(400, -118);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  // the eye, a fixed spot in the wall: it opens as you pass and turns to follow you
  const ex = EYE_WX - camX * 0.9, ey = GROUND - 210;
  if (eyeOpen > 0.02 && ex > -120 && ex < W + 120) {
    const look = clamp((sx - ex) / 400, -1, 1);
    ctx.fillStyle = 'rgba(0,2,8,0.75)';
    ellipse(ctx, ex, ey, 90, 50);
    glow(ctx, ex, ey, 120, 70, '200,230,255', 0.35 * eyeOpen);
    ctx.fillStyle = '#eef6ff';
    ctx.beginPath();
    ctx.ellipse(ex, ey, 46, Math.max(0.5, 22 * eyeOpen), 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(150,190,240,0.6)';
    ellipse(ctx, ex + look * 18, ey, 14, Math.max(0.3, 14 * eyeOpen));
    ctx.strokeStyle = 'rgba(0,2,8,0.9)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(ex, ey, 48, Math.max(0.5, 23 * eyeOpen), 0, 0, TAU);
    ctx.stroke();
  }
  // its breath on the ice: frost blooming from where its muzzle is, fading between breaths
  const b = breathOut(time) * (0.3 + 0.7 * smooth(k * 1.2));
  if (b > 0.02) {
    const fx = bx + 470 * s, fy = cy - 10 * s;
    glow(ctx, fx, fy, 130 * s * (0.6 + b * 0.4), 70 * s, '225,240,255', 0.35 * b);
    ctx.strokeStyle = `rgba(240,248,255,${0.5 * b})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const an = (i / 10) * TAU, r = (40 + (i % 3) * 18) * s * (0.5 + b * 0.5);
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + Math.cos(an) * r, fy + Math.sin(an) * r * 0.6);
      ctx.moveTo(fx + Math.cos(an) * r * 0.6, fy + Math.sin(an) * r * 0.36);
      ctx.lineTo(fx + Math.cos(an + 0.3) * r * 0.8, fy + Math.sin(an + 0.3) * r * 0.5);
    }
    ctx.stroke();
  }
}

// The clear ice wall between you and it: a cold glassy wash with a sheen, darker deeper down
function drawIceSheet(ctx, k, time) {
  ctx.fillStyle = mixc([40, 90, 160], [10, 24, 50], k, 0.28);
  ctx.fillRect(0, 0, W, GROUND);
  const s = (time * 0.04) % 1.4 - 0.2;
  ctx.fillStyle = 'rgba(220,240,255,0.05)';
  ctx.beginPath();
  ctx.moveTo(s * W, 0);
  ctx.lineTo(s * W + 120, 0);
  ctx.lineTo(s * W - 60, GROUND);
  ctx.lineTo(s * W - 180, GROUND);
  ctx.closePath();
  ctx.fill();
}
function drawFlaws(ctx, L, R) {
  for (const f of flaws) {
    if (f.x < L - 40 || f.x > R + 40) continue;
    if (f.l) {
      ctx.strokeStyle = 'rgba(200,225,255,0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(f.x, f.y);
      ctx.lineTo(f.x + Math.cos(f.a) * f.l, f.y + Math.sin(f.a) * f.l);
      ctx.lineTo(f.x + Math.cos(f.a + 0.6) * f.l * 1.4, f.y + Math.sin(f.a + 0.6) * f.l * 1.2);
      ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(210,232,255,0.3)';
      circle(ctx, f.x, f.y, f.r);
    }
  }
}

// A flight of the stair you came down, cut into the wall behind the landing: steps from the landing above down
// to this one, their edges rough (cut by hand), the ledge of the landing above running back west
function drawFlight(ctx, x, k) {
  const top = GROUND - 130, n = 7, sw = 22;
  ctx.fillStyle = 'rgba(8,20,46,0.55)';
  ctx.fillRect(x - LANDING_W + 10, top - 4, LANDING_W - n * sw - 10, 10);
  for (let i = 0; i < n; i++) {
    const sx = x - n * sw + i * sw, sy = top + (i * (GROUND - top)) / n;
    ctx.fillStyle = 'rgba(20,46,90,0.6)';
    ctx.fillRect(sx, sy, sw + 1, GROUND - sy);
    ctx.fillStyle = 'rgba(170,205,250,0.45)';
    ctx.fillRect(sx, sy, sw, 2);
  }
  ctx.strokeStyle = 'rgba(170,205,250,0.25)'; // chisel marks
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    ctx.moveTo(x - 120 + i * 18, top - 30 + (i % 2) * 6);
    ctx.lineTo(x - 112 + i * 18, top - 18 + (i % 2) * 6);
  }
  ctx.stroke();
}

// The roof: black ice, coming down lower the deeper you are
function drawRoof(ctx, L, R, k) {
  const y = 24 + 70 * smooth(k);
  ctx.fillStyle = '#01040c';
  ctx.fillRect(L, 0, R - L, y);
  ctx.beginPath();
  for (let x = L - (L % 34) - 34; x < R + 34; x += 34) {
    ctx.moveTo(x, y - 1);
    ctx.lineTo(x + 17, y + 14 + ((x / 34) % 3) * 9);
    ctx.lineTo(x + 34, y - 1);
  }
  ctx.fill();
}

// A cutters' lantern on an iron post at a landing: lit (a warm flame) or out (dark glass, a wisp of frost)
function drawLantern(ctx, l, on, time) {
  const x = l.x, y = GROUND - 120;
  ctx.fillStyle = '#2a2a30';
  ctx.fillRect(x - 2.5, y, 5, GROUND - y);
  ctx.fillRect(x - 2.5, y, 18, 3);
  ctx.strokeStyle = '#2a2a30';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 14, y + 2);
  ctx.lineTo(x + 14, y + 10);
  ctx.stroke();
  if (on > 0.02) glow(ctx, x + 14, y + 22, 70, 60, '255,200,120', 0.45 * on * (0.9 + 0.1 * Math.sin(time * 9 + l.p)));
  ctx.fillStyle = '#3a3026';
  ctx.beginPath();
  ctx.roundRect(x + 6, y + 10, 16, 22, 3);
  ctx.fill();
  ctx.fillStyle = on > 0.02 ? `rgba(255,${Math.round(200 + 30 * on)},140,${0.3 + 0.6 * on})` : 'rgba(120,150,190,0.35)';
  ctx.fillRect(x + 9, y + 14, 10, 14);
  if (on > 0.02) {
    ctx.fillStyle = `rgba(255,240,200,${on})`;
    ellipse(ctx, x + 14, y + 22 - Math.sin(time * 11 + l.p), 2, 3.5);
  }
  ctx.fillStyle = 'rgba(230,244,255,0.8)';
  ctx.fillRect(x + 6, y + 9, 16, 2);
}

// The den's door at FENRIR_DEN_X: an arch cut into the black ice with a sheet of ice over it. As you come near
// (crack: 0..1) cracks run through the sheet by themselves. Until the den is there the ice holds (the cracks go
// so far and frost over again, the breath seeps through them); with the den, the sheet breaks and falls aside
function drawDoor(ctx, crack, time) {
  const x = FENRIR_DEN_X, top = GROUND - 250;
  const archPath = (pad) => {
    ctx.beginPath();
    ctx.moveTo(x - 110 - pad, GROUND + 4);
    ctx.lineTo(x - 110 - pad, top + 90);
    ctx.quadraticCurveTo(x, top - 50 - pad, x + 110 + pad, top + 90);
    ctx.lineTo(x + 110 + pad, GROUND + 4);
    ctx.closePath();
  };
  // the cut frame: black ice, a pale rim of tool marks
  ctx.fillStyle = '#04081a';
  archPath(26);
  ctx.fill();
  ctx.strokeStyle = 'rgba(150,190,240,0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#000104';
  archPath(0);
  ctx.fill();
  const open = FENRIR_DOOR_OPEN ? crack : 0, hold = FENRIR_DOOR_OPEN ? 1 : 0.7;
  // the light of the den far behind it, cold
  glow(ctx, x, GROUND - 100, 140, 120, '150,200,255', 0.08 + 0.12 * crack);
  if (open < 0.98) {
    // the sheet of ice over it
    ctx.save();
    archPath(0);
    ctx.clip();
    ctx.fillStyle = `rgba(150,195,250,${0.42 * (1 - open)})`;
    ctx.fillRect(x - 120, top - 60, 240, GROUND - top + 70);
    ctx.fillStyle = 'rgba(230,244,255,0.1)';
    ctx.fillRect(x - 80, top, 30, GROUND - top);
    // cracks from a point low in the middle, as if pushed from inside
    const c = Math.min(crack, hold), ox = x + 6, oy = GROUND - 110;
    if (c > 0.02) {
      ctx.strokeStyle = `rgba(240,250,255,${0.5 + 0.4 * c})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const an = (i / 12) * TAU + Math.sin(i * 5.3) * 0.2, len = (60 + (i * 37) % 90) * c * 1.4;
        const mx = ox + Math.cos(an) * len * 0.5 + Math.sin(i * 3.1) * 8, my = oy + Math.sin(an) * len * 0.5;
        ctx.moveTo(ox, oy);
        ctx.lineTo(mx, my);
        ctx.lineTo(ox + Math.cos(an + 0.15) * len, oy + Math.sin(an + 0.15) * len);
      }
      ctx.stroke();
      // the wolf's breath seeping through, in time with the breathing in the wall
      const b = breathOut(time) * c;
      if (b > 0.02) glow(ctx, ox, oy, 90, 60, '235,245,255', 0.4 * b);
      // and the frost closing over the cracks again: the ice holds
      if (!FENRIR_DOOR_OPEN) {
        ctx.fillStyle = `rgba(225,240,255,${0.12 + 0.08 * Math.sin(time * 0.9)})`;
        ellipse(ctx, ox, oy, 40 * c, 30 * c);
      }
    }
    ctx.restore();
  }
  if (open > 0.02) {
    // broken: the shards fallen to either side
    ctx.fillStyle = 'rgba(170,210,255,0.75)';
    ctx.strokeStyle = 'rgba(10,30,70,0.8)';
    ctx.lineWidth = 1.2;
    for (const [dx, h, a] of [[-130, 40, -0.3], [-96, 26, 0.4], [124, 46, 0.25], [150, 22, -0.5], [-150, 18, 0.1]]) {
      ctx.save();
      ctx.translate(x + dx * open, GROUND - h * 0.5);
      ctx.rotate(a * open);
      ctx.beginPath();
      ctx.moveTo(-12, h * 0.5);
      ctx.lineTo(-4, -h * 0.5);
      ctx.lineTo(12, h * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }
  // two old lamp hooks either side of the arch, empty
  ctx.strokeStyle = '#2a2a30';
  ctx.lineWidth = 3;
  for (const d of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + d * 140, top + 110);
    ctx.lineTo(x + d * 160, top + 110);
    ctx.lineTo(x + d * 160, top + 122);
    ctx.stroke();
  }
}

// The sign by the door: the den's name, both levels (finalTag) and a live count of slimes here. A count, never a
// lock: the line says how many are here and how many are recommended, nothing else
function drawSign(ctx, x, here, time) {
  ctx.fillStyle = '#2a2a32';
  ctx.beginPath();
  ctx.roundRect(x - 5, GROUND - 110, 10, 112, 3);
  ctx.fill();
  ctx.save();
  ctx.translate(x, GROUND - 120);
  ctx.rotate(Math.sin(time * 0.7) * 0.01);
  const tag = finalTag(FROST_TOP), n = here | 0;
  ctx.font = `700 13px ${FONT}`;
  const tw = Math.max(250, ctx.measureText(tag).width + 34);
  ctx.fillStyle = '#16203a';
  ctx.strokeStyle = '#e0526e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-tw / 2, -46, tw, 92, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(230,244,255,0.8)'; // rime along its top
  ctx.fillRect(-tw / 2 + 10, -47, tw - 20, 3);
  text(ctx, FENRIR_DEN_NAME, 0, -26, 17, '#eef6ff');
  ctx.fillStyle = '#e0526e';
  ctx.beginPath();
  ctx.roundRect(-tw / 2 + 12, -10, tw - 24, 20, 10);
  ctx.fill();
  text(ctx, tag, 0, 0, 13, '#ffffff');
  const enough = n >= FINAL_MIN_PLAYERS;
  text(ctx, `${n} here, ${FINAL_MIN_PLAYERS}+ recommended`, 0, 28, 14, enough ? '#bfe8f0' : '#f4d0da');
  ctx.restore();
}

// The landing floor: clear ice over black, pale edges, rough where it was cut
function drawFloor(ctx, L, R) {
  const g = ctx.createLinearGradient(0, GROUND, 0, H);
  g.addColorStop(0, '#24467e');
  g.addColorStop(1, '#02081a');
  ctx.fillStyle = g;
  ctx.fillRect(L, GROUND, R - L, H - GROUND + 10);
  ctx.fillStyle = 'rgba(170,205,250,0.55)';
  ctx.fillRect(L, GROUND - 1, R - L, 3);
  ctx.strokeStyle = 'rgba(2,10,30,0.55)';
  ctx.lineWidth = 1.2;
  for (let x = Math.floor(L / 120) * 120; x < R; x += 120) {
    ctx.beginPath();
    ctx.moveTo(x + 14, GROUND + 4);
    ctx.lineTo(x + 30, GROUND + 22);
    ctx.stroke();
  }
}

// The stair behind you frosting over: white frost creeps east from the way in over the steps and the floor, the
// deeper you are (art only: the way back always works, and walking back up thaws it)
function drawFrostBehind(ctx, k, time) {
  const g = smooth((k - 0.15) / 0.6), reach = 60 + g * 340, x0 = LONGSTAIR_EXIT_X - 80;
  // the way up, pale at first
  glow(ctx, LONGSTAIR_EXIT_X, GROUND - 90, 110, 110, '150,200,255', 0.25 * (1 - g));
  if (g < 0.02) return;
  ctx.fillStyle = `rgba(225,240,255,${0.5 * g})`;
  ctx.beginPath();
  ctx.moveTo(x0, GROUND + 30);
  ctx.lineTo(x0, GROUND - 260);
  for (let y = -260; y <= 30; y += 26) ctx.lineTo(x0 + reach * (0.75 + 0.25 * Math.sin(y * 0.11 + time * 0.2)), GROUND + y);
  ctx.closePath();
  ctx.fill();
  // feathers of frost along its edge
  ctx.strokeStyle = `rgba(245,250,255,${0.7 * g})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let y = -240; y <= 20; y += 20) {
    const ex = x0 + reach * (0.75 + 0.25 * Math.sin(y * 0.11 + time * 0.2));
    ctx.moveTo(ex - 10, GROUND + y);
    ctx.lineTo(ex + 14, GROUND + y - 8);
    ctx.moveTo(ex + 4, GROUND + y - 4);
    ctx.lineTo(ex + 10, GROUND + y + 6);
  }
  ctx.stroke();
}

// Over the slimes: the dark closing in from the edges, deeper the further down, ice dust settling (it slows and
// stops the deeper you are), and Fenrir's line
export function drawLongStairFront(ctx, camX, viewW, time, me) {
  const k = stairDepth(me?.x ?? 0);
  ctx.save();
  ctx.translate(camX, 0);
  const g = ctx.createRadialGradient(W / 2, H * 0.6, 120, W / 2, H * 0.6, W * 0.7);
  g.addColorStop(0, 'rgba(1,3,10,0)');
  g.addColorStop(1, `rgba(1,3,10,${0.2 + 0.5 * k})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = `rgba(1,3,10,${0.1 * k})`;
  ctx.fillRect(0, 0, W, H);
  for (const m of motes) {
    if (m.k < k * 1.4) continue;
    const x = ((m.x - camX * 0.3 + Math.sin(time * 0.5 + m.p) * 14) % W + W) % W;
    const y = 30 + ((m.y + time * m.v) % 430);
    ctx.fillStyle = `rgba(220,236,255,${0.35 + 0.2 * Math.sin(time * 2 + m.p)})`;
    circle(ctx, x, y, m.s);
  }
  drawSays(ctx, me ? me.x - camX : W / 2, time);
  ctx.restore();
}
// Fenrir's line: a dark bubble with pale writing, out of the ice ahead of you (screen space)
function drawSays(ctx, sx, time) {
  if (!says) return;
  const life = 7, age = time - says.at;
  if (age > life || age < 0) return void (says = null);
  ctx.save();
  ctx.globalAlpha = clamp(Math.min(age * 1.2, life - age), 0, 1);
  ctx.font = `700 15px ${FONT}`;
  const w = ctx.measureText(says.text).width + 30, h = 34;
  const x = clamp(sx + 120, 16, W - w - 16), y = 120;
  ctx.fillStyle = 'rgba(4,8,20,0.92)';
  ctx.strokeStyle = 'rgba(200,230,255,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.stroke();
  text(ctx, says.text, x + w / 2, y + h / 2 + 1, 15, '#e8f4ff');
  ctx.restore();
}
