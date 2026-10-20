// Docs: docs/social/ai-characters.md
// The AI characters on the client (Elder Mochi, Curator Clio — see NPCS in src/shared/sim.js): drawing
// them, their public conversations (speech bubbles, a feed in the corner) and the MapleStory-style dialog
// box for talking to them, shared by all characters. The AI itself lives on the server (server/npc.js);
// this only shows what everyone says and sends what you type.
import { clamp } from './util.js';
import { Slime } from './slime.js';
import { text } from './village.js';
import { ROOMS, NPC_TEXT_MAX } from './shared/sim.js';

const TYPE_SPEED = 45; // characters per second for their replies
const FEED_LINES = 6;
const FEED_LIFE = 20; // seconds a line stays in the corner feed
const LOG_LINES = 12;
const FONT = "Fredoka, 'Trebuchet MS', sans-serif";

const bubbleLife = (s) => Math.min(12, 4 + s.length * 0.06);

// Split text into lines no wider than maxW (in the current font)
export function wrap(ctx, str, maxW) {
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

// The one dialog box, the one corner feed (the chat adds its lines too: addFeed), and which character the dialog is talking to
const ui = {
  el: document.getElementById('npc'),
  logEl: document.getElementById('npc-log'),
  input: document.getElementById('npc-input'),
  name: document.getElementById('npc-name'),
  blurb: document.getElementById('npc-blurb'),
  face: document.getElementById('npc-face').getContext('2d'),
};
ui.input.maxLength = NPC_TEXT_MAX;
let openChar = null;
const feed = []; // { char, from, to, text, at } — every character's public conversation, newest last
const now = () => performance.now() / 1000;
document.getElementById('npc-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const said = ui.input.value.trim();
  if (!said || !openChar) return;
  openChar.send({ t: 'npc', npc: openChar.cfg.id, text: said });
  ui.input.value = '';
});
document.getElementById('npc-close').onclick = () => openChar?.close();
// Characters who keep a shop (cfg.shop) have a Trade button: it closes the dialog and opens their shop
const tradeButton = document.getElementById('npc-trade');
let tradeWith = () => {};
export const onTrade = (fn) => (tradeWith = fn);
tradeButton.onclick = () => {
  const shop = openChar?.cfg.shop;
  openChar?.close();
  if (shop) tradeWith(shop);
};

// a line from somewhere else (the chat, src/chat.js): { who, text, color } where `who` is the coloured lead-in
export function addFeed(f) {
  feed.push({ ...f, at: now() });
  if (feed.length > FEED_LINES) feed.shift();
}

export const dialogOpen = () => openChar !== null;
export const closeDialog = () => openChar?.close();

export class Character {
  // cfg: an entry of NPCS (src/shared/sim.js)
  constructor(cfg, { send, onOpenChange }) {
    this.cfg = cfg;
    this.ground = ROOMS[cfg.room].ground;
    this.send = send; // (message) → over the game socket
    this.onOpenChange = onOpenChange;
    this.slime = new Slime(cfg.hue);
    this.slime.name = cfg.name;
    this.slime.accessories = [cfg.accessory];
    if (cfg.folk) this.slime.setFolk(cfg.folk, cfg.lively);
    this.slime.x = cfg.x;
    this.slime.y = this.ground;
    this.thinking = false;
    this.near = false;
    this.bubbles = new Map(); // speaker name ('' for the character) → { text, at, typed }
    this.log = []; // { from, to, text, typed?, span }
    this.time = 0;
  }

  get isOpen() {
    return openChar === this;
  }

  open() {
    if (openChar && openChar !== this) openChar.close();
    openChar = this;
    ui.name.textContent = this.cfg.name;
    ui.blurb.textContent = `${this.cfg.blurb} · everyone can hear`;
    ui.input.placeholder = `Say something to ${this.cfg.short}…`;
    tradeButton.hidden = !this.cfg.shop;
    ui.el.hidden = false;
    this.renderLog();
    this.send({ t: 'npc-open', npc: this.cfg.id });
    ui.input.focus();
    this.onOpenChange(true);
  }

  // Open the dialog with something already typed in, ready to send or edit
  ask(prefill) {
    this.open();
    ui.input.value = prefill;
  }

  close() {
    if (openChar !== this) return;
    openChar = null;
    ui.el.hidden = true;
    ui.input.blur();
    this.onOpenChange(false);
  }

  // Someone slapped them: a wince and an indignant word (not an AI reply)
  slapped(quip) {
    this.slime.wince();
    this.bubbles.set('', { text: quip, at: this.time, typed: Infinity });
  }

