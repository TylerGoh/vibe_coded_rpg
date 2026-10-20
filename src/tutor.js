// Docs: docs/social/lecture-tutor.md
// The tutoring room (room 4): Tutor Byte quizzes the students in turn on the course they voted for.
// The quiz runs on the server (server/tutor.js); this draws the room, the whiteboard (question, the
// student's answer, and the verdict out of 5), the session scoreboard, and the answer box on your turn.
import { W, H, TAU, clamp, circle, ellipse } from './util.js';
import { Slime } from './slime.js';
import { text } from './village.js';
import { ROOMS, TUTOR, TUTOR_EXIT_X } from './shared/sim.js';
import { courseById, BREAK } from './shared/courses.js';

const ROOM = ROOMS[TUTOR];
const FLOOR = ROOM.ground;
const TUTOR_X = 690;
const FONT = "Fredoka, 'Trebuchet MS', sans-serif";

function wrap(ctx, str, maxW) {
  const lines = [];
  let line = '';
  for (const word of String(str).split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxW && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

export class Tutor {
  constructor({ send, me }) {
    this.send = send;
    this.me = me; // () → your username
    this.state = { phase: 'idle', course: null, scores: [] };
    this.receivedAt = 0;
    this.time = 0;
    this.slime = new Slime(185);
    this.slime.name = 'Tutor Byte';
    this.slime.accessories = ['tutor'];
    this.form = document.getElementById('answer');
    this.input = document.getElementById('answer-input');
    this.prompt = document.getElementById('answer-prompt');
    this.note = document.getElementById('answer-note');
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const a = this.input.value.trim();
      if (!a) return;
      this.send({ t: 'tutor-answer', text: a });
      this.input.value = '';
    });
  }

  get myTurn() {
    return this.state.phase === 'answering' && this.state.turn === this.me();
  }

  receive(m) {
    if (m.t === 'tutor-error') {
      this.note.textContent = m.text;
      return;
    }
    const wasMine = this.myTurn;
    this.state = m;
    this.receivedAt = this.time;
    this.note.textContent = '';
    this.showForm(wasMine);
  }

  // The answer box shows (and grabs the keyboard) only while it's your turn
  showForm(wasMine = false) {
    const mine = this.myTurn;
    this.form.hidden = !mine;
    if (mine && !wasMine) {
      this.input.value = '';
      this.prompt.textContent = `Your turn, ${this.me()}! Type your answer:`;
      this.input.focus();
    }
    if (!mine && document.activeElement === this.input) this.input.blur();
  }

  hide() {
    this.form.hidden = true;
    if (document.activeElement === this.input) this.input.blur();
  }

  update(dt, inRoom) {
    this.time += dt;
    this.slime.animate(dt, { x: TUTOR_X, y: FLOOR, vx: 0, vy: 0, grounded: true, facing: 1 });
    if (!inRoom) this.hide();
    else this.showForm(this.myTurn);
  }

  get secondsLeft() {
    return Math.max(0, Math.ceil((this.state.msLeft - (this.time - this.receivedAt) * 1000) / 1000));
  }

  // ——— drawing (camera applied; the room is one screen wide) ———
  draw(ctx) {
    // walls: a calm mint study room
    ctx.fillStyle = '#e4f3ec';
    ctx.fillRect(0, 0, ROOM.width, H);
    ctx.fillStyle = 'rgba(127,184,159,0.15)';
    for (let x = 0; x < ROOM.width; x += 36) ctx.fillRect(x, 0, 18, FLOOR - 60);
    ctx.fillStyle = '#b8d9c9';
    ctx.fillRect(0, FLOOR - 60, ROOM.width, 60);
    ctx.fillStyle = '#c99b6b';
    ctx.fillRect(0, FLOOR, ROOM.width, H - FLOOR);
    ctx.strokeStyle = '#b8895c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < ROOM.width; x += 80) {
      ctx.moveTo(x, FLOOR + 4);
      ctx.lineTo(x - 25, H);
    }
    ctx.stroke();
    ctx.fillStyle = '#e0b88a';
    ctx.fillRect(0, FLOOR - 3, ROOM.width, 5);
    // window, plant, clock, bookshelf
    this.drawDecor(ctx);
    this.drawExit(ctx);
    this.drawBoard(ctx);
    this.drawScores(ctx);
    // the tutor's desk, with the tutor behind it
    ctx.save();
    ctx.translate(TUTOR_X, FLOOR);
    ctx.scale(1.2, 1.2);
    ctx.translate(-TUTOR_X, -FLOOR);
    this.slime.draw(ctx);
    ctx.restore();
    ctx.fillStyle = '#9b6e48';
    ctx.fillRect(TUTOR_X + 20, FLOOR - 46, 90, 46);
    ctx.fillStyle = '#b8895c';
    ctx.fillRect(TUTOR_X + 14, FLOOR - 52, 102, 8);
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(TUTOR_X + 40, FLOOR - 60, 26, 8); // a stack of marking
    ctx.fillStyle = '#ff9fb8';
    ctx.fillRect(TUTOR_X + 86, FLOOR - 66, 12, 14); // a mug
    ctx.font = `700 12px ${FONT}`;
    const tw = ctx.measureText('Tutor Byte').width + 14;
    ctx.fillStyle = 'rgba(40,90,70,0.8)';
    ctx.beginPath();
    ctx.roundRect(TUTOR_X - tw / 2, FLOOR + 8, tw, 18, 9);
    ctx.fill();
    text(ctx, 'Tutor Byte', TUTOR_X, FLOOR + 17.5, 12, '#ffe28a');
  }

  drawDecor(ctx) {
    // clock
    ctx.fillStyle = '#fffaf0';
    circle(ctx, 880, 50, 18);
    ctx.strokeStyle = '#5f8f7a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(880, 50, 18, 0, TAU);
    ctx.stroke();
    const a = this.time * 0.3;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(880, 50);
    ctx.lineTo(880 + Math.cos(a) * 12, 50 + Math.sin(a) * 12);
    ctx.moveTo(880, 50);
    ctx.lineTo(880 + Math.cos(a / 12) * 8, 50 + Math.sin(a / 12) * 8);
    ctx.stroke();
    // bookshelf
    ctx.fillStyle = '#9b6e48';
    ctx.fillRect(820, FLOOR - 150, 110, 150);
    const colors = ['#ff9fb8', '#9fd8ff', '#ffe28a', '#a6f5c9', '#c9b6ff'];
    for (let r = 0; r < 3; r++) {
      ctx.fillStyle = '#7a5434';
      ctx.fillRect(824, FLOOR - 146 + r * 48 + 40, 102, 5);
      for (let k = 0; k < 7; k++) {
        ctx.fillStyle = colors[(k + r * 2) % colors.length];
        ctx.fillRect(828 + k * 14, FLOOR - 146 + r * 48 + 8 + (k % 3) * 2, 11, 32 - (k % 3) * 2);
      }
    }
    // plant
    ctx.fillStyle = '#d9a877';
    ctx.fillRect(140, FLOOR - 40, 34, 40);
    ctx.fillStyle = '#5fb85a';
    for (const [dx, dy, r] of [[0, -58, 16], [-14, -46, 12], [14, -48, 12], [0, -76, 10]]) ellipse(ctx, 157 + dx, FLOOR + dy, r, r * 0.8);
  }

  drawExit(ctx) {
    const x = TUTOR_EXIT_X;
    ctx.fillStyle = '#5f8f7a';
    ctx.beginPath();
    ctx.roundRect(x - 30, FLOOR - 92, 60, 92, [8, 8, 0, 0]);
    ctx.fill();
    ctx.fillStyle = '#7fb89f';
    ctx.beginPath();
    ctx.roundRect(x - 25, FLOOR - 87, 50, 87, [5, 5, 0, 0]);
    ctx.fill();
    ctx.fillStyle = '#ffd36b';
    circle(ctx, x + 14, FLOOR - 42, 2.5);
    ctx.fillStyle = 'rgba(79,191,134,0.9)';
    ctx.beginPath();
    ctx.roundRect(x - 34, FLOOR - 118, 68, 18, 5);
    ctx.fill();
    text(ctx, 'Lecture Hall', x, FLOOR - 108.5, 11, '#ffffff');
  }

  // The whiteboard: what's happening in the quiz right now
  drawBoard(ctx) {
    const x = 200, y = 34, w = 430, h = 300;
    ctx.fillStyle = '#c9c4bc';
    ctx.beginPath();
    ctx.roundRect(x - 8, y - 8, w + 16, h + 16, 8);
    ctx.fill();
    ctx.fillStyle = '#fdfdfb';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#c9c4bc';
    ctx.fillRect(x + 20, y + h + 8, w - 40, 6); // marker tray
    for (const [mx, c] of [[x + 40, '#3c6ad0'], [x + 60, '#d03a3a'], [x + 80, '#2f8f5f']]) {
      ctx.fillStyle = c;
      ctx.fillRect(mx, y + h + 4, 14, 4);
    }
    const s = this.state;
    const course = courseById(s.course);
    const header = course ? `${course.code} · ${course.name}` : 'Tutoring Room';
    text(ctx, header, x + w / 2, y + 18, 13, '#3f6f5a');
    ctx.fillStyle = 'rgba(63,111,90,0.25)';
    ctx.fillRect(x + 20, y + 30, w - 40, 2);

    const para = (str, py, size, color, maxLines = 4, indent = 18) => {
      ctx.font = `700 ${size}px ${FONT}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = color;
      const lines = wrap(ctx, str, w - indent * 2).slice(0, maxLines);
      lines.forEach((l, i) => ctx.fillText(l, x + indent, py + i * (size + 4)));
      return py + lines.length * (size + 4);
    };

    if (!course) {
      const msg = s.course === BREAK ? 'On a break!' : 'Welcome to tutoring!';
      text(ctx, msg, x + w / 2, y + 110, 26, '#3f6f5a');
      text(ctx, s.course === BREAK ? 'Vote for a course to start the quiz again.' : 'Vote for a course and I\'ll quiz you, one at a time.', x + w / 2, y + 148, 14, '#5b4a6b');
      text(ctx, 'Press C to open the course menu', x + w / 2, y + 180, 14, '#8a6fc4');
      text(ctx, 'Each answer is rated out of 5. Scores reset when everyone leaves.', x + w / 2, y + 230, 12, '#8a8a8a');
      return;
    }
    let py = y + 52;
    if (s.phase === 'idle' || s.phase === 'asking') {
      text(ctx, s.turn ? `Thinking of a question for ${s.turn}…` : 'Getting ready…', x + w / 2, y + 140, 17, '#3f6f5a');
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = '#7fb89f';
        circle(ctx, x + w / 2 - 14 + i * 14, y + 170 - Math.max(0, Math.sin(this.time * 6 - i)) * 5, 4);
      }
      return;
    }
    // the question
    py = para(`Question for ${s.turn}${s.topic ? ` · ${s.topic}` : ''}`, py, 12, '#8a6fc4', 1);
    py = para(s.question ?? '', py + 4, 15, '#2d2a3e', 4);
    if (s.phase === 'answering') {
      const left = this.secondsLeft, k = clamp(left / 90, 0, 1);
      ctx.fillStyle = '#e8e4dc';
      ctx.fillRect(x + 18, py + 10, w - 36, 8);
      ctx.fillStyle = k > 0.3 ? '#7fb89f' : '#e0567a';
      ctx.fillRect(x + 18, py + 10, (w - 36) * k, 8);
      text(ctx, `${s.turn} is answering… ${left}s`, x + w / 2, py + 36, 14, '#5b4a6b');
      return;
    }
    // their answer, then the verdict
    py = para(`${s.turn}: “${s.answer ?? ''}”`, py + 8, 13, '#3c6ad0', 3);
    if (s.phase === 'marking') {
      text(ctx, 'Marking…', x + w / 2, py + 22, 15, '#3f6f5a');
      return;
    }
    const r = s.result;
    if (!r) return;
    // score out of 5, as five dots
    ctx.font = `700 14px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#2d2a3e';
    ctx.fillText(`${r.score} / 5`, x + 18, py + 16);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i < r.score ? '#ffcf3a' : '#e8e4dc';
      circle(ctx, x + 78 + i * 18, py + 16, 7);
    }
    py += 32;
    if (r.comment) py = para(r.comment, py, 12, '#5b4a6b', 2);
    if (r.right) py = para(`Right: ${r.right}`, py + 2, 12, '#2f8f5f', 3);
    if (r.missed) py = para(`Missed: ${r.missed}`, py + 2, 12, '#d03a3a', 3);
    para(`Answer: ${r.model}`, py + 2, 12, '#3c5a9a', 4);
  }

  // The session scoreboard, pinned to the wall
  drawScores(ctx) {
    const x = 34, y = 60, w = 130;
    const rows = this.state.scores ?? [];
    const h = 44 + Math.max(1, rows.length) * 20;
    ctx.fillStyle = '#fff6dc';
    ctx.save();
    ctx.translate(x + w / 2, y);
    ctx.rotate(-0.02);
    ctx.fillRect(-w / 2, 0, w, h);
    ctx.fillStyle = '#e0567a';
    circle(ctx, 0, 4, 4); // pin
    text(ctx, 'Scoreboard', 0, 22, 14, '#8a6420');
    if (!rows.length) text(ctx, 'no one yet', 0, 46, 11, '#a08bb3');
    const best = Math.max(0, ...rows.map(([, p]) => p));
    rows.forEach(([name, pts], i) => {
      const ry = 46 + i * 20;
      const isTurn = name === this.state.turn;
      ctx.font = `700 12px ${FONT}`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillStyle = isTurn ? '#3c6ad0' : '#3a3550';
      ctx.fillText(`${isTurn ? '> ' : ''}${name}`, -w / 2 + 10, ry);
      ctx.textAlign = 'right';
      ctx.fillStyle = pts === best && pts > 0 ? '#d08a1a' : '#3a3550';
      ctx.fillText(String(pts), w / 2 - 10, ry);
    });
    ctx.restore();
  }
}

