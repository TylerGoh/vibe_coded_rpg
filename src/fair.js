// Docs: docs/places/fair.md
// The Gathering Fair on the client: what E does there (a booth's game, a prize on the counter, a closed ride's note),
// booth mode (the camera zooms into the booth, its game runs on a card over the world while your slime stands still,
// then zooms back out), who else is at a booth, today's bests, and riding the carousel's horses (rideOf).
// Booth mode, step by step: E at an open booth → {t:'fair', a:'start', g} → the server's {a:'go', g, seed} opens the
// round ('in': the zoom) → 'play' for ROUND_S seconds (Esc / Stop ends it early, for fewer tickets) → 'done': the score
// goes to the server ({a:'end', score}) and its {a:'won'} shows the tickets → 'out': the zoom back.
import { W, H, clamp } from './util.js';
import { text } from './village.js';
import { FAIR, FAIR_GROUND, ROUND_S, FAIR_GAMES, GALLERY_W, GALLERY_H, BOOTHS, HORSES, boothAt, prizeAt, lookAt } from './shared/fair.js';
import { COSMETICS } from './shared/rpg.js';
import { keys } from './keys.js';
import { GAMES } from './fair-games.js';
import { horseBob } from './fair-art.js';

const CARD_X = (W - GALLERY_W) / 2, CARD_Y = 116; // the game card, on screen
const ZOOM_IN = 0.5, ZOOM_OUT = 0.4; // s
const DONE_S = 2.6; // how long the result shows before the zoom back (or tap / E / Esc)
const ASK_MS = 2500; // a start asked for, waiting on the server's go
const STOP = { x: CARD_X + GALLERY_W - 74, y: CARD_Y - 36, w: 74, h: 26 }; // the Stop button (phones), above the card
const ease = (k) => k * k * (3 - 2 * k);

export class Fair {
  constructor({ send, toast, audio, onOpenChange }) {
    this.send = send;
    this.toast = toast;
    this.audio = audio;
    this.onOpenChange = onOpenChange;
    this.round = null; // { g, game, t, score, phase, k, booth, result }
    this.zoom = 0;
    this.playing = new Map(); // slime id → the game it's playing (everyone else at a booth)
    this.bests = {}; // game → { name, score }, today
    this.held = new Set(); // directions held (left, right, jump = up, down)
    this.askedAt = 0;
  }

  get isOpen() {
    return !!this.round;
  }

  // walked in: today's bests. Walked out (or warped): any round is over
  enter() {
    this.send({ t: 'fair', a: 'hello' });
  }
  leave() {
    if (this.round?.phase === 'play' || this.round?.phase === 'in') this.send({ t: 'fair', a: 'end', score: this.round.score });
    if (this.round) {
      this.round = null;
      this.onOpenChange?.();
    }
    this.zoom = 0;
    this.playing.clear();
    this.held.clear();
  }

  // what E would do where you stand: { b } a booth, { prize } a prize on the counter, { look } a closed ride
  near(me) {
    if (!me || me.room !== FAIR || !me.grounded || me.onPlat || this.round) return null;
    const b = boothAt(me.x);
    if (b) return { b };
    const prize = prizeAt(me.x);
    if (prize) return { prize };
    const look = lookAt(me.x);
    return look ? { look } : null;
  }
  prompt(me, rpgMe) {
    const n = this.near(me);
    if (!n) return null;
    if (n.b) return n.b.shut ? `look at ${n.b.name}` : `play ${n.b.name} (free)`;
    if (n.prize) {
      const c = COSMETICS[n.prize];
      return rpgMe?.cosmetics?.includes(n.prize) ? `the ${c.name} (you have it)` : `trade ${c.tickets} tickets for the ${c.name}`;
    }
    return n.look.look;
  }
  // E: → true if it did something here
  use(me, rpgMe) {
    const n = this.near(me);
    if (!n) return false;
    if (n.b?.shut) this.toast(n.b.shut);
    else if (n.b) {
      if (performance.now() - this.askedAt < ASK_MS) return true;
      this.askedAt = performance.now();
      this.send({ t: 'fair', a: 'start', g: n.b.game });
    } else if (n.prize) {
      const c = COSMETICS[n.prize], have = rpgMe?.tickets ?? 0;
      if (rpgMe?.cosmetics?.includes(n.prize)) this.toast(`You already have the ${c.name}`);
      else if (have < c.tickets) {
        this.toast(`The ${c.name} is ${c.tickets} tickets, and you have ${have}. Win more at the booths!`);
        this.audio.sfx('error');
      } else this.send({ t: 'fair', a: 'prize', id: n.prize });
    } else this.toast(n.look.says);
    return true;
  }

