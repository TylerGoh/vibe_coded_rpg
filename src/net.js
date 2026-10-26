// Docs: docs/netcode.md
// Client side of the multiplayer protocol (server/index.js describes the messages).
//
// Own slime: client-side prediction. Every fixed 1/60 s step we apply our input locally, remember it,
// and send it. When a snapshot arrives we take the server's state as truth, drop the inputs it has
// already applied (ack), and replay the rest — so movement feels instant but can never drift from
// the server. Any small correction is smoothed out visually rather than snapped.
//
// Everyone else: drawn INTERP ticks in the past, interpolated between the two snapshots around that
// moment, so they glide smoothly even though packets arrive unevenly.
import { TICK_RATE, newState, step, unpack, applyCharge, applyHook } from './shared/sim.js';
import { decode, encodeInput, BIN_VERSION } from './shared/wire.js';
import { installSpeed } from './shared/testspeed.js';
import { enableTestSkills } from './shared/skills.js';

const INTERP = 6; // ticks (100 ms) behind the newest snapshot for remote slimes
const MAX_SNAPS = 60;
const KICKED = 4001; // server close code: this account logged in somewhere else
const RPG = new Set(['final', 'me', 'mobs', 'loot', 'hurt', 'faint', 'woke', 'gear', 'toast', 'notice', 'advance', 'thirst', 'reborn', 'got', 'skill', 'boss', 'bossdmg', 'nomana', 'shop', 'guard', 'scrolled', 'warp', 'summons', 'sumhit', 'sumhurt', 'sumgone', 'netcatch', 'party', 'curse', 'burn', 'fields', 'fieldhit', 'burst', 'refund']);

// A knockback: same numbers as server/rpg.js hurt(), so prediction and server agree exactly
export function applyKick(s, kick) {
  s.vx = kick.vx;
  s.vy = kick.vy;
  s.grounded = s.onPlat = false;
}

export class Net {
  constructor(url, { onJoin, onLeave, onStatus, onDenied, onRtc, onNpc, onLecture, onSlap, onNote, onLand, onClass, onCast, onRpg, onStep, onChase, onHook, onHouse, onChat, onBuild, onPlaytime }) {
    this.url = url;
    this.cb = { onJoin, onLeave, onStatus, onDenied, onRtc, onNpc, onLecture, onSlap, onNote, onLand, onClass, onCast, onRpg, onStep, onChase, onHook, onHouse, onChat, onBuild, onPlaytime };
    this.id = null;
    this.me = newState(); // predicted state
    this.pending = []; // [seq, keys, kick?, charge?, hook?] not yet acknowledged
    this.afterInput = []; // messages to send right after this step's input (src/rpg.js hook / chase)
    this.seq = 0;
    this.snaps = []; // { tick, players: Map(id → state) }
    this.latest = null; // newest snapshot not yet reconciled against
    this.clockOffset = null; // serverTick ≈ now * TICK_RATE + clockOffset
    this.roster = new Map(); // id → { name, hue }
    this.correction = { x: 0, y: 0 }; // visual offset that eases a misprediction away
    this.retry = 0;
    this.profile = null;
  }

  // profile: { user, pass, hue }
  connect(profile) {
    this.profile = profile;
    this.stopped = false;
    this.cb.onStatus('connecting');
    const ws = (this.ws = new WebSocket(this.url));
    ws.binaryType = 'arraybuffer';
    ws.onopen = () => {
      this.retry = 0;
      ws.send(JSON.stringify({ t: 'hello', ...profile, bin: BIN_VERSION })); // bin: we read binary snapshots (of this version)
    };
    // snapshots and mob updates are binary (src/shared/wire.js), everything else JSON
    ws.onmessage = (e) => {
      const m = typeof e.data === 'string' ? JSON.parse(e.data) : decode(e.data);
      if (m) this.receive(m);
    };
    ws.onclose = (e) => {
      if (ws !== this.ws) return;
      this.id = null;
      for (const id of this.roster.keys()) this.cb.onLeave(id);
      this.roster.clear();
      this.snaps = [];
      // Bad password, or kicked by a newer login of this account: don't fight back, go to the login screen.
      if (this.stopped || e.code === KICKED) {
        if (!this.stopped) this.cb.onDenied(e.reason || 'Logged in somewhere else');
        this.stopped = true;
        return;
      }
      this.cb.onStatus(e.reason || 'reconnecting');
      setTimeout(() => this.connect(this.profile), Math.min(5000, 500 * 2 ** this.retry++));
    };
  }

  // Leave on purpose: close without reconnecting.
  logout() {
    this.stopped = true;
    this.ws?.close(1000, 'logout');
    this.id = null;
    for (const id of this.roster.keys()) this.cb.onLeave(id);
    this.roster.clear();
    this.snaps = [];
    this.pending = [];
  }

