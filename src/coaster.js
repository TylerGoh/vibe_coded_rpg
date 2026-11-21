// Docs: docs/places/coaster.md
// The Gathering Line's client side (F2): its track, lattice legs and the four station sheds (drawCoaster, from drawFair
// in src/fair-art.js), a rider in their car tilting with the rail (drawRider, from the slime pass in src/main.js: the
// house swing's trick, the slime drawn under a rotation), and the "where to?" card (RideCard) whose buttons send the E
// press with the pick (sim.js PICK), so boarding still happens inside step().
import { circle, ellipse } from './util.js';
import { text } from './village.js';
import { TRACK, STATIONS, SEAT, RAIL, rideAt, rideTicks, rideCode, PICK_SHIFT } from './shared/coaster.js';
import { FAIR_GROUND, BIGTOP_X } from './shared/fair.js';

const G = FAIR_GROUND;
const PINK = '#ff6f91', PALE = '#ffd1dc', LEG = 'rgba(120,100,150,0.32)', GOLD = '#f2c14e', CREAM = '#fff4e6';
const CAR = ['#b8a8d6', '#9fe3ff', '#ffd36e', '#b9e58c', '#ff9fb8'];
const visible = (x0, x1, L, R) => x1 > L && x0 < R;
// where the rail goes into and out of the Big Top's roof (a dark hole in the canvas at each)
const HOLES = (() => {
  const out = [];
  for (let i = 0; i < TRACK.length; i++) {
    const a = TRACK[i][2] === 'T', b = TRACK[(i + 1) % TRACK.length][2] === 'T';
    if (a !== b) out.push(TRACK[a ? i : (i + 1) % TRACK.length]);
  }
  return out;
})();

// ——— the track, behind the slimes (after the Big Top, so the high return line runs in front of its roof) ———
export function drawCoaster(ctx, L, R, time) {
  // lattice legs down to the ground, every few samples, skipping the stretch inside the Big Top and the loop
  ctx.strokeStyle = LEG;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < TRACK.length; i += 38) {
    const [x, y, f] = TRACK[i];
    if (f === 'T' || x < L - 30 || x > R + 30 || y > G - 30) continue;
    if (Math.abs(x - 4630) < 80 && y < 230) continue; // (the loop stands on its own pair)
    if (Math.abs(x - BIGTOP_X) < 300 && y < 300) continue; // (the Big Top's roof is under it)
    ctx.moveTo(x, y + 4);
    ctx.lineTo(x, G);
    ctx.moveTo(x - 16, G);
    ctx.lineTo(x, Math.min(G - 10, y + 36));
    ctx.lineTo(x + 16, G);
  }
  ctx.moveTo(4580, 220);
  ctx.lineTo(4560, G - 190);
  ctx.moveTo(4680, 220);
  ctx.lineTo(4700, G - 190);
  ctx.stroke();
  // the rail: a pink band with a pale top edge, broken where it runs inside the Big Top
  for (const [w, c, dy] of [[6, PINK, 0], [2, PALE, -3]]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath();
    let pen = false;
    for (let i = 0; i <= TRACK.length; i += 2) {
      const [x, y, f] = TRACK[i % TRACK.length];
      const on = f !== 'T' && x > L - 40 && x < R + 40;
      if (!on) {
        pen = false;
        continue;
      }
      pen ? ctx.lineTo(x, y + dy) : ctx.moveTo(x, y + dy);
      pen = true;
    }
    ctx.stroke();
  }
  // the holes in the Big Top's roof
  ctx.fillStyle = 'rgba(60,30,60,0.75)';
  for (const [x, y] of HOLES) if (visible(x - 30, x + 30, L, R)) ellipse(ctx, x, y, 15, 19);
  for (let k = 0; k < STATIONS.length; k++) if (visible(STATIONS[k].x - 110, STATIONS[k].x + 110, L, R)) drawShed(ctx, STATIONS[k], k, time);
}