  receive(m, myId) {
    if (m.a === 'go' && GAMES[m.g]) {
      this.askedAt = 0;
      this.round = { g: m.g, game: new GAMES[m.g](m.seed), t: 0, score: 0, phase: 'in', k: 0, booth: BOOTHS.find((b) => b.game === m.g), result: null };
      this.held.clear();
      this.audio.sfx('fairStart');
      this.onOpenChange?.();
    } else if (m.a === 'play') {
      if (m.id !== myId) this.playing.set(m.id, m.g);
    } else if (m.a === 'score') {
      this.playing.delete(m.id);
    } else if (m.a === 'won') {
      if (this.round) this.round.result = m;
      if (m.tickets) this.audio.sfx('tickets');
    } else if (m.a === 'bests') {
      this.bests = m.bests ?? {};
    } else if (m.a === 'prized') {
      this.audio.sfx('prize');
      this.toast(`Won the ${COSMETICS[m.id]?.name}! You're wearing it (Bag → Style to take it off). ${m.total} tickets left.`);
    }
  }

  update(dt) {
    const r = this.round;
    if (!r) {
      this.zoom = Math.max(0, this.zoom - dt / ZOOM_OUT);
      return;
    }
    if (r.phase === 'out') {
      this.zoom = Math.max(0, this.zoom - dt / ZOOM_OUT);
      if (this.zoom <= 0) {
        this.round = null;
        this.onOpenChange?.();
      }
      return;
    }
    this.zoom = Math.min(1, this.zoom + dt / ZOOM_IN);
    if (r.phase === 'in' && this.zoom >= 1) r.phase = 'play';
    else if (r.phase === 'play') {
      r.t += dt;
      const dir = { x: (this.held.has('right') ? 1 : 0) - (this.held.has('left') ? 1 : 0), y: (this.held.has('down') ? 1 : 0) - (this.held.has('jump') ? 1 : 0) };
      r.game.update(dt, r.t, dir);
      if (r.t >= ROUND_S) this.finish();
    } else if (r.phase === 'done') {
      r.k += dt;
      r.game.update(dt, r.t, { x: 0, y: 0 });
      if (r.k > (r.result ? DONE_S : DONE_S + 4)) r.phase = 'out';
    }
  }

  finish() {
    const r = this.round;
    if (!r || (r.phase !== 'play' && r.phase !== 'in')) return;
    r.phase = 'done';
    r.k = 0;
    this.send({ t: 'fair', a: 'end', score: r.score });
    this.audio.sfx('fairEnd');
  }
  // Esc / Stop / E after the result: stop playing (the tickets so far), or go back
  quit() {
    const r = this.round;
    if (!r) return;
    if (r.phase === 'play' || r.phase === 'in') this.finish();
    else if (r.phase === 'done' && (r.result || r.k > 1)) r.phase = 'out';
  }
  tap(x, y, i) {
    const r = this.round;
    if (r?.phase !== 'play') return;
    const pts = r.game.tap(r.t, x, y, i);
    if (pts === null) return; // (reloading)
    r.score = Math.max(0, r.score + pts);
    this.audio.sfx(pts > 0 ? (r.g === 'bonk' ? 'bonk' : 'pop') : pts < 0 ? 'error' : r.g === 'bonk' ? 'whiff' : 'plink');
  }