  // Voice chat signalling, relayed by the server to player `to` (see src/voice.js)
  sendRtc(to, d) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ t: 'rtc', to, d }));
  }

  // Start/stop broadcasting your voice to everyone (see src/voice.js)
  sendCast(on) {
    if (this.ws?.readyState === WebSocket.OPEN && this.id !== null) this.ws.send(JSON.stringify({ t: 'cast', on }));
  }

  // Talking to Elder Mochi: {t:'npc', text} or {t:'npc-open'} (see server/index.js)
  sendNpc(m) {
    if (this.ws?.readyState === WebSocket.OPEN && this.id !== null) this.ws.send(JSON.stringify(m));
  }

  receive(m) {
    if (m.t.startsWith('npc')) {
      this.cb.onNpc(m);
    } else if (m.t === 'note') {
      if (m.id !== this.id) this.cb.onNote(m.id, m.n);
    } else if (m.t === 'courses' || m.t === 'tutor' || m.t === 'tutor-error') {
      this.cb.onClass(m);
    } else if (RPG.has(m.t)) {
      if (m.t === 'gear' && this.roster.has(m.id)) Object.assign(this.roster.get(m.id), { gear: m.gear, lvl: m.lvl });
      this.cb.onRpg(m); // the Wildwood: stats, mobs, loot (src/rpg.js)
    } else if (m.t === 'house' || m.t === 'house-grew' || m.t === 'furni' || m.t === 'invite' || m.t === 'accused' || m.t === 'trade' || m.t === 'trade-ask' || m.t === 'trade-end' || m.t === 'harvested' || m.t === 'brewed') {
      this.cb.onHouse(m); // personal houses (src/house.js, src/players.js), farming and alchemy (src/alchemy.js)
    } else if (m.t === 'chat' || m.t === 'chat-log' || m.t === 'chat-error') {
      this.cb.onChat(m); // text chat and private messages (src/chat.js)
    } else if (m.t === 'playtime') {
      this.cb.onPlaytime?.(m); // the Esc menu's Play time page (src/playtime.js)
    } else if (m.t === 'slap') {
      this.cb.onSlap(m);
    } else if (m.t === 'lecture' || m.t === 'hands' || m.t === 'ask-error') {
      this.cb.onLecture(m);
    } else if (m.t === 'cast') {
      this.cb.onCast(m.id, m.on);
    } else if (m.t === 'rtc') {
      this.cb.onRtc(m.from, m.d);
    } else if (m.t === 's') {
      const now = performance.now() / 1000;
      const offset = m.k - now * TICK_RATE;
      // Track the server clock: follow it closely, but jump if we're far off (first packet, tab was asleep).
      if (this.clockOffset === null || Math.abs(offset - this.clockOffset) > 20) this.clockOffset = offset;
      // Late packets read low, so lean toward the earliest-arriving (highest) estimate.
      else this.clockOffset += (offset - this.clockOffset) * (offset > this.clockOffset ? 0.2 : 0.02);
      const players = new Map();
      for (const a of m.p) players.set(a[0], unpack(a));
      const snap = { tick: m.k, ack: m.a, players };
      this.snaps.push(snap);
      if (this.snaps.length > MAX_SNAPS) this.snaps.shift();
      this.latest = snap;
    } else if (m.t === 'denied') {
      this.stopped = true;
      this.ws.close();
      this.cb.onDenied(m.reason);
    } else if (m.t === 'welcome') {
      if (m.speed) installSpeed(m.speed, m.now); // test servers only (TEST_SPEED)
      if (m.testSkills) enableTestSkills(); // test servers only (TEST_SKILLS: SP1's test skills)
      this.id = m.id;
      this.ice = m.ice; // voice relay servers for this session (see server/turn.js)
      this.pending = [];
      this.latest = null;
      this.clockOffset = null;
      for (const p of m.players) this.addPlayer(p);
      this.me.home = this.roster.get(m.id)?.home ?? 0; // our house's room (snapshots leave it out: it never changes)
      this.cb.onStatus('online');
      this.cb.onBuild(m.build); // a newer patch is live? (src/update.js)
      for (const id of m.casts ?? []) this.cb.onCast(id, true);
    } else if (m.t === 'join') {
      this.addPlayer(m);
    } else if (m.t === 'leave') {
      this.roster.delete(m.id);
      this.cb.onLeave(m.id);
    }
  }

  addPlayer(p) {
    this.roster.set(p.id, { name: p.name, hue: p.hue, gear: p.gear, lvl: p.lvl, home: p.home });
    this.cb.onJoin(p.id, p);
  }

  // Server-authoritative reconciliation: rewind to the server's state for us, replay what it hasn't seen.
  reconcile() {
    const snap = this.latest;
    this.latest = null;
    if (!snap || this.id === null) return;
    const server = snap.players.get(this.id);
    if (!server) return;
    const before = { x: this.me.x, y: this.me.y };
    this.pending = this.pending.filter(([s]) => s > snap.ack);
    Object.assign(this.me, server); // (keeps this.me.home, which snapshots don't carry)
    for (const [, k, kick, charge, hook] of this.pending) {
      step(this.me, k);
      if (hook !== undefined) applyHook(this.me, hook); // a Hook cut short at its mob (the server's hook message does the same)
      if (kick) applyKick(this.me, kick); // a knockback we predicted at this step (the server applies it there too)
      if (charge) applyCharge(this.me); // a Charge that connected after this step (the server's slap does the same)
    }
    // Ease any visible difference away over a few frames instead of popping.
    const dx = before.x - this.me.x, dy = before.y - this.me.y;
    if (Math.hypot(dx, dy) < 80) {
      this.correction.x += dx;
      this.correction.y += dy;
    } else {
      this.correction.x = this.correction.y = 0; // teleport-sized: just snap
    }
  }

  // One fixed client step with the current keys.
  tick(keys) {
    if (this.id === null || this.ws.readyState !== WebSocket.OPEN) return;
    this.reconcile();
    this.prev = { x: this.me.x, y: this.me.y }; // for drawing between fixed steps
    const s = ++this.seq;
    const was = this.me.grounded, slam = this.me.sl, cut = this.me.uc | 0, hooks = this.me.hc | 0;
    step(this.me, keys);
    // Hook (SP2): it just fired; src/rpg.js finds the mob, sends the hook and says how many ticks the yank takes
    const hook = (this.me.hc | 0) > hooks ? this.cb.onHook?.(this.me, s) ?? 0 : undefined;
    if (hook !== undefined) applyHook(this.me, hook);
    if (!was && this.me.grounded) this.cb.onLand(this.me); // only on fresh steps, never on replays
    // the Warrior's chase moves: a Leap Slam landed, an Upward Cut went off (their hits: src/rpg.js chase)
    if (slam && !this.me.sl) this.cb.onChase?.('leap_slam', this.me, s);
    if ((this.me.uc | 0) > cut) this.cb.onChase?.('upward_cut', this.me, s);
    // the Wildwood: did a mob just hit us? (src/rpg.js decides, and returns the knockback to predict)
    const kick = this.cb.onStep?.(this.me, s);
    if (kick) applyKick(this.me, kick);
    this.pending.push([s, keys, kick, undefined, hook]);
    if (this.pending.length > 120) this.pending.shift(); // server's gone quiet; don't grow forever
    this.ws.send(encodeInput(s, keys));
    for (const f of this.afterInput.splice(0)) f(); // (a chase move's message: right after the input it happened at)
  }

  // A Charge connected with the slap sent at input `seq` (the newest: slaps go out between steps):
  // predicted now and re-applied on every replay, like a knockback. The server does it when it runs that slap.
  charge(seq) {
    const e = this.pending.find((p) => p[0] === seq);
    if (!e || e[3]) return;
    e[3] = true;
    if (seq === this.seq) applyCharge(this.me);
  }

  // The server tick other slimes (and mobs) are being drawn at: INTERP ticks behind the newest
  renderTick() {
    return this.clockOffset === null ? null : (performance.now() / 1000) * TICK_RATE + this.clockOffset - INTERP;
  }

  // Called once per rendered frame.
  smooth(dt) {
    const k = Math.exp(-dt * 18);
    this.correction.x *= k;
    this.correction.y *= k;
  }

  // Interpolated states of everyone but us, `INTERP` ticks behind the server clock.
  remotes() {
    const out = new Map();
    if (!this.snaps.length || this.clockOffset === null) return out;
    const t = performance.now() / 1000 * TICK_RATE + this.clockOffset - INTERP;
    let a = this.snaps[0], b = this.snaps[this.snaps.length - 1];
    for (let i = this.snaps.length - 1; i > 0; i--) {
      if (this.snaps[i - 1].tick <= t) {
        a = this.snaps[i - 1];
        b = this.snaps[i];
        break;
      }
    }
    const span = b.tick - a.tick;
    const f = span > 0 ? Math.min(1, Math.max(0, (t - a.tick) / span)) : 1;
    for (const [id, sb] of b.players) {
      if (id === this.id) continue;
      let sa = a.players.get(id) ?? sb;
      if (sa.room !== sb.room) sa = sb; // went through a door: no sliding between rooms
      out.set(id, {
        x: sa.x + (sb.x - sa.x) * f,
        y: sa.y + (sb.y - sa.y) * f,
        vy: sa.vy + (sb.vy - sa.vy) * f,
        vx: sa.vx + (sb.vx - sa.vx) * f,
        grounded: f < 0.5 ? sa.grounded : sb.grounded,
        facing: f < 0.5 ? sa.facing : sb.facing,
        room: sb.room,
        dt: sb.dt, bc: sb.bc, fj: sb.fj, ifr: sb.ifr, // Mobility (for their dash / blink effects)
        sl: sb.sl, uc: sb.uc, // the chase moves (their slam / cut effects)
      });
    }
    return out;
  }
}
