// Docs: docs/netcode.md, docs/ui/hints.md (main.js wires every feature; see the index in Agent.md)
import { W, H, rand, clamp } from './util.js';
import { drawBackground, setBackgroundResolution } from './background.js';
import { envAt } from './environment.js';
import { Slime, paletteFor } from './slime.js';
import { Particles } from './particles.js';
import { drawVillage, text } from './village.js';
import { Net } from './net.js';
import { Voice } from './voice.js';
import { Character, drawFeed, dialogOpen, closeDialog, onTrade } from './npc.js';
import { Hall } from './hall.js';
import { Piano } from './piano.js';
import { Museum } from './museum.js';
import { Tutor } from './tutor.js';
import { CourseMenu } from './courses-ui.js';
import { Rpg, bar } from './rpg.js';
import { drawPrompts, drawBeacon, drawDoorBand } from './hints.js';
import { drawField } from './field.js';
import { audio } from './audio.js';
import { FIELD, FJORD, CLIFFS_PATH_X, HIGHLANDS, CALDERA, CALDERA_DOOR_X, CITADEL, CITADEL_DOOR_X, WILLOWMERE, COVES, MYCELIUM, GLOWROOT, CANOPY, WRECK, THORNHEART, SPINE, STAGES, zoneAt, isCombat, denAt, DENS, SHOP_X, SHOP_RANGE, PETSHOP, ITEMS } from './shared/rpg.js';
import { drawHighlands } from './highlands.js';
import { drawCaldera, drawCalderaPass } from './caldera.js';
import { drawCitadel, drawSkylift } from './citadel.js';
import { drawDen, drawDenEntrance } from './dens.js';
import { SkillTree } from './skilltree.js';
import { Shop } from './shop.js';
import { Houses } from './house.js';
import { Store } from './store.js';
import { Alchemy } from './alchemy.js';
import { Pets } from './pets.js';
import { drawPetShop } from './petshop.js';
import { FURNITURE } from './shared/house.js';
import { Players } from './players.js';
import { Trade } from './trade.js';
import { Accuse } from './accuse.js';
import { Chat } from './chat.js';
import { WorldMap } from './worldmap.js';
import { drawHarbour } from './harbour.js';
import { drawFjord } from './fjord.js';
import { drawCrossing, drawCrossingFront, crossingAt, crossingLabel } from './crossing.js';
import { drawCliffs, drawCliffsPath, Telescope, scopeNear } from './cliffs.js';
import { drawRuins, ruinStoneAt, RUIN_STONES } from './ruins.js';
import { GATES, gateAt } from './shared/branches.js';
import { drawGates, drawEntries } from './branch-gates.js';
import { drawWillowmere } from './willowmere.js';
import { drawCoves } from './coves.js';
import { drawDeep } from './deep.js';
import { drawGlowroot } from './glowroot.js';
import { drawCanopy } from './canopy.js';
import { drawWreck } from './wreck.js';
import { drawThornheart } from './thornheart.js';
import { drawSpine } from './spine.js';
import { wayAt } from './shared/waystones.js';
import { drawWaystones, wayPrompt, wayBeacons, WayCard, shimmer } from './waystones.js';
import { fastGradients } from './fastcanvas.js';
import { gfx } from './gfx.js';
import { TOUCH, setupTouch, toggleFullscreen, fullscreenSupported, isIPhone } from './touch.js';
import { HOTBAR, SKILLS, rankOf } from './shared/skills.js';
import { DT, WORLD_W, LEFT, RIGHT, JUMP, DOWN, USE, DASH, BLINK, cleanHue, ROOMS, roomDef, isHouse, VILLAGE, HALL, PIANO, MUSEUM, TUTOR, doorAt, pianoKeyAt, NPCS, PROF_X, SLAP_QUIPS, SLAP_COOLDOWN_MS, STORE, HARBOUR, CLIFFS, CLIFFS_SCOPE_X, doorOpen, npcIn } from './shared/sim.js';

const canvas = document.getElementById('game');
const stage = document.getElementById('stage');
const joinPanel = document.getElementById('join');
const nameInput = document.getElementById('name');
const passInput = document.getElementById('pass');
const errorLine = document.getElementById('error');
const menu = document.getElementById('menu');
const micButton = document.getElementById('mic');
const castButton = document.getElementById('cast');
const swatches = document.getElementById('swatches');
const ctx = fastGradients(canvas.getContext('2d')); // big gradient fills drawn as cached strips (docs/performance.md)
const ENV = envAt(0); // a sunny day in the village
const HUES = [148, 200, 265, 320, 350, 28, 48, 175];

// ——— canvas sizing (same approach as Slime Hop) ———
let scale = 1;
function resize() {
  const view = document.documentElement;
  const s = Math.min(view.clientWidth / W, view.clientHeight / H);
  const dpr = devicePixelRatio || 1;
  canvas.style.width = `${W * s}px`;
  canvas.style.height = `${H * s}px`;
  scale = Math.min(s * dpr, gfx.cap); // the Graphics setting (src/gfx.js): High up to 2, Low 1
  gfx.settle();
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  stage.style.setProperty('--s', s);
  setBackgroundResolution(scale);
}
resize();
addEventListener('resize', resize);
addEventListener('orientationchange', () => setTimeout(resize, 150));

// ——— login screen ———
// Only the username and colour are remembered here; the browser's password manager can keep the password.
let profile = { name: '', hue: HUES[0] };
try {
  profile = { ...profile, ...JSON.parse(localStorage.getItem('slimeville-profile') || '{}') };
} catch {}
nameInput.maxLength = 12;
nameInput.value = profile.name;
const preview = new Slime(profile.hue);

for (const hue of HUES) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'swatch';
  b.style.background = `linear-gradient(${paletteFor(hue).top}, ${paletteFor(hue).bottom})`;
  b.style.borderColor = paletteFor(hue).line;
  b.setAttribute('aria-label', `Colour ${hue}`);
  b.onclick = () => pickHue(hue);
  b.dataset.hue = hue;
  swatches.append(b);
}
function pickHue(hue) {
  profile.hue = hue;
  preview.palette = paletteFor(hue);
  for (const b of swatches.children) b.classList.toggle('on', Number(b.dataset.hue) === hue);
}
pickHue(cleanHue(profile.hue));
nameInput.addEventListener('input', () => preview.setName(nameInput.value));
for (const el of [nameInput, passInput]) el.addEventListener('input', () => (errorLine.textContent = ''));
preview.setName(profile.name);

let joined = false; // playing (or trying to): the login panel is hidden
let status = 'connecting';
const slimes = new Map(); // id → Slime (everyone else)
let mine = null;
const particles = new Particles();

const fx = {
  land(s, vy) {
    const n = Math.min(8, 2 + Math.floor(vy / 250));
    for (let i = 0; i < n; i++) {
      particles.add({ x: s.x + rand(-18, 18), y: s.y - 2, vx: rand(-70, 70), vy: rand(-90, -20), g: 300, size: rand(2.5, 4.5), color: '#fff6e0', life: rand(0.25, 0.45) });
    }
  },
  jump(s) {
    if (s === mine) audio.sfx('jump', { vol: 0.5 });
    for (let i = 0; i < 3; i++) particles.add({ x: s.x + rand(-10, 10), y: s.y, vx: rand(-40, 40), vy: rand(-30, 0), size: rand(2, 3.5), color: '#ffffff', life: 0.3 });
  },
};