  // a key while a round is open (down: pressed, else released). Esc stops; the walk / jump / down keys aim; attack or
  // use fires; 1–9 bonk a hole straight away (laid out like a number pad: 7 8 9 on top)
  key(e, down) {
    const dir = ['left', 'right', 'jump', 'down'].find((d) => keys.is(e, d));
    if (dir) {
      if (down) this.held.add(dir);
      else this.held.delete(dir);
    }
    if (!down || e.repeat) return;
    if (e.code === 'Escape') return this.quit();
    if (this.round?.phase === 'done') {
      if (keys.is(e, 'use') || keys.is(e, 'attack')) this.quit();
      return;
    }
    if (keys.is(e, 'attack') || keys.is(e, 'use')) this.tap();
    const n = /^(?:Digit|Numpad)([1-9])$/.exec(e.code);
    if (n && this.round?.g === 'bonk') {
      const d = +n[1] - 1;
      this.tap(undefined, undefined, (2 - Math.floor(d / 3)) * 3 + (d % 3));
    }
  }
  // the pointer, in canvas pixels: 'move' aims, 'down' fires (or presses Stop, or closes the result)
  pointer(type, x, y) {
    const r = this.round;
    if (!r) return;
    if (type === 'down' && x >= STOP.x && x <= STOP.x + STOP.w && y >= STOP.y && y <= STOP.y + STOP.h) return this.quit();
    if (type === 'down' && r.phase === 'done') return this.quit();
    const cx = x - CARD_X, cy = y - CARD_Y;
    if (r.phase !== 'play' || cx < -30 || cx > GALLERY_W + 30 || cy < -30 || cy > GALLERY_H + 30) return;
    if (type === 'move') r.game.aim(cx, cy);
    else this.tap(cx, cy);
  }

  // A slime on one of the carousel's horses: how far it bobs with it (0 when it isn't on one)
  rideOf(s, room, time) {
    if (room !== FAIR) return 0;
    for (const h of HORSES) if (Math.abs(s.y - h.y) < 2 && s.x >= h.x - 8 && s.x <= h.x + h.w + 8) return horseBob(h.i, time);
    return 0;
  }

  // the camera, zoomed into the booth (render() calls this first, so the whole world zooms)
  applyZoom(ctx, camX) {
    const b = this.round?.booth;
    if (!b || this.zoom <= 0) return;
    const z = ease(this.zoom), s = 1 + z * 1.6, bx = b.x - camX, by = FAIR_GROUND - 140;
    ctx.translate(bx + (W / 2 - bx) * z, by + (H / 2 + 30 - by) * z);
    ctx.scale(s, s);
    ctx.translate(-bx, -by);
  }

  // a little sign over everyone else who's playing at a booth
  drawPlaying(ctx, slimeOf) {
    for (const [id, g] of this.playing) {
      const s = slimeOf(id);
      if (!s) continue;
      const w = 86, x = s.x - w / 2, y = s.y - s.h - 64;
      ctx.fillStyle = 'rgba(91,74,107,0.85)';
      ctx.beginPath();
      ctx.roundRect(x, y, w, 20, 10);
      ctx.fill();
      text(ctx, g === 'bonk' ? 'bonking!' : 'popping!', s.x, y + 10, 10, '#fff4e6');
    }
  }

