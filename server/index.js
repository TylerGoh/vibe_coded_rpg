// Docs: docs/netcode.md (the protocol is documented below)
// Production server: serves the built game (dist/) at /rpg/ and the multiplayer WebSocket at /rpg/ws,
// on loopback. nginx proxies tylergoh.com/rpg/ to it. Run with: npm start (builds first) or npm run serve.
//
// The server is authoritative. Each client sends one input per 1/60 s step:
//   → {t:'hello', user, pass, hue, bin}  once, to log in (accounts: server/accounts.js)
//   → {t:'in', s:seq, k:keys}          one per client step (keys: LEFT|RIGHT|JUMP|DOWN bits)
// and every tick (60 Hz) each client gets
//   ← {t:'s', k:tick, a:lastSeqApplied, p:[[id,x,y,vx,vy,flags,drop], ...]}
// Binary: `in`, `s` and `mobs` are binary frames (src/shared/wire.js) for clients that said `bin` in
// their hello; JSON for older tabs still open from before (they can't read binary). Everything else is JSON.
// `bin` is the snapshot version the tab reads (BIN_VERSION; 1 = before the voyage clock `vt`).
// plus ← welcome / join / leave events, or ← {t:'denied', reason} for a bad login.
// Proximity voice chat is peer-to-peer WebRTC (src/voice.js); the server only relays the call setup:
//   → {t:'rtc', to, d}  is forwarded as  ← {t:'rtc', from, d}  (offers, answers, ICE candidates, byes).
// Broadcasting: → {t:'cast', on}  ← {t:'cast', id, on}  to everyone. A broadcaster is heard by every slime in
//   every room at full volume (one way: they still only hear others by proximity). The welcome's `casts`
//   lists who's broadcasting already; a broadcast ends when they leave.
// AI characters (NPCS in src/shared/sim.js, server/npc.js): Elder Mochi, Captain Brine, Curator Clio. Talking is public;
// every message carries `npc`, the character's id:
//   → {t:'npc-open', npc}           ← {t:'npc-log', npc, lines}   the recent conversation, to anyone
//   → {t:'npc', npc, text}  (standing within the character's range, in its room)
//       ← {t:'npc-say', npc, from, text}   to everyone, straight away
//       ← {t:'npc-reply', npc, to, text}   to everyone, when it answers
//       ← {t:'npc-error', npc, text}       just to the speaker (asleep, too fast, API trouble…)
//   ← {t:'npc-think', npc, on}  to everyone, so its "…" bubble shows while it's composing a reply
// Rooms: each slime's room is part of its simulated state (doors are in src/shared/sim.js). Clients only
// draw and voice-call slimes in their own room. In the lecture hall (server/lecture.js):
//   ← {t:'lecture', topic, text, n, ask?}  each new line of Prof. Synapse's lecture, to everyone in the
//                                      hall (and the current one to each slime as it walks in); `ask`
//                                      {user, text} when the line answers a student's question
//   → {t:'ask', text} raise your hand with a question · → {t:'ask-cancel'} lower it
// Courses (src/shared/courses.js), in the lecture hall and the tutoring room:
//   → {t:'vote', course}   vote for a course (or 'break' in the tutoring room); a majority of the room wins
//   ← {t:'courses', current, pending, votes:{course: n}}   to everyone in that room, whenever it changes
// Tutoring room (server/tutor.js): ← {t:'tutor', phase, course, turn, question, …} quiz state on every change;
//   → {t:'tutor-answer', text}  from the student whose turn it is
//   ← {t:'hands', users}  whose hands are up, in order · ← {t:'ask-error', text}  just to the asker
// Piano room: ← {t:'note', id, n}  to everyone in it, whenever a slime lands on a key (MIDI note n).
//   The lander's own client already played it from prediction and ignores its echo.
// Slapping: → {t:'slap', dir}  ← {t:'slap', id, dir, hits:[ids], npc?, quip?, mob?}  to everyone in that room.
//   Hits are judged here from the server's positions; npc is 'mochi' / 'prof' if one got slapped.
// The combat rooms (the stages and their dens, COMBAT_ROOMS): server/rpg.js, src/shared/rpg.js, src/shared/skills.js.
// Combat is client-decided (responsiveness first; server/rpg.js explains). These carry `s`, the client's
// latest input seq, and run once that input has been applied (ORDERED / runActions):
//   → {t:'slap', dir, s, vt, hits:[[mobId, dmg, crit]]}  ← slap gets `mobs:[[id, dmg, crit, killed]]`
//   → {t:'skill', skill, dir, s, hits, tx?, ty?}  ← {t:'skill', id, skill, dir, x, y, hits, heals?, tx?, ty?, dur?}
//   → {t:'ouch', s, mob, kind:'touch'|'charge'|'slam'|'rain', mx}  a mob hit me (the server applies the same knockback)
//   → {t:'pickup', s}
//   ← {t:'nomana'}  a skill you tried had too little MP
//   ← {t:'me', lvl, exp, next, hp, maxHp, mp, maxMp, coins, bag:[{id,n}], gear:{helmet,weapon}, atk, magic, def,
//       skills:{id:rank}, sp, hotbar:[6], potbar:[3], alt:{hotbar,potbar}, set, ap:{str,dex,int,luk}, apLeft,
//       minRoll, pvp, berserk, manaShield, fire, cls, reborn, spLeft:{novice, cls}}  your character (sp: points
//       you can spend now; a Novice's class points pile up in spLeft.cls until it chooses a class)
//   → {t:'learn'|'unlearn', skill} · {t:'respec'} · {t:'hotbar', bar:'skill'|'pot', slot, id} · {t:'pvp', on}
//   → {t:'hotswap'}  swap the hotbar for the other setup · {t:'ap', stat, n} (n < 0 takes back) · {t:'ap', reset:true}
//   → {t:'buy', item, n, shop} · {t:'sell', slot, n, shop} · {t:'buycos', id} (Boutique)  at a shop (SHOPS: Pip, Runa)
//       ← {t:'shop', ok:'buy'|'sell', item|cos, n, gold}
//   → {t:'wear', id, on} · {t:'showhelm', on}  Boutique cosmetics (gear messages carry wear / showHelmet)
//   ← {t:'mobs', k, m:[[id, kind, x, y, hp, flags, maxHp]], b?}  30 Hz to each combat room (kind: index into
//       MOB_KINDS; flags 1 facing left · 2 walking · 4 angry · 8 telegraphing · 16 charging · 32 enraged ·
//       64 slowed; b: seconds until a den's boss is back)
//   ← {t:'boss', a:'warn'|'charge'|'leap'|'slam'|'rain'|'rainHit'|'summon'|'phase'|'rage'|'ultWarn'|'ultHit'|'die', id, x, y, dir,
//       act?, dur?, marks?, r?, tx?, n? (phase), kind/name/safe/lanes/x0/speed? (ultimates)}
//   ← {t:'guard', id, what:'pop'|'block'|'secondwind'}  a Jelly Bubble / Aegis took a hit, or Second Wind saved someone
//   ← {t:'loot', l:[[id, item, n, x, y]]}  everything on the room's ground, whenever it changes
//   ← {t:'hurt', id, dmg, hp, max, by?}  a mob (or `by`, a slapping friend) hit a slime (to its room)
//   ← {t:'faint', id, by?}  a slime hit 0 HP: it splats, and wakes up in its town 1.6 s later · ← {t:'got', item, n}  you picked something up
//   ← {t:'gear', id, gear, lvl, up?}  to everyone, when someone's gear or level changes (join/welcome carry it too)
//   ← {t:'toast', text}  a short notice just for you
//   ← {t:'notice', text, news?}  a one-time message on joining (a toast and a chat line: the levelling rollback;
//       news 'classes': the S2 migration made you a Novice)
//   Classes (S2, src/shared/skills.js CLASSES): → {t:'rebirth', cls}  at the Rebirth Pool (REBIRTH_X in Slimeville):
//       choose / change your class (server/rpg.js rebirth checks level, gold, the weapon); answered by
//       ← {t:'reborn', id, cls, from} to the room, a gear message (look carries cls) and your new 'me'
//   ← {t:'advance', lvl, cls, text}  you reached an advancement level (ADVANCEMENTS): a banner
//   ← {t:'thirst', id, n}  Jelly Thirst healed slime id by n (to its room)
//   → {t:'pickup'} (Z) · → {t:'equip'|'use'|'drop', slot} (bag index) · → {t:'unequip', slot:'helmet'|'weapon'}
//   → {t:'scroll', slot, target:'helmet'|'weapon'|bagIndex}  use an enhancement scroll on a weapon / helmet
//       ← {t:'scrolled', id, result:'ok'|'fail'|'boom', item, name, left, by}  to the room (bag entries and
//       `me.gearE` carry each item's enhancement e = {u, s, atk, magic, def, hp}; look/gear carry `plus`)
//   Newer mob / boss attacks: ← {t:'boss', a:'shots'|'puddle'|'geysers'|'sweep'|'beam'|'grid'|'bombs'|'slash'|
//       'pulse'|'echo'|'diveWarn'|'mobBlink'|'bossBlink'|'eggBreak', id, x, y, dir, …}: hazards the client
//       simulates and judges (src/rpg.js), reported back as ouch kinds shot/burn/geyser/sweep/beam/zap/bomb/
//       slash/pulse. Mobs flags 128 = special; [7], [8] = Pyra's egg hp / max.
//   Inputs: k also has DASH (32) and BLINK (64); snapshots carry each slime's mobility state (sim.js pack).
//   Big bosses talk (MOBS[kind].lines): ← {t:'boss', a:'say', id, kind, text}  on walking in (just to you), at a
//   new phase and when freed (to the den).
//   Damage meter (bosses and field bosses): ← {t:'bossdmg', id, kind, d: [[name, damage], …]} most first; empty
//   when its HP was reset (respawned, or healed when left alone).
// Waystones (src/shared/waystones.js, docs/places/waystones.md): → {t:'way'} at one: attune to it (`me.ways`
//   lists yours) · → {t:'way', to} at an attuned one: the server moves you to stone `to`
//   ← {t:'warp', id, x, in?}  to the room you left and the one you arrived in (a shimmer where you were / are)
// Personal houses (server/house.js, src/shared/house.js): rooms from HOUSE_BASE up, one per account;
//   each slime's own house room (`home`) is in welcome / join info (not in snapshots: it never changes).
//   Every town (TOWNS) has a door into it; its front door lets you out into your town (`town`, in snapshots).
//   ← {t:'house', room, owner, layout}  to whoever walks into a house, and to everyone in it when it changes
//   → {t:'house-set', layout}  the owner redecorated (in their own house) · → {t:'house-kick'} send guests out
//   → {t:'house-grow', size}  the owner pays to grow it to that size ← {t:'house-grew', room, name, by}  to all inside
//   ← {t:'furni', owned, bought?}  the furniture you own (at login, and after → {t:'furni-buy', k} in the store)
//   farming and alchemy (docs/places/alchemy.md): the house message also carries farm: {plot id: [crop, ms left]}
//   → {t:'plant', plot, crop} · → {t:'harvest', plot} ← {t:'harvested', item, n}  (your own garden plots)
//   → {t:'brew', steps, n}  at an alchemy lab ← {t:'brewed', id, item, n, ok}  to the room
//   pets (docs/places/pets.md): the house message also carries pets: {pet id: [ms until its belly is empty, ms a
//   full belly lasts]}; pets are bought with furni-buy in the Pet Shop · → {t:'pet-feed', id, item}  one portion
//   of food from your bag, at a pet in the house you're in ← {t:'pet-fed', room, id, by, item}  to the room
//   → {t:'invite', to}  (from a town or your own house, to a player in a town: TOWNS in sim.js)
//       ← {t:'invite', from, name, ms}  to them · → {t:'visit', host, no?}  yes takes them into the host's house
// Botting accusations, for fun (server/accuse.js, docs/social/accuse.md): → {t:'accuse', to}  (ACCUSE_COOLDOWN_MS
//   per accuser) · → {t:'deny'}  ← {t:'accused', by?, ms?, caught?}  your state: open (ms of grace left), caught
//   (until you deny it, your EXP goes nowhere but BOT_CUT of it to `by`), or nothing (no `by`)
// Trading (server/trade.js, docs/social/trading.md): → {t:'trade-ask', to}  ← {t:'trade-ask', from, name, ms}
//   → {t:'trade-answer', from, yes} · → {t:'trade-offer', items:[{slot, n}], coins} (your whole offer)
//   → {t:'trade-ready', on, v} · → {t:'trade-cancel'}  ← {t:'trade', with, withId, v, mine, theirs}  ← {t:'trade-end', text, done}
// Text chat (server/chat.js): one public channel for everyone online, plus private messages by account name
//   → {t:'chat', text, to?}   ← {t:'chat', id, at, from, to?, text}  public: to everyone · private: to both of you
//   ← {t:'chat-log', lines:[…same shape]}  at login: recent public lines and your private ones (incl. while offline)
//   ← {t:'chat-error', text}  just to the sender (no such slime, too fast…)
// One login per account: logging in again elsewhere takes over, and the old connection is
// closed with code 4001 (the client then stops reconnecting and says why). Clients predict their own slime and reconcile
// against `a`; everyone else is interpolated a few ticks in the past.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { CLASSES } from '../src/shared/skills.js';
import { TICK_RATE, newState, step, pack, KEY_MASK, SPAWN_X, NPCS, NPC_TEXT_MAX, cleanText, VILLAGE, HALL, TUTOR, MUSEUM, MUSEUM_WINGS, EXHIBIT_SPACING, exhibitX, ROOMS, PROF_X, SLAP_REACH, SLAP_COOLDOWN_MS, SLAP_QUIPS, PIANO, pianoKeyAt, roomDef, isHouse, npcIn, VOYAGE_MAX, TOWNS, placeAt } from '../src/shared/sim.js';
import { createLecture } from './lecture.js';
import { createTutor } from './tutor.js';
import { createVote } from './vote.js';
import { WINGS } from '../src/history.js';
import { createNpc, npcConfigured } from './npc.js';
import { createRpg } from './rpg.js';
import { createHouses } from './house.js';
import { createChat } from './chat.js';
import { createAccuse } from './accuse.js';
import { createTrade } from './trade.js';
import { decode, encodeSlimes, encodeSnap, BIN_VERSION } from '../src/shared/wire.js';
import { isCombat } from '../src/shared/rpg.js';
import { CHARACTERS } from './characters.js';
import { openAccounts } from './accounts.js';
import { getIceServers, turnConfigured } from './turn.js';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DIST = process.env.DIST ? resolve(process.env.DIST) : join(ROOT, 'dist'); // tests point this at a scratch build
const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT) || 3002;
const BASE = '/rpg/';
const WS_PATH = '/rpg/ws';