  // Messages from the server (see server/index.js)
  receive(m) {
    if (m.t === 'npc-think') this.thinking = m.on;
    else if (m.t === 'npc-log') {
      this.log = m.lines.map((l) => ({ ...l, typed: l.text.length }));
      this.renderLog();
    } else if (m.t === 'npc-say') {
      this.say(m.from, null, m.text);
    } else if (m.t === 'npc-reply') {
      this.say(null, m.to, m.text);
    } else if (m.t === 'npc-error') {
      this.addLog({ system: true, text: m.text, typed: m.text.length });
      if (!this.isOpen) this.bubbles.set('', { text: m.text, at: this.time, typed: Infinity });
    }
  }

  say(from, to, said) {
    const self = from === null;
    this.bubbles.set(self ? '' : from, { text: said, at: this.time, typed: self ? 0 : Infinity });
    feed.push({ char: this.cfg.short, from, to, text: said, at: now() });
    if (feed.length > FEED_LINES) feed.shift();
    this.addLog({ from, to, text: said, typed: self ? 0 : said.length });
  }

  addLog(line) {
    this.log.push(line);
    if (this.log.length > LOG_LINES) this.log.shift();
    this.renderLog();
  }

  renderLog() {
    if (!this.isOpen) return;
    ui.logEl.replaceChildren();
    if (!this.log.length) {
      const hint = document.createElement('p');
      hint.className = 'npc-system';
      hint.textContent = this.cfg.hello ?? `Say hello to ${this.cfg.short}. (Everyone can hear you.)`;
      ui.logEl.append(hint);
    }
    for (const line of this.log) {
      const p = document.createElement('p');
      if (line.system) p.className = 'npc-system';
      else {
        p.className = line.from ? 'npc-player' : 'npc-mochi';
        const who = document.createElement('b');
        who.textContent = line.from ? `${line.from}: ` : `${this.cfg.short}${line.to ? ` → ${line.to}` : ''}: `;
        p.append(who);
      }
      line.span = document.createElement('span');
      line.span.textContent = line.text.slice(0, line.typed);
      p.append(line.span);
      ui.logEl.append(p);
    }
    ui.logEl.scrollTop = ui.logEl.scrollHeight;
  }

  // me: your slime if you're in this character's room (else null). Turns them toward you, runs the
  // typewriters, and tracks whether you're close enough to talk.
  update(dt, me) {
    this.time += dt;
    const { x } = this.cfg;
    const d = me ? Math.hypot(me.x - x, me.y - this.ground) : Infinity;
    this.near = d <= this.cfg.range;
    const facing = me && d < 450 ? Math.sign(me.x - x) || this.cfg.faces : this.cfg.faces; // looks at you when you're about
    this.slime.animate(dt, { x, y: this.ground, vx: 0, vy: 0, grounded: true, facing });

    const b = this.bubbles.get('');
    if (b && b.typed < b.text.length) b.typed += dt * TYPE_SPEED;
    for (const line of this.log) {
      if (line.typed >= line.text.length) continue;
      line.typed = Math.min(line.text.length, line.typed + dt * TYPE_SPEED);
      if (this.isOpen && line.span) {
        line.span.textContent = line.text.slice(0, Math.floor(line.typed));
        ui.logEl.scrollTop = ui.logEl.scrollHeight;
      }
    }
    for (const [who, bb] of this.bubbles) if (this.time - bb.at > bubbleLife(bb.text) + 1) this.bubbles.delete(who);
    if (this.isOpen && !(this.near || (this.cfg.anywhere && me))) this.close(); // walked away (or out of the room) // got pushed / logged in elsewhere: walked out of range

    if (this.isOpen) this.drawFace();
  }