  // the game card, over everything (screen space)
  drawGame(ctx, time, touch) {
    const r = this.round;
    if (!r) return;
    const a = r.phase === 'out' ? this.zoom : clamp((this.zoom - 0.45) / 0.55, 0, 1);
    ctx.save();
    ctx.fillStyle = `rgba(30,22,48,${0.5 * this.zoom})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = a;
    const [c1] = r.booth?.canopy ?? ['#ff8fa6'];
    // the frame, and the header: the game's name, the score, the time left
    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.roundRect(CARD_X - 12, CARD_Y - 44, GALLERY_W + 24, GALLERY_H + 56, 18);
    ctx.fill();
    ctx.fillStyle = '#fff4e6';
    ctx.beginPath();
    ctx.roundRect(CARD_X - 6, CARD_Y - 6, GALLERY_W + 12, GALLERY_H + 12, 10);
    ctx.fill();
    const name = FAIR_GAMES[r.g].name;
    text(ctx, name.toUpperCase(), CARD_X + 90, CARD_Y - 22, 16, '#ffffff');
    text(ctx, `score ${r.score}`, CARD_X + GALLERY_W / 2 - 30, CARD_Y - 22, 18, '#ffffff');
    const left = Math.max(0, ROUND_S - r.t);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(CARD_X + GALLERY_W / 2 + 50, CARD_Y - 27, 140, 10);
    ctx.fillStyle = left < 5 ? '#ff6f91' : '#ffffff';
    ctx.fillRect(CARD_X + GALLERY_W / 2 + 50, CARD_Y - 27, (140 * left) / ROUND_S, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.roundRect(STOP.x, STOP.y, STOP.w, STOP.h, 13);
    ctx.fill();
    text(ctx, r.phase === 'done' ? 'Back' : 'Stop', STOP.x + STOP.w / 2, STOP.y + STOP.h / 2, 12, '#5b4a6b');
    // the game itself
    ctx.save();
    ctx.translate(CARD_X, CARD_Y);
    ctx.beginPath();
    ctx.rect(0, 0, GALLERY_W, GALLERY_H);
    ctx.clip();
    r.game.draw(ctx, r.t);
    if (r.phase !== 'done' && r.t < 3) {
      // how to play, for the first moments
      ctx.globalAlpha = a * Math.min(1, (3 - r.t) * 1.5);
      ctx.fillStyle = 'rgba(30,22,48,0.7)';
      ctx.beginPath();
      ctx.roundRect(GALLERY_W / 2 - 300, GALLERY_H - 92, 600, 60, 14);
      ctx.fill();
      text(ctx, FAIR_GAMES[r.g].how, GALLERY_W / 2, GALLERY_H - 72, 13, '#fff4e6');
      const keysHow = r.g === 'bonk' ? 'click a hole, or arrows + X (or 1-9)' : 'aim with the mouse and click, or arrows + X';
      text(ctx, touch ? 'tap to play' : keysHow, GALLERY_W / 2, GALLERY_H - 50, 11, '#ffd1dc');
      ctx.globalAlpha = a;
    }
    if (r.phase === 'done') {
      ctx.fillStyle = 'rgba(30,22,48,0.72)';
      ctx.fillRect(0, 0, GALLERY_W, GALLERY_H);
      text(ctx, r.t >= ROUND_S ? 'TIME!' : 'STOPPED', GALLERY_W / 2, GALLERY_H / 2 - 70, 34, '#ffe28a');
      text(ctx, `score ${r.result?.score ?? r.score}`, GALLERY_W / 2, GALLERY_H / 2 - 24, 22, '#ffffff');
      const res = r.result;
      text(ctx, !res ? 'counting your tickets...' : res.tickets ? `+${res.tickets} ticket${res.tickets === 1 ? '' : 's'}` : 'no tickets this time', GALLERY_W / 2, GALLERY_H / 2 + 18, 26, res?.tickets ? '#ff9fb8' : '#d6c8f0');
      if (res) text(ctx, `${res.total} tickets in all · prizes at the counter by the gate`, GALLERY_W / 2, GALLERY_H / 2 + 54, 13, '#fff4e6');
    }
    ctx.restore();
    if (!touch && r.phase !== 'done') text(ctx, 'Esc to stop early (fewer tickets)', W / 2, CARD_Y + GALLERY_H + 22, 11, 'rgba(255,255,255,0.8)');
    ctx.restore();
  }
}