const wsUrl = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}${import.meta.env.BASE_URL}ws`;
const net = new Net(wsUrl, {
  onJoin(id, p) {
    if (id === net.id) return;
    const s = new Slime(p.hue);
    s.setName(p.name);
    s.setLook(p); // gear, Boutique cosmetics
    s.lvl = p.lvl;
    s.pvp = p.pvp;
    slimes.set(id, s);
  },
  onLeave(id) {
    slimes.delete(id);
    voice.close(id);
    voice.setCast(id, false);
  },
  onCast(id, on) {
    voice.setCast(id, on);
    showMic();
  },
  onRtc(from, d) {
    voice.receive(from, d);
  },
  onNpc(m) {
    characters.get(m.npc ?? 'mochi')?.receive(m);
  },
  onLecture(m) {
    hall.receive(m);
  },
  // course votes (lecture hall / tutoring room) and the tutor's quiz
  onClass(m) {
    if (m.t === 'courses') {
      courseMenu.receive(m);
      if (room === HALL) hall.receive(m);
    } else tutor.receive(m);
  },
  // someone else landed on a piano key (ours play straight from prediction, in onLand)
  onNote(id, n) {
    const s = slimes.get(id);
    if (room === PIANO) piano.play(n, s?.visible ? s.x : mine?.x ?? 0, mine?.x ?? 0);
  },
  onLand(st) {
    const n = pianoKeyAt(st);
    if (n !== null) piano.play(n, st.x, st.x);
  },
  // the Wildwood (src/rpg.js): stats, mobs, loot, gear and level changes
  onRpg(m) {
    if (m.t === 'me') queueMicrotask(() => trade.refresh()); // the bag changed while trading
    if (m.t === 'warp') {
      // someone vanished from (or appeared at) a waystone in our room
      if (m.id === net.id && m.in) warpedIn = time;
      else if (m.id !== net.id && online()) shimmer(particles, m.x, roomDef(room).ground);
      if (m.id !== net.id || !m.in) audio.sfx('warp', { vol: m.id === net.id ? 1 : 0.5 });
      return;
    }
    if (m.t === 'gear') {
      const s = m.id === net.id ? mine : slimes.get(m.id);
      if (s) {
        s.setLook(m);
        s.lvl = m.lvl;
        s.pvp = m.pvp;
        if (m.up && (s === mine || s.visible)) levelUp(s);
      }
    } else if (m.t === 'hurt') {
      const s = m.id === net.id ? mine : slimes.get(m.id);
      if (s) Object.assign(s, { hp: m.hp, maxHp: m.max, hpAt: time }); // a little HP bar over them for a while
      if (isCombat(room)) rpg.hurt(s?.visible || s === mine ? s : null, m.dmg, m.id === net.id);
    } else if (m.t === 'faint') {
      const s = m.id === net.id ? mine : slimes.get(m.id);
      if (s && isCombat(room) && (s === mine || s.visible)) splat(s, m.id === net.id);
    } else {
      if (m.t === 'guard') return rpg.guard(m, m.id === net.id ? mine : slimes.get(m.id), m.id === net.id);
      rpg.receive(m, { mine, myId: net.id, slimeOf: (id) => (id === net.id ? mine : slimes.get(id)) });
      if (m.t === 'me') {
        if (mine) {
          mine.setLook(m);
          Object.assign(mine, { lvl: m.lvl, pvp: m.pvp });
          // our buffs and shields, as the server sees them (in rpg.time)
          for (const b of ['berserk', 'rally', 'bubble', 'aegis']) mine[`${b}Until`] = rpg.time + (m[b] ?? 0) / 1000;
        }
        alchemy.gotMe(m);
        skillTree.render();
        shop.render();
        showPvp();
      }
    }
  },
  // every fixed step: did a mob just hit us? (src/rpg.js; returns a knockback to predict)
  onStep(me, seq) {
    return rpg.step(me, seq, !!mine && splatted(mine));
  },
  // personal houses: a house's layout, or someone inviting us over
  onHouse(m) {
    if (m.t === 'house') houses.receive(m);
    else if (m.t === 'house-grew') houses.grew(m);
    else if (m.t === 'furni') houses.receiveOwned(m), store.bought(m);
    else if (m.t === 'pet-fed') pets.fed(m, profile.name);
    else if (m.t === 'harvested' || m.t === 'brewed') alchemy.receive(m, { myId: net.id, slimeOf: (id) => (id === net.id ? mine : slimes.get(id)?.visible ? slimes.get(id) : null) });
    else if (m.t === 'accused') accuse.receive(m);
    else if (m.t.startsWith('trade')) trade.receive(m);
    else players.receive(m);
  },
  onChat(m) {
    chat.receive(m);
  },
  onSlap(m) {
    const slapper = m.id === net.id ? mine : slimes.get(m.id);
    let boltDur = 0; // someone else's staff bolt: their hits show when it lands
    if (slapper && slapper !== mine) {
      slapper.slap(m.dir); // ours already swung when we clicked
      if (slapper.visible) audio.sfx(weaponSound(slapper), { pan: clamp((slapper.x - (mine?.x ?? 0)) / 500, -1, 1), vol: 0.5 });
      if (slapper.visible && isCombat(room) && ITEMS[slapper.gear?.weapon]?.kind === 'staff') boltDur = rpg.otherBolt(slapper, m.dir, m.mobs);
    }
    if (m.mobs && isCombat(room) && m.id !== net.id) rpg.othersHits(m.mobs, mine?.x ?? 0, boltDur); // ours already showed
    const struck = [];
    for (const id of m.hits) {
      const s = id === net.id ? mine : slimes.get(id);
      if (s) {
        s.wince();
        struck.push([s.x, s.y - s.h * 0.5]);
      }
    }
    const c = characters.get(m.npc);
    if (c && npcIn(c.cfg, room)) {
      c.slapped(SLAP_QUIPS[c.cfg.id][m.quip]);
      struck.push([c.cfg.x, c.ground - 35]);
    } else if (m.npc === 'prof' && room === HALL) {
      hall.slapped(SLAP_QUIPS.prof[m.quip]);
      struck.push([PROF_X, ROOMS[HALL].platforms[0].y - 35]);
    }
    for (const [x, y] of struck) impact(x - m.dir * 6, y);
  },
  onStatus(s) {
    status = s;
    if (s === 'online') voice.setIceServers(net.ice);
    if (s !== 'online') voice.reset(); // dropped: calls are tied to the old connection's ids
    showMic();
    if (s === 'online') {
      try {
        localStorage.setItem('slimeville-profile', JSON.stringify({ name: profile.name, hue: profile.hue }));
      } catch {}
    }
  },
  // wrong password, or this account logged in somewhere else: back to the login panel
  onDenied(reason) {
    showLogin(reason);
  },
});

// ——— AI characters: Elder Mochi in the village, Curator Clio in the museum ———
const characters = new Map(NPCS.map((cfg) => [cfg.id, new Character(cfg, {
  send: (m) => net.sendNpc(m),
  onOpenChange: () => held.clear(), // no walking off while typing to them
})]));
const charsHere = () => [...characters.values()].filter((c) => npcIn(c.cfg, room));
const museum = new Museum({ onOpenChange: () => held.clear() });
const scope = new Telescope(); // the telescope on the east cliffs (src/cliffs.js)
// Clio can be asked from anywhere in the museum (Q, the Ask button, or a fact sheet's "Ask Clio")
const askClio = (prefill = '') => {
  museum.close();
  characters.get('clio').ask(prefill);
};
document.getElementById('sheet-ask').onclick = () => askClio(`Tell me more about ${museum.reading?.title ?? 'this'}`);
const tutor = new Tutor({ send: (m) => net.sendNpc(m), me: () => profile.name });
const touch = setupTouch();
const courseMenu = new CourseMenu({ send: (m) => net.sendNpc(m), onOpenChange: () => held.clear() });

const piano = new Piano();
const rpg = new Rpg({ send: (m) => net.sendNpc(m), net, onOpenChange: () => held.clear() });
rpg.onSlot = (bar, i) => useSlot(bar, i);
rpg.onGear = (gear) => mine && mine.setLook({ ...rpg.me, gear });
const skillTree = new SkillTree({ rpg, send: (m) => net.sendNpc(m), onOpenChange: () => held.clear() });
const shop = new Shop({ rpg, send: (m) => net.sendNpc(m), onOpenChange: () => held.clear() });
onTrade((keeper) => shop.open(keeper)); // a character who keeps a shop: the Trade button in their dialog (Runa)
// Merchant Pip, behind his stall in the village (src/shop.js)
const merchant = new Slime(48);
merchant.accessories = ['merchant'];
merchant.name = 'Merchant Pip';
// Personal houses (src/house.js) and who's online, with invites (src/players.js)
const houses = new Houses({ send: (m) => net.sendNpc(m), me: () => profile.name, gold: () => rpg.me?.coins ?? 0, view: () => camX + W / 2, toast: (t) => rpg.toast(t), onOpenChange: () => held.clear() });
houses.who = () => [...slimes.values(), ...(mine && net.id !== null ? [mine] : [])].filter((s) => s.visible !== false); // (who's on a swing)
const store = new Store({ send: (m) => net.sendNpc(m), gold: () => rpg.me?.coins ?? 0, owned: () => houses.owned, toast: (t) => rpg.toast(t) });
// Garden plots and the alchemy lab in houses (src/alchemy.js)
const alchemy = new Alchemy({ send: (m) => net.sendNpc(m), rpg, houses, onOpenChange: () => held.clear() });
// Feeding pets in houses (src/pets.js; the Pet Shop sells them through the store's card, src/petshop.js)
const pets = new Pets({ send: (m) => net.sendNpc(m), rpg, houses, onOpenChange: () => held.clear() });
const players = new Players({ net, houses, send: (m) => net.sendNpc(m), self: () => ({ name: profile.name, hue: profile.hue, lvl: rpg.me?.lvl }), onOpenChange: () => held.clear() });
// Being accused of botting (src/accuse.js): the deny button is drawn on the canvas, somewhere random
const accuse = new Accuse({ send: (m) => net.sendNpc(m), W, H });
// Text chat and private messages (src/chat.js); the Players panel's Message buttons open a private tab
const chat = new Chat({ send: (m) => net.sendNpc(m), me: () => profile.name, online: () => [...net.roster.values()].map((r) => r.name), onOpenChange: () => held.clear() });
rpg.onAnnounce = (line) => chat.announce(line); // a field boss turning up (or beaten) in your room
// Trading coins and items with someone standing near you (src/trade.js, server/trade.js)
const trade = new Trade({ send: (m) => net.sendNpc(m), rpg, onOpenChange: () => held.clear() });
players.onTrade = (id) => {
  players.close();
  trade.ask(id);
};
players.onMessage = (name) => {
  players.close();
  chat.open(name);
};
const hudButtons = document.getElementById('hudbtns');
const whoButton = document.getElementById('who');
const decoButton = document.getElementById('decorate');
whoButton.onclick = () => {
  if (online()) players.toggle();
  whoButton.blur();
};
decoButton.onclick = () => {
  houses.startEditing(room);
  decoButton.blur();
};
const nearShop = () => online() && room === VILLAGE && Math.abs(net.me.x - SHOP_X) < SHOP_RANGE;
// The hotbar: 1–6 skills, 7–9 potions (keys, clicks or taps)
function useSlot(bar, i) {
  if (!online()) return;
  audio.unlock();
  if (rpg.finishAssign(bar, i)) return;
  const id = rpg.slotContent(bar, i);
  if (!id) return rpg.toast(bar === 'pot' ? 'Empty: put potions here from the bag (I)' : 'Empty: put skills here from the skill tree (K)');
  if (bar === 'pot') return rpg.drink(id);
  if (splatted(mine)) return;
  if (SKILLS[id]?.kind === 'move') return pressMove(id);
  if (rpg.cast(id, mine, mine.facing, net.seq, mine) && ['strike', 'spin'].includes(SKILL_KIND(id))) mine.slap(mine.facing);
}
// Dash / Blink from the hotbar: hold their input bit for a few steps (the physics acts on the press)
let moveBits = 0, moveSteps = 0;
// A door with `ask` (a ship's gangway) is confirmed first: the card's Set sail sends the E press itself,
// so the door is still taken inside step() like any other (docs/places/crossings.md)
const sail = {
  door: null,
  el: document.getElementById('sail'),
  open(d) {
    this.door = d;
    document.getElementById('sail-text').textContent = d.ask;
    this.el.hidden = false;
    held.clear();
  },
  close() {
    this.door = null;
    this.el.hidden = true;
  },
  go() {
    if (this.door && doorAt(net.me) === this.door) {
      moveBits |= USE;
      moveSteps = 1;
    }
    this.close();
  },
};
document.getElementById('sail-go').onclick = () => sail.go();
// Waystones (docs/places/waystones.md): E at one you haven't touched attunes to it; at one you have, a card
// lists the other stones you know and the server takes you there
const ways = new WayCard((to) => net.sendNpc({ t: 'way', to }));
function useWaystone() {
  const at = wayAt(net.me), have = rpg.me?.ways ?? [];
  if (!have.includes(at.id)) return net.sendNpc({ t: 'way' });
  if (!have.some((id) => id !== at.id)) return rpg.toast('The waystone hums. Touch another one somewhere on the island and you can travel between them.');
  held.clear();
  ways.open(at, have);
}
let warpedIn = -9; // when the server last moved us by waystone (the shimmer waits for the new room)
document.getElementById('sail-no').onclick = () => sail.close();
function pressMove(id) {
  if (!rankOf(rpg.me?.skills, id)) return rpg.toast(`You haven't learned ${SKILLS[id].name} yet (press K)`), audio.sfx('error');
  moveBits |= id === 'dash' ? DASH : BLINK;
  moveSteps = 3;
}
// Dash / Blink / Flash Jump effects, for anyone: spotted from changes in their physics state
function moveFx(s, st) {
  const was = s.mvWas ?? st;
  s.mvWas = { dt: st.dt ?? 0, bc: st.bc ?? 0, fj: !!st.fj, x: st.x, y: st.y };
  if (!was || st === was) return;
  const vol = s === mine ? 0.8 : 0.4, pan = clamp((st.x - (mine?.x ?? st.x)) / 500, -1, 1), follow = () => ({ x: s.x, y: s.y });
  if ((st.dt ?? 0) > 0 && !(was.dt > 0)) {
    rpg.fx.spawn('dash', { x: st.x, y: st.y, dir: st.facing ?? s.facing ?? 1 });
    rpg.fx.spawn('iframe', { follow, dur: 0.3 });
    audio.sfx('dash', { pan, vol });
  }
  if ((st.bc ?? 0) > was.bc + 5) {
    rpg.fx.spawn('blink', { x0: was.x, x1: st.x, y: st.y });
    rpg.fx.spawn('iframe', { follow, dur: 0.35 });
    audio.sfx('blink', { pan, vol });
  }
  if (st.fj && !was.fj) {
    rpg.fx.spawn('flashjump', { x: st.x, y: st.y, dir: st.facing ?? 1 });
    audio.sfx('flashJump', { pan, vol });
  }
}
const SKILL_KIND = (id) => ({ power_strike: 'strike', sky_splitter: 'strike', cleave: 'strike', whirlwind: 'spin', blade_storm: 'spin' })[id]; // (these swing the sword)
// ——— fainting: the slime goes splat into a puddle of its own jelly (then wakes up in the village) ———
const SPLAT_TIME = 1.6;
const splats = []; // { s, x, y, at, seed }
function splat(s, isMe) {
  s.splatAt = time;
  splats.push({ s, x: s.x, y: s.y, at: time, seed: Math.random() * 100 });
  for (let i = 0; i < 16; i++) {
    particles.add({ x: s.x + rand(-14, 14), y: s.y - rand(8, 26), vx: rand(-260, 260), vy: rand(-430, -150), g: 1100, size: rand(3, 7), color: i % 3 ? s.palette.top : s.palette.bottom, life: rand(0.5, 0.9) });
  }
  rpg.pop(s.x, s.y - 50, 'SPLAT!', '#ff6f91', 26);
  audio.sfx('faint', { pan: clamp((s.x - (mine?.x ?? 0)) / 500, -1, 1), vol: isMe ? 1 : 0.6 });
  if (isMe) held.clear();
}
const splatted = (s) => s.splatAt !== undefined && time - s.splatAt < SPLAT_TIME;
function drawSplats() {
  for (let i = splats.length - 1; i >= 0; i--) {
    const p = splats[i], k = (time - p.at) / SPLAT_TIME;
    if (k > 1) {
      splats.splice(i, 1);
      continue;
    }
    const pal = p.s.palette, spread = 1 - (1 - Math.min(1, k * 7)) ** 3; // splats out fast, then settles
    ctx.save();
    ctx.globalAlpha = Math.min(1, (1 - k) * 4);
    ctx.translate(p.x, p.y);
    const blob = (x, y, rx, ry) => {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    };
    ctx.fillStyle = pal.bottom;
    ctx.strokeStyle = pal.line;
    ctx.lineWidth = 2;
    for (let j = 0; j < 4; j++) {
      // little splotches flung around the puddle
      const a = p.seed + j * 1.9, d = (34 + (j % 2) * 16) * spread;
      blob(Math.cos(a) * d * 1.3, -2 + Math.sin(a) * 2, 4 + (j % 3), 2.5);
    }
    const g = ctx.createLinearGradient(0, -14, 0, 0);
    g.addColorStop(0, pal.top);
    g.addColorStop(1, pal.bottom);
    ctx.fillStyle = g;
    const rx = 18 + 30 * spread, ry = 22 - 13 * spread + Math.sin(k * 40) * 1.2 * (1 - k);
    ctx.beginPath(); // the puddle, wobbling a little as it settles
    ctx.ellipse(0, -ry * 0.55, rx, ry, 0, Math.PI, 0);
    ctx.lineTo(rx, 0);
    ctx.ellipse(0, 0, rx, 3, 0, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.ellipse(-rx * 0.45, -ry * 0.9, rx * 0.16, 2, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2d2a3e'; // x x eyes and a wobbly little mouth
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    const ey = -ry * 0.55;
    ctx.beginPath();
    for (const ex of [-8, 8]) {
      ctx.moveTo(ex - 3, ey - 3); ctx.lineTo(ex + 3, ey + 3);
      ctx.moveTo(ex + 3, ey - 3); ctx.lineTo(ex - 3, ey + 3);
    }
    ctx.moveTo(-3, ey + 6);
    ctx.quadraticCurveTo(0, ey + 4, 3, ey + 6);
    ctx.stroke();
    ctx.restore();
  }
}

// a burst of sparkles and a "LEVEL UP!" over a slime
function levelUp(s) {
  for (let i = 0; i < 18; i++) {
    const a = rand(0, Math.PI * 2), v = rand(60, 180);
    particles.add({ x: s.x, y: s.y - 25, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, g: 120, drag: 2, size: rand(3, 6), color: i % 3 ? '#ffe28a' : '#c9b6ff', shape: 'sparkle', vr: rand(-6, 6), life: rand(0.6, 1) });
  }
  rpg.pop(s.x, s.y - 80, 'LEVEL UP!', '#ffe28a', 24);
}
const hall = new Hall({
  send: (m) => net.sendNpc(m),
  onOpenChange: () => held.clear(), // no walking off while typing a question
});

// ——— proximity voice chat ———
const voice = new Voice((to, d) => net.sendRtc(to, d));
let micError = '';
const casting = () => net.id !== null && voice.casters.has(net.id);
function showMic() {
  micButton.hidden = !joined;
  micButton.classList.toggle('on', voice.micOn);
  micButton.textContent = micError || (voice.micOn ? 'Mic on' : 'Mic off') + (TOUCH ? '' : ' · M');
  castButton.hidden = !joined || status !== 'online';
  castButton.classList.toggle('on', casting());
  castButton.textContent = (casting() ? 'Live to all' : 'Broadcast') + (TOUCH ? '' : ' · B');
}
async function toggleMic() {
  try {
    micError = '';
    await voice.setMic(!voice.micOn);
  } catch (e) {
    console.warn('microphone refused', e);
    micError = window.isSecureContext ? 'Mic blocked' : 'Mic needs https';
  }
  if (!voice.micOn && casting()) net.sendCast(false); // no mic, nothing to broadcast
  showMic();
}
// Broadcast: everyone online, in every room, hears you at full volume (src/voice.js). Turns the mic on.
async function toggleCast() {
  if (casting()) {
    net.sendCast(false);
    return;
  }
  if (!voice.micOn) await toggleMic();
  if (voice.micOn) net.sendCast(true);
}
micButton.onclick = () => {
  toggleMic();
  micButton.blur(); // so Space jumps instead of pressing the button again
};
castButton.onclick = () => {
  toggleCast();
  castButton.blur();
};

function showLogin(message = '') {
  voice.reset();
  joined = false;
  mine = null;
  held.clear();
  menu.hidden = true;
  closeDialog();
  museum.close();
  courseMenu.close();
  tutor.hide();
  hall.closeAsk();
  rpg.close();
  rpg.assign = null;
  skillTree.close();
  shop.close();
  players.close();
  players.invites = [];
  trade.reset();
  accuse.reset();
  chat.close();
  chat.lines = [];
  houses.stopEditing();
  showMic();
  joinPanel.hidden = false;
  errorLine.textContent = message;
  passInput.value = '';
  (nameInput.value ? passInput : nameInput).focus();
}

// ——— Esc menu ———
function toggleMenu(open = menu.hidden) {
  menu.hidden = !open;
  showControls(false);
  showMap(false);
  held.clear(); // no walking while the menu is up
  if (open) {
    document.getElementById('resume').focus();
    showVoiceStatus();
    hbSwapButton.textContent = `Hotbar: swap to setup ${2 - (rpg.me?.set ?? 0)}`;
  } else document.activeElement?.blur();
}

// Voice call status in the Esc menu, refreshed while it's open — for figuring out why someone can't be heard.
const voiceStatus = document.getElementById('voice-status');
const STATE_TEXT = { new: 'calling…', connecting: 'connecting…', connected: 'connected', disconnected: 'reconnecting…', failed: 'failed', closed: 'ended' };
async function showVoiceStatus() {
  if (menu.hidden) return;
  const rows = await voice.status();
  const relay = voice.hasRelay ? 'relay available' : 'no relay (direct only)';
  voiceStatus.replaceChildren();
  const head = document.createElement('div');
  head.className = 'vs-head';
  head.textContent = `Voice · ${voice.micOn ? 'mic on' : 'mic off'} · ${relay}`;
  voiceStatus.append(head);
  if (!rows.length) {
    const none = document.createElement('div');
    none.textContent = 'No slimes nearby';
    voiceStatus.append(none);
  }
  for (const r of rows) {
    const row = document.createElement('div');
    row.className = `vs-row vs-${r.state}`;
    const who = net.roster.get(r.id)?.name ?? `slime ${r.id}`;
    const hear = r.state === 'connected' ? ` · volume ${Math.round(r.volume * 100)}%` : '';
    row.textContent = `${who}: ${STATE_TEXT[r.state] ?? r.state}${r.route ? ` (${r.route})` : ''}${hear}`;
    voiceStatus.append(row);
  }
  setTimeout(showVoiceStatus, 1000);
}
document.getElementById('resume').onclick = () => toggleMenu(false);
const fsButton = document.getElementById('fullscreen');
fsButton.hidden = !fullscreenSupported();
fsButton.onclick = () => {
  toggleFullscreen();
  toggleMenu(false);
};
document.getElementById('ios-tip').hidden = !isIPhone();
addEventListener('fullscreenchange', () => setTimeout(resize, 100));
// Music on / off (sound effects stay on); src/audio.js remembers the choice
const musicButton = document.getElementById('music');
const showMusic = () => (musicButton.textContent = `Music: ${audio.musicOn ? 'on' : 'off'}`);
// Friendly fire: slaps in the Wildwood only hurt between two players who both have it on
const pvpButton = document.getElementById('pvp');
function showPvp() {
  pvpButton.textContent = `Friendly fire: ${rpg.me?.pvp === false ? 'off' : 'on'}`;
}
pvpButton.onclick = () => {
  rpg.setPvp(!rpg.me?.pvp);
  showPvp();
};
rpg.onPvp = showPvp;
// the two hotbar setups: swapped only from here, on purpose (no hotkey: it's part of the skill ceiling)
const hbSwapButton = document.getElementById('hbswap');
hbSwapButton.onclick = () => {
  rpg.swapHotbar();
  toggleMenu(false);
};
// Graphics: auto / high / low (src/gfx.js; Auto drops to low on a slow machine)
const gfxButton = document.getElementById('gfx');
const showGfx = () => (gfxButton.textContent = gfx.label());
gfx.onChange(() => {
  resize();
  showGfx();
});
showGfx();
gfxButton.onclick = () => gfx.cycle();
showMusic();
musicButton.onclick = () => {
  audio.setMusic(!audio.musicOn);
  showMusic();
};
// Controls: every key (or touch button), in the Esc menu instead of as labels on the HUD (owner's request)
const CONTROLS = TOUCH
  ? [['◀ ▶', 'walk'], ['Jump', 'jump (twice with Flash Jump)'], ['▼', 'drop through a platform'], ['E', 'doors, talk, read, use, waystones'],
     ['Tap the game', 'slap · Hit attacks'], ['Loot', 'pick things up'], ['Hotbar', 'skills and potions'], ['Bag · Skills', 'your bag and skill tree'],
     ['Players', "who's online, invite, message"], ['Chat', 'chat · /w name to whisper · /r to reply'], ['Decorate', 'in your own house'],
     ['Mic · Broadcast', 'talk to slimes nearby · to everyone'], ['Menu', 'this menu']]
  : [['← → / A D', 'walk'], ['↑ / W / Space', 'jump (twice with Flash Jump)'], ['↓ / S', 'drop through a platform'], ['E', 'doors, talk, read, use, waystones'],
     ['Click', 'slap · attack'], ['X', 'attack'], ['Z', 'pick things up'], ['1–6 · 7–9', 'skills · potions'], ['Shift · V', 'Dash · Blink'],
     ['I · K', 'bag · skill tree'], ['P', "who's online, invite, message"], ['Enter', 'chat · /w name to whisper · /r to reply'],
     ['R', 'decorate your house'], ['C · H · Q', 'course menu · raise your hand · ask Clio'], ['M · B', 'mic · broadcast to everyone'],
     ['F', 'fullscreen'], ['Esc', 'this menu']];
const controlsList = document.getElementById('controls-list');
for (const [k, what] of CONTROLS) {
  const dt = document.createElement('dt'), dd = document.createElement('dd');
  dt.textContent = k;
  dd.textContent = what;
  controlsList.append(dt, dd);
}
function showControls(on) {
  menu.classList.toggle('help', on);
  document.getElementById('controls').hidden = !on;
  if (on) document.getElementById('controls-back').focus();
}
document.getElementById('controls-open').onclick = () => showControls(true);
document.getElementById('controls-back').onclick = () => {
  showControls(false);
  document.getElementById('controls-open').focus();
};
// World map: a teaser chart of the Glass Sea (src/worldmap.js), drawn only while its page is open
const worldMap = new WorldMap(document.getElementById('worldmap-canvas'));
function showMap(on) {
  menu.classList.toggle('mapview', on);
  document.getElementById('worldmap').hidden = !on;
  if (on) {
    worldMap.show(room, cleanHue(profile.hue), online() ? net.me.x : 0);
    document.getElementById('map-back').focus();
  } else worldMap.hide();
}
document.getElementById('map-open').onclick = () => showMap(true);
document.getElementById('map-back').onclick = () => {
  showMap(false);
  document.getElementById('map-open').focus();
};
document.getElementById('logout').onclick = () => {
  net.logout();
  showLogin('Logged out — see you soon!');
};

function join() {
  profile.name = nameInput.value.trim().toLowerCase();
  if (!profile.name || !passInput.value) {
    errorLine.textContent = 'Enter your username and password';
    return;
  }
  errorLine.textContent = '';
  joinPanel.hidden = true;
  document.activeElement?.blur();
  mine = new Slime(profile.hue);
  mine.setName(profile.name);
  joined = true;
  hintTime = 0;
  voice.unlock(); // this click is the user gesture browsers want before playing audio
  piano.unlock();
  audio.unlock();
  showMic();
  net.connect({ user: profile.name, pass: passInput.value, hue: profile.hue });
}
joinPanel.addEventListener('submit', (e) => {
  e.preventDefault();
  join();
});

// ——— slapping: click (or tap) to slap toward that side ———
const pops = []; // "SLAP!" words floating up from hits
function impact(x, y) {
  for (let i = 0; i < 8; i++) {
    const a = rand(0, Math.PI * 2), v = rand(80, 200);
    particles.add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, g: 200, drag: 3, size: rand(3, 6), color: i % 2 ? '#ffe28a' : '#ffffff', shape: 'sparkle', vr: rand(-8, 8), life: rand(0.3, 0.5) });
  }
  pops.push({ x, y: y - 20, at: time, tilt: rand(-0.25, 0.25) });
  if (pops.length > 8) pops.shift();
}
let lastSlap = 0;
// what a slap sounds like with what's in hand: a sword swings, a staff fires (its bolt), a mitten slaps
const weaponSound = (s) => ({ sword: 'swing', staff: 'staffBolt' })[ITEMS[s.gear?.weapon]?.kind] ?? 'slap';
// In the Wildwood a slap (or a sword swing, with one equipped) also hits mobs
// (what it hits is decided right here from what's on screen, and shown straight away: src/rpg.js)
function slapToward(dir) {
  if (performance.now() - lastSlap < SLAP_COOLDOWN_MS || splatted(mine)) return;
  lastSlap = performance.now();
  mine.slap(dir); // swing straight away
  audio.sfx(weaponSound(mine), { vol: 0.7 });
  const hits = rpg.slapHits(mine, dir);
  net.sendNpc({ t: 'slap', dir, s: net.seq, vt: Math.round(net.renderTick() ?? 0), hits });
}
canvas.addEventListener('pointerdown', (e) => {
  piano.unlock();
  audio.unlock();
  if (online()) {
    const r = canvas.getBoundingClientRect();
    if (accuse.tap(((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H)) return; // "Not a bot!"
  }
  if (!online() || !menu.hidden || dialogOpen() || hall.askOpen || museum.isOpen || courseMenu.isOpen || rpg.isOpen || skillTree.isOpen || shop.isOpen || players.isOpen || trade.isOpen || alchemy.isOpen || pets.isOpen || e.button > 0) return;
  const r = canvas.getBoundingClientRect();
  if (scope.isOpen) return scope.tap((e.clientX - r.left) / r.width); // looking through the telescope
  const worldX = camX + ((e.clientX - r.left) / r.width) * W;
  if (houses.editing) return houses.pointer('down', worldX, ((e.clientY - r.top) / r.height) * H); // decorating: put down / pick up
  slapToward(Math.sign(worldX - mine.x) || mine.facing);
});
canvas.addEventListener('pointermove', (e) => {
  if (!houses.editing) return;
  const r = canvas.getBoundingClientRect();
  houses.pointer('move', camX + ((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H);
});

// ——— input ———
const held = new Set();
const KEYMAP = {
  ArrowLeft: LEFT, KeyA: LEFT, ArrowRight: RIGHT, KeyD: RIGHT,
  ArrowUp: JUMP, KeyW: JUMP, Space: JUMP, ArrowDown: DOWN, KeyS: DOWN,
  KeyE: USE, // go through doors (talking to characters and reading exhibits are handled before this)
  ShiftLeft: DASH, ShiftRight: DASH, KeyV: BLINK, // the Mobility skills (they do nothing until learned)
};
addEventListener('keydown', (e) => {
  if (!joined) return;
  piano.unlock(); // any key press counts as the gesture browsers need before playing sound
  audio.unlock();
  const typing = document.activeElement?.tagName === 'INPUT';
  if (dialogOpen() || hall.askOpen || typing) {
    // typing to a character, a question or an answer: keys go to the text box, Esc closes it / lets go
    if (e.code === 'Escape') {
      e.preventDefault();
      if (chat.typing) chat.close();
      closeDialog();
      hall.closeAsk();
      document.activeElement?.blur();
    }
    return;
  }
  // the waystone card: Esc or E closes it, number keys pick a stone
  if (ways.isOpen) {
    e.preventDefault();
    if (e.code === 'Escape' || (e.code === 'KeyE' && !e.repeat)) ways.close();
    else if (/^Digit[1-9]$/.test(e.code)) ways.list.children[Number(e.code.slice(5)) - 1]?.click();
    return;
  }
  // boarding a ship: E or Enter sets sail, Esc thinks better of it
  if (sail.door) {
    e.preventDefault();
    if (e.code === 'Escape') sail.close();
    else if ((e.code === 'KeyE' || e.code === 'Enter') && !e.repeat) sail.go();
    return;
  }
  // the trade window: Esc calls the trade off
  if (trade.isOpen) {
    if (e.code === 'Escape') {
      e.preventDefault();
      trade.cancel();
    }
    return;
  }
  // the bag (I), the skill tree (K) and the shop: their key or Esc closes them (the rest is clicks / taps)
  for (const [panel, code] of [[rpg, 'KeyI'], [skillTree, 'KeyK'], [shop, 'KeyE'], [players, 'KeyP'], [alchemy, 'KeyE'], [pets, 'KeyE']]) {
    if (!panel.isOpen) continue;
    if (e.code === 'Escape' || (e.code === code && !e.repeat)) {
      e.preventDefault();
      panel.close();
    }
    return;
  }
  // decorating your house: Esc / R finishes, Delete removes, F flips; walking and doors still work
  if (houses.editing && !e.repeat) {
    if (e.code === 'Escape' || e.code === 'KeyR') {
      e.preventDefault();
      houses.stopEditing();
      return;
    }
    if (houses.key(e.code)) {
      e.preventDefault();
      return;
    }
  }
  if (e.code === 'Escape' && chat.isOpen) {
    e.preventDefault();
    chat.close();
    return;
  }
  if (e.code === 'KeyP' && !e.repeat && menu.hidden && online()) {
    e.preventDefault();
    players.open();
    return;
  }
  if (e.code === 'KeyR' && !e.repeat && menu.hidden && online() && houses.isMine(room)) {
    e.preventDefault();
    houses.startEditing(room);
    return;
  }
  if (e.code === 'Escape' && rpg.assign) {
    e.preventDefault();
    rpg.assign = null; // stop choosing a hotbar slot
    return;
  }
  if (e.code === 'KeyI' && !e.repeat && menu.hidden && online()) {
    e.preventDefault();
    rpg.toggle();
    return;
  }
  if (e.code === 'KeyK' && !e.repeat && menu.hidden && online()) {
    e.preventDefault();
    skillTree.toggle();
    return;
  }
  const digit = /^Digit([1-9])$/.exec(e.code);
  if (digit && !e.repeat && menu.hidden && online()) {
    e.preventDefault();
    const n = Number(digit[1]) - 1;
    useSlot(n < HOTBAR ? 'skill' : 'pot', n < HOTBAR ? n : n - HOTBAR);
    return;
  }
  if (e.code === 'KeyE' && !e.repeat && menu.hidden && nearShop()) {
    e.preventDefault();
    shop.open();
    return;
  }
  if (e.code === 'KeyZ' && menu.hidden && isCombat(room) && online()) {
    e.preventDefault();
    rpg.pickup(net.me, net.seq); // held Z keeps picking things up
    return;
  }
  if (e.code === 'KeyX' && menu.hidden && isCombat(room) && online()) {
    e.preventDefault();
    slapToward(mine.facing);
    return;
  }
  if (courseMenu.isOpen) {
    if (e.code === 'Escape' || e.code === 'KeyC') {
      e.preventDefault();
      courseMenu.close();
    }
    return;
  }
  if (e.code === 'KeyC' && !e.repeat && menu.hidden && (room === HALL || room === TUTOR) && online()) {
    e.preventDefault();
    courseMenu.open(room === TUTOR);
    return;
  }
  if (e.code === 'Enter' && room === TUTOR && tutor.myTurn) {
    e.preventDefault();
    tutor.input.focus(); // back to the answer box
    return;
  }
  if ((e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Slash') && !e.repeat && menu.hidden && online()) {
    e.preventDefault();
    chat.focus(); // the chatbox (/ starts a command)
    if (e.code === 'Slash' && !chat.input.value) chat.input.value = '/';
    return;
  }
  if (museum.isOpen) {
    // reading a fact sheet: ← → browse, Esc or E closes
    e.preventDefault();
    if (e.code === 'Escape' || (e.code === 'KeyE' && !e.repeat)) museum.close();
    else if (e.code === 'ArrowLeft' || e.code === 'KeyA') museum.browse(-1);
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') museum.browse(1);
    return;
  }
  if (scope.isOpen) {
    // looking through the telescope: ← → swing it, Esc or E steps back
    e.preventDefault();
    if (e.code === 'Escape' || (e.code === 'KeyE' && !e.repeat)) scope.close();
    else if (!e.repeat && (e.code === 'ArrowLeft' || e.code === 'KeyA')) scope.turn(-1);
    else if (!e.repeat && (e.code === 'ArrowRight' || e.code === 'KeyD')) scope.turn(1);
    return;
  }
  if (e.code === 'KeyH' && !e.repeat && menu.hidden && room === HALL && online()) {
    e.preventDefault();
    hall.toggleHand(profile.name);
    return;
  }
  const talkTo = e.code === 'KeyE' && !e.repeat && menu.hidden && charsHere().find((c) => c.near);
  if (talkTo) {
    e.preventDefault();
    talkTo.open();
    return;
  }
  if (e.code === 'KeyQ' && !e.repeat && menu.hidden && room === MUSEUM && online()) {
    e.preventDefault();
    askClio();
    return;
  }
  if (e.code === 'KeyE' && !e.repeat && menu.hidden && online() && !houses.editing && alchemy.use(room, net.me)) {
    e.preventDefault(); // a garden plot or an alchemy lab
    return;
  }
  if (e.code === 'KeyE' && !e.repeat && menu.hidden && online() && !houses.editing && pets.use(room, net.me)) {
    e.preventDefault(); // a pet: its card, to feed it
    return;
  }
  if (e.code === 'KeyE' && !e.repeat && menu.hidden && (room === STORE || room === PETSHOP) && (store.isOpen || store.near)) {
    e.preventDefault();
    if (store.isOpen) store.close();
    else store.open();
    return;
  }
  if (e.code === 'Escape' && store.isOpen) {
    e.preventDefault();
    store.close();
    return;
  }
  if (e.code === 'KeyE' && !e.repeat && menu.hidden && room === MUSEUM && museum.near) {
    e.preventDefault();
    museum.open();
    return;
  }
  if (e.code === 'KeyE' && !e.repeat && menu.hidden && online() && wayAt(net.me)) {
    e.preventDefault();
    useWaystone(); // a waystone: attune, or pick where to go (docs/places/waystones.md)
    return;
  }
  if (e.code === 'KeyE' && !e.repeat && menu.hidden && online() && ruinStoneAt(net.me)) {
    e.preventDefault();
    museum.open(ruinStoneAt(net.me)); // a Keeper stone, on the museum's fact-sheet card
    return;
  }
  if (e.code === 'KeyE' && !e.repeat && menu.hidden && online() && gateAt(net.me, room)) {
    e.preventDefault();
    rpg.toast(gateAt(net.me, room).says); // a blocked way into a branch (docs/places/branches.md)
    return;
  }
  if (e.code === 'KeyE' && !e.repeat && menu.hidden && room === CLIFFS && online() && scopeNear(net.me)) {
    e.preventDefault();
    held.clear();
    scope.show();
    return;
  }
  if (e.code === 'KeyE' && !e.repeat && menu.hidden && online() && doorAt(net.me)?.ask) {
    e.preventDefault();
    sail.open(doorAt(net.me)); // a ship's gangway: ask first (docs/places/crossings.md)
    return;
  }
  if (e.code === 'Escape') {
    e.preventDefault();
    toggleMenu();
    return;
  }
  if (!menu.hidden) return;
  if (e.code === 'KeyF' && !e.repeat) {
    toggleFullscreen();
    return;
  }
  if (e.code === 'KeyM' && !e.repeat) {
    toggleMic();
    return;
  }
  if (e.code === 'KeyB' && !e.repeat && online()) {
    toggleCast();
    return;
  }
  if (!(e.code in KEYMAP)) return;
  e.preventDefault();
  held.add(e.code);
  if ((KEYMAP[e.code] & (DASH | BLINK)) && !e.repeat) {
    // latched for a few steps, so even the quickest tap reaches the physics
    moveBits |= KEYMAP[e.code];
    moveSteps = 3;
  }
});
addEventListener('keyup', (e) => held.delete(e.code));
addEventListener('blur', () => held.clear());
const keys = () => {
  if (mine && splatted(mine)) return 0; // the server ignores us until we wake up anyway
  if (scope.isOpen) return 0; // standing still at the telescope
  let k = 0;
  for (const c of held) k |= KEYMAP[c];
  if (moveSteps > 0) {
    k |= moveBits;
    if (--moveSteps === 0) moveBits = 0;
  }
  return k;
};

// ——— loop ———
let camX = 0;
let time = 0;
let acc = 0;
let hintTime = 0;
let room = VILLAGE; // the room we're in (and drawing)
const online = () => joined && net.id !== null && mine;

// realDt: actual time since the last frame (up to 0.25 s), used for the fixed simulation steps.
function update(realDt) {
  // Animations (jelly wobble, particles…) never step more than 1/30 s at once: after tabbing back
  // the first frame can be huge, and one big step turns the wobble spring inside out.
  const dt = Math.min(realDt, 1 / 30);
  time += dt;
  hintTime += dt;
  // Fixed 60 Hz simulation steps, in lockstep with the server's tick.
  if (joined) {
    acc = Math.min(acc + realDt, DT * 5);
    while (acc >= DT) {
      net.tick(keys());
      acc -= DT;
    }
    net.smooth(dt);
  }

  const newRoom = online() ? net.me.room : VILLAGE;
  if (newRoom !== room) {
    room = newRoom;
    gfx.settle();
    camX = clamp((online() ? net.me.x : 0) - W / 2, 0, roomDef(room).width + (roomDef(room).viewPad ?? 0) - W); // no panning across rooms
    particles.list = [];
    ways.close();
    if (time - warpedIn < 1.5 && mine) shimmer(particles, net.me.x, net.me.y);
    hall.closeAsk();
    museum.close();
    scope.close();
    courseMenu.close();
    courseMenu.myVote = null;
    shop.close();
    store.leave();
    alchemy.close();
    pets.close();
    houses.stopEditing();
    if (online()) audio.sfx('door');
  }
  if (online()) audio.setScene(room, STAGES[room] ? zoneAt(net.me.x, room).name : null);
  rpg.update(dt, online() ? net.me : null, room);
  if ((room === STORE || room === PETSHOP) && online()) store.update(net.me, room);
  if (online()) alchemy.update(room, net.me);
  if (online()) pets.update(room, net.me);
  if (room === VILLAGE) merchant.animate(dt, { x: SHOP_X + 20, y: ROOMS[VILLAGE].ground, vx: 0, vy: 0, grounded: true, facing: mine && mine.x < SHOP_X + 20 ? -1 : 1 });

  const remote = net.remotes();
  for (const [id, s] of slimes) {
    const st = remote.get(id);
    s.visible = !!st && st.room === room; // only slimes in the same room are seen (and heard)
    if (s.visible) s.animate(dt, st, fx);
    if (s.visible) moveFx(s, st);
    else s.mvWas = null;
  }

  if (joined && net.id !== null && mine) {
    // everyone online, in any room: voice.js decides who's in earshot (or broadcasting)
    const everyone = new Map();
    for (const [id, st] of remote) if (slimes.has(id)) everyone.set(id, st);
    voice.update({ id: net.id, x: mine.x, y: mine.y, room }, everyone);
    for (const [id, s] of slimes) s.talk = ease(s.talk, voice.levelOf(id), dt);
    mine.talk = ease(mine.talk, voice.micLevel, dt);
  }

  for (const c of characters.values()) c.update(dt, online() && npcIn(c.cfg, room) ? mine : null);
  if (sail.door && !(online() && doorAt(net.me) === sail.door)) sail.close(); // walked off the gangway
  if (room === MUSEUM) museum.update(dt, online() ? net.me : null);
  if (scope.isOpen) scope.update(dt);
  tutor.update(dt, online() && room === TUTOR);
  players.showCard();
  trade.showCard();
  chat.update(dt);
  chat.button.hidden = !online() || !TOUCH; // phones only: keyboards open the chat with Enter (owner's call)
  whoButton.hidden = !online();
  hudButtons.classList.toggle('combat', isCombat(room)); // below the HP / MP panel there
  decoButton.hidden = !online() || !houses.isMine(room) || houses.editing;
  touch.update({
    playing: !!online(),
    courses: room === HALL || room === TUTOR,
    hand: room === HALL,
    ask: room === MUSEUM,
    field: isCombat(room),
    dash: !!rankOf(rpg.me?.skills, 'dash'),
    blink: !!rankOf(rpg.me?.skills, 'blink'),
    overlay: dialogOpen() || hall.askOpen || museum.isOpen || courseMenu.isOpen || rpg.isOpen || skillTree.isOpen || shop.isOpen || players.isOpen || trade.isOpen || alchemy.isOpen || pets.isOpen || !menu.hidden || document.activeElement?.tagName === 'INPUT',
  });
  if (room === PIANO) piano.update(dt);
  if (room === HALL) hall.update(dt, [...slimes.values()].filter((s) => s.visible).length + 1);

  let focusX;
  if (joined && net.id !== null) {
    // between the last two fixed steps, plus whatever correction is still easing out
    const a = acc / DT, prev = net.prev ?? net.me;
    const x = prev.x + (net.me.x - prev.x) * a + net.correction.x;
    const y = prev.y + (net.me.y - prev.y) * a + net.correction.y;
    mine.animate(dt, { ...net.me, x, y }, fx);
    moveFx(mine, net.me);
    focusX = x;
  } else {
    focusX = WORLD_W / 2 + Math.sin(time * 0.08) * (WORLD_W / 2 - W / 2); // slow pan behind the title
    preview.animate(dt, { x: 0, y: 0, vx: 0, vy: 0, grounded: true, facing: 1 });
  }
  const target = clamp(focusX - W / 2, 0, roomDef(room).width + (roomDef(room).viewPad ?? 0) - W); // viewPad: the cliffs look out past their edge
  camX += (target - camX) * (joined ? Math.min(1, dt * 8) : 1);
  particles.update(dt);
}

// quick to rise, slower to fall, so the speaking bubble doesn't flicker between words
const ease = (v = 0, target, dt) => v + (target - v) * Math.min(1, dt * (target > v ? 25 : 6));

// A little speech bubble with bouncing sound bars over a slime that's talking.
function drawTalk(s) {
  const k = clamp((s.talk - 0.08) / 0.25, 0, 1);
  if (k <= 0) return;
  const x = s.x + 22 * s.facing, y = s.y - s.h - 16;
  ctx.save();
  ctx.globalAlpha = Math.min(1, k * 2);
  ctx.translate(x, y);
  ctx.scale(0.7 + 0.3 * k, 0.7 + 0.3 * k);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = 'rgba(40,40,60,0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(-17, -11, 34, 22, 11);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath(); // tail toward the slime
  ctx.moveTo(-6 * s.facing, 9);
  ctx.lineTo(-12 * s.facing, 16);
  ctx.lineTo(-1 * s.facing, 10);
  ctx.fill();
  ctx.fillStyle = paletteFor(s.hue ?? 148).line;
  for (let i = 0; i < 4; i++) {
    const h = 4 + Math.abs(Math.sin(time * 14 + i * 1.7)) * 10 * Math.min(1, s.talk * 1.5);
    ctx.beginPath();
    ctx.roundRect(-10.5 + i * 6, -h / 2, 3.5, h, 1.75);
    ctx.fill();
  }
  ctx.restore();
}

function nameTag(s, mineTag) {
  const label = (s.name || 'slime') + (isCombat(room) && s.lvl ? ` · Lv ${s.lvl}` : '');
  ctx.font = "700 12px Fredoka, 'Trebuchet MS', sans-serif";
  const w = ctx.measureText(label).width + 14;
  ctx.fillStyle = 'rgba(45,42,62,0.62)';
  ctx.beginPath();
  ctx.roundRect(s.x - w / 2, s.y + 8, w, 18, 9);
  ctx.fill();
  text(ctx, label, s.x, s.y + 17.5, 12, mineTag ? '#ffe28a' : '#ffffff');
  if (isCombat(room) && s.pvp) {
    // friendly fire on: a little red dot (slaps between two of these hurt)
    ctx.fillStyle = '#ff5d73';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(s.x - w / 2 - 2, s.y + 17, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function drawPill(x, y, w, label, color = '#5b4a6b') {
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, 34, 17);
  ctx.fill();
  text(ctx, label, x + w / 2, y + 17.5, 16, color);
}

// Everything you can do where you stand, above your slime, plus beacons over doors and characters you
// could walk up to (src/hints.js). E does one thing at a time, in the same order as the keydown handler.
const BEACON_RANGE = 420;
const DOOR_BAND_Y = 160; // how high over the ground a door's level chip sits (under the beacon)
function drawHints() {
  if (!online() || splatted(mine) || !menu.hidden || sail.door || ways.isOpen || dialogOpen() || hall.askOpen || museum.isOpen || scope.isOpen || courseMenu.isOpen || rpg.isOpen || skillTree.isOpen || shop.isOpen || players.isOpen || trade.isOpen || alchemy.isOpen || pets.isOpen || houses.editing) return;
  const me = net.me, acts = [];
  const talk = charsHere().find((c) => c.near);
  const door = doorAt(me);
  if (talk) acts.push({ key: 'E', label: talk.cfg.shop ? `talk to ${talk.cfg.name} (or trade)` : `talk to ${talk.cfg.name}` });
  else if (nearShop()) acts.push({ key: 'E', label: 'shop with Merchant Pip' });
  else if (room === MUSEUM && museum.near) acts.push({ key: 'E', label: `read: ${museum.near.title.length > 34 ? museum.near.title.slice(0, 32) + '…' : museum.near.title}` });
  else if (wayAt(me)) acts.push({ key: 'E', label: wayPrompt(me, rpg.me?.ways) });
  else if (ruinStoneAt(me)) acts.push({ key: 'E', label: `read ${ruinStoneAt(me).name}` });
  else if (room === CLIFFS && scopeNear(me)) acts.push({ key: 'E', label: 'look through the telescope' });
  else if ((room === STORE || room === PETSHOP) && store.near && !store.isOpen) acts.push({ key: 'E', label: `${room === PETSHOP ? 'adopt' : 'buy'} the ${FURNITURE[store.near.k].name.toLowerCase()} (${FURNITURE[store.near.k].price.toLocaleString('en-US')} gold)` });
  else if (alchemy.prompt(room, me)) acts.push({ key: 'E', label: alchemy.prompt(room, me) });
  else if (pets.prompt(room, me)) acts.push({ key: 'E', label: pets.prompt(room, me) });
  else if (gateAt(me, room)) acts.push({ key: 'E', label: gateAt(me, room).look });
  else if (door) acts.push({ key: 'E', label: door.label, band: door.band, hard: door.hard });
  if (isCombat(room)) {
    if (rpg.nearLoot) acts.push({ key: 'Z', label: 'pick up loot' });
    if ([...rpg.views.values()].some((v) => Math.abs(v.x - me.x) < 130 && Math.abs(v.y - me.y) < 70)) acts.push({ key: 'X', label: TOUCH ? 'attack' : 'attack (or click)' });
  }
  if (me.grounded && me.onPlat) acts.push({ key: '↓', label: room === PIANO ? 'drop off the black key' : 'drop down' });
  drawPrompts(ctx, mine.x, mine.y - mine.h - 30, acts, camX, time, TOUCH);
  // beacons: the nearest couple of things you can't reach yet
  const far = [];
  for (const d of roomDef(room).doors) if (doorOpen(me, d)) far.push({ x: d.x, y: roomDef(room).ground - (isHouse(room) ? 186 : 190), near: d === door }); // above door signs
  for (const c of charsHere()) far.push({ x: c.slime.x, y: c.slime.y - c.slime.h * c.cfg.size - 52, near: c.near });
  if (room === VILLAGE) far.push({ x: SHOP_X + 20, y: ROOMS[VILLAGE].ground - 120, near: nearShop() });
  for (const st of RUIN_STONES) if (st.room === room) far.push({ x: st.x, y: ROOMS[room].ground - 180, near: st === ruinStoneAt(me) });
  far.push(...wayBeacons(room, roomDef(room).ground, me));
  if (room === CLIFFS) far.push({ x: CLIFFS_SCOPE_X, y: ROOMS[CLIFFS].ground - 110, near: scopeNear(me) });
  for (const g of GATES) if (g.room === room) far.push({ x: g.x, y: roomDef(room).ground - 130, near: g === gateAt(me, room) });
  far.filter((b) => !b.near && Math.abs(b.x - me.x) < BEACON_RANGE).sort((a, b) => Math.abs(a.x - me.x) - Math.abs(b.x - me.x)).slice(0, 2)
    .forEach((b) => drawBeacon(ctx, b.x, b.y, 'E', clamp((BEACON_RANGE - Math.abs(b.x - me.x)) / 120, 0, 1), time, TOUCH));
}

function render() {
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  if (room === VILLAGE || room === FIELD || isHouse(room)) drawBackground(ctx, camX, time, ENV, roomDef(room).width); // (the Highlands and the dens paint their own sky; houses show it through their windows)

  ctx.save();
  ctx.translate(-Math.round(camX * scale) / scale, 0);
  if (room === HALL) hall.draw(ctx);
  else if (room === PIANO) piano.draw(ctx, camX);
  else if (room === MUSEUM) museum.draw(ctx, camX);
  else if (room === TUTOR) tutor.draw(ctx);
  else if (STAGES[room]) {
    const near = (x) => Math.abs(x - camX - W / 2) < W / 2 + 160;
    if (room === FIELD) {
      drawField(ctx, camX, W, time);
      if (near(CLIFFS_PATH_X)) drawCliffsPath(ctx, CLIFFS_PATH_X, ROOMS[FIELD].ground, time);
    } else if (room === WILLOWMERE) drawWillowmere(ctx, camX, W, time);
    else if (room === COVES) drawCoves(ctx, camX, W, time);
    else if (room === MYCELIUM) drawDeep(ctx, camX, W, time);
    else if (room === GLOWROOT) drawGlowroot(ctx, camX, W, time);
    else if (room === CANOPY) drawCanopy(ctx, camX, W, time);
    else if (room === WRECK) drawWreck(ctx, camX, W, time);
    else if (room === THORNHEART) drawThornheart(ctx, camX, W, time);
    else if (room === SPINE) drawSpine(ctx, camX, W, time);
    else if (room === HIGHLANDS) {
      drawHighlands(ctx, camX, W, time);
      if (near(CALDERA_DOOR_X)) drawCalderaPass(ctx, CALDERA_DOOR_X, ROOMS[HIGHLANDS].ground, time);
    } else if (room === CALDERA) {
      drawCaldera(ctx, camX, W, time);
      if (near(CITADEL_DOOR_X)) drawSkylift(ctx, CITADEL_DOOR_X, ROOMS[CALDERA].ground, time);
    } else drawCitadel(ctx, camX, W, time);
    for (const d of DENS) if (d.from === room && Math.abs(d.entranceX - camX - W / 2) < W / 2 + 140) drawDenEntrance(ctx, d.entranceX, ROOMS[room].ground, d.theme, time);
  } else if (denAt(room)) drawDen(ctx, room, camX, W, time);
  else if (isHouse(room)) houses.draw(ctx, room, time, houses.isMine(room));
  else if (room === STORE) store.draw(ctx, camX, W, time);
  else if (room === PETSHOP) drawPetShop(ctx, store, camX, W, time);
  else if (room === HARBOUR) drawHarbour(ctx, camX, W, time);
  else if (room === FJORD) drawFjord(ctx, camX, W, time);
  else if (room === CLIFFS) drawCliffs(ctx, camX, W, time);
  else if (roomDef(room)?.crossing) drawCrossing(ctx, room, camX, W, time, online() ? net.me : null);
  else drawVillage(ctx, camX, W, time);
  if (room === VILLAGE && Math.abs(SHOP_X - camX - W / 2) < W / 2 + 80) {
    merchant.draw(ctx);
    nameTag(merchant, false);
  }
  drawRuins(ctx, room, camX - 80, camX + W + 80, time, online() ? ruinStoneAt(net.me) : null); // Keeper stones (Bramble Woods, the branches)
  drawWaystones(ctx, room, roomDef(room)?.ground ?? 450, camX - 80, camX + W + 80, time, online() ? wayAt(net.me) : null, rpg.me?.ways);
  drawGates(ctx, room, roomDef(room)?.ground ?? 450, camX - 80, camX + W + 80, time, online() ? gateAt(net.me, room) : null); // blocked ways into branches
  drawEntries(ctx, room, roomDef(room)?.ground ?? 450, camX - 80, camX + W + 80, time); // and the open ways into shipped ones
  // doors into combat rooms say who they're for (their level band), over the door (a den's mouth has its own sign)
  for (const d of roomDef(room)?.doors ?? []) if (d.band && STAGES[d.to] && Math.abs(d.x - camX - W / 2) < W / 2 + 60) drawDoorBand(ctx, d.x, roomDef(room).ground - DOOR_BAND_Y, d.band, d.hard);
  if (isCombat(room)) rpg.drawWorld(ctx);
  for (const c of charsHere()) c.drawSlime(ctx);
  drawSplats();
  const all = [...slimes.values()].filter((s) => s.visible && !splatted(s));
  // a slime on a house's swing swings with its seat
  const drawSlime = (s) => {
    const sw = isHouse(room) && houses.swingFor(room, s, time);
    if (!sw) return s.draw(ctx);
    ctx.save();
    ctx.translate(sw.x, sw.y);
    ctx.rotate(sw.a);
    ctx.translate(-sw.x, -sw.y);
    s.draw(ctx);
    ctx.restore();
  };
  for (const s of all) drawSlime(s);
  const meShown = mine && net.id !== null && !splatted(mine);
  if (isCombat(room)) for (const s of meShown ? [...all, mine] : all) rpg.drawAura(ctx, s); // Berserk
  if (meShown) drawSlime(mine); // our own slime on top
  if (isCombat(room)) for (const s of meShown ? [...all, mine] : all) rpg.drawShields(ctx, s); // Bubble, Aegis
  for (const s of all) nameTag(s, false);
  if (meShown) nameTag(mine, true);
  if (roomDef(room)?.crossing) drawCrossingFront(ctx, room, camX, W, time, online() ? net.me : null); // the near water, over the hull's foot
  rpg.drawFx(ctx); // skill effects (and Dash / Blink anywhere)
  if (isCombat(room)) for (const s of all) if (s.hpAt !== undefined && time - s.hpAt < 5) bar(ctx, s.x - 22, s.y - s.h - 14, 44, 6, s.hp / s.maxHp, '#ff6f91');
  for (const s of all) drawTalk(s);
  if (mine && net.id !== null) drawTalk(mine);
  for (const c of charsHere()) c.drawBubbles(ctx, mine && net.id !== null ? [...all, mine] : all);
  chat.drawBubbles(ctx, mine && net.id !== null ? [...all, mine] : all);
  if (room === PIANO) piano.drawNotes(ctx);
  if (isHouse(room)) houses.drawEditing(ctx, time);
  if (room === HALL) {
    hall.drawHands(ctx, mine && net.id !== null ? [...all, mine] : all);
    hall.drawCaption(ctx);
  }
  drawHints();
  particles.draw(ctx);
  rpg.drawPops(ctx);
  for (const p of pops) {
    const k = (time - p.at) / 0.7;
    if (k > 1) continue;
    ctx.save();
    ctx.globalAlpha = Math.min(1, (1 - k) * 2);
    ctx.translate(p.x, p.y - k * 26);
    ctx.rotate(p.tilt);
    ctx.scale(0.7 + Math.min(1, k * 5) * 0.4, 0.7 + Math.min(1, k * 5) * 0.4);
    ctx.font = "700 20px Fredoka, 'Trebuchet MS', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeText('SLAP!', 0, 0);
    ctx.fillStyle = '#ff6f91';
    ctx.fillText('SLAP!', 0, 0);
    ctx.restore();
  }
  ctx.restore();
  if (scope.isOpen) scope.draw(ctx, time, TOUCH);

  if (joined) {
    const n = slimes.size + (net.id !== null ? 1 : 0);
    const here = [...slimes.values()].filter((s) => s.visible).length + (net.id !== null ? 1 : 0);
    if (status === 'online' && (room === HALL || room === TUTOR) && !courseMenu.isOpen && !TOUCH) drawPill(W - 236, 94, 220, 'C  course menu');
    if (status === 'online' && room === TUTOR) drawPill(16, 14, 260, `Tutoring Room · ${here} student${here === 1 ? '' : 's'}`);
    else if (status === 'online' && room === MUSEUM) {
      if (!TOUCH && !dialogOpen()) drawPill(W - 196, 54, 180, 'Q  ask Clio');
      drawPill(16, 14, 330, `Museum · ${museum.placeName(net.me.x)} · ${here} visitor${here === 1 ? '' : 's'}`);
    }
    else if (status === 'online' && STAGES[room]) drawPill(16, 14, 330, `${STAGES[room].pill ?? STAGES[room].name} · ${zoneAt(net.me.x, room).name} · ${here} slime${here === 1 ? '' : 's'}`);
    else if (status === 'online' && denAt(room)) drawPill(16, 14, 330, `${denAt(room).name} · ${here} slime${here === 1 ? '' : 's'}`);
    else if (status === 'online' && room === PIANO) {
      drawPill(16, 14, 230, `Music House · ${here} slime${here === 1 ? '' : 's'}`);
      drawPill(W - 296, TOUCH ? 56 : 54, 280, 'Jump on the keys to play them!');
    }
    else if (status === 'online' && room === HALL) {
      drawPill(16, 14, 230, `Lecture Hall · ${here} student${here === 1 ? '' : 's'}`);
      const up = hall.hands.includes(profile.name);
      if (!hall.askOpen && !TOUCH) drawPill(W - 236, 54, 220, up ? 'Hand up · H to lower' : 'H  raise your hand', up ? '#8a6fc4' : '#5b4a6b');
      if (up && TOUCH) drawPill(W - 236, 54, 220, 'Hand up', '#8a6fc4');
    }
    else if (status === 'online' && room === STORE) drawPill(16, 14, 260, `Furniture Store · ${here} shopper${here === 1 ? '' : 's'}`);
    else if (status === 'online' && room === PETSHOP) drawPill(16, 14, 260, `Pet Shop · ${here} shopper${here === 1 ? '' : 's'}`);
    else if (status === 'online' && room === HARBOUR) drawPill(16, 14, 300, `Greenhollow Harbour · ${here} slime${here === 1 ? '' : 's'}`);
    else if (status === 'online' && room === FJORD) drawPill(16, 14, 300, `Icefang Hamlet · ${here} slime${here === 1 ? '' : 's'}`);
    else if (status === 'online' && room === CLIFFS) drawPill(16, 14, 300, `The East Cliffs · ${here} slime${here === 1 ? '' : 's'}`);
    else if (status === 'online' && crossingAt(room, net.me)) {
      // aboard: where she's bound, how long till she's in, and a little track of the voyage
      const cr = crossingAt(room, net.me);
      const pw = TOUCH ? 300 : 360; // (on phones the top buttons start just past 330)
      drawPill(16, 14, pw, `${TOUCH ? 'Ferry' : 'Puddle Jumper'} · ${crossingLabel(cr)} · ${here} aboard`);
      ctx.fillStyle = 'rgba(91,74,107,0.18)';
      ctx.beginPath();
      ctx.roundRect(46, 42, pw - 60, 4, 2);
      ctx.fill();
      ctx.fillStyle = cr.docked ? '#5aa9a1' : '#4f6b9a';
      ctx.beginPath();
      ctx.roundRect(46, 42, (pw - 60) * cr.k, 4, 2);
      ctx.fill();
    }
    else if (status === 'online' && isHouse(room)) {
      drawPill(16, 14, 260, `${houses.title(room, houses.isMine(room))} · ${here} slime${here === 1 ? '' : 's'}`);
    }
    else if (status === 'online') drawPill(16, 14, 210, `Slimeville · ${n} slime${n === 1 ? '' : 's'} online`);
    else drawPill(16, 14, 220, status === 'connecting' ? 'Connecting…' : `Reconnecting… (${status})`, '#d9607a');
    if (status === 'online' && voice.casters.size) {
      // who's live: a red pill at the top centre for everyone
      const names = [...voice.casters].map((id) => (id === net.id ? 'You' : net.roster.get(id)?.name)).filter(Boolean);
      const label = names.length === 1 && names[0] === 'You' ? 'LIVE  You are broadcasting to everyone' : `LIVE  ${names.join(', ')} ${names.length === 1 ? 'is' : 'are'} broadcasting`;
      const w = Math.min(420, 60 + label.length * 8.5);
      drawPill(W / 2 - w / 2, 54, w, label, '#d9465f');
    }
    if (status === 'online') rpg.drawHud(ctx, isCombat(room), H);
    if (status === 'online') alchemy.drawBuff(ctx, 128);
    if (status === 'online') accuse.draw(ctx);
    const a = clamp(1 - (hintTime - 8) / 1.5, 0, 1);
    if (!museum.isOpen && !chat.isOpen) drawFeed(ctx, TOUCH ? H - 112 : a > 0 ? H - 56 : isCombat(room) ? H - 72 : H - 14, TOUCH ? 520 : isCombat(room) ? 300 : 620); // on touch, above the controls; above the hotbar
    if (a > 0 && !scope.isOpen) {
      ctx.globalAlpha = a;
      drawPill(W / 2 - 380, TOUCH ? 140 : H - 48, 760, TOUCH ? '◀ ▶  walk  ·  Jump  ·  E  doors, talk, read  ·  tap the game  slap  ·  Menu' : '← → / A D  walk  ·  ↑ / W / Space  jump  ·  E  use  ·  click  slap  ·  I  bag  ·  K  skills  ·  P  players  ·  M  mic  ·  Esc  menu');
      ctx.globalAlpha = 1;
    }
  } else {
    // join panel (the name box, swatches and button are HTML laid over it — see style.css)
    ctx.fillStyle = 'rgba(43,35,64,0.25)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fffaf3';
    ctx.strokeStyle = '#ffc6d9';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(W / 2 - 190, 34, 380, 474, 28);
    ctx.fill();
    ctx.stroke();
    text(ctx, 'Slimeville', W / 2, 80, 38, '#ff8fb1');
    text(ctx, 'a cozy village for slimes', W / 2, 114, 15, '#a08bb3');
    ctx.fillStyle = 'rgba(91,74,107,0.12)';
    ctx.beginPath();
    ctx.ellipse(W / 2, 206, 44, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // a little preview of your slime
    ctx.save();
    ctx.translate(W / 2, 204);
    ctx.scale(1.6, 1.6);
    preview.draw(ctx);
    ctx.restore();
  }
}

// For tests and troubleshooting: open the game with #debug to reach its internals from the console.
if (location.hash === '#debug') window.slimeville = { chat, net, voice, characters, museum, scope, hall, piano, tutor, courseMenu, rpg, skillTree, shop, houses, store, alchemy, pets, players, accuse, audio, slimes, get mine() { return mine; }, get camX() { return camX; } };

// #debug also keeps frame timings (window.slimeville.perf: JS time in update() and render(), and the gap
// between frames, which includes the browser's own drawing) and shows the frame rate in the corner.
// See docs/performance.md.
const perf = { n: 0, upd: 0, ren: 0, gap: 0, worst: 0, ema: 16.7, reset() { this.n = this.upd = this.ren = this.gap = this.worst = 0; } };
if (window.slimeville) window.slimeville.perf = perf;
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(Math.max(0, (now - last) / 1000), 0.25);
  const gap = now - last;
  last = now;
  gfx.sample(gap / 1000);
  const t0 = performance.now();
  update(dt);
  const t1 = performance.now();
  render();
  const t2 = performance.now();
  perf.n++;
  perf.upd += t1 - t0;
  perf.ren += t2 - t1;
  perf.gap += gap;
  perf.worst = Math.max(perf.worst, gap);
  if (window.slimeville && gap < 250) {
    // a small frame-rate readout in the corner (#debug only)
    perf.ema += (gap - perf.ema) * 0.05;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    text(ctx, `${Math.round(1000 / perf.ema)} fps · ${scale.toFixed(2)}× · ${gfx.low ? 'low' : 'high'}`, W - 80, H - 8, 11, '#5b4a6b');
  }
}
requestAnimationFrame(frame);
