// Docs: docs/ui/world-map.md
// The World map page of the Esc menu: a hand-drawn chart of the Glass Sea, as a teaser of where the
// story is heading (story/world/geography.md, story/world/atlas.md). It shows the islands, the sea
// routes and fog where the charts run out, plus a bouncing "you are here" slime. Tapping an island that has
// one (ISLAND_MAPS) opens its own map: its places as a graph, shipped ones solid, blocked ones dashed
// (src/shared/branches.js). It sends nothing to the server.
import { FJORD, FORGEHOLD, HIGHLANDS, GLACIER, SKERRIES, GROTTO, HEIGHTS, BLUEHALLS, QBRIDGE, OLDICE, LONGSTAIR, BLACKSANDS, ASHWOOD, COAST, TUBES, BRIMSTONE, FOUNDRY, RIM, CALDERA, CITADEL, DENS, UNDERFLUES, LONGFLUE } from './shared/rpg.js';
import { roomDef } from './shared/sim.js';
import { ISLAND_MAPS, nodeAt, shipped } from './shared/branches.js';
import { TOUCH } from './touch.js';

const MW = 720, MH = 380; // the chart's size in canvas pixels (× --s on screen, see style.css)
const FONT = "Fredoka, 'Trebuchet MS', sans-serif";
const INK = '#5b4a6b';

// Which island a room is on. Everything not listed (the village, its buildings, houses, the Wildwood) is home.
// Aboard a crossing you're out on its route: 'sea' (the ferry's) or 'straits' (the Lodestar's).
const ISLAND_OF_STAGE = { [FORGEHOLD]: 'ember', [BLACKSANDS]: 'ember', [ASHWOOD]: 'ember', [COAST]: 'ember', [TUBES]: 'ember', [BRIMSTONE]: 'ember', [FOUNDRY]: 'ember', [RIM]: 'ember', [UNDERFLUES]: 'ember', [LONGFLUE]: 'ember', [HIGHLANDS]: 'frost', [FJORD]: 'frost', [GLACIER]: 'frost', [SKERRIES]: 'frost', [GROTTO]: 'frost', [HEIGHTS]: 'frost', [BLUEHALLS]: 'frost', [QBRIDGE]: 'frost', [OLDICE]: 'frost', [LONGSTAIR]: 'frost', [CALDERA]: 'ember', [CITADEL]: 'citadel' };
export function islandOf(room) {
  if (roomDef(room)?.crossing) return roomDef(room).crossing.route === 'steam' ? 'straits' : 'sea';
  const den = DENS.find((d) => d.room === room);
  return ISLAND_OF_STAGE[den ? den.from : room] ?? 'green';
}

// Where each island sits on the chart, and where its "you are here" pin goes
const ISLANDS = {
  green: { x: 150, y: 205, name: 'Greenhollow', sub: 'Slimeville · the Wildwood' },
  frost: { x: 395, y: 92, name: 'Frostpeak', sub: 'Icefang Hamlet · the far north' },
  ember: { x: 400, y: 296, name: 'Emberdeep', sub: 'Forgehold · the far south' },
  citadel: { x: 545, y: 150, name: 'Aether Citadel', sub: 'in the sky' },
};
const PINS = { ...ISLANDS, sea: { x: 205, y: 150 }, straits: { x: 334, y: 214 } }; // (out on the ferry's route, out in the Steam Straits)
// Where to tap for an island's own map (on the chart), and the way back from it
const TAP = { green: { x: 150, y: 215, rx: 85, ry: 85 }, frost: { x: 395, y: 112, rx: 72, ry: 64 }, ember: { x: 400, y: 300, rx: 72, ry: 56 } };
const BACK = { x: 16, y: 16, w: 132, h: 30 };

// Small seeded random, so the coastlines and waves are the same every time the page opens
function seeded(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// A soft, rounded island outline: wobbly radii joined by curves through their midpoints
function blob(ctx, cx, cy, rx, ry, seed, n = 11) {
  const r = seeded(seed);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 0.78 + r() * 0.3;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  ctx.beginPath();
  const mid = (i) => {
    const p = pts[i % n], q = pts[(i + 1) % n];
    return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  };
  const m0 = mid(n - 1);
  ctx.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const m = mid(i);
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
  }
  ctx.closePath();
}