const MAX_PLAYERS = 60;
const KICKED = 4001; // close code: this account logged in somewhere else
const MAX_QUEUE = 12; // buffered inputs per player; older ones are dropped so lag can't pile up
const MAX_CREDIT = 6; // a player may catch up on at most this many steps in one burst
const RTC_BURST = 60; // voice call-setup messages a player may send in a burst…
const RTC_PER_SEC = 20; // …and on average
const IDLE_TICKS = 15; // no input for this long (e.g. tab hidden) → simulate them standing still
const ORDERED = new Set(['slap', 'skill', 'ouch', 'pickup']); // carry `s`, the client's latest input seq

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

async function serveStatic(req, res) {
  const url = new URL(req.url, 'http://x');
  if (!url.pathname.startsWith(BASE)) {
    res.writeHead(404).end('not found');
    return;
  }
  const rel = decodeURIComponent(url.pathname.slice(BASE.length)) || 'index.html';
  const file = normalize(join(DIST, rel));
  if (!file.startsWith(DIST)) {
    res.writeHead(403).end('forbidden'); // path traversal
    return;
  }
  try {
    const info = await stat(file);
    const target = info.isDirectory() ? join(file, 'index.html') : file;
    const body = await readFile(target);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(target)] || 'application/octet-stream',
      'Cache-Control': rel.startsWith('assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
}

const server = createServer((req, res) => serveStatic(req, res));
const wss = new WebSocketServer({ server, path: WS_PATH, maxPayload: 64 * 1024 }) // room for WebRTC session descriptions;

const accounts = openAccounts(process.env.DB);
const npcs = new Map(NPCS.map((c) => [c.id, { ...c, ai: createNpc(accounts.path, { ...c, ...CHARACTERS[c.id] }), thinking: 0 }]));
const inRoom = (room) => [...players.values()].filter((q) => q.joined && q.state.room === room);
const inHall = () => inRoom(HALL);
const toRoom = (room) => (msg) => {
  const data = JSON.stringify(msg);
  for (const q of inRoom(room)) send(q.ws, data);
};
// (when the lecture actually switches course, everyone in the hall gets the new course state)
const lecture = createLecture((msg) => (msg.t === 'course-changed' ? toRoom(HALL)(courseState(HALL)) : toRoom(HALL)(msg)));
const tutor = createTutor(toRoom(TUTOR));
// Course votes: each room's votes, and what to do when a choice wins
const votes = new Map([
  [HALL, { vote: createVote(), current: () => lecture.course(), pending: () => lecture.pending(), apply: (c) => lecture.setCourse(c) }],
  [TUTOR, { vote: createVote(), current: () => tutor.course(), pending: () => null, apply: (c) => tutor.setCourse(c) }],
]);
// Students in a room, in the order they came in (the tutor takes turns in this order)
const namesIn = (room) => inRoom(room).sort((a, b) => a.roomSince - b.roomSince).map((q) => q.name);
function courseState(room) {
  const v = votes.get(room);
  return { t: 'courses', current: v.current(), pending: v.pending(), votes: v.vote.counts(namesIn(room)) };
}
// Re-count a room's votes (after a vote, or someone leaving) and switch course if one has a majority
function recount(room) {
  const v = votes.get(room);
  const present = namesIn(room);
  const win = v.vote.winner(present);
  if (win && win !== v.current() && win !== v.pending()) {
    v.apply(win);
    v.vote.clear();
  }
  toRoom(room)(courseState(room));
}
const players = new Map(); // id → { ws, name, hue, state, queue, ack, credit, idle, last }
const online = new Map(); // account name → player id
let nextId = 1;
let tick = 0;

const info = (p, id) => ({ id, name: p.name, hue: p.hue, home: p.state.home, ...rpg.look(p) });
const send = (ws, msg) => ws.readyState === ws.OPEN && ws.send(typeof msg === 'string' || msg instanceof Uint8Array || msg instanceof ArrayBuffer ? msg : JSON.stringify(msg));
function broadcast(msg, except) {
  const data = JSON.stringify(msg);
  for (const [id, p] of players) if (id !== except && p.joined) send(p.ws, data);
}
const rpg = createRpg({ dbPath: accounts.path, players, send, toRoom, broadcast });
const chat = createChat({ dbPath: accounts.path, players, send, users: () => accounts.list().map((a) => a.user) });
const accuse = createAccuse({ players, send });
setInterval(() => accuse.tick(), 1000).unref(); // accusations run out (deny deadlines, penalties)
const trade = createTrade({ dbPath: accounts.path, players, send, rpg });
setInterval(() => trade.tick(), 1000).unref(); // trades end when someone walks off or leaves
const houses = createHouses({ dbPath: accounts.path, players, send, toRoom, pay: rpg.pay, give: rpg.give, take: rpg.take });

// Where everyone stood when the server stopped, so a deploy doesn't send them all back to spawn
// (owner's ask). Written on shutdown, read once at startup; an account's first login within POS_KEEP_MS
// puts its slime back. House room ids change every restart, so a house is saved as "home" (your own)
// or as its front door. A game-breaking deploy: `touch data/reset-positions` first and nobody is moved.
const POS_FILE = join(dirname(accounts.path), 'positions.json');
const POS_RESET = join(dirname(accounts.path), 'reset-positions');
const POS_KEEP_MS = 15 * 60_000;
const savedPos = new Map();
try {
  if (existsSync(POS_RESET)) unlinkSync(POS_RESET);
  else if (existsSync(POS_FILE)) {
    const { at, pos } = JSON.parse(readFileSync(POS_FILE, 'utf8'));
    if (Date.now() - at < POS_KEEP_MS) for (const [user, v] of Object.entries(pos)) savedPos.set(user, v);
  }
  if (existsSync(POS_FILE)) unlinkSync(POS_FILE);
} catch (e) {
  console.error('could not read saved positions', e);
}
function savePositions() {
  const pos = {};
  for (const p of players.values()) {
    if (!p.joined) continue;
    const { room, x, vt } = p.state;
    if (!isHouse(room)) pos[p.name] = { room, x, ...(vt ? { vt } : {}) }; // (vt: mid-crossing, so the voyage goes on)
    else pos[p.name] = room === p.state.home ? { room: 'home', x } : { room: TOWNS[p.state.town | 0].room, x: TOWNS[p.state.town | 0].homeX }; // (someone else's house: their town's front door)
  }
  try {
    writeFileSync(POS_FILE, JSON.stringify({ at: Date.now(), pos }));
  } catch (e) {
    console.error('could not save positions', e);
  }
}
// Put a slime back where it stood before the restart (at most once per account). → whether it did
function restorePos(user, state) {
  const v = savedPos.get(user);
  if (!v) return false;
  savedPos.delete(user);
  const room = v.room === 'home' ? state.home : v.room;
  const r = Number.isInteger(room) && roomDef(room);
  if (!r) return false;
  state.room = room;
  state.x = Math.max(20, Math.min(r.width - 20, Number(v.x) || 0));
  state.y = r.ground;
  if (r.crossing) state.vt = Math.max(0, Math.min(VOYAGE_MAX, Number(v.vt) | 0));
  return true;
}

wss.on('connection', (ws) => {
  if (players.size >= MAX_PLAYERS) {
    ws.close(1013, 'village is full');
    return;
  }
  const id = nextId++;
  const p = { ws, actions: [], joined: false, loggingIn: false, name: '', hue: 0, state: null, queue: [], ack: 0, credit: 0, idle: 0, last: 0, alive: true, rtcTokens: RTC_BURST, rtcAt: 0 };
  players.set(id, p);

  ws.on('pong', () => (p.alive = true));
  ws.on('message', (data, isBinary) => {
    let m;
    try {
      m = isBinary ? decode(data) : JSON.parse(data);
    } catch {
      return;
    }
    if (!m) return;
    if (m.t === 'in' && p.joined) {
      const s = m.s >>> 0, k = m.k & KEY_MASK;
      if (s <= p.last) return; // duplicate or out of order
      p.last = s;
      if (k) p.keysAt = Date.now(); // for active play time (server/rpg.js clock)
      p.queue.push([s, k]);
      if (p.queue.length > MAX_QUEUE) p.queue.shift();
    } else if ((m.t === 'npc' || m.t === 'npc-open') && p.joined) {
      talkToNpc(p, m);
    } else if (m.t === 'vote' && p.joined && votes.has(p.state.room) && typeof m.course === 'string') {
      votes.get(p.state.room).vote.set(p.name, m.course.slice(0, 20));
      recount(p.state.room);
    } else if (m.t === 'tutor-answer' && p.joined && p.state.room === TUTOR) {
      const refused = tutor.answer(p.name, m.text);
      if (refused) send(p.ws, { t: 'tutor-error', text: refused });
    } else if ((m.t === 'ask' || m.t === 'ask-cancel') && p.joined && p.state.room === HALL) {
      if (m.t === 'ask-cancel') lecture.cancel(p.name);
      else {
        const refused = lecture.ask(p.name, m.text);
        if (refused) send(p.ws, { t: 'ask-error', text: refused });
      }
    } else if (ORDERED.has(m.t) && p.joined) {
      // run after the inputs the client had sent before it, so it happens where the client saw it happen
      p.actions.push(m);
      if (p.actions.length > 16) p.actions.shift();
    } else if ((m.t === 'equip' || m.t === 'unequip' || m.t === 'use' || m.t === 'drop') && p.joined) {
      rpg.item(id, p, m);
    } else if (m.t === 'scroll' && p.joined) {
      rpg.scroll(id, p, m);
    } else if (m.t === 'rebirth' && p.joined) {
      rpg.rebirth(id, p, m);
    } else if (['learn', 'unlearn', 'respec', 'hotbar', 'hotswap', 'ap', 'pvp', 'wear', 'showhelm'].includes(m.t) && p.joined) {
      rpg.skills(id, p, m);
    } else if ((m.t === 'buy' || m.t === 'sell' || m.t === 'buycos') && p.joined) {
      rpg.shop(id, p, m);
    } else if (m.t === 'way' && p.joined) {
      rpg.way(id, p, m);
    } else if (m.t === 'house-set' && p.joined) {
      houses.set(p, m);
    } else if (m.t === 'tp' && p.joined && process.env.TEST_TP) {
      // tests only (TEST_TP=1, never live): jump to {room?, x, vt?} instead of walking there; room -1 = your
      // house; vt: how far into a crossing (ticks)
      const room = m.room === -1 ? p.state.home : Number.isInteger(m.room) ? m.room : p.state.room;
      if (roomDef(room)) Object.assign(placeAt(p.state, room, Math.max(0, Math.min(roomDef(room).width, Number(m.x) || 0))), { vt: roomDef(room).crossing ? Number(m.vt) | 0 : 0 });
    } else if (m.t === 'furni-buy' && p.joined && typeof m.k === 'string') {
      houses.buy(p, m);
    } else if (m.t === 'house-grow' && p.joined) {
      houses.grow(p, m);
    } else if (m.t === 'house-kick' && p.joined) {
      houses.kick(id, p);
    } else if (m.t === 'plant' && p.joined && typeof m.crop === 'string') {
      houses.plant(p, m);
    } else if (m.t === 'harvest' && p.joined) {
      houses.harvest(p, m);
    } else if (m.t === 'pet-feed' && p.joined && Number.isInteger(m.id) && typeof m.item === 'string') {
      houses.feed(p, m);
    } else if (m.t === 'brew' && p.joined) {
      if (houses.atLab(p)) rpg.brew(id, p, m);
    } else if (m.t === 'invite' && p.joined) {
      houses.invite(id, p, m);
    } else if (m.t === 'visit' && p.joined && typeof m.host === 'string') {
      houses.visit(id, p, m);
    } else if (m.t === 'accuse' && p.joined) {
      accuse.accuse(id, p, m);
    } else if (m.t === 'trade-ask' && p.joined) {
      trade.ask(id, p, m);
    } else if (m.t === 'trade-answer' && p.joined) {
      trade.answer(id, p, m);
    } else if (m.t === 'trade-offer' && p.joined) {
      trade.offer(id, p, m);
    } else if (m.t === 'trade-ready' && p.joined) {
      trade.ready(id, p, m);
    } else if (m.t === 'trade-cancel' && p.joined) {
      trade.cancel(id, p);
    } else if (m.t === 'deny' && p.joined) {
      accuse.deny(p);
    } else if (m.t === 'chat' && p.joined) {
      chat.say(p, m);
    } else if (m.t === 'cast' && p.joined) {
      if (!!m.on !== !!p.cast) {
        p.cast = !!m.on;
        broadcast({ t: 'cast', id, on: p.cast });
      }
    } else if (m.t === 'rtc' && p.joined) {
      relayRtc(id, p, m);
    } else if (m.t === 'hello' && !p.joined && !p.loggingIn) {
      p.loggingIn = true;
      login(id, p, m).catch((e) => {
        console.error('login failed', e);
        ws.close(1011, 'server error');
      });
    }
  });
  ws.on('close', () => {
    players.delete(id);
    if (p.joined) rpg.save(p);
    if (p.joined && online.get(p.name) === id) {
      lecture.cancel(p.name);
      for (const [room, v] of votes) {
        v.vote.drop(p.name);
        if (p.state.room === room) setTimeout(() => recount(room), 0); // after they're gone from the room
      }
    }
    if (online.get(p.name) === id) online.delete(p.name);
    if (p.joined) broadcast({ t: 'leave', id });
  });
});

// Forward WebRTC signalling to another logged-in player, rate-limited so it can't be used to flood.
function relayRtc(id, p, m) {
  const to = players.get(m.to);
  if (!to?.joined || to === p || typeof m.d !== 'object' || m.d === null) return;
  const now = Date.now() / 1000;
  p.rtcTokens = Math.min(RTC_BURST, p.rtcTokens + (now - p.rtcAt) * RTC_PER_SEC);
  p.rtcAt = now;
  if (p.rtcTokens < 1) return;
  p.rtcTokens--;
  send(to.ws, { t: 'rtc', from: id, d: m.d });
}

// Is something at (x, y) within slapping reach of slime s, on side dir?
const inReach = (s, dir, x, y, extra = 0) => {
  const ahead = (x - s.x) * dir;
  return ahead > -12 && ahead < SLAP_REACH + extra && Math.abs(y - s.y) < 45 + extra;
};

// m: {dir, vt, hits}: vt is the server tick the slapper was seeing (other slimes are judged where they
// were then); hits are the mobs the slapper's own screen says it hit (server/rpg.js checks them)
function slap(id, p, m) {
  const now = Date.now(), dir = m.dir < 0 ? -1 : 1;
  if (now - (p.slapAt ?? 0) < SLAP_COOLDOWN_MS - 60) return;
  p.slapAt = now;
  const room = p.state.room;
  const hits = [];
  for (const [qid, q] of players) {
    if (qid === id || !q.joined || q.state.room !== room) continue;
    const at = rpg.playerAt(q, Number(m.vt));
    if (inReach(p.state, dir, at.x, at.y, 8)) hits.push(qid);
  }
  let npc;
  for (const c of NPCS) if (npcIn(c, room) && inReach(p.state, dir, c.x, ROOMS[room].ground, 12)) npc = c.id; // they're big slimes
  if (room === HALL && inReach(p.state, dir, PROF_X, ROOMS[HALL].platforms[0].y, 10)) npc = 'prof';
  const quip = npc && Math.floor(Math.random() * SLAP_QUIPS[npc].length);
  const mobs = isCombat(room) ? rpg.attack(id, p, dir, m.hits) : [];
  if (isCombat(room)) rpg.pvp(id, p, dir, hits);
  const data = JSON.stringify({ t: 'slap', id, dir, hits, npc, quip, mobs: mobs.length ? mobs : undefined });
  for (const q of players.values()) if (q.joined && q.state.room === room) send(q.ws, data);
}

// Where a visitor is standing in the museum, so Clio knows what "this" means
// Elder Mochi hears each speaker's level and class (he tends the Rebirth Pool, so a Lv 10+ Novice gets
// pointed at it: server/characters.js)
function whoIs(p) {
  const c = p.rpg;
  return c ? `Lv ${c.lvl} ${CLASSES[c.cls]?.name ?? 'Novice'}` : undefined;
}

function museumPlace(x) {
  for (let w = MUSEUM_WINGS.length - 1; w >= 0; w--) {
    if (x < MUSEUM_WINGS[w].x - 100) continue;
    const i = WINGS[w].findIndex((e, k) => Math.abs(x - exhibitX(w, k)) < EXHIBIT_SPACING / 2);
    return i >= 0 ? `standing at the exhibit "${WINGS[w][i].title}" in Wing ${w + 1}, ${MUSEUM_WINGS[w].name}` : `in Wing ${w + 1}, ${MUSEUM_WINGS[w].name}`;
  }
  return 'in the museum lobby';
}

// Characters marked `anywhere` (Clio) can be asked from anywhere in their room
const nearNpc = (p, c) => npcIn(c, p.state.room) && (c.anywhere || Math.hypot(p.state.x - c.x, p.state.y - ROOMS[p.state.room].ground) <= c.range + 40); // slack for lag

async function talkToNpc(p, m) {
  const c = npcs.get(m.npc ?? 'mochi');
  if (!c) return;
  if (m.t === 'npc-open') {
    send(p.ws, { t: 'npc-log', npc: c.id, lines: c.ai.recent() });
    return;
  }
  const text = cleanText(m.text, NPC_TEXT_MAX);
  if (!text) return;
  if (!nearNpc(p, c)) {
    send(p.ws, { t: 'npc-error', npc: c.id, text: `Walk a little closer to ${c.name} to talk.` });
    return;
  }
  const refused = c.ai.check(p.name);
  if (refused) {
    send(p.ws, { t: 'npc-error', npc: c.id, text: refused });
    return;
  }
  broadcast({ t: 'npc-say', npc: c.id, from: p.name, text });
  if (c.thinking++ === 0) broadcast({ t: 'npc-think', npc: c.id, on: true });
  const result = await c.ai.reply(p.name, text, c.room === MUSEUM ? museumPlace(p.state.x) : c.id === 'mochi' ? whoIs(p) : undefined);
  if (--c.thinking === 0) broadcast({ t: 'npc-think', npc: c.id, on: false });
  if (result.reply) broadcast({ t: 'npc-reply', npc: c.id, to: p.name, text: result.reply });
  else send(p.ws, { t: 'npc-error', npc: c.id, text: result.error });
}

async function login(id, p, m) {
  const acc = await accounts.login(m.user, m.pass, m.hue);
  if (p.ws.readyState !== p.ws.OPEN) return; // they left while we checked the password
  if (!acc) {
    p.loggingIn = false;
    send(p.ws, { t: 'denied', reason: 'Wrong username or password' });
    return;
  }
  const ice = await getIceServers(); // voice relay credentials (server/turn.js), or null for STUN only
  if (p.ws.readyState !== p.ws.OPEN) return;
  // Already logged in somewhere else: the new login takes over that slime, where it stands.
  let state = newState(SPAWN_X + Math.floor(Math.random() * 120));
  if (process.env.TEST_SPAWN) [state.room, state.x] = process.env.TEST_SPAWN.split(':').map(Number); // tests only: start somewhere else
  const oldId = online.get(acc.user);
  const old = players.get(oldId);
  if (old) {
    state = old.state;
    p.rpg = old.rpg; // same character, mid-fight
    p.hurtAt = old.hurtAt;
    p.faintUntil = old.faintUntil;
    p.faintBy = old.faintBy;
    p.hist = old.hist ?? []; // (lag compensation history: without it the next tick crashed)
    p.cds = old.cds ?? {};
    p.dirty = true;
    if (old.cast) broadcast({ t: 'cast', id: oldId, on: false });
    old.joined = false; // stop simulating / broadcasting it before the close lands
    players.delete(oldId);
    broadcast({ t: 'leave', id: oldId });
    old.ws.close(KICKED, 'Logged in somewhere else');
  }
  online.set(acc.user, id);
  p.joined = true;
  p.bin = m.bin === true ? 1 : Math.max(0, Math.min(BIN_VERSION, m.bin | 0)); // reads binary snapshots / mob updates of this version (src/shared/wire.js)
  p.name = acc.user;
  p.hue = acc.hue;
  p.state = state;
  state.home = houses.homeOf(acc.user);
  if (old) p.invites = old.invites;
  if (!p.rpg) rpg.load(p);
  if (!old) {
    // your town (docs/world.md): you start there, unless your spot from before a restart was kept
    state.town = p.rpg.town;
    const town = TOWNS[state.town];
    if (!process.env.TEST_SPAWN && (p.goHome || !restorePos(acc.user, state)) && town.room !== VILLAGE) placeAt(state, town.room, town.x + Math.floor(Math.random() * 120));
  }
  send(p.ws, { t: 'welcome', id, tick, rate: TICK_RATE, ice, players: [...players].filter(([, q]) => q.joined).map(([i, q]) => info(q, i)), casts: [...players].filter(([, q]) => q.joined && q.cast).map(([i]) => i) });
  broadcast({ t: 'join', ...info(p, id) }, id);
  rpg.sendMe(p);
  houses.sendOwned(p);
  chat.sendLog(p);
  rpg.entered(p);
  houses.entered(p);
  accuse.entered(p);
}

// Save everyone's character before a restart (deploys restart the service)
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => {
    for (const p of players.values()) if (p.joined) rpg.save(p);
    savePositions();
    process.exit(0);
  });
}

