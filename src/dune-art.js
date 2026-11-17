// Docs: docs/places/amberdune.md, docs/art.md
// Amberdune's people and its gear (atlas Phase 9, A0 and A1), the art that isn't a room (src/caravan.js and the rest):
// - the dune folk look (`folk: 'dune'`, src/slime.js): warm amber-gold jelly with a little sand caught inside, drifting
//   slowly down through it like an hourglass's (DUNE_PALETTE, drawDuneFolk); their wobble is the slow, steady one every
//   island's folk have (`stiff` in slime.js), youngsters (`lively`) still bounce;
// - what Caravanserai's people wear (drawDuneDress, for their NPCS `accessory`): Skipper Kesh's 'saltskipper', Mother
//   Dune's 'matriarch', Tally's 'counter', Asra's 'wellkeeper'. Long scarves, wrapped hoods and veils, brass rings and beads;
// - the gear players get (through src/field.js): Tally's Salt-Iron Tulwar and Drover's Wrap, the fulgurite scorpion's
//   Fulgurite Crest, the dial sentry's Dialwatch Helm, and the Sunroller's Gnomon Blade and Scarab Crown (DUNE_SWORDS,
//   DUNE_HELMETS). The staves and bows are configs in src/staff-art.js and src/bow-art.js.
// Slime space: the body sits on y = 0 and reaches up to -h, facing right; fx is the face's centre x.
import { TAU, circle, ellipse } from './util.js';

const SAND = '#e8c88a', SAND_D = '#b8924e', SAND_L = '#f6e2b4';
const INDIGO = '#3e4a7a', INDIGO_D = '#26305a';
const BRASS = '#d8a84a', BRASS_D = '#9a7028', BRASS_L = '#f4d68a';
const RUST = '#b8583a', RUST_D = '#7e3622';
const SALTIRON = '#8a8e96', SALTIRON_D = '#5a5e68', SALT = '#f4f2ea';

// ——— the dune folk look ———
export const DUNE_PALETTE = (hue) => ({
  top: `hsl(${hue} 72% 76% / 0.92)`,
  bottom: `hsl(${hue - 6} 62% 56% / 0.95)`,
  line: `hsl(${hue - 10} 50% 36%)`,
  cheek: `hsl(${hue - 14} 80% 72%)`,
});
// inside the body (clipped): a soft band of warmer light near the bottom, and grains of sand drifting slowly down through
// the jelly, gathering in a little drift at the bottom
export function drawDuneFolk(ctx, w, h, t) {
  const g = ctx.createLinearGradient(0, -h, 0, 0);
  g.addColorStop(0, 'rgba(255,240,200,0)');
  g.addColorStop(1, 'rgba(255,200,120,0.28)');
  ctx.fillStyle = g;
  ctx.fillRect(-w, -h * 1.2, w * 2, h * 1.3);
  ctx.fillStyle = 'rgba(150,104,40,0.55)';
  for (let i = 0; i < 14; i++) {
    const x = Math.sin(i * 2.7) * w * 0.42, k = ((t * 0.06 + i * 0.137) % 1);
    circle(ctx, x + Math.sin(t * 0.5 + i) * 1.5, -h * (0.9 - k * 0.85), 0.9 + (i % 3) * 0.35);
  }
  ctx.fillStyle = 'rgba(184,146,78,0.45)'; // the little drift at the bottom
  ctx.beginPath();
  ctx.ellipse(0, -1, w * 0.36, h * 0.06, 0, Math.PI, 0);
  ctx.fill();
}

