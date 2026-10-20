// Docs: docs/social/lecture-tutor.md
// The lecture hall: its interior (room 1), Prof. Synapse at the front, and his lecture.
// The lecture itself is written on the server (server/lecture.js); this shows it, plus raised hands:
// press H to ask a question, it's queued, and the professor calls on you and answers in turn.
import { W, H, TAU, clamp, circle, ellipse } from './util.js';
import { Slime } from './slime.js';
import { text } from './village.js';
import { ROOMS, HALL, HALL_EXIT_X, PROF_X, TUTOR_DOOR_X } from './shared/sim.js';
import { courseById } from './shared/courses.js';

const ROOM = ROOMS[HALL];
const FLOOR = ROOM.ground;
const STAGE = ROOM.platforms.find((p) => p.kind === 'stage');
const SEATS = ROOM.platforms.filter((p) => p.kind === 'seats');
const TYPE_SPEED = 30; // characters per second, a lecturing pace
const FONT = "Fredoka, 'Trebuchet MS', sans-serif";
const LAYERS = [3, 4, 4, 2]; // the network drawn on the chalkboard

function wrap(ctx, str, maxW) {
  const lines = [];
  let line = '';
  for (const word of str.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxW && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

export class Hall {
  constructor({ send, onOpenChange }) {
    this.send = send;
    this.onOpenChange = onOpenChange;
    this.hands = []; // usernames with a hand up, in the order they'll be called on
    this.form = document.getElementById('ask');
    this.input = document.getElementById('ask-input');
    this.note = document.getElementById('ask-note');
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = this.input.value.trim();
      if (!q) return;
      this.send({ t: 'ask', text: q });
      this.input.value = '';
      this.closeAsk();
    });
    this.prof = new Slime(265);
    this.prof.name = 'Prof. Synapse';
    this.prof.accessories = ['professor'];
    this.line = null; // { topic, text, n, typed, at }
    this.time = 0;
  }

  // Someone slapped him
  slapped(quip) {
    this.prof.wince();
    this.quip = { text: quip, at: this.time };
  }

  receive(m) {
    if (m.t === 'hands') this.hands = m.users;
    else if (m.t === 'ask-error') {
      this.openAsk();
      this.note.textContent = m.text;
    } else if (m.t === 'courses') {
      this.course = m.current;
    } else {
      this.line = { topic: m.topic, topicIdx: m.topicIdx, text: m.text, n: m.n, ask: m.ask, typed: 0, at: this.time };
      if (m.course) this.course = m.course;
    }
  }

  get askOpen() {
    return !this.form.hidden;
  }

  openAsk() {
    this.form.hidden = false;
    this.note.textContent = '';
    this.input.focus();
    this.onOpenChange(true);
  }

  closeAsk() {
    if (this.form.hidden) return;
    this.form.hidden = true;
    this.input.blur();
    this.onOpenChange(false);
  }

  // H: raise your hand (opens the question box), or lower it if it's already up
  toggleHand(me) {
    if (this.hands.includes(me)) this.send({ t: 'ask-cancel' });
    else this.openAsk();
  }

  // A raised hand over each waiting student, and the question over whoever's being answered.
  drawHands(ctx, slimes) {
    for (const s of slimes) {
      const i = this.hands.indexOf(s.name);
      if (i >= 0) drawHand(ctx, s.x, s.y - s.h - 10, this.time, i);
    }
    const l = this.line;
    if (!l?.ask) return;
    const asker = slimes.find((s) => s.name === l.ask.user);
    if (asker) drawQuestion(ctx, asker.x, asker.y - asker.h - 12, l.ask.text);
  }

  update(dt, students) {
    this.time += dt;
    if (this.line && this.line.typed < this.line.text.length) this.line.typed += dt * TYPE_SPEED;
    // he faces his students, turning to the board while he "writes" a new topic
    const writing = this.line && this.time - this.line.at < 1.2;
    this.prof.animate(dt, { x: PROF_X, y: STAGE.y, vx: 0, vy: 0, grounded: true, facing: writing ? -1 : 1 });
    this.students = students;
  }

  // Everything in the room except the players (drawn by main.js on top)
  draw(ctx) {
    drawWalls(ctx, this.time);
    this.drawBoard(ctx);
    drawSeats(ctx, 'back');
    drawSeats(ctx, 'front'); // everything stays behind the players
    drawStage(ctx);
    drawExit(ctx, this.time);
    drawSideDoor(ctx);
    ctx.save();
    ctx.translate(this.prof.x, this.prof.y);
    ctx.scale(1.25, 1.25);
    ctx.translate(-this.prof.x, -this.prof.y);
    this.prof.draw(ctx);
    ctx.restore();
    drawLectern(ctx);
    if (this.quip && this.time - this.quip.at < 2.8) drawQuestion(ctx, PROF_X, STAGE.y - 78, this.quip.text);
    ctx.font = `700 12px ${FONT}`;
    const tw = ctx.measureText('Prof. Synapse').width + 14;
    ctx.fillStyle = 'rgba(60,40,90,0.75)';
    ctx.beginPath();
    ctx.roundRect(PROF_X - tw / 2, STAGE.y + 8, tw, 18, 9);
    ctx.fill();
    text(ctx, 'Prof. Synapse', PROF_X, STAGE.y + 17.5, 12, '#ffe28a');
  }

  drawBoard(ctx) {
    const x = 40, y = 70, w = 330, h = 220;
    ctx.fillStyle = '#9b7d66';
    ctx.beginPath();
    ctx.roundRect(x - 10, y - 10, w + 20, h + 26, 10);
    ctx.fill();
    ctx.fillStyle = '#2f5d50';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ellipse(ctx, x + w * 0.3, y + h * 0.3, w * 0.35, h * 0.25, -0.3);
    ctx.fillStyle = '#c99b6b'; // chalk ledge with chalk and an eraser
    ctx.fillRect(x - 6, y + h + 4, w + 12, 7);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 40, y + h + 1, 12, 3);
    ctx.fillStyle = '#ff9fb8';
    ctx.fillRect(x + 60, y + h + 1, 9, 3);
    ctx.fillStyle = '#5b4a6b';
    ctx.fillRect(x + w - 60, y + h, 26, 5);

    // the course, the topic being taught (chalk-written as it changes), and the syllabus
    const course = courseById(this.course ?? 'ml');
    const ti = this.line?.topicIdx ?? 0;
    const topic = this.line?.topic ?? course.syllabus[0];
    text(ctx, `${course.code} · ${course.name}`, x + w / 2, y + 15, 12, 'rgba(255,240,170,0.9)');
    const reveal = this.line ? clamp((this.time - this.line.at) / 1.2, 0, 1) : 1;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y + 20, w * reveal + 1, 30);
    ctx.clip();
    text(ctx, topic, x + w / 2, y + 37, topic.length > 28 ? 15 : 18, 'rgba(255,255,240,0.95)');
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,240,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 30, y + 54);
    ctx.lineTo(x + w - 30, y + 54);
    ctx.stroke();
    course.syllabus.forEach((item, i) => {
      const iy = y + 70 + i * 18.5;
      const now = i === ti, done = i < ti;
      ctx.font = `700 11.5px ${FONT}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = now ? '#ffe28a' : done ? 'rgba(255,255,240,0.45)' : 'rgba(255,255,240,0.8)';
      ctx.fillText(`${i + 1}. ${item}`, x + 30, iy);
      if (now) {
        ctx.beginPath(); // chalk arrow pointing at the current topic
        ctx.moveTo(x + 12, iy - 5);
        ctx.lineTo(x + 22, iy);
        ctx.lineTo(x + 12, iy + 5);
        ctx.closePath();
        ctx.fill();
      }
      if (done) {
        ctx.strokeStyle = 'rgba(160,230,160,0.8)'; // a chalk tick
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(x + 12, iy);
        ctx.lineTo(x + 16, iy + 4);
        ctx.lineTo(x + 23, iy - 4);
        ctx.stroke();
      }
    });
    if (course.id === 'ml') this.drawNetwork(ctx, x + w - 92, y + 64, 80, 70);
  }

  // A tiny neural network doodle with signals flowing through it (Machine Learning course only)
  drawNetwork(ctx, x, y, w, h) {
    const nx = (i) => x + (i * w) / (LAYERS.length - 1);
    const ny = (n, j) => y + ((j + 0.5) * h) / n;
    ctx.lineWidth = 0.8;
    for (let i = 0; i < LAYERS.length - 1; i++) {
      for (let a = 0; a < LAYERS[i]; a++) {
        for (let b = 0; b < LAYERS[i + 1]; b++) {
          const x1 = nx(i), y1 = ny(LAYERS[i], a), x2 = nx(i + 1), y2 = ny(LAYERS[i + 1], b);
          ctx.strokeStyle = 'rgba(255,255,240,0.2)';
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          const k = (this.time * 0.6 + a * 0.37 + b * 0.21 + i * 0.5) % 1.6;
          if (k < 1) {
            ctx.fillStyle = 'rgba(255,230,120,0.85)';
            circle(ctx, x1 + (x2 - x1) * k, y1 + (y2 - y1) * k, 1.3);
          }
        }
      }
    }
    LAYERS.forEach((n, i) => {
      for (let j = 0; j < n; j++) {
        ctx.fillStyle = 'rgba(255,255,240,0.8)';
        circle(ctx, nx(i), ny(n, j), 4.5);
        ctx.fillStyle = '#2f5d50';
        circle(ctx, nx(i), ny(n, j), 2.6);
      }
    });
  }

  // The lecture line, as a big speech bubble from the professor, typed out at a speaking pace
  drawCaption(ctx) {
    const said = this.line ? this.line.text.slice(0, Math.floor(this.line.typed)) : '';
    const full = this.line?.text ?? 'Ahem! Settle down, settle down… class is about to begin.';
    const ask = this.line?.ask;
    ctx.save();
    ctx.font = `700 13px ${FONT}`;
    const asked = ask ? wrap(ctx, `${ask.user} asks: “${ask.text}”`, 420) : [];
    ctx.font = `700 15px ${FONT}`;
    const lines = wrap(ctx, full, 420);
    const head = asked.length ? asked.length * 18 + 6 : 0;
    const bx = 430, by = 140, bw = 460, bh = lines.length * 21 + 22 + head;
    ctx.fillStyle = 'rgba(255,253,246,0.96)';
    ctx.strokeStyle = '#c9b6ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 16);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath(); // tail toward the professor
    ctx.moveTo(bx + 18, by + bh - 2);
    ctx.lineTo(PROF_X + 40, STAGE.y - 80);
    ctx.lineTo(bx + 48, by + bh - 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,253,246,0.96)';
    ctx.fillRect(bx + 16, by + bh - 6, 34, 5);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    if (asked.length) {
      ctx.font = `700 13px ${FONT}`;
      ctx.fillStyle = '#8a6fc4';
      asked.forEach((l, i) => ctx.fillText(l, bx + 20, by + 19 + i * 18));
      ctx.strokeStyle = 'rgba(201,182,255,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx + 20, by + head + 6);
      ctx.lineTo(bx + bw - 20, by + head + 6);
      ctx.stroke();
      ctx.font = `700 15px ${FONT}`;
    }
    ctx.fillStyle = '#3a3550';
    let left = this.line ? said.length : full.length;
    lines.forEach((l, i) => {
      ctx.fillText(l.slice(0, Math.max(0, left)), bx + 20, by + head + 21 + i * 21);
      left -= l.length + 1;
    });
    ctx.restore();
  }
}

// A little raised mitten, waving; with the queue position if they're not next
function drawHand(ctx, x, y, time, place) {
  const wave = Math.sin(time * 6 + x) * 0.25;
  ctx.save();
  ctx.translate(x + 14, y);
  ctx.rotate(0.15 + wave);
  ctx.fillStyle = '#fff6ea';
  ctx.strokeStyle = '#c9a98a';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(-6, -18, 12, 16, 6); // palm and fingers
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(-7, -8, 3, 5, -0.6, 0, TAU); // thumb
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff6ea';
  ctx.fillRect(-3, -3, 6, 9); // arm
  ctx.strokeRect(-3, -3, 6, 9);
  ctx.restore();
  if (place > 0) {
    ctx.fillStyle = '#8a6fc4';
    ctx.beginPath();
    ctx.arc(x + 28, y - 18, 8, 0, TAU);
    ctx.fill();
    text(ctx, String(place + 1), x + 28, y - 17.5, 11, '#ffffff');
  }
}

// The question, as a speech bubble over the student who asked it
function drawQuestion(ctx, x, bottom, q) {
  ctx.save();
  ctx.font = `700 12px ${FONT}`;
  const lines = wrap(ctx, q, 180);
  const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 18, h = lines.length * 15 + 10;
  const bx = clamp(x - w / 2, 4, W - w - 4);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#c9b6ff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(bx, bottom - h, w, h, 9);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 6, bottom - 1);
  ctx.lineTo(x, bottom + 7);
  ctx.lineTo(x + 6, bottom - 1);
  ctx.fill();
  ctx.fillStyle = '#4a3b5c';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  lines.forEach((l, i) => ctx.fillText(l, bx + 9, bottom - h + 12.5 + i * 15));
  ctx.restore();
}

function drawWalls(ctx, time) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#efe4ff');
  g.addColorStop(1, '#f9efe2');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, ROOM.width, H);
  // wallpaper stripes
  ctx.fillStyle = 'rgba(201,182,255,0.18)';
  for (let x = 0; x < ROOM.width; x += 40) ctx.fillRect(x, 0, 18, FLOOR - 70);
  // tall arched windows up the back, sunlight slanting in
  for (const wx of [520, 700, 860, 1010]) {
    ctx.fillStyle = '#c9b6ff';
    ctx.beginPath();
    ctx.roundRect(wx - 34, 50, 68, 150, [34, 34, 4, 4]);
    ctx.fill();
    const sky = ctx.createLinearGradient(0, 56, 0, 194);
    sky.addColorStop(0, '#bfe6ff');
    sky.addColorStop(1, '#fff6e0');
    ctx.fillStyle = sky;
    ctx.beginPath();
    ctx.roundRect(wx - 28, 56, 56, 138, [28, 28, 2, 2]);
    ctx.fill();
    ctx.strokeStyle = '#c9b6ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(wx, 56);
    ctx.lineTo(wx, 194);
    ctx.moveTo(wx - 28, 120);
    ctx.lineTo(wx + 28, 120);
    ctx.stroke();
    ctx.fillStyle = `rgba(255,250,220,${0.12 + 0.03 * Math.sin(time + wx)})`;
    ctx.beginPath();
    ctx.moveTo(wx - 28, 194);
    ctx.lineTo(wx + 28, 194);
    ctx.lineTo(wx - 40, FLOOR);
    ctx.lineTo(wx - 130, FLOOR);
    ctx.closePath();
    ctx.fill();
  }
  // banner
  ctx.fillStyle = '#ff9fb8';
  ctx.beginPath();
  ctx.moveTo(400, 14);
  ctx.lineTo(560, 14);
  ctx.lineTo(560, 40);
  ctx.lineTo(480, 46);
  ctx.lineTo(400, 40);
  ctx.closePath();
  ctx.fill();
  text(ctx, 'Slime University', 480, 28, 14, '#ffffff');
  // pendant lamps
  for (const lx of [150, 480, 800, 1080]) {
    ctx.strokeStyle = '#5b4a6b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lx, 0);
    ctx.lineTo(lx, 26);
    ctx.stroke();
    const glow = ctx.createRadialGradient(lx, 36, 2, lx, 36, 60);
    glow.addColorStop(0, 'rgba(255,226,140,0.5)');
    glow.addColorStop(1, 'rgba(255,226,140,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(lx - 60, -20, 120, 120);
    ctx.fillStyle = '#5b4a6b';
    ctx.beginPath();
    ctx.moveTo(lx - 14, 38);
    ctx.quadraticCurveTo(lx, 18, lx + 14, 38);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffe69a';
    circle(ctx, lx, 39, 5);
  }
  // wooden wainscot and floor
  ctx.fillStyle = '#c99b6b';
  ctx.fillRect(0, FLOOR - 70, ROOM.width, 70);
  ctx.fillStyle = '#b8895c';
  for (let x = 10; x < ROOM.width; x += 60) {
    ctx.beginPath();
    ctx.roundRect(x, FLOOR - 62, 48, 52, 5);
    ctx.fill();
  }
  ctx.fillStyle = '#b07f55';
  ctx.fillRect(0, FLOOR, ROOM.width, H - FLOOR);
  ctx.strokeStyle = '#9b6e48';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x < ROOM.width; x += 70) {
    ctx.moveTo(x, FLOOR + 4);
    ctx.lineTo(x - 30, H);
  }
  ctx.stroke();
  ctx.fillStyle = '#d9a877';
  ctx.fillRect(0, FLOOR - 3, ROOM.width, 5);
}

function drawStage(ctx) {
  const { x, y, w } = STAGE;
  ctx.fillStyle = '#9b6e48';
  ctx.beginPath();
  ctx.roundRect(x, y, w, FLOOR - y + 2, [6, 6, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#c99b6b';
  ctx.beginPath();
  ctx.roundRect(x - 4, y - 4, w + 8, 10, 5);
  ctx.fill();
  ctx.fillStyle = '#ff9fb8'; // little bunting along the stage front
  for (let i = 0; i < 9; i++) {
    const px = x + 18 + i * ((w - 36) / 8);
    ctx.beginPath();
    ctx.moveTo(px - 7, y + 8);
    ctx.lineTo(px + 7, y + 8);
    ctx.lineTo(px, y + 20);
    ctx.fill();
    ctx.fillStyle = ['#fff1a8', '#a6f5c9', '#c9b6ff', '#9fd8ff', '#ff9fb8'][i % 5];
  }
}

function drawLectern(ctx) {
  const lx = PROF_X + 58, y = STAGE.y;
  ctx.fillStyle = '#8f6240';
  ctx.beginPath();
  ctx.moveTo(lx - 16, y);
  ctx.lineTo(lx - 12, y - 46);
  ctx.lineTo(lx + 12, y - 46);
  ctx.lineTo(lx + 16, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#b07f55';
  ctx.beginPath();
  ctx.moveTo(lx - 20, y - 46);
  ctx.lineTo(lx + 20, y - 46);
  ctx.lineTo(lx + 16, y - 56);
  ctx.lineTo(lx - 24, y - 52);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fffaf0'; // notes on the lectern
  ctx.fillRect(lx - 14, y - 58, 16, 5);
  ctx.fillStyle = '#ffcf3a';
  circle(ctx, lx, y - 28, 5); // a little brain-ish emblem
  ctx.fillStyle = '#8f6240';
  circle(ctx, lx, y - 28, 2);
}

// Tiered seating, all drawn behind the players: seat backs and risers, then each row's front edge
function drawSeats(ctx, layer) {
  SEATS.forEach((p, i) => {
    const below = SEATS[i - 1]?.y ?? FLOOR;
    if (layer === 'back') {
      ctx.fillStyle = '#9b6e48';
      ctx.fillRect(p.x, p.y, p.w, below - p.y);
      // seat backs, a row of plush red seats
      for (let sx = p.x + 22; sx < p.x + p.w - 10; sx += 44) {
        ctx.fillStyle = '#d9607a';
        ctx.beginPath();
        ctx.roundRect(sx - 15, p.y - 30, 30, 28, [10, 10, 3, 3]);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.roundRect(sx - 11, p.y - 27, 8, 18, 4);
        ctx.fill();
      }
    } else {
      // row front edge, over the players' feet
      ctx.fillStyle = '#c99b6b';
      ctx.beginPath();
      ctx.roundRect(p.x - 2, p.y - 3, p.w + 4, 9, 4);
      ctx.fill();
      ctx.fillStyle = '#b8895c';
      ctx.fillRect(p.x, p.y + 6, p.w, Math.min(14, below - p.y - 6));
    }
  });
}

// The side door to the tutoring room
function drawSideDoor(ctx) {
  const x = TUTOR_DOOR_X;
  ctx.fillStyle = '#5f8f7a';
  ctx.beginPath();
  ctx.roundRect(x - 32, FLOOR - 96, 64, 96, [8, 8, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#7fb89f';
  ctx.beginPath();
  ctx.roundRect(x - 26, FLOOR - 90, 52, 90, [5, 5, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#d9f0e6';
  ctx.fillRect(x - 16, FLOOR - 80, 32, 22); // little window
  ctx.fillStyle = '#ffd36b';
  circle(ctx, x + 16, FLOOR - 44, 2.5);
  ctx.fillStyle = '#fffaf0';
  ctx.strokeStyle = '#5f8f7a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 58, FLOOR - 128, 116, 22, 7);
  ctx.fill();
  ctx.stroke();
  text(ctx, 'Tutoring Room', x, FLOOR - 116.5, 13, '#3f6f5a');
}

function drawExit(ctx, time) {
  const x = HALL_EXIT_X;
  ctx.fillStyle = '#8f6240';
  ctx.beginPath();
  ctx.roundRect(x - 30, FLOOR - 92, 60, 92, [30, 30, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#b07f55';
  ctx.beginPath();
  ctx.roundRect(x - 25, FLOOR - 87, 50, 87, [25, 25, 0, 0]);
  ctx.fill();
  ctx.strokeStyle = '#8f6240';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, FLOOR - 86);
  ctx.lineTo(x, FLOOR);
  ctx.stroke();
  ctx.fillStyle = '#ffd36b';
  circle(ctx, x - 6, FLOOR - 42, 2.5);
  circle(ctx, x + 6, FLOOR - 42, 2.5);
  // glowing exit sign
  const a = 0.85 + 0.15 * Math.sin(time * 2);
  ctx.fillStyle = `rgba(79,191,134,${a})`;
  ctx.beginPath();
  ctx.roundRect(x - 22, FLOOR - 118, 44, 18, 5);
  ctx.fill();
  text(ctx, 'EXIT', x, FLOOR - 108.5, 12, '#ffffff');
}

// The hall seen from outside, in the village (drawn by village.js)
export function drawHallOutside(ctx, doorX, ground, time) {
  const w = 380, x = doorX - w / 2, top = ground - 200;
  // steps
  ctx.fillStyle = '#d9d2e6';
  ctx.fillRect(x - 10, ground - 14, w + 20, 16);
  ctx.fillStyle = '#e8e2f2';
  ctx.fillRect(x, ground - 24, w, 12);
  // body
  ctx.fillStyle = '#f4efe6';
  ctx.fillRect(x + 10, top, w - 20, ground - 24 - top);
  // columns
  ctx.fillStyle = '#fffaf3';
  for (let i = 0; i < 6; i++) {
    const cx = x + 30 + i * ((w - 60) / 5);
    if (Math.abs(cx - doorX) < 50) continue;
    ctx.fillRect(cx - 12, top + 10, 24, ground - 34 - top);
    ctx.fillStyle = '#e6dcef';
    for (let f = -6; f <= 6; f += 6) ctx.fillRect(cx + f - 1, top + 16, 2, ground - 46 - top);
    ctx.fillStyle = '#fffaf3';
    ctx.fillRect(cx - 16, top + 4, 32, 8);
    ctx.fillRect(cx - 16, ground - 34, 32, 8);
  }
  // pediment with a neural-net emblem
  ctx.fillStyle = '#c9b6ff';
  ctx.beginPath();
  ctx.moveTo(x - 14, top + 6);
  ctx.lineTo(doorX, top - 70);
  ctx.lineTo(x + w + 14, top + 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#efe6ff';
  ctx.beginPath();
  ctx.moveTo(x + 20, top - 2);
  ctx.lineTo(doorX, top - 56);
  ctx.lineTo(x + w - 20, top - 2);
  ctx.closePath();
  ctx.fill();
  const ey = top - 24;
  ctx.strokeStyle = '#a593e6';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (const [ax, ay] of [[-20, -8], [-20, 8]]) for (const [bx, by] of [[0, -12], [0, 0], [0, 12]]) {
    ctx.moveTo(doorX + ax, ey + ay);
    ctx.lineTo(doorX + bx, ey + by);
  }
  for (const [ax, ay] of [[0, -12], [0, 0], [0, 12]]) {
    ctx.moveTo(doorX + ax, ey + ay);
    ctx.lineTo(doorX + 20, ey);
  }
  ctx.stroke();
  ctx.fillStyle = '#a593e6';
  for (const [nx, ny] of [[-20, -8], [-20, 8], [0, -12], [0, 0], [0, 12], [20, 0]]) {
    circle(ctx, doorX + nx, ey + ny, 3.5 + 0.8 * Math.sin(time * 3 + nx + ny));
  }
  // name band
  ctx.fillStyle = '#a593e6';
  ctx.fillRect(x + 10, top + 6, w - 20, 22);
  text(ctx, 'LECTURE HALL', doorX, top + 18, 15, '#ffffff');
  // double doors
  ctx.fillStyle = '#8f6240';
  ctx.beginPath();
  ctx.roundRect(doorX - 38, ground - 120, 76, 96, [38, 38, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#b07f55';
  ctx.beginPath();
  ctx.roundRect(doorX - 33, ground - 115, 66, 91, [33, 33, 0, 0]);
  ctx.fill();
  ctx.strokeStyle = '#8f6240';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(doorX, ground - 114);
  ctx.lineTo(doorX, ground - 24);
  ctx.stroke();
  ctx.fillStyle = '#ffd36b';
  circle(ctx, doorX - 7, ground - 66, 3);
  circle(ctx, doorX + 7, ground - 66, 3);
  // warm light through the fanlight
  ctx.fillStyle = 'rgba(255,226,140,0.7)';
  ctx.beginPath();
  ctx.arc(doorX, ground - 86, 22, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = '#b07f55';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let k = 1; k < 4; k++) {
    const a = Math.PI + (k * Math.PI) / 4;
    ctx.moveTo(doorX, ground - 86);
    ctx.lineTo(doorX + Math.cos(a) * 22, ground - 86 + Math.sin(a) * 22);
  }
  ctx.stroke();
  // banners hanging between the columns
  for (const bx of [x + 66, x + w - 66]) {
    const sway = Math.sin(time * 1.4 + bx) * 2;
    ctx.fillStyle = '#ff9fb8';
    ctx.beginPath();
    ctx.moveTo(bx - 14, top + 34);
    ctx.lineTo(bx + 14, top + 34);
    ctx.lineTo(bx + 14 + sway, top + 104);
    ctx.lineTo(bx + sway, top + 94);
    ctx.lineTo(bx - 14 + sway, top + 104);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    circle(ctx, bx + sway * 0.5, top + 62, 6);
  }
}