  drawFace() {
    const g = ui.face;
    const c = g.canvas;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, c.width, c.height);
    g.setTransform(c.width / 64, 0, 0, c.width / 64, 0, 0);
    g.translate(30, 58);
    g.scale(0.95, 0.95);
    const { x, y, facing } = this.slime;
    this.slime.x = 0;
    this.slime.y = 0;
    this.slime.facing = 1;
    this.slime.draw(g);
    Object.assign(this.slime, { x, y, facing });
  }

  // ——— drawing in the world (camera already applied) ———

  drawSlime(ctx) {
    const s = this.slime;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.scale(this.cfg.size, this.cfg.size);
    ctx.translate(-s.x, -s.y);
    s.draw(ctx);
    ctx.restore();
    // name tag, in gold
    ctx.font = `700 12px ${FONT}`;
    const w = ctx.measureText(this.cfg.name).width + 14;
    ctx.fillStyle = 'rgba(91,60,20,0.72)';
    ctx.beginPath();
    ctx.roundRect(s.x - w / 2, s.y + 8, w, 18, 9);
    ctx.fill();
    text(ctx, this.cfg.name, s.x, s.y + 17.5, 12, '#ffe28a');
  }

  // Speech bubbles over the character and anyone who spoke to them. slimes: Slime objects on screen.
  drawBubbles(ctx, slimes) {
    const top = this.slime.y - this.slime.h * this.cfg.size - 26;
    if (this.thinking) this.drawThinking(ctx, this.slime.x, top);
    else if (this.bubbles.has('')) this.drawBubble(ctx, this.slime.x, top, this.bubbles.get(''), true);
    // (the "E talk to …" prompt is drawn over your own slime: src/hints.js)
    for (const s of slimes) {
      const b = this.bubbles.get(s.name);
      if (b) this.drawBubble(ctx, s.x, s.y - s.h - 22, b, false);
    }
  }

  drawBubble(ctx, x, bottom, b, mochi) {
    const age = this.time - b.at, life = bubbleLife(b.text);
    const a = clamp(Math.min(age * 6, life + 1 - age), 0, 1);
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = `700 12px ${FONT}`;
    const lines = wrap(ctx, b.text, 190);
    const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 18, h = lines.length * 15 + 10;
    const y = bottom - h;
    ctx.fillStyle = mochi ? '#fff8e4' : '#ffffff';
    ctx.strokeStyle = mochi ? '#d9b36a' : 'rgba(40,40,60,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y, w, h, 9);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath(); // tail
    ctx.moveTo(x - 6, bottom - 1);
    ctx.lineTo(x, bottom + 7);
    ctx.lineTo(x + 6, bottom - 1);
    ctx.fill();
    // typewriter: reveal characters across the wrapped lines
    let left = Math.floor(b.typed);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#4a3b5c';
    lines.forEach((l, i) => {
      const shown = l.slice(0, Math.max(0, left));
      left -= l.length + 1;
      ctx.fillText(shown, x - w / 2 + 9, y + 12.5 + i * 15);
    });
    ctx.restore();
  }

  drawThinking(ctx, x, bottom) {
    ctx.save();
    ctx.fillStyle = '#fff8e4';
    ctx.strokeStyle = '#d9b36a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x - 24, bottom - 24, 48, 24, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#b08a4a';
    for (let i = 0; i < 3; i++) {
      const lift = Math.max(0, Math.sin(this.time * 6 - i * 0.8)) * 3;
      ctx.beginPath();
      ctx.arc(x - 10 + i * 10, bottom - 12 - lift, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // little thought puffs
    ctx.fillStyle = '#fff8e4';
    for (const [dx, dy, r] of [[-4, 6, 3.5], [-9, 12, 2.2]]) {
      ctx.beginPath();
      ctx.arc(x + dx, bottom + dy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ——— the public feed, bottom-left of the screen (no camera): every character's conversation ———
export function drawFeed(ctx, bottom, maxWidth = 620) {
  if (openChar) return; // the dialog shows the conversation
  ctx.save();
  ctx.font = `700 13px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let y = bottom;
  // newest at the bottom; each line wraps to at most 3 rows so answers can be read from anywhere
  for (let i = feed.length - 1; i >= 0 && y > 120; i--) {
    const f = feed[i];
    const a = clamp((FEED_LIFE + Math.min(20, f.text.length / 15) - (now() - f.at)) / 2, 0, 1); // longer answers stay longer
    if (a <= 0) continue;
    const who = f.who ?? (f.from ? `${f.from} → ${f.char}: ` : `${f.char} → ${f.to}: `);
    const whoW = ctx.measureText(who).width;
    const rows = wrap(ctx, `${'\u2003'.repeat(Math.ceil(whoW / ctx.measureText('\u2003').width))}${f.text}`, maxWidth - 20);
    if (rows.length > 3) {
      rows.length = 3;
      while (rows[2].length && ctx.measureText(`${rows[2]}…`).width > maxWidth - 20) rows[2] = rows[2].slice(0, -1);
      rows[2] += '…';
    }
    const w = Math.min(maxWidth, Math.max(...rows.map((r) => ctx.measureText(r).width)) + 20);
    const h = rows.length * 17 + 7;
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(45,42,62,0.62)';
    ctx.beginPath();
    ctx.roundRect(16, y - h, w, h, 12);
    ctx.fill();
    ctx.fillStyle = f.color ?? (f.from ? '#ffffff' : '#ffe28a');
    ctx.fillText(who, 26, y - h + 12);
    ctx.fillStyle = '#ffffff';
    rows.forEach((r, k) => ctx.fillText(k === 0 ? r.trimStart() : r, k === 0 ? 26 + whoW : 26, y - h + 12 + k * 17));
    y -= h + 4;
  }
  ctx.restore();
}
