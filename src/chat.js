// Docs: docs/social/chat.md
// The chatbox (Enter, or the Chat button): an Everyone tab for public chat and a tab per private
// conversation. Public lines also pop up as speech bubbles over the speaker (if they're in your room)
// and, while the box is closed, every line shows in the corner feed (src/npc.js). Commands: /w name text
// whispers, /r text replies to whoever whispered last, /all text says it in public from a private tab.
// Unread private lines are counted from the last line you saw in each conversation, kept in localStorage.
import { clamp } from './util.js';
import { audio } from './audio.js';
import { addFeed, wrap } from './npc.js';
import { CHAT_MAX } from './shared/sim.js';

const FONT = "Fredoka, 'Trebuchet MS', sans-serif";
const MAX_LINES = 400; // kept on the client
const bubbleLife = (s) => Math.min(10, 4 + s.length * 0.06);
const WHISPER = /^\/(w|whisper|msg|dm|t|tell)\s+(\S+)\s*(.*)$/i;

export class Chat {
  // me() → your account name · online() → names of everyone online · onOpenChange(open)
  constructor({ send, me, online, onOpenChange }) {
    this.send = send;
    this.me = me;
    this.online = online;
    this.onOpenChange = onOpenChange;
    this.el = document.getElementById('chat');
    this.tabsEl = document.getElementById('chat-tabs');
    this.logEl = document.getElementById('chat-log');
    this.noteEl = document.getElementById('chat-note');
    this.input = document.getElementById('chat-input');
    this.input.maxLength = CHAT_MAX;
    this.button = document.getElementById('chatbtn');
    this.button.onclick = () => {
      if (this.isOpen) this.close();
      else this.open();
      this.button.blur();
    };
    document.getElementById('chat-close').onclick = () => this.close();
    document.getElementById('chat-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.submit();
    });
    this.input.addEventListener('focus', () => this.onOpenChange(true)); // stop walking while typing
    this.lines = []; // { id, at, from, to?, text } or { system, peer, text }, oldest first
    this.tab = null; // null: Everyone · a name: your private conversation with them
    this.peers = []; // names you have a private conversation with, most recent first
    this.unreadAll = 0;
    this.lastFrom = null; // who whispered to you last (/r)
    this.bubbles = new Map(); // name → { text, at }
    this.time = 0;
    this.seen = {};
  }

  get isOpen() {
    return !this.el.hidden;
  }
  get typing() {
    return document.activeElement === this.input;
  }
  // peer: open straight onto your conversation with them
  open(peer) {
    if (peer !== undefined) this.showTab(peer);
    this.el.hidden = false;
    this.markSeen();
    this.render();
    this.input.focus();
  }
  close() {
    if (this.el.hidden) return;
    this.el.hidden = true;
    this.input.blur();
    this.render();
    this.onOpenChange(false);
  }
  focus() {
    if (!this.isOpen) return this.open();
    this.input.focus();
  }
  showTab(peer) {
    this.tab = peer || null;
    if (this.tab && !this.peers.includes(this.tab)) this.peers.unshift(this.tab);
    this.markSeen();
    this.render();
  }

  peerOf(l) {
    if (l.system) return l.peer;
    return l.to ? (l.from === this.me() ? l.to : l.from) : null;
  }
  // unread private lines from peer
  unread(peer) {
    const seen = this.seen[peer] ?? 0;
    return this.lines.filter((l) => !l.system && l.to && l.from === peer && l.id > seen).length;
  }
  markSeen() {
    if (!this.isOpen) return;
    if (this.tab === null) this.unreadAll = 0;
    else {
      const last = this.lines.findLast((l) => !l.system && this.peerOf(l) === this.tab);
      if (last && last.id > (this.seen[this.tab] ?? 0)) {
        this.seen[this.tab] = last.id;
        try {
          localStorage.setItem(`slimeville-chat-${this.me()}`, JSON.stringify(this.seen));
        } catch {}
      }
    }
  }

  // ← chat, chat-log, chat-error
  receive(m) {
    if (m.t === 'chat-log') {
      try {
        this.seen = JSON.parse(localStorage.getItem(`slimeville-chat-${this.me()}`)) ?? {};
      } catch {
        this.seen = {};
      }
      this.lines = m.lines;
      this.peers = [];
      for (let i = this.lines.length - 1; i >= 0; i--) {
        const p = this.peerOf(this.lines[i]);
        if (p && !this.peers.includes(p)) this.peers.push(p);
      }
      this.lastFrom = this.lines.findLast((l) => l.to && l.from !== this.me())?.from ?? null;
      this.unreadAll = 0;
      this.markSeen();
      this.render();
      return;
    }
    if (m.t === 'chat-error') {
      // a whisper to a name that doesn't exist: drop the empty tab it opened
      if (this.tab && !this.lines.some((l) => !l.system && this.peerOf(l) === this.tab)) {
        this.peers = this.peers.filter((p) => p !== this.tab);
        this.lines = this.lines.filter((l) => !(l.system && l.peer === this.tab));
        this.tab = null;
      }
      this.add({ system: true, peer: this.tab, text: m.text });
      addFeed({ who: '', text: m.text, color: '#ffb3c7' });
      audio.sfx('error', { vol: 0.5 });
      return;
    }
    const mine = m.from === this.me(), peer = this.peerOf(m);
    this.add(m);
    if (peer) {
      this.peers = [peer, ...this.peers.filter((p) => p !== peer)];
      if (!mine) {
        this.lastFrom = m.from;
        audio.sfx('skillUp', { vol: 0.5 });
      }
      addFeed({ who: mine ? `you → ${m.to}: ` : `${m.from} → you: `, text: m.text, color: '#ffb3e6' });
    } else {
      if (!mine && !(this.isOpen && this.tab === null)) this.unreadAll++;
      this.bubbles.set(m.from, { text: m.text, at: this.time });
      addFeed({ who: `${m.from}: `, text: m.text, color: '#b9e8ff' });
      if (!mine) audio.sfx('bubblePop', { vol: 0.25 });
    }
    this.markSeen();
    this.render();
  }
  add(l) {
    this.lines.push(l);
    if (this.lines.length > MAX_LINES) this.lines.shift();
  }

  submit() {
    let text = this.input.value.trim(), to = this.tab;
    if (!text) return this.input.blur(); // empty Enter: back to the game, the box stays up
    const w = WHISPER.exec(text);
    if (w) {
      to = w[2].toLowerCase();
      text = w[3];
      this.showTab(to);
    } else if (/^\/r(\s|$)/i.test(text)) {
      if (!this.lastFrom) return this.system('Nobody has whispered to you yet.');
      to = this.lastFrom;
      text = text.slice(2).trim();
      this.showTab(to);
    } else if (/^\/(all|e)(\s|$)/i.test(text)) {
      to = null;
      text = text.replace(/^\/\S+/, '').trim();
    } else if (text.startsWith('/')) {
      return this.system('Commands: /w name message · /r message (reply) · /all message');
    }
    this.input.value = '';
    if (text) this.send({ t: 'chat', text, to: to ?? undefined });
  }
  system(text) {
    this.add({ system: true, peer: this.tab, text });
    this.render();
  }

  render() {
    const me = this.me(), online = new Set(this.online());
    // the Chat button: how many lines you haven't seen
    const n = this.unreadAll + this.peers.reduce((s, p) => s + this.unread(p), 0);
    const label = `Chat${n ? ` (${n})` : ''}`;
    if (this.button.textContent !== label) this.button.textContent = label;
    this.button.classList.toggle('unread', this.peers.some((p) => this.unread(p)));
    if (!this.isOpen) return;
    this.tabsEl.replaceChildren();
    for (const peer of [null, ...this.peers]) {
      const b = document.createElement('button');
      b.type = 'button';
      const u = peer ? this.unread(peer) : 0;
      b.className = (peer === this.tab ? 'on' : '') + (u ? ' unread' : '');
      b.textContent = (peer ?? 'Everyone') + (u ? ` (${u})` : '');
      if (peer && !online.has(peer)) b.classList.add('away');
      b.onclick = () => {
        this.showTab(peer);
        this.input.focus();
      };
      this.tabsEl.append(b);
    }
    this.noteEl.textContent = this.tab && !online.has(this.tab) ? `${this.tab} is offline: they'll see it when they log in` : '';
    this.input.placeholder = this.tab ? `Message ${this.tab}…` : 'Say something to everyone… (/w name to whisper)';
    const atBottom = this.logEl.scrollHeight - this.logEl.scrollTop - this.logEl.clientHeight < 30;
    this.logEl.replaceChildren();
    for (const l of this.lines) {
      if (this.peerOf(l) !== this.tab) continue;
      const row = document.createElement('div');
      row.className = 'chat-line' + (l.system ? ' sys' : '');
      if (l.system) row.textContent = l.text;
      else {
        const t = document.createElement('span');
        t.className = 'chat-time';
        t.textContent = new Date(l.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const who = document.createElement('b');
        who.textContent = l.from === me ? 'you' : l.from;
        if (l.from === me) who.className = 'me';
        else {
          who.title = `Message ${l.from}`;
          who.onclick = () => {
            this.showTab(l.from);
            this.input.focus();
          };
        }
        row.append(t, who, document.createTextNode(` ${l.text}`));
      }
      this.logEl.append(row);
    }
    if (atBottom || this.logEl.dataset.tab !== String(this.tab)) this.logEl.scrollTop = this.logEl.scrollHeight;
    this.logEl.dataset.tab = String(this.tab);
  }

  update(dt) {
    this.time += dt;
    for (const [who, b] of this.bubbles) if (this.time - b.at > bubbleLife(b.text) + 1) this.bubbles.delete(who);
  }

  // Speech bubbles over slimes (on screen, in your room) who said something in public
  drawBubbles(ctx, slimes) {
    for (const s of slimes) {
      const b = this.bubbles.get(s.name);
      if (!b) continue;
      const age = this.time - b.at, a = clamp(Math.min(age * 6, bubbleLife(b.text) + 1 - age), 0, 1);
      if (a <= 0) continue;
      const x = s.x, bottom = s.y - s.h - 22;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.font = `700 12px ${FONT}`;
      const lines = wrap(ctx, b.text.replace(/\S{24}(?=\S)/g, '$& '), 190); // (long words broken up)
      if (lines.length > 4) (lines.length = 4), (lines[3] += '…');
      const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 18, h = lines.length * 15 + 10, y = bottom - h;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'rgba(40,40,60,0.35)';
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
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#4a3b5c';
      lines.forEach((l, i) => ctx.fillText(l, x - w / 2 + 9, y + 12.5 + i * 15));
      ctx.restore();
    }
  }
}