// Drop connections that stopped answering pings (e.g. a phone that went to sleep).
setInterval(() => {
  for (const p of players.values()) {
    if (!p.alive) p.ws.terminate();
    p.alive = false;
    p.ws.ping();
  }
}, 10000).unref();

// One simulation step for a player, announcing piano notes when they land on a key
function stepPlayer(id, p, keys) {
  const was = p.state.grounded, town = p.state.town;
  step(p.state, keys);
  if (p.state.town !== town && p.rpg) {
    p.dirty = true; // (saved with the character: server/rpg.js save)
    send(p.ws, { t: 'toast', text: `${TOWNS[p.state.town].name} is your town now: you'll wake up here, and your front door opens onto it` });
  }
  if (!was && p.state.grounded && p.state.room === PIANO) {
    const n = pianoKeyAt(p.state);
    if (n !== null) {
      const data = `{"t":"note","id":${id},"n":${n}}`;
      for (const q of players.values()) if (q.joined && q.state.room === PIANO) send(q.ws, data);
    }
  }
}

// Slaps, skills, pickups and ouches the client sent after input `s`: run once that input has been
// applied (or straight away if we're not waiting on any more inputs)
function runActions(id, p, all) {
  while (p.actions.length && (all || (p.actions[0].s >>> 0) <= p.ack)) {
    const m = p.actions.shift();
    if (m.t === 'slap') slap(id, p, m);
    else if (m.t === 'skill') rpg.cast(id, p, m);
    else if (m.t === 'ouch') rpg.ouch(id, p, m);
    else if (m.t === 'pickup') rpg.pickup(p);
  }
}