function label(ctx, x, y, s, size, color = INK, weight = 700) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(255, 250, 243, 0.9)';
  ctx.strokeText(s, x, y);
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

// An island: a pale shallows ring, the land, a darker rim on its southern edge for depth
function island(ctx, cx, cy, rx, ry, seed, land, rim) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  blob(ctx, cx, cy + 2, rx + 9, ry + 8, seed);
  ctx.fill();
  ctx.fillStyle = rim;
  blob(ctx, cx, cy + 4, rx, ry, seed);
  ctx.fill();
  ctx.fillStyle = land;
  blob(ctx, cx, cy, rx, ry, seed);
  ctx.fill();
}

function fog(ctx, cx, cy, w, t, tint) {
  ctx.save();
  for (let i = 0; i < 6; i++) {
    const a = t * 0.15 + i * 1.7;
    ctx.fillStyle = tint;
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(a) * w * 0.35, cy + Math.sin(a * 1.3) * w * 0.18, w * 0.42, w * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function route(ctx, pts, dash = [7, 7]) {
  ctx.save();
  ctx.setLineDash(dash);
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255, 143, 177, 0.85)';
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  ctx.bezierCurveTo(pts[2], pts[3], pts[4], pts[5], pts[6], pts[7]);
  ctx.stroke();
  ctx.restore();
}

function drawChart(ctx, t, here, hue) {
  // the sea, inside a cream chart border
  ctx.fillStyle = '#fffaf3';
  ctx.beginPath();
  ctx.roundRect(0, 0, MW, MH, 22);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(8, 8, MW - 16, MH - 16, 16);
  ctx.clip();
  const sea = ctx.createLinearGradient(0, 0, 0, MH);
  sea.addColorStop(0, '#b9dcee'); // colder up north
  sea.addColorStop(0.55, '#a8d8e6');
  sea.addColorStop(1, '#b4e0d4'); // warm green water in the south
  ctx.fillStyle = sea;
  ctx.fillRect(0, 0, MW, MH);

  // little wave marks, drifting very slowly (the Drift)
  const wr = seeded(7);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 46; i++) {
    const x = (wr() * MW + t * 3) % MW, y = wr() * MH, s = 5 + wr() * 4;
    ctx.beginPath();
    ctx.arc(x - s, y, s, Math.PI * 1.15, Math.PI * 1.85);
    ctx.arc(x + s, y, s, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }

  // the Maelstrom, a slow swirl at the centre where Pangelea's heart sank
  ctx.save();
  ctx.translate(470, 205);
  ctx.rotate(-t * 0.25);
  ctx.strokeStyle = 'rgba(91, 74, 107, 0.22)';
  ctx.lineWidth = 2;
  for (let arm = 0; arm < 3; arm++) {
    ctx.beginPath();
    for (let k = 0; k <= 40; k++) {
      const a = arm * ((Math.PI * 2) / 3) + k * 0.16, rad = 4 + k * 0.95;
      const px = Math.cos(a) * rad, py = Math.sin(a) * rad * 0.6;
      k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();

  // routes: the ferry north, the Steam Straits south, the balloon climb
  route(ctx, [190, 172, 230, 110, 300, 90, 350, 92]);
  route(ctx, [385, 128, 330, 190, 330, 240, 370, 274]);
  route(ctx, [445, 280, 500, 262, 525, 215, 540, 182], [3, 6]);
  label(ctx, 262, 116, 'the ferry', 12, '#e46f95', 600);
  label(ctx, 318, 228, 'Steam Straits', 12, '#e46f95', 600);
  label(ctx, 530, 250, 'by balloon', 12, '#e46f95', 600);

  // uncharted: fog where the charts give out
  fog(ctx, 650, 230, 90, t, 'rgba(225, 214, 240, 0.4)'); // east: ghost lights in a marsh
  fog(ctx, 118, 335, 80, t + 3, 'rgba(244, 228, 196, 0.45)'); // south-west: a sandy smudge
  fog(ctx, 655, 60, 70, t + 6, 'rgba(240, 244, 250, 0.45)'); // far north-east: open water
  for (let i = 0; i < 4; i++) { // lights flicker inside the eastern fog
    const a = t * 0.6 + i * 1.6;
    ctx.fillStyle = `rgba(255, 228, 160, ${0.45 + 0.35 * Math.sin(a * 2)})`;
    ctx.beginPath();
    ctx.arc(630 + i * 15 + Math.sin(a) * 4, 225 + Math.cos(a * 1.4) * 10, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  label(ctx, 650, 236, '?', 26, 'rgba(91, 74, 107, 0.55)');
  label(ctx, 118, 342, '?', 24, 'rgba(91, 74, 107, 0.55)');
  label(ctx, 655, 66, '?', 20, 'rgba(91, 74, 107, 0.5)');
  label(ctx, 650, 262, 'uncharted', 11, 'rgba(91, 74, 107, 0.6)', 600);

  // a scatter of islets nobody has named
  for (const [x, y, r] of [[250, 300, 7], [590, 320, 6], [300, 40, 5], [80, 90, 6], [520, 60, 4], [690, 330, 5]]) {
    island(ctx, x, y, r, r * 0.7, x * 7 + y, '#cfe6b8', '#a9c992');
  }

  // Greenhollow: green and sheltered; the apple tree and the village
  island(ctx, 150, 205, 70, 46, 11, '#a6dc8f', '#7fbf73');
  ctx.fillStyle = '#7fbf73';
  for (const [x, y] of [[176, 196], [190, 208], [184, 186], [200, 194]]) { // the Wildwood
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#ffb0c4';
  for (const [x, y] of [[120, 210], [130, 216], [112, 218]]) ctx.fillRect(x - 3, y - 3, 6, 6); // roofs
  ctx.fillStyle = '#6aa960';
  ctx.beginPath();
  ctx.arc(140, 200, 8, 0, Math.PI * 2); // the old apple tree
  ctx.fill();
  ctx.fillStyle = '#ff7a8f';
  for (const [x, y] of [[137, 197], [143, 202], [141, 195]]) ctx.fillRect(x, y, 2.5, 2.5);
  ctx.fillStyle = `rgba(190, 236, 255, ${0.75 + 0.25 * Math.sin(t * 2)})`; // the Rebirth Pool, by the tree
  ctx.beginPath();
  ctx.ellipse(152, 208, 3.6, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f4ecdc'; // the white east cliffs, where the Wildwood ends
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.ellipse(150, 205, 68, 44, 0, -0.45, 0.35);
  ctx.stroke();

  // Frostpeak: snowy, with peaks and the aurora overhead
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = i === 1 ? 'rgba(255, 170, 210, 0.45)' : 'rgba(140, 230, 190, 0.5)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let k = 0; k <= 20; k++) {
      const x = 330 + k * 7, y = 34 + i * 7 + Math.sin(k * 0.5 + t * 0.8 + i) * 5;
      k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  island(ctx, 395, 92, 62, 34, 23, '#eef6fb', '#c6dbea');
  ctx.fillStyle = '#d3e4f0';
  for (const [x, h] of [[372, 22], [395, 30], [418, 20]]) {
    ctx.beginPath();
    ctx.moveTo(x - 13, 96);
    ctx.quadraticCurveTo(x, 96 - h * 1.6, x + 13, 96);
    ctx.fill();
  }

  // Icefang Hamlet, where the ferry comes in: turf huts at the head of the fjord, its fire lit, and the
  // Queen's ice bridge running out from the coast, cracked (docs/places/fjord.md)
  ctx.fillStyle = '#7c9a7e';
  for (const [x, y] of [[352, 104], [360, 108], [345, 110]]) {
    ctx.beginPath();
    ctx.arc(x, y, 3.6, Math.PI, 0);
    ctx.fill();
  }
  ctx.fillStyle = `rgba(255, 200, 120, ${0.6 + 0.3 * Math.sin(t * 5)})`;
  ctx.beginPath();
  ctx.arc(354, 111, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(214, 236, 255, 0.95)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(440, 112);
  ctx.quadraticCurveTo(470, 116, 486, 128);
  ctx.moveTo(492, 132);
  ctx.quadraticCurveTo(504, 142, 510, 154);
  ctx.stroke();

  // Emberdeep: dark sand, a volcano, its smoke column (drawn 22px higher than its coordinates)
  ctx.save();
  ctx.translate(0, -22);
  island(ctx, 400, 318, 66, 38, 37, '#c9a4a8', '#a9838b');
  ctx.fillStyle = '#9b7680';
  ctx.beginPath();
  ctx.moveTo(378, 322);
  ctx.quadraticCurveTo(400, 278, 422, 322);
  ctx.fill();
  ctx.fillStyle = '#ff9a6a';
  ctx.beginPath();
  ctx.ellipse(400, 297, 5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 5; i++) {
    const k = (t * 0.3 + i / 5) % 1;
    ctx.fillStyle = `rgba(150, 130, 140, ${0.45 * (1 - k)})`;
    ctx.beginPath();
    ctx.arc(400 + Math.sin(k * 4 + i) * 6 + k * 14, 292 - k * 60, 5 + k * 9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // the Aether Citadel, floating above the Maelstrom, with its shadow on the sea
  const bob = Math.sin(t * 0.9) * 3;
  ctx.fillStyle = 'rgba(91, 74, 107, 0.12)';
  ctx.beginPath();
  ctx.ellipse(530, 196, 34, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(0, bob);
  ctx.fillStyle = '#d9cdee';
  ctx.beginPath();
  ctx.moveTo(515, 152);
  ctx.quadraticCurveTo(545, 186, 575, 152);
  ctx.fill();
  island(ctx, 545, 150, 32, 12, 51, '#efe7fa', '#d1c4ea');
  ctx.fillStyle = '#d1c4ea';
  ctx.beginPath();
  ctx.roundRect(541, 112, 8, 36, 3); // the spire
  ctx.fill();
  ctx.fillStyle = '#ffe3a3';
  ctx.beginPath();
  ctx.arc(545, 112, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // names
  for (const [key, isl] of Object.entries(ISLANDS)) {
    const dy = key === 'frost' ? 48 : key === 'ember' ? 50 : key === 'citadel' ? 34 + bob : 64;
    label(ctx, isl.x, isl.y + dy, isl.name, 16);
    label(ctx, isl.x, isl.y + dy + 14, isl.sub, 11, 'rgba(91, 74, 107, 0.75)', 600);
    // (Emberdeep sits near the chart's bottom edge, so its hint goes beside it)
    const [hx, hy] = key === 'ember' ? [isl.x + 122, isl.y + 26] : [isl.x, isl.y + dy + 29];
    if (ISLAND_MAPS[key]) label(ctx, hx, hy, TOUCH ? 'tap for its map' : 'click for its map', 11, '#e46f95', 600);
  }
  label(ctx, 470, 236, 'the Maelstrom', 11, 'rgba(91, 74, 107, 0.6)', 600);

  // compass, top left
  ctx.save();
  ctx.translate(46, 52);
  ctx.fillStyle = '#ff8fb1';
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.lineTo(6, 0);
  ctx.lineTo(0, 20);
  ctx.lineTo(-6, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fffaf3';
  ctx.beginPath();
  ctx.moveTo(0, 20);
  ctx.lineTo(6, 0);
  ctx.lineTo(-6, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  label(ctx, 46, 26, 'N', 13);

  // you are here: a little bouncing slime in your colour
  const pin = PINS[here];
  if (pin) drawPin(ctx, pin.x, pin.y, t, hue);
  ctx.restore();
}

// A little bouncing slime in your colour, standing at (x, y)
// side: put the label beside the slime, not over it (when another card sits just above: island maps)
function drawPin(ctx, x, y, t, hue, side = false) {
  const hop = Math.abs(Math.sin(t * 3)) * 8;
  const px = x, py = y - 18 - hop;
  ctx.fillStyle = 'rgba(91, 74, 107, 0.18)';
  ctx.beginPath();
  ctx.ellipse(px, y - 4, 10 - hop * 0.4, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `hsl(${hue}, 80%, 72%)`;
  ctx.strokeStyle = `hsl(${hue}, 45%, 45%)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px - 11, py + 8);
  ctx.quadraticCurveTo(px - 12, py - 10, px, py - 10);
  ctx.quadraticCurveTo(px + 12, py - 10, px + 11, py + 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.fillRect(px - 5, py - 2, 2.5, 4);
  ctx.fillRect(px + 2.5, py - 2, 2.5, 4);
  if (!side) return label(ctx, px, py - 16, 'you are here', 11, '#e46f95');
  ctx.font = `700 11px ${FONT}`;
  label(ctx, px + 18 + ctx.measureText('you are here').width / 2, py + 2, 'you are here', 11, '#e46f95');
}

// An island's own map: its places as cards joined by paths (story/world/island-depth.md). Shipped places
// are solid, with their levels; ones not open yet are dashed and say what's in the way, with no spoilers
// past their names. here: the node you're in (or null).
const CARD_W = 108, CARD_H = 40;
// each island's own map: its sea, land, rim and how an open place's card is edged
const LOOK = {
  green: { sea: ['#b9dcee', '#b4e0d4'], land: '#c8eab3', rim: '#a6d48f', edge: '#7fbf73', ok: '#5f9a52', path: '#c99b6b' },
  frost: { sea: ['#aec8de', '#a4c2d6'], land: '#eef6fb', rim: '#c6dbea', edge: '#7fa8d4', ok: '#4e7ea8', path: '#a8b8c8' },
  ember: { sea: ['#b8d4c4', '#a8ccb8'], land: '#e2cfc8', rim: '#c4a8a4', edge: '#c07a6a', ok: '#a0503e', path: '#9a7a70' },
};
function drawIslandMap(ctx, t, key, here, hue) {
  const nodes = ISLAND_MAPS[key], byId = Object.fromEntries(nodes.map((n) => [n.id, n])), lk = LOOK[key] ?? LOOK.green;
  ctx.fillStyle = '#fffaf3';
  ctx.beginPath();
  ctx.roundRect(0, 0, MW, MH, 22);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(8, 8, MW - 16, MH - 16, 16);
  ctx.clip();
  const sea = ctx.createLinearGradient(0, 0, 0, MH);
  sea.addColorStop(0, lk.sea[0]);
  sea.addColorStop(1, lk.sea[1]);
  ctx.fillStyle = sea;
  ctx.fillRect(0, 0, MW, MH);
  // the island itself, filling the page
  island(ctx, 370, 200, 335, 185, 11, lk.land, lk.rim);
  ctx.restore();
  label(ctx, MW / 2, 36, ISLANDS[key].name, 20);
  // the paths: a trodden track between open places, dashed into the ones that aren't
  for (const n of nodes) {
    const p = byId[n.from];
    if (!p) continue;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = shipped(n) ? 5 : 3;
    ctx.strokeStyle = shipped(n) ? lk.path : 'rgba(143, 98, 64, 0.45)';
    if (!shipped(n)) ctx.setLineDash([6, 7]);
    ctx.beginPath();
    ctx.moveTo(p.at[0], p.at[1]);
    ctx.lineTo(n.at[0], n.at[1]);
    ctx.stroke();
    ctx.restore();
  }
  for (const n of nodes) {
    const open = shipped(n), [x, y] = n.at, l = x - CARD_W / 2, top = y - CARD_H / 2;
    ctx.save();
    ctx.fillStyle = open ? (n.town ? '#ffe3ec' : '#fffaf3') : 'rgba(255, 250, 243, 0.55)';
    ctx.strokeStyle = !open ? 'rgba(91, 74, 107, 0.4)' : n.town ? '#ff8fb1' : lk.edge;
    ctx.lineWidth = open ? 2.5 : 2;
    if (!open) ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.roundRect(l, top, CARD_W, CARD_H, 12);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    const ink = open ? INK : 'rgba(91, 74, 107, 0.6)';
    label(ctx, x, y - (n.band || !open ? 2 : -4), n.name, 12, ink);
    const sub = open ? (n.band ? `Lv ${n.band}` : n.town ? 'town' : '') : `${n.band ? `Lv ${n.band} · ` : ''}${n.block}`;
    if (sub) label(ctx, x, y + 13, sub, 10, n.hard ? '#d0486a' : open ? lk.ok : 'rgba(91, 74, 107, 0.6)', 600);
    if (n.hard) label(ctx, l + CARD_W - 8, top + 12, '!', 13, '#d0486a');
  }
  // a key, bottom right
  label(ctx, MW - 92, MH - 22, 'dashed: not open yet', 11, 'rgba(91, 74, 107, 0.65)', 600);
  // back to the chart
  ctx.fillStyle = '#ff8fb1';
  ctx.beginPath();
  ctx.roundRect(BACK.x, BACK.y, BACK.w, BACK.h, 15);
  ctx.fill();
  ctx.font = `700 13px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('‹ the Glass Sea', BACK.x + BACK.w / 2, BACK.y + 20);
  if (here) {
    // (the label goes beside the pin when a card sits right above, or the map's top edge does: the Aurora Heights)
    const crowded = here.at[1] < 90 || nodes.some((n) => n !== here && Math.abs(n.at[0] - here.at[0]) < CARD_W && here.at[1] - n.at[1] > 0 && here.at[1] - n.at[1] < CARD_H + 50);
    drawPin(ctx, here.at[0], here.at[1] - CARD_H / 2 + 4, t, hue, crowded);
  }
}

export class WorldMap {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = MW * 2; // drawn at 2× so it stays crisp when the menu is scaled up
    this.canvas.height = MH * 2;
    this.raf = 0;
  }

  // here: the room you're in (and x in it); hue: your slime's colour. Opens on the chart.
  show(room, hue, x = 0) {
    this.hide();
    const here = islandOf(room);
    const node = !ISLAND_MAPS[here] ? null : nodeAt(room, x) ?? (here === 'green' ? ISLAND_MAPS.green[1] : null); // (the village's buildings and houses: Slimeville)
    this.view = null; // null: the chart · an ISLAND_MAPS key: that island's map
    const t0 = performance.now();
    const frame = (now) => {
      this.ctx.setTransform(2, 0, 0, 2, 0, 0);
      this.ctx.clearRect(0, 0, MW, MH);
      if (this.view) drawIslandMap(this.ctx, (now - t0) / 1000, this.view, here === this.view ? node : null, hue);
      else drawChart(this.ctx, (now - t0) / 1000, here, hue);
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
    // tap an island for its map, tap the back pill to return (pointer events: mouse and touch alike)
    const at = (e) => {
      const r = this.canvas.getBoundingClientRect();
      return [((e.clientX - r.left) / r.width) * MW, ((e.clientY - r.top) / r.height) * MH];
    };
    const hit = ([x, y]) => {
      if (this.view) return x >= BACK.x && x <= BACK.x + BACK.w && y >= BACK.y && y <= BACK.y + BACK.h ? 'back' : null;
      return Object.keys(TAP).find((k) => ((x - TAP[k].x) / TAP[k].rx) ** 2 + ((y - TAP[k].y) / TAP[k].ry) ** 2 <= 1) ?? null;
    };
    this.canvas.onpointerdown = (e) => {
      const h = hit(at(e));
      if (!h) return;
      e.preventDefault();
      this.view = h === 'back' ? null : h;
    };
    this.canvas.onpointermove = (e) => (this.canvas.style.cursor = hit(at(e)) ? 'pointer' : '');
  }

  hide() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.canvas.onpointerdown = this.canvas.onpointermove = null;
  }
}