// A long scarf wound round the neck, both tails hanging off the back (stripes: a second colour)
function scarf(ctx, w, h, fill, stripe, t, tails = true) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-w * 0.52, -h * 0.4);
  ctx.quadraticCurveTo(0, -h * 0.3, w * 0.52, -h * 0.4);
  ctx.lineTo(w * 0.5, -h * 0.28);
  ctx.quadraticCurveTo(0, -h * 0.18, -w * 0.5, -h * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (stripe) {
    ctx.strokeStyle = stripe;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, -h * 0.34);
    ctx.quadraticCurveTo(0, -h * 0.25, w * 0.5, -h * 0.34);
    ctx.stroke();
  }
  if (!tails) return;
  const sw = Math.sin(t * 1.4) * 3;
  ctx.fillStyle = fill;
  for (const [x0, len] of [[-w * 0.42, h * 0.34], [-w * 0.3, h * 0.26]]) {
    ctx.beginPath();
    ctx.moveTo(x0, -h * 0.34);
    ctx.quadraticCurveTo(x0 - 8 + sw, -h * 0.2, x0 - 6 + sw * 1.4, -h * 0.34 + len);
    ctx.lineTo(x0 + 3 + sw * 1.4, -h * 0.34 + len - 2);
    ctx.quadraticCurveTo(x0 + 2 + sw, -h * 0.2, x0 + 8, -h * 0.34);
    ctx.closePath();
    ctx.fill();
    if (stripe) {
      ctx.fillStyle = stripe;
      ctx.fillRect(x0 - 6 + sw * 1.3, -h * 0.34 + len - 7, 9, 3);
      ctx.fillStyle = fill;
    }
  }
}
// A wrapped hood: cloth wound over the top of the head, a fold hanging down one side
function wrap(ctx, w, h, fill, line, band) {
  const by = -h * 0.62;
  ctx.fillStyle = fill;
  ctx.strokeStyle = line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.58, by + 8);
  ctx.bezierCurveTo(-w * 0.64, by - h * 0.56, w * 0.64, by - h * 0.56, w * 0.58, by + 8);
  ctx.quadraticCurveTo(0, by - 4, -w * 0.58, by + 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'; // the folds of the wrap
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 1; i < 4; i++) {
    const y = by + 4 - i * h * 0.1;
    ctx.moveTo(-w * (0.56 - i * 0.08), y + 3);
    ctx.quadraticCurveTo(0, y - 6, w * (0.56 - i * 0.08), y - 1);
  }
  ctx.stroke();
  if (band) {
    ctx.fillStyle = band;
    ctx.beginPath();
    ctx.ellipse(0, by + 2, w * 0.56, h * 0.06, 0, Math.PI * 0.05, Math.PI * 0.95);
    ctx.lineTo(-w * 0.5, by + 2);
    ctx.fill();
  }
  ctx.fillStyle = fill; // the hanging fold, at the back
  ctx.beginPath();
  ctx.moveTo(-w * 0.5, by + 4);
  ctx.quadraticCurveTo(-w * 0.72, by + h * 0.2, -w * 0.62, by + h * 0.36);
  ctx.lineTo(-w * 0.46, by + h * 0.3);
  ctx.quadraticCurveTo(-w * 0.5, by + h * 0.14, -w * 0.36, by + 6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = 1.4;
  ctx.stroke();
}
function beads(ctx, x0, y0, x1, y1, n, cols) {
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    ctx.fillStyle = cols[i % cols.length];
    circle(ctx, x0 + (x1 - x0) * k, y0 + (y1 - y0) * k + Math.sin(k * Math.PI) * 4, 1.8);
  }
}