// A station: a striped shed over the platform, its name on the board, a parked car waiting
const NAMES = ['GATE PLAZA', 'MIDWAY', 'RIDE ROW', "PIER'S END"];
function drawShed(ctx, st, k, time) {
  const x = st.x, top = G - 150;
  ctx.fillStyle = 'rgba(40,30,50,0.14)';
  ellipse(ctx, x, G + 2, 90, 6);
  // the platform
  ctx.fillStyle = '#c99b6b';
  ctx.fillRect(x - 80, G - 8, 160, 8);
  // posts and a striped roof
  ctx.fillStyle = '#8a7fb0';
  for (const px of [x - 74, x + 74]) ctx.fillRect(px - 3, top + 14, 6, G - top - 14);
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? CREAM : PINK;
    ctx.beginPath();
    ctx.moveTo(x, top - 22);
    ctx.lineTo(x - 90 + (i * 180) / 8, top + 16);
    ctx.lineTo(x - 90 + ((i + 1) * 180) / 8, top + 16);
    ctx.closePath();
    ctx.fill();
  }
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = i % 2 ? PINK : GOLD;
    const vx = x - 90 + (i * 180) / 9, vw = 180 / 9;
    ctx.beginPath();
    ctx.moveTo(vx, top + 15);
    ctx.lineTo(vx + vw, top + 15);
    ctx.quadraticCurveTo(vx + vw / 2, top + 27, vx, top + 15);
    ctx.fill();
  }
  // its board
  ctx.fillStyle = CREAM;
  ctx.strokeStyle = PINK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 52, top + 32, 104, 30, 8);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'THE GATHERING LINE', x, top + 42, 8, '#a04a6a');
  text(ctx, NAMES[k], x, top + 54, 10, PINK);
  // bulbs along the eave
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = CAR[(i + Math.floor(time * 2) + k) % CAR.length];
    circle(ctx, x - 66 + i * 22, top + 30, 2.4);
  }
  // a car waiting at the platform
  drawCar(ctx, x + 40, RAIL, 0, CAR[k % CAR.length], true);
}

// A car on the rail at (x, y), tipped by a. back: the back half only (a rider is drawn between the halves)
function drawCar(ctx, x, y, a, color, empty = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.fillStyle = '#6a5a7a';
  for (const dx of [-14, 14]) circle(ctx, dx, 1, 4);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-24, -22, 48, 20, [10, 10, 6, 6]);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(-18, -18, 36, 4);
  if (empty) {
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, -22);
    ctx.quadraticCurveTo(0, -32, 10, -22);
    ctx.stroke();
  }
  ctx.restore();
}
// the car's front: its side panel over the rider's lower half, and the lap bar
function drawCarFront(ctx, x, y, a, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-26, -16, 52, 15, [4, 4, 7, 7]);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.fillRect(-26, -6, 52, 5);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-12, -16);
  ctx.quadraticCurveTo(0, -26, 12, -16);
  ctx.stroke();
  ctx.fillStyle = '#6a5a7a';
  for (const dx of [-15, 15]) circle(ctx, dx, 1, 4.5);
  ctx.restore();
}

// A slime riding: rd / rc from its state (yours predicted, others' from snapshots). draw: the slime's own draw. Returns
// false when it's out of sight inside the Big Top (its name tag stays off too)
export function drawRider(ctx, s, rd, rc, draw) {
  const p = rideAt(rd, rc);
  if (p.hidden) return false;
  const rx = s.x, ry = s.y + SEAT, color = CAR[(rd * 7) % CAR.length];
  drawCar(ctx, rx, ry, p.a, color);
  ctx.save();
  ctx.translate(rx, ry);
  ctx.rotate(p.a);
  ctx.translate(-rx, -ry);
  draw();
  ctx.restore();
  drawCarFront(ctx, rx, ry, p.a, color);
  return true;
}
export const riderHidden = (rd, rc) => !!rd && rideAt(rd, rc).hidden;

// ——— the card: where to? ———
// onPick(bits): the caller ORs these into the next input (USE plus the pick), like the Set sail card
export class RideCard {
  constructor(onPick) {
    this.el = document.getElementById('ride');
    this.list = document.getElementById('ride-list');
    this.from = -1;
    this.onPick = onPick;
    document.getElementById('ride-no').onclick = () => this.close();
  }
  get isOpen() {
    return this.from >= 0;
  }
  open(from) {
    this.from = from;
    document.getElementById('ride-text').textContent = `The Gathering Line, from ${STATIONS[from].name}. Where to?`;
    this.list.replaceChildren();
    STATIONS.forEach((st, to) => {
      if (to === from) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = `${st.name[0].toUpperCase()}${st.name.slice(1)} · ${Math.round(rideTicks(rideCode(from, to)) / 60)} s`;
      b.onclick = () => this.pick(to);
      this.list.append(b);
    });
    this.el.hidden = false;
  }
  // the n-th button (keys 1-3)
  pickNth(n) {
    const to = STATIONS.map((_, i) => i).filter((i) => i !== this.from)[n];
    if (to !== undefined) this.pick(to);
  }
  pick(to) {
    if (this.from < 0) return;
    this.onPick((to + 1) << PICK_SHIFT);
    this.close();
  }
  close() {
    this.from = -1;
    this.el.hidden = true;
  }
}
