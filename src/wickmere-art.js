// Docs: docs/places/fen.md, docs/art.md
// Lantern Fen's people and Wickmere's gear (atlas Phase 8), the art that isn't the town itself (src/wickmere.js):
// - the fen folk look (`folk: 'fen'`, src/slime.js): pale, translucent violet-grey jelly with a soft light deep inside,
//   as if each of them carries a small lantern (FEN_PALETTE, drawFenFolk);
// - what Wickmere's people wear (drawFenDress, for their NPCS `accessory`): Skipper Netta's 'eelskipper', Wren's
//   'lamplady', Ferryman Hob's 'ferryman', Sedge's 'reedweaver';
// - Sedge's gear for players: the Reedcutter (FEN_SWORDS) and the Reed Hood (FEN_HELMETS), through field.js.
// Slime space: the body sits on y = 0 and reaches up to -h, facing right; fx is the face's centre x.
import { TAU, circle, ellipse } from './util.js';

const REED = '#b8a874', REED_D = '#8a7a50', REED_L = '#d8cc9a';
const DUSK = '#5e4e84', DUSK_D = '#3e3458';
const LAMP = '#ffe2a8', LAMP_V = '#e4d4ff';
const BOGIRON = '#3e3a44', BOGIRON_L = '#6a6474';

// ——— the fen folk look ———
export const FEN_PALETTE = (hue) => ({
  top: `hsl(${hue} 30% 86% / 0.86)`,
  bottom: `hsl(${hue} 22% 64% / 0.9)`,
  line: `hsl(${hue} 24% 44%)`,
  cheek: `hsl(${hue} 50% 82%)`,
});
// inside the body (clipped): a soft warm light deep down, like a lantern seen through mist, and a faint mist line
export function drawFenFolk(ctx, w, h, t) {
  const k = 0.75 + 0.25 * Math.sin(t * 1.4);
  const g = ctx.createRadialGradient(0, -h * 0.28, 2, 0, -h * 0.28, w * 0.6);
  g.addColorStop(0, `rgba(255,226,170,${0.42 * k})`);
  g.addColorStop(0.5, `rgba(240,214,255,${0.16 * k})`);
  g.addColorStop(1, 'rgba(240,214,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-w, -h * 1.2, w * 2, h * 1.3);
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i < 2; i++) {
    const y = -h * (0.5 + i * 0.18);
    ctx.moveTo(-w * 0.55, y);
    for (let x = -w * 0.55; x <= w * 0.55; x += 5) ctx.lineTo(x, y + Math.sin(x * 0.18 + t * 1.2 + i * 2) * 1.6);
  }
  ctx.stroke();
}

// A small lantern on a short wire: (x, y) is the top of the wire
function handLantern(ctx, x, y, t, violet = false) {
  ctx.strokeStyle = DUSK_D;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + 6);
  ctx.stroke();
  ctx.fillStyle = violet ? `rgba(214,190,255,${0.24 + 0.1 * Math.sin(t * 3)})` : `rgba(255,220,150,${0.24 + 0.1 * Math.sin(t * 3)})`;
  circle(ctx, x, y + 14, 13);
  ctx.fillStyle = DUSK_D;
  ctx.beginPath();
  ctx.roundRect(x - 5.5, y + 6, 11, 15, 3);
  ctx.fill();
  ctx.fillStyle = violet ? LAMP_V : LAMP;
  ctx.beginPath();
  ctx.roundRect(x - 3.6, y + 8.5, 7.2, 10, 2);
  ctx.fill();
}

// A deep hood with a rim (Wren's grey, Hob's oiled brown): over the top of the head, down to the shoulders
function hood(ctx, w, h, fill, line, rim) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.6, -h * 0.22);
  ctx.bezierCurveTo(-w * 0.68, -h * 1.12, w * 0.68, -h * 1.12, w * 0.6, -h * 0.22);
  ctx.quadraticCurveTo(w * 0.42, -h * 0.64, 0, -h * 0.7);
  ctx.quadraticCurveTo(-w * 0.42, -h * 0.64, -w * 0.6, -h * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.66, w * 0.44, h * 0.11, 0, Math.PI, 0);
  ctx.fill();
}