// ——— Caravanserai's people ———
export function drawDuneDress(ctx, kind, w, h, fx, t) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (kind === 'saltskipper') {
    // Skipper Kesh: a short sailor's coat of faded indigo, salt-stained, the scarf tied tight; a sun-bleached cloth cap
    // pulled low, a brass ring in one ear, a coil of line over her shoulder. She's the only one of them who likes water
    ctx.fillStyle = INDIGO;
    ctx.strokeStyle = INDIGO_D;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-w * 0.46, -h * 0.36);
    ctx.quadraticCurveTo(0, -h * 0.44, w * 0.46, -h * 0.36);
    ctx.lineTo(w * 0.5, -h * 0.1);
    ctx.lineTo(-w * 0.5, -h * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(244,242,234,0.45)'; // salt rings on the coat
    for (const [x, y] of [[-0.24, -0.2], [0.18, -0.26], [0.32, -0.16]]) ellipse(ctx, w * x, h * y, 5, 2.4);
    ctx.strokeStyle = '#c8b48a'; // a coil of line over the shoulder
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(-w * 0.3, -h * 0.34, 9 - i * 2, 6 - i * 1.4, -0.5, 0, TAU);
      ctx.stroke();
    }
    scarf(ctx, w, h, '#d86a3a', SAND_L, t, false);
    const by = -h * 0.8; // the cloth cap, pulled low
    ctx.fillStyle = '#e8dcc0';
    ctx.strokeStyle = '#a89a78';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-w * 0.46, by + 6);
    ctx.bezierCurveTo(-w * 0.46, by - h * 0.3, w * 0.46, by - h * 0.3, w * 0.46, by + 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#d8ccae'; // its brim, out over the face
    ctx.beginPath();
    ctx.ellipse(fx * 0.6 + w * 0.08, by + 6, w * 0.4, 4, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = BRASS; // the ear-ring
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(-w * 0.44, -h * 0.56, 3.2, 0, TAU);
    ctx.stroke();
  } else if (kind === 'matriarch') {
    // Mother Dune: a great indigo veil over her head and shoulders, falling to the ground behind her, sewn all over its edge
    // with little brass discs that chime when she moves; a long staff of sun-dried acacia with a star-dial's pointer on top
    ctx.fillStyle = INDIGO;
    ctx.strokeStyle = INDIGO_D;
    ctx.lineWidth = 2;
    ctx.beginPath(); // the train, behind
    ctx.moveTo(-w * 0.56, -h * 0.5);
    ctx.quadraticCurveTo(-w * 0.86, -h * 0.2, -w * 0.78, 0);
    ctx.lineTo(-w * 0.3, 0);
    ctx.quadraticCurveTo(-w * 0.46, -h * 0.3, -w * 0.3, -h * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath(); // the veil over the head, the face left clear
    ctx.moveTo(-w * 0.62, -h * 0.24);
    ctx.bezierCurveTo(-w * 0.7, -h * 1.14, w * 0.7, -h * 1.14, w * 0.62, -h * 0.24);
    ctx.quadraticCurveTo(w * 0.44, -h * 0.64, 0, -h * 0.72);
    ctx.quadraticCurveTo(-w * 0.44, -h * 0.64, -w * 0.62, -h * 0.24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.ellipse(-w * 0.3, -h * 0.86, w * 0.1, h * 0.12, -0.4, 0, TAU);
    ctx.fill();
    for (let i = 0; i <= 12; i++) { // the brass discs along the veil's edge
      const k = i / 12, x = -w * 0.6 + k * w * 1.2, y = -h * 0.26 - Math.sin(k * Math.PI) * h * 0.44;
      ctx.fillStyle = Math.sin(t * 2 + i * 1.7) > 0.6 ? BRASS_L : BRASS;
      circle(ctx, x, y, 1.9);
    }
    ctx.strokeStyle = '#9a7a52'; // the staff, held in front, the dial's pointer on top
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w * 0.78, 0);
    ctx.lineTo(w * 0.86, -h * 1.22);
    ctx.stroke();
    ctx.fillStyle = BRASS;
    ctx.beginPath();
    ctx.moveTo(w * 0.86, -h * 1.22);
    ctx.lineTo(w * 0.86 + 12, -h * 1.22 - 4);
    ctx.lineTo(w * 0.86, -h * 1.22 - 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = BRASS_D;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(w * 0.86, -h * 1.22, 6, 0, TAU);
    ctx.stroke();
  } else if (kind === 'counter') {
    // Tally: a sand-coloured coat with deep pockets, a long string of counting beads round his neck in bands of ten, a
    // ledger under his arm, a little rolled turban, a reed pen behind his ear
    ctx.fillStyle = '#c8a878';
    ctx.strokeStyle = '#8a6a42';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-w * 0.48, -h * 0.38);
    ctx.quadraticCurveTo(0, -h * 0.46, w * 0.48, -h * 0.38);
    ctx.lineTo(w * 0.54, -2);
    ctx.lineTo(-w * 0.54, -2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(138,106,66,0.6)'; // the pockets
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-w * 0.36, -h * 0.2, w * 0.2, h * 0.12);
    ctx.strokeRect(w * 0.14, -h * 0.2, w * 0.2, h * 0.12);
    beads(ctx, -w * 0.4, -h * 0.4, w * 0.4, -h * 0.4, 20, ['#b8583a', '#b8583a', '#b8583a', '#b8583a', '#b8583a', '#b8583a', '#b8583a', '#b8583a', '#b8583a', '#f4d68a']);
    ctx.fillStyle = '#6a4a2e'; // the ledger under the arm
    ctx.save();
    ctx.translate(-w * 0.5, -h * 0.26);
    ctx.rotate(-0.25);
    ctx.fillRect(-8, -12, 16, 22);
    ctx.fillStyle = '#f0e6cc';
    ctx.fillRect(-6, -10, 3, 18);
    ctx.restore();
    const by = -h * 0.8; // a small rolled turban
    ctx.fillStyle = '#f0e6cc';
    ctx.strokeStyle = '#b8a47a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(0, by, w * 0.42, h * 0.16, 0, Math.PI, 0);
    ctx.lineTo(w * 0.42, by + 4);
    ctx.lineTo(-w * 0.42, by + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(184,164,122,0.8)';
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      ctx.moveTo(-w * 0.4, by - i * 4);
      ctx.quadraticCurveTo(0, by - 6 - i * 4, w * 0.4, by - i * 5 - 2);
    }
    ctx.stroke();
    ctx.strokeStyle = '#8a7a52'; // the reed pen behind his ear
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-w * 0.34, -h * 0.66);
    ctx.lineTo(-w * 0.12, -h * 0.98);
    ctx.stroke();
  } else if (kind === 'wellkeeper') {
    // Asra: a sleeveless tunic of rust-red, a cord of knotted rope round her waist (she marks the well rope), her hair
    // wrapped in a green scarf the colour of the rain she's never seen, a dipper hung at her hip
    ctx.fillStyle = RUST;
    ctx.strokeStyle = RUST_D;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-w * 0.42, -h * 0.38);
    ctx.quadraticCurveTo(0, -h * 0.44, w * 0.42, -h * 0.38);
    ctx.lineTo(w * 0.5, -2);
    ctx.lineTo(-w * 0.5, -2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#d8c49a'; // the knotted cord
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, -h * 0.18);
    ctx.quadraticCurveTo(0, -h * 0.12, w * 0.5, -h * 0.18);
    ctx.stroke();
    ctx.fillStyle = '#d8c49a';
    for (const x of [-0.3, -0.1, 0.1, 0.3]) circle(ctx, w * x, -h * 0.15, 2.4);
    ctx.strokeStyle = '#8a6a48'; // the dipper
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w * 0.36, -h * 0.16);
    ctx.lineTo(w * 0.44, -h * 0.04);
    ctx.stroke();
    ctx.fillStyle = '#a07a4a';
    ellipse(ctx, w * 0.46, -h * 0.02, 5, 3);
    wrap(ctx, w * 0.92, h, '#6aa878', '#3e7a50', null);
  }
  ctx.restore();
}

