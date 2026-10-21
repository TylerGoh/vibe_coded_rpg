// Docs: docs/social/accuse.md
// Being accused of botting (server/accuse.js): a notice at the top and a "Not a bot!" button drawn on the
// canvas (never HTML, so a bot can't find it in the page) at a random spot that jumps every MOVE_MS. Tapping
// it denies the accusation. Nothing else is blocked while it's open. Once the grace time is up you're caught
// (your EXP is skimmed), and the button stays until you deny it.
// The Accuse button itself is in the Players panel (src/players.js).
import { text } from './village.js';
import { audio } from './audio.js';
import { TOUCH } from './touch.js';

const MOVE_MS = 3500; // the button jumps somewhere else this often
const BW = 132, BH = 40; // its size
const fmt = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export class Accuse {
  constructor({ send, W, H }) {
    this.send = send;
    this.W = W;
    this.H = H;
    this.reset();
  }
  reset() {
    this.state = null; // { by, until (performance.now ms), caught }
    this.btn = null; // { x, y } in canvas px
    this.movedAt = 0;
  }

  // ← {t:'accused', by?, ms?, caught?}
  receive(m) {
    const was = this.state;
    this.state = m.by ? { by: m.by, until: performance.now() + m.ms, caught: !!m.caught } : null;
    if (this.state && !this.state.caught && !was) audio.sfx('bossWarn', { vol: 0.5 });
    this.movedAt = 0;
  }
  get open() {
    return !!this.state; // (caught too: denying stops the skimming)
  }

  // somewhere random, clear of the top-left HUD and (on phones) the touch controls along the bottom
  move() {
    const y0 = TOUCH ? 180 : 140, y1 = TOUCH ? this.H * 0.55 : this.H - 120;
    this.btn = { x: 30 + Math.random() * (this.W - 60 - BW), y: y0 + Math.random() * (y1 - y0 - BH) };
    this.movedAt = performance.now();
  }

  // a click / tap at canvas px (x, y): → true if it hit the button (and nothing else should happen)
  tap(x, y) {
    const b = this.btn;
    if (!this.open || !b || x < b.x || x > b.x + BW || y < b.y || y > b.y + BH) return false;
    this.send({ t: 'deny' });
    this.btn = null;
    audio.sfx('coin', { vol: 0.6 });
    return true;
  }

  draw(ctx) {
    const s = this.state, t = performance.now();
    if (!s) return;
    const left = s.until - t, cx = this.W / 2;
    const label = s.caught
      ? `Caught botting: ${s.by} skims your EXP until you hit the button`
      : `${s.by} says you're a bot! Find the button to deny it · ${fmt(left)}`;
    ctx.font = "700 14px Fredoka, 'Trebuchet MS', sans-serif";
    const w = ctx.measureText(label).width + 36;
    ctx.fillStyle = 'rgba(255,235,240,0.94)';
    ctx.beginPath();
    ctx.roundRect(cx - w / 2, 96, w, 30, 15);
    ctx.fill();
    text(ctx, label, cx, 111.5, 14, '#d9465f');
    if (!this.btn || t - this.movedAt > MOVE_MS) this.move();
    const b = this.btn, pulse = 1 + Math.sin(t / 160) * 0.03;
    ctx.save();
    ctx.translate(b.x + BW / 2, b.y + BH / 2);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#ff8fb1';
    ctx.strokeStyle = '#fffaf3';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-BW / 2, -BH / 2, BW, BH, 20);
    ctx.fill();
    ctx.stroke();
    text(ctx, 'Not a bot!', 0, 1, 17, '#fffaf3');
    ctx.restore();
  }
}