// ——— Wickmere's people ———
export function drawFenDress(ctx, kind, w, h, fx, t) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (kind === 'eelskipper') {
    // Skipper Netta: an oilskin smock the colour of peat, a knitted cap with a violet bobble, an eel-hook at her belt
    ctx.fillStyle = '#4e4636';
    ctx.strokeStyle = '#2e2a20';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-w * 0.46, -h * 0.4);
    ctx.quadraticCurveTo(0, -h * 0.48, w * 0.46, -h * 0.4);
    ctx.lineTo(w * 0.52, -2);
    ctx.lineTo(-w * 0.52, -2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; // the oilskin's shine
    ctx.fillRect(-w * 0.3, -h * 0.36, w * 0.1, h * 0.3);
    ctx.strokeStyle = '#8a8a90'; // the eel-hook
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w * 0.34, -h * 0.2);
    ctx.lineTo(-w * 0.34, -h * 0.04);
    ctx.arc(-w * 0.28, -h * 0.04, w * 0.06, Math.PI, 0, true);
    ctx.stroke();
    const by = -h * 0.84; // the knitted cap, ribbed, and its bobble
    ctx.fillStyle = '#6a5e86';
    ctx.strokeStyle = '#3e3458';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-w * 0.44, by + 8);
    ctx.bezierCurveTo(-w * 0.46, by - h * 0.34, w * 0.46, by - h * 0.34, w * 0.44, by + 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(62,52,88,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -w * 0.36; x <= w * 0.36; x += 5) {
      ctx.moveTo(x, by + 6);
      ctx.lineTo(x, by + 1);
    }
    ctx.stroke();
    ctx.fillStyle = '#b89ae0';
    circle(ctx, 0, by - h * 0.25, 5);
  } else if (kind === 'lamplady') {
    // Wren the Lamplady: a soft grey hood and shawl, a ring of wick-trimmers at her belt, a lantern held out, warm
    hood(ctx, w, h, '#8a8496', '#5a5468', '#a8a2b4');
    ctx.fillStyle = '#9a94a8'; // the shawl's knot
    ctx.beginPath();
    ctx.ellipse(fx - 2, -h * 0.24, 7, 5, 0.3, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#c8c0a8'; // wick-trimmers on a ring
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(-w * 0.3, -h * 0.12, 4, 0, TAU);
    ctx.moveTo(-w * 0.32, -h * 0.08);
    ctx.lineTo(-w * 0.36, h * 0.0);
    ctx.moveTo(-w * 0.27, -h * 0.08);
    ctx.lineTo(-w * 0.25, h * 0.0);
    ctx.stroke();
    handLantern(ctx, fx + w * 0.62, -h * 0.5 + Math.sin(t * 1.4) * 1.5, t);
  } else if (kind === 'ferryman') {
    // Ferryman Hob: an oiled brown hood, a long grey beard of a bib (it's his scarf), and his punt pole over a shoulder
    ctx.strokeStyle = '#6a5038';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-w * 0.9, h * 0.1);
    ctx.lineTo(w * 0.5, -h * 1.5);
    ctx.stroke();
    ctx.strokeStyle = '#8a6a48';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-w * 0.9, h * 0.1);
    ctx.lineTo(w * 0.5, -h * 1.5);
    ctx.stroke();
    hood(ctx, w, h, '#6a5040', '#3e2e22', '#8a6c54');
    ctx.fillStyle = '#c8c4cc'; // the scarf, wound thick under his chin
    ctx.beginPath();
    ctx.moveTo(fx - w * 0.3, -h * 0.3);
    ctx.quadraticCurveTo(fx, -h * 0.2, fx + w * 0.3, -h * 0.3);
    ctx.quadraticCurveTo(fx + w * 0.2, -h * 0.02, fx, h * 0.02);
    ctx.quadraticCurveTo(fx - w * 0.2, -h * 0.02, fx - w * 0.3, -h * 0.3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,114,130,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = -2; i <= 2; i++) {
      ctx.moveTo(fx + i * 5, -h * 0.24);
      ctx.lineTo(fx + i * 4, -h * 0.04);
    }
    ctx.stroke();
  } else if (kind === 'reedweaver') {
    // Sedge: a reed cape woven in bands, a reed knife at her belt, a half-woven hood of seed-heads pushed back, and a
    // little lantern on a cord round her neck that she keeps lit "for practice"
    ctx.fillStyle = REED;
    ctx.strokeStyle = REED_D;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, -h * 0.42);
    ctx.quadraticCurveTo(0, -h * 0.5, w * 0.5, -h * 0.42);
    ctx.lineTo(w * 0.56, -h * 0.12);
    ctx.lineTo(-w * 0.56, -h * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = REED_D;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -w * 0.5; x <= w * 0.5; x += 4) {
      ctx.moveTo(x, -h * 0.42);
      ctx.lineTo(x * 1.1, -h * 0.12);
    }
    ctx.stroke();
    ctx.fillStyle = REED_L; // the fringe
    for (let x = -w * 0.52; x <= w * 0.52; x += 6) ellipse(ctx, x, -h * 0.1, 2, 4);
    const by = -h * 0.9; // the seed-head crown pushed back
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI * 0.9 + i * 0.22;
      const x0 = Math.cos(a) * w * 0.32 - w * 0.1, y0 = by + Math.sin(a) * h * 0.1;
      ctx.strokeStyle = REED_D;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0 + Math.cos(a) * 9, y0 + Math.sin(a) * 9 - 3);
      ctx.stroke();
      ctx.fillStyle = '#9a7a4a';
      ellipse(ctx, x0 + Math.cos(a) * 11, y0 + Math.sin(a) * 11 - 4, 2.4, 4, a + Math.PI / 2);
    }
    ctx.strokeStyle = '#5a4a3a'; // the lantern on its cord
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(fx - 8, -h * 0.4);
    ctx.lineTo(fx, -h * 0.26);
    ctx.lineTo(fx + 8, -h * 0.4);
    ctx.stroke();
    ctx.fillStyle = `rgba(255,220,150,${0.3 + 0.12 * Math.sin(t * 2.6)})`;
    circle(ctx, fx, -h * 0.2, 8);
    ctx.fillStyle = DUSK_D;
    ctx.beginPath();
    ctx.roundRect(fx - 3.5, -h * 0.26, 7, 9, 2);
    ctx.fill();
    ctx.fillStyle = LAMP;
    ctx.fillRect(fx - 2, -h * 0.24, 4, 5);
  }
  ctx.restore();
}