// ——— swords ———
// The Salt-Iron Tulwar: a curved grey blade, frosted white along the spine where the salt comes out of it, a disc pommel
function drawSaltTulwar(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(255,240,200,0.8)';
    ctx.shadowBlur = 10;
  }
  ctx.fillStyle = SALTIRON;
  ctx.beginPath();
  ctx.moveTo(-3, -L * 0.24);
  ctx.quadraticCurveTo(-5, -L * 0.7, 4, -L);
  ctx.quadraticCurveTo(8, -L * 0.62, 4, -L * 0.24);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = SALT; // the frosted spine
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-2.4, -L * 0.28);
  ctx.quadraticCurveTo(-4.2, -L * 0.7, 3.6, -L * 0.97);
  ctx.stroke();
  ctx.fillStyle = SALTIRON_D;
  for (const y of [0.4, 0.55, 0.7]) circle(ctx, 1.5, -L * y, 0.8);
  ctx.fillStyle = BRASS; // the guard, a short bar with knobs
  ctx.fillRect(-8, -L * 0.25, 16, 3);
  circle(ctx, -8, -L * 0.25 + 1.5, 2.2);
  circle(ctx, 8, -L * 0.25 + 1.5, 2.2);
  ctx.fillStyle = '#5a3a24'; // a wrapped leather grip
  ctx.beginPath();
  ctx.roundRect(-2.4, -L * 0.23, 4.8, L * 0.2, 2);
  ctx.fill();
  ctx.fillStyle = BRASS;
  circle(ctx, 0, -L * 0.02, 3.6);
  ctx.restore();
}
// The Gnomon Blade: a long straight blade of bronze shaped like a sundial's gnomon (a tall right-angled wedge), the hours
// notched along its back; it glints gold
function drawGnomonBlade(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(255,220,120,0.9)';
    ctx.shadowBlur = 12;
  }
  const g = ctx.createLinearGradient(-5, 0, 6, 0);
  g.addColorStop(0, '#a8742a');
  g.addColorStop(0.5, '#e8b85a');
  g.addColorStop(1, '#c08a3a');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-3, -L * 0.26);
  ctx.lineTo(-3, -L);
  ctx.lineTo(6, -L * 0.26);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#6a4418'; // the hour notches along its back
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < 9; i++) {
    const y = -L * (0.3 + i * 0.075);
    ctx.moveTo(-3, y);
    ctx.lineTo(-1, y);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,246,210,0.6)';
  ctx.beginPath();
  ctx.moveTo(-1.5, -L * 0.3);
  ctx.lineTo(-1.5, -L * 0.9);
  ctx.lineTo(0.2, -L * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#26305a'; // a dial-plate guard, a sun in its middle
  ctx.beginPath();
  ctx.ellipse(0, -L * 0.255, 10, 3.4, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = BRASS_L;
  circle(ctx, 0, -L * 0.255, 2);
  ctx.fillStyle = '#3e2a1e';
  ctx.beginPath();
  ctx.roundRect(-2.4, -L * 0.24, 4.8, L * 0.22, 2);
  ctx.fill();
  ctx.fillStyle = BRASS;
  circle(ctx, 0, -L * 0.02, 3.4);
  ctx.restore();
}
export const DUNE_SWORDS = { salt_tulwar: drawSaltTulwar, gnomon_blade: drawGnomonBlade };
export const DUNE_SWORD_LEN = { salt_tulwar: 62, gnomon_blade: 68 };

// ——— helmets ———
// The Drover's Wrap: a long undyed scarf wound into a hood, a fold over the mouth pulled down, a brass ring holding it
function drawDroverWrap(ctx, w, h) {
  wrap(ctx, w, h, '#e8dcc0', '#a89a78', null);
  ctx.strokeStyle = BRASS;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-w * 0.44, -h * 0.5, 4, 0, TAU);
  ctx.stroke();
}
// The Fulgurite Crest: a branching crest of lightning glass on a leather cap, glinting
function drawFulguriteCrest(ctx, w, h) {
  const by = -h * 0.66, rx = w * 0.5;
  ctx.fillStyle = '#6a4a32';
  ctx.strokeStyle = '#3e2a1e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 8);
  ctx.bezierCurveTo(-rx * 1.04, by - h * 0.42, rx * 1.04, by - h * 0.42, rx, by + 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(220,240,255,0.95)';
  ctx.fillStyle = 'rgba(190,220,240,0.55)';
  ctx.lineWidth = 3;
  const top = by - h * 0.28;
  ctx.beginPath(); // the glass branches, like the strike that made it
  ctx.moveTo(0, top + 4);
  ctx.lineTo(-2, top - 10);
  ctx.lineTo(4, top - 18);
  ctx.lineTo(1, top - 28);
  ctx.moveTo(-2, top - 10);
  ctx.lineTo(-10, top - 18);
  ctx.lineTo(-9, top - 24);
  ctx.moveTo(4, top - 18);
  ctx.lineTo(11, top - 22);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  circle(ctx, 1, top - 28, 2);
}
// The Dialwatch Helm: a dial sentry's bronze head hollowed out, rings round it, its sun-glass eye in the brow
function drawDialwatchHelm(ctx, w, h) {
  const by = -h * 0.62, rx = w * 0.56;
  ctx.fillStyle = '#b8823a';
  ctx.strokeStyle = '#6a4418';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 10);
  ctx.bezierCurveTo(-rx * 1.06, by - h * 0.52, rx * 1.06, by - h * 0.52, rx, by + 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#e8b85a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, by - h * 0.16, rx * 0.92, h * 0.08, 0, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = '#26305a';
  circle(ctx, rx * 0.4, by - h * 0.06, 6);
  ctx.fillStyle = '#ffe9a8';
  circle(ctx, rx * 0.4, by - h * 0.06, 3.6);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  circle(ctx, rx * 0.4 - 1, by - h * 0.06 - 1.4, 1.2);
}
// The Scarab Crown: a crown of the Sunroller's blue-black wing-case, edged gold, a pea-sized stone sun in front
function drawScarabCrown(ctx, w, h) {
  const by = -h * 0.66, rx = w * 0.54;
  ctx.fillStyle = '#1e2440';
  ctx.strokeStyle = '#d8a84a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx, by + 8);
  ctx.bezierCurveTo(-rx * 1.1, by - h * 0.5, -rx * 0.1, by - h * 0.62, 0, by - h * 0.42);
  ctx.bezierCurveTo(rx * 0.1, by - h * 0.62, rx * 1.1, by - h * 0.5, rx, by + 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(120,150,220,0.55)'; // the wing-case's sheen
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx * 0.6, by - h * 0.3);
  ctx.quadraticCurveTo(-rx * 0.3, by - h * 0.44, -rx * 0.1, by - h * 0.4);
  ctx.moveTo(rx * 0.6, by - h * 0.3);
  ctx.quadraticCurveTo(rx * 0.3, by - h * 0.44, rx * 0.1, by - h * 0.4);
  ctx.stroke();
  ctx.fillStyle = '#d8a84a';
  circle(ctx, 0, by - h * 0.04, 6.2);
  ctx.fillStyle = '#f4d68a';
  circle(ctx, 0, by - h * 0.04, 4);
  ctx.strokeStyle = '#9a7028';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 6.8, by - h * 0.04 + Math.sin(a) * 6.8);
    ctx.lineTo(Math.cos(a) * 9, by - h * 0.04 + Math.sin(a) * 9);
    ctx.stroke();
  }
}
export const DUNE_HELMETS = { drover_wrap: drawDroverWrap, fulgurite_crest: drawFulguriteCrest, dialwatch_helm: drawDialwatchHelm, scarab_crown: drawScarabCrown };
export { SAND, SAND_D, SAND_L, BRASS, BRASS_D, BRASS_L, INDIGO, INDIGO_D };