function update() {
  tick++;
  for (const [id, p] of players) {
    if (!p.joined) continue;
    // Each input is exactly one simulation step. Credits refill one per tick, so a client can
    // catch up after a hiccup but can't run faster than real time on average.
    p.credit = Math.min(MAX_CREDIT, p.credit + 1);
    let stepped = 0;
    while (p.queue.length && p.credit >= 1) {
      const [s, k] = p.queue.shift();
      stepPlayer(id, p, p.faintUntil ? 0 : k); // splatted: can't move until you wake up
      p.ack = s;
      p.credit--;
      stepped++;
      runActions(id, p, false);
    }
    p.idle = stepped ? 0 : p.idle + 1;
    if (p.idle > IDLE_TICKS) stepPlayer(id, p, 0); // still fall to the ground while their tab is asleep
    runActions(id, p, p.idle > 2 || !p.queue.length); // nothing left to wait for
    if (p.state.room !== p.room) {
      // walked through a door: drop their vote in the room they left, and catch them up on the new one
      const left = p.room;
      p.room = p.state.room;
      p.roomSince = tick;
      if (votes.has(left)) {
        votes.get(left).vote.drop(p.name);
        recount(left);
      }
      if (votes.has(p.room)) toRoom(p.room)(courseState(p.room));
      const line = lecture.current();
      if (p.room === HALL && line) send(p.ws, { t: 'lecture', ...line });
      if (p.room === HALL) send(p.ws, { t: 'hands', users: lecture.hands() });
      else lecture.cancel(p.name); // left the hall: hand goes down
      if (p.room === TUTOR) send(p.ws, tutor.state());
      rpg.entered(p);
      houses.entered(p);
    }
  }
  rpg.tick(tick);
  if (tick % TICK_RATE === 0) {
    lecture.tick(namesIn(HALL));
    tutor.tick(namesIn(TUTOR));
  }

  const snap = [];
  for (const [id, p] of players) if (p.joined) snap.push(pack(id, p.state));
  const slimes = [], json = []; // made once per version, only in the formats someone needs
  for (const p of players.values()) {
    if (!p.joined) continue;
    if (p.bin) send(p.ws, encodeSnap(tick, p.ack, (slimes[p.bin] ??= encodeSlimes(snap, p.bin))));
    else send(p.ws, `{"t":"s","k":${tick},"a":${p.ack},"p":${(json[0] ??= JSON.stringify(snap))}}`);
  }
}

// Fixed 60 Hz loop. setInterval drifts, so schedule against the clock and run any missed ticks.
const TICK_MS = 1000 / TICK_RATE;
let nextAt = performance.now();
function loop() {
  const now = performance.now();
  let n = 0;
  while (now >= nextAt && n < 5) {
    update();
    nextAt += TICK_MS;
    n++;
  }
  if (now - nextAt > 250) nextAt = now; // way behind (process was suspended): don't spiral
  setTimeout(loop, Math.max(0, nextAt - performance.now()));
}
loop();

server.listen(PORT, HOST, () => {
  console.log(`Slime village on http://${HOST}:${PORT}${BASE} (ws ${WS_PATH})`);
  console.log(turnConfigured() ? 'Voice: Cloudflare TURN relay enabled' : 'Voice: STUN only (no TURN_KEY_ID / TURN_KEY_API_TOKEN)');
  console.log(npcConfigured() ? 'Elder Mochi: DeepSeek enabled' : 'Elder Mochi: asleep (no DEEPSEEK_API_KEY)');
  getIceServers(); // fetch the first credentials now, so a bad key shows up in the log straight away
});