// ——— Sedge's gear ———
// The Reedcutter: a long, thin blade of black bog-iron with a hook at the tip, on a reed-bound haft
function drawReedcutter(ctx, L, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = 'rgba(214,190,255,0.8)';
    ctx.shadowBlur = 10;
  }
  ctx.fillStyle = BOGIRON;
  ctx.beginPath();
  ctx.moveTo(-3, -L * 0.3);
  ctx.lineTo(-2.4, -L * 0.94);
  ctx.quadraticCurveTo(4, -L * 1.04, 9, -L * 0.94); // the hook
  ctx.quadraticCurveTo(4, -L * 0.94, 3.2, -L * 0.86);
  ctx.lineTo(3, -L * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = BOGIRON_L; // the pitted edge
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(2.2, -L * 0.32);
  ctx.lineTo(1.8, -L * 0.86);
  ctx.stroke();
  ctx.fillStyle = 'rgba(214,190,255,0.5)';
  for (const y of [0.45, 0.62, 0.78]) circle(ctx, -0.6, -L * y, 0.9);
  ctx.fillStyle = REED_D; // the guard, a plain bar
  ctx.fillRect(-7, -L * 0.31, 14, 3);
  ctx.fillStyle = REED; // the haft, bound in split reed
  ctx.beginPath();
  ctx.roundRect(-2.6, -L * 0.29, 5.2, L * 0.29, 2);
  ctx.fill();
  ctx.strokeStyle = REED_D;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = -L * 0.27; y < 0; y += 3) {
    ctx.moveTo(-2.6, y);
    ctx.lineTo(2.6, y + 1.5);
  }
  ctx.stroke();
  ctx.restore();
}
export const FEN_SWORDS = { reedcutter: drawReedcutter };
export const FEN_SWORD_LEN = { reedcutter: 60 };

// The Reed Hood: split reed woven tight, a fringe of seed-heads round the rim
function drawReedHood(ctx, w, h) {
  const by = -h * 0.64, rx = w * 0.56;
  ctx.fillStyle = REED;
  ctx.strokeStyle = REED_D;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-rx * 1.06, by + 8);
  ctx.bezierCurveTo(-rx * 1.12, by - h * 0.62, rx * 1.12, by - h * 0.62, rx * 1.06, by + 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(138,122,80,0.7)'; // the weave
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < 4; i++) {
    const y = by + 6 - i * h * 0.12;
    ctx.moveTo(-rx * (1 - i * 0.12), y);
    ctx.quadraticCurveTo(0, y - 4, rx * (1 - i * 0.12), y);
  }
  for (let x = -rx * 0.8; x <= rx * 0.8; x += rx * 0.27) {
    ctx.moveTo(x, by + 6);
    ctx.lineTo(x * 0.5, by - h * 0.4);
  }
  ctx.stroke();
  ctx.fillStyle = '#9a7a4a'; // seed-heads round the rim
  for (let x = -rx; x <= rx; x += rx * 0.25) ellipse(ctx, x, by + 9, 2.4, 4.4);
  ctx.fillStyle = REED_L;
  ellipse(ctx, 0, by - h * 0.46, 4, 2.4);
}
export const FEN_HELMETS = { reed_hood: drawReedHood };
