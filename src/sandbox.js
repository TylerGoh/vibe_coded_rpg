// Docs: docs/sandbox.md
// The dev sandbox's panel and DPS readout (only when the server's welcome says `sandbox`: a server run with SANDBOX=1,
// server/sandbox.js). The panel (#sbx; O, or the Sandbox button) swaps your character, puts training dummies in the
// Training Yard, takes you to any boss at any phase, and has god mode, full MP and no cooldowns. The readout (#sbx-dps)
// shows your damage per second, the total, a timer and a per-skill breakdown, from the server's count. Everything that
// makes a fight feel like one (hit pops, sounds, shakes, the buff bar, the hotbar) is the game's own, untouched.
import { ITEMS, DENS, MOBS, PHASE_AT, isCombat, GREEN_TOP, FROST_TOP, EMBER_TOP } from './shared/rpg.js';
import { SKILLS, CLASSES, weaponOk } from './shared/skills.js';
import { FINAL } from './shared/final.js';
import { ARENA, DUMMY_HP_SHARES, SANDBOX_LEVELS, SANDBOX_MAX_LVL, SANDBOX_HEADLINERS, SANDBOX_PARTY } from './shared/sandbox.js';

const LEVEL_NAMES = { 10: '1st', 30: '2nd', 60: '3rd', 100: '4th', 200: 'cap' };
const WEAPON_KINDS = { warrior: ['sword'], mage: ['staff'], cleric: ['staff'], archer: ['bow'], novice: ['sword', 'staff', 'bow'] };
const NEAR_DEATH = 0.05; // the last phase button: the boss at 5%
const LAST_HOLD = 0.001; // the phase lock in a boss's last phase: it never dies
// the level the Bosses tab's class swap gives you for each island's headliner (its recommended level)
const ISLAND_LVL = { Greenhollow: GREEN_TOP, Frostpeak: FROST_TOP, Emberdeep: EMBER_TOP };

const el = (tag, props = {}, kids = []) => {
  const e = Object.assign(document.createElement(tag), props);
  for (const k of [kids].flat()) if (k !== null && k !== undefined) e.append(k);
  return e;
};
const fmt = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 1 : 2)}M` : n >= 1e4 ? `${(n / 1e3).toFixed(n >= 1e5 ? 0 : 1)}k` : Math.round(n).toLocaleString('en-US'));
const clock = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
// a readout row's key (server/sandbox.js keyOf) → what it's called
function nameOf(key) {
  const [a, b] = key.includes(':') ? key.split(':') : [null, key];
  if (a === 'dot') return { burn: 'Burn', bleed: 'Bleed', poison: 'Poison' }[b] ?? b;
  const base = { attack: 'Attack', bolt: 'Staff bolt', arrow: 'Bow shot' }[b] ?? SKILLS[b]?.name ?? b;
  return a ? `${base} (${a})` : base;
}
// the HP shares where a boss's phases 2, 3 (and a final boss's 4) start
const phasesOf = (kind) => (MOBS[kind].final ? FINAL[MOBS[kind].final].at : PHASE_AT.slice(1));
// the HP share that starts a boss in phase i (0-based; past its last phase: its last), or near death
function phaseHp(kind, i) {
  if (i === 'end') return NEAR_DEATH;
  const at = phasesOf(kind);
  return i === 0 ? 1 : at[Math.min(i, at.length) - 1] - 0.01;
}
// the phase lock for phase i: the share where the next phase would start (its last phase, or near death: never dies)
function holdHp(kind, i) {
  const at = phasesOf(kind);
  return i === 'end' || i >= at.length ? LAST_HOLD : at[i];
}
// a boss's ultimates, in the order the server's index uses
function ultsOf(kind) {
  const k = MOBS[kind];
  return k.final ? FINAL[k.final].ults : k.ults ?? (k.ult ? [k.ult] : []);
}
// the best gear of a kind up to a level (the Bosses tab's class swap)
function bestUpTo(lvl, ok, score) {
  let best = null;
  for (const [id, it] of Object.entries(ITEMS)) {
    if (!ok(id, it) || (it.lvl ?? 1) > lvl) continue;
    if (!best || (it.lvl ?? 1) > (best[1].lvl ?? 1) || ((it.lvl ?? 1) === (best[1].lvl ?? 1) && score(it) > score(best[1]))) best = [id, it];
  }
  return best?.[0] ?? null;
}

export class Sandbox {
  // send: a JSON message to the server · rpg: the Rpg (src/rpg.js: me, cds) · online: are we in the game?
  constructor({ send, rpg, online }) {
    this.send = send;
    this.rpg = rpg;
    this.online = online;
    this.on = false; // a sandbox server said so in its welcome
    this.isOpen = false;
    this.tab = 'char';
    this.state = { god: false, mp: false, nocd: false, dummyHp: 1 };
    this.dps = null; // the last {t:'sbx-dps'}
    this.showDps = localStorage.getItem('slimeville-sbx-dps') !== 'off';
    this.pick = { cls: 'warrior', lvl: 30, skills: 'max', ap: 'main', weapon: '', helmet: '' };
    this.phase = 0;
    this.hold = false; // the phase lock, sent with Fight and changed mid-fight
    this.party = true; // a boss's party mechanics as for SANDBOX_PARTY slimes
    this.room = -1;
    this.others = false; // "Other dens" folded open
    this.panel = document.getElementById('sbx');
    this.body = document.getElementById('sbx-body');
    this.tabs = document.getElementById('sbx-tabs');
    this.readout = document.getElementById('sbx-dps');
    this.button = document.getElementById('sbxbtn');
    document.getElementById('sbx-close').onclick = () => this.close();
    this.button.onclick = () => {
      this.toggle();
      this.button.blur();
    };
    for (const [id, label] of [['char', 'Character'], ['dummy', 'Dummies'], ['boss', 'Bosses'], ['opts', 'Toggles']]) {
      const b = el('button', { type: 'button', textContent: label, onclick: () => this.show(id) });
      b.dataset.tab = id;
      this.tabs.append(b);
    }
    // No cooldowns: the client's own cooldown sweeps are cleared too, or the hotbar would still wait
    setInterval(() => {
      if (this.on && this.state.nocd) this.rpg.cds = {};
    }, 50);
  }

  enable() {
    if (this.on) return;
    this.on = true;
    // its key, on the Esc menu's Controls page
    const list = document.getElementById('controls-list');
    if (list) list.append(el('dt', { textContent: matchMedia('(pointer: coarse)').matches ? 'Sandbox' : 'O' }), el('dd', { textContent: 'the sandbox panel (the dev sandbox only)' }));
  }

  receive(m) {
    if (m.t === 'sbx-state') {
      this.state = { ...this.state, ...m };
      if (this.isOpen) this.render();
    } else if (m.t === 'sbx-dps') {
      this.dps = m;
      this.drawReadout();
    }
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }
  open() {
    if (!this.on || !this.online()) return;
    const me = this.rpg.me;
    if (me) Object.assign(this.pick, { cls: me.cls ?? 'novice', lvl: me.lvl, weapon: '', helmet: '' });
    this.isOpen = true;
    this.panel.hidden = false;
    this.render();
  }
  close() {
    this.isOpen = false;
    this.panel.hidden = true;
  }
  show(tab) {
    this.tab = tab;
    this.render();
  }

  // once a frame (src/main.js): the button and the readout follow where you are
  frame(room) {
    const live = this.on && this.online();
    if (room !== this.room) {
      this.room = room;
      if (this.isOpen && this.tab === 'boss') this.render(); // (the "This fight" box follows you in and out of dens)
    }
    this.button.hidden = !live;
    this.readout.hidden = !(live && this.showDps && isCombat(room) && (room === ARENA || this.dps?.total > 0));
    if (!live && this.isOpen) this.close();
  }

  drawReadout() {
    const d = this.dps;
    this.readout.replaceChildren();
    const secs = Math.max(1, (d?.ms ?? 0) / 1000), total = d?.total ?? 0;
    this.readout.append(
      el('div', { className: 'sbx-dps-top' }, [el('b', { textContent: `DPS ${fmt(total / secs)}` }), el('button', { type: 'button', textContent: 'Reset', onclick: () => this.send({ t: 'sbx', a: 'meter' }) })]),
      el('div', { className: 'sbx-dps-sub', textContent: total ? `${fmt(total)} in ${clock(d.ms)}` : 'Hit something: the timer starts' }),
    );
    for (const [key, dmg, hits] of (d?.rows ?? []).slice(0, 6)) {
      const share = total ? dmg / total : 0;
      const row = el('div', { className: 'sbx-row' }, [el('span', { textContent: nameOf(key) }), el('span', { textContent: `${fmt(dmg)} · ${Math.round(share * 100)}% · ${hits}x` })]);
      row.style.setProperty('--w', `${Math.max(3, share * 100)}%`);
      this.readout.append(row);
    }
  }

  // ——— the panel ———
  seg(options, value, onPick, color) {
    return el('div', { className: 'sbx-seg' }, options.map(([v, label]) => {
      const b = el('button', { type: 'button', textContent: label, className: v === value ? 'on' : '', onclick: () => onPick(v) });
      if (color) b.style.setProperty('--c', color(v));
      return b;
    }));
  }
  row(label, ...kids) {
    return el('div', { className: 'sbx-line' }, [el('span', { className: 'sbx-label', textContent: label }), ...kids]);
  }
  act(label, msg, cls = '') {
    return el('button', { type: 'button', className: `sbx-act ${cls}`, textContent: label, onclick: () => this.send({ t: 'sbx', ...msg }) });
  }

  render() {
    for (const b of this.tabs.children) b.classList.toggle('on', b.dataset.tab === this.tab);
    this.body.replaceChildren(...this[`tab_${this.tab}`]());
  }

  tab_char() {
    const p = this.pick, redo = () => this.render();
    const items = (kinds) => Object.entries(ITEMS).filter(([, it]) => kinds.includes(it.kind)).sort((a, b) => (a[1].lvl ?? 0) - (b[1].lvl ?? 0));
    const select = (value, list, onPick, keepLabel) => {
      const s = el('select', { className: 'sbx-select', onchange: () => onPick(s.value) }, [
        el('option', { value: '', textContent: keepLabel }),
        el('option', { value: 'none', textContent: '(none)' }),
        ...list.map(([id, it]) => el('option', { value: id, textContent: `Lv ${it.lvl ?? 1} · ${it.name}${it.atk ? ` · ATK ${it.atk}` : ''}${it.magic ? ` · MAGIC ${it.magic}` : ''}${it.def ? ` · DEF ${it.def}` : ''}` })),
      ]);
      s.value = value;
      return s;
    };
    const lvl = el('input', { type: 'number', min: 1, max: SANDBOX_MAX_LVL, value: p.lvl, className: 'sbx-num', onchange: () => (p.lvl = Math.max(1, Math.min(SANDBOX_MAX_LVL, Math.floor(Number(lvl.value) || 1)))) });
    const apply = () => this.send({ t: 'sbx', a: 'char', cls: p.cls, lvl: p.lvl, skills: p.skills, ap: p.ap, ...(p.weapon && { weapon: p.weapon === 'none' ? null : p.weapon }), ...(p.helmet && { helmet: p.helmet === 'none' ? null : p.helmet }) });
    return [
      this.row('Class', this.seg(Object.keys(CLASSES).map((c) => [c, CLASSES[c].name]), p.cls, (v) => { p.cls = v; p.weapon = ''; redo(); }, (v) => CLASSES[v].color)),
      this.row('Level', lvl, this.seg(SANDBOX_LEVELS.map((n) => [n, LEVEL_NAMES[n] ? `${n} · ${LEVEL_NAMES[n]}` : String(n)]), p.lvl, (v) => { p.lvl = v; redo(); })),
      this.row('Skills', this.seg([['max', 'Max all'], ['keep', 'Keep'], ['clear', 'None (spend in K)']], p.skills, (v) => { p.skills = v; redo(); })),
      this.row('Ability pts', this.seg([['main', 'All in main stat'], ['keep', 'Keep'], ['reset', 'Reset (spend in I)']], p.ap, (v) => { p.ap = v; redo(); })),
      this.row('Weapon', select(p.weapon, items(WEAPON_KINDS[p.cls] ?? []), (v) => (p.weapon = v), '(keep: a wrong kind becomes the starter)')),
      this.row('Helmet', select(p.helmet, items(['helmet']), (v) => (p.helmet = v), '(keep)')),
      el('div', { className: 'sbx-btns' }, [el('button', { type: 'button', className: 'sbx-act sbx-go', textContent: 'Apply', onclick: apply }), this.act('Stock potions', { a: 'pots' })]),
      el('p', { className: 'sbx-note', textContent: 'Max all spends every point your level gives, earliest skills first; fine-tune in K. Saved on this sandbox only.' }),
    ];
  }

  tab_dummy() {
    const s = this.state;
    return [
      this.row('Spawn', el('div', { className: 'sbx-btns' }, [this.act('One dummy', { a: 'dummy', kind: 'one' }), this.act('A pack', { a: 'dummy', kind: 'pack' }), this.act('One that hits back', { a: 'dummy', kind: 'spar' }), this.act('Clear', { a: 'dummy', kind: 'clear' }, 'sbx-off')])),
      this.row('Dummy HP', this.seg(DUMMY_HP_SHARES.map((v) => [v, `${Math.round(v * 100)}%`]), s.dummyHp, (v) => this.send({ t: 'sbx', a: 'dummyhp', share: v }))),
      this.row('DPS readout', el('div', { className: 'sbx-btns' }, [
        this.act('Reset', { a: 'meter' }),
        el('button', { type: 'button', className: 'sbx-act', textContent: this.showDps ? 'Hide it' : 'Show it', onclick: () => {
          this.showDps = !this.showDps;
          localStorage.setItem('slimeville-sbx-dps', this.showDps ? 'on' : 'off');
          this.render();
        } }),
      ])),
      el('p', { className: 'sbx-note', textContent: "Dummies never die; their HP stays where it's set (for skills that care about a target's HP). The readout counts all your damage, on anything, since its reset." }),
    ];
  }

  tab_boss() {
    const tag = (k) => (k.final ? 'final boss' : k.top ? 'top boss' : 'den');
    const fight = (kind) => {
      this.send({ t: 'sbx', a: 'boss', kind, hp: phaseHp(kind, this.phase), hold: this.hold ? holdHp(kind, this.phase) : 0, party: this.party });
      this.close();
    };
    const here = DENS.find((d) => d.room === this.room);
    const card = (d, island) => {
      const k = MOBS[d.boss], n = ultsOf(d.boss).length;
      return el('button', { type: 'button', className: `sbx-boss${island ? ' sbx-head' : ''}`, onclick: () => fight(d.boss) }, [
        island && el('i', { textContent: island }),
        el('b', { textContent: k.name }),
        el('span', { textContent: `Lv ${k.lvl} · ${tag(k)} · ${phasesOf(d.boss).length + 1} phases · ${n} ultimate${n === 1 ? '' : 's'}` }),
      ]);
    };
    const heads = SANDBOX_HEADLINERS.map((h) => [DENS.find((d) => d.boss === h.boss), h.island]).filter(([d]) => d);
    const rest = DENS.filter((d) => !SANDBOX_HEADLINERS.some((h) => h.boss === d.boss));
    const out = [
      this.row('Start at', this.seg([[0, 'Phase 1'], [1, 'Phase 2'], [2, 'Phase 3'], [3, 'Phase 4 (finals)'], ['end', 'Near death']], this.phase, (v) => { this.phase = v; this.render(); })),
      this.row('Hold phase', this.seg([[true, 'On'], [false, 'Off']], this.hold, (v) => { this.hold = v; this.render(); }), el('span', { className: 'sbx-about', textContent: "its HP stops short of the next phase (in the last: it can't die)" })),
      this.row('Party mechs', this.seg([[true, `As for ${SANDBOX_PARTY}`], [false, 'As in the game']], this.party, (v) => { this.party = v; this.render(); }), el('span', { className: 'sbx-about', textContent: 'final bosses always have them' })),
    ];
    // in a den: this fight's own controls
    if (here) {
      const kind = here.boss, k = MOBS[kind], island = SANDBOX_HEADLINERS.find((h) => h.boss === kind)?.island;
      const lvl = ISLAND_LVL[island] ?? k.lvl;
      const asClass = (cls) => {
        const weapon = bestUpTo(lvl, (id, it) => it.kind === CLASSES[cls].weapon && weaponOk(cls, id), (it) => (it.atk ?? 0) + (it.magic ?? 0));
        const helmet = bestUpTo(lvl, (id, it) => it.kind === 'helmet', (it) => it.def ?? 0);
        this.send({ t: 'sbx', a: 'char', cls, lvl, skills: 'max', ap: 'main', ...(weapon && { weapon }), ...(helmet && { helmet }) });
      };
      out.push(el('div', { className: 'sbx-fight' }, [
        el('b', { textContent: `This fight: ${k.name}` }),
        this.row('Ultimate now', el('div', { className: 'sbx-btns' }, ultsOf(kind).map((u, i) => this.act(u.name, { a: 'ult', kind, which: i })))),
        this.row('Restart at', el('div', { className: 'sbx-btns' }, [...phasesOf(kind).map((_, i) => i), phasesOf(kind).length].map((i) => el('button', { type: 'button', className: 'sbx-act', textContent: `Phase ${i + 1}`, onclick: () => {
          this.phase = i;
          this.send({ t: 'sbx', a: 'boss', kind, hp: phaseHp(kind, i), hold: this.hold ? holdHp(kind, i) : 0, party: this.party });
        } })))),
        this.row('Hold / party', el('div', { className: 'sbx-btns' }, [
          el('button', { type: 'button', className: 'sbx-act', textContent: 'Apply the switches above now', onclick: () => this.send({ t: 'sbx', a: 'bossopt', kind, hold: this.hold ? holdHp(kind, this.phase) : 0, party: this.party }) }),
        ])),
        this.row(`Be a Lv ${lvl}`, this.seg(Object.keys(CLASSES).filter((c) => c !== 'novice').map((c) => [c, CLASSES[c].name]), this.rpg.me?.cls, (c) => asClass(c), (v) => CLASSES[v].color),
          el('span', { className: 'sbx-about', textContent: 'max skills, all in the main stat, the best gear up to that level' })),
      ]));
    }
    out.push(
      el('div', { className: 'sbx-bosses' }, heads.map(([d, island]) => card(d, island))),
      el('button', { type: 'button', className: 'sbx-act sbx-fold', textContent: `${this.others ? 'Hide' : 'Show'} the other dens (${rest.length})`, onclick: () => { this.others = !this.others; this.render(); } }),
      this.others && el('div', { className: 'sbx-bosses' }, rest.map((d) => card(d))),
      el('div', { className: 'sbx-btns' }, [el('button', { type: 'button', className: 'sbx-act', textContent: 'Back to the yard', onclick: () => {
        this.send({ t: 'sbx', a: 'yard' });
        this.close();
      } })]),
      el('p', { className: 'sbx-note', textContent: 'Fight takes you into its den with the boss fresh at that phase. Ultimate now fires once the boss finishes what it is doing. God mode (Toggles) keeps you up through an ultimate: the hit still shows. Leave and it heals after a few seconds, as in the game. Everyone in the sandbox shares the dens.' }),
    );
    return out.filter(Boolean);
  }

  tab_opts() {
    const s = this.state;
    const tog = (what, label, about) => this.row(label, this.seg([[true, 'On'], [false, 'Off']], !!s[what], (v) => this.send({ t: 'sbx', a: 'toggle', what, on: v })), el('span', { className: 'sbx-about', textContent: about }));
    return [
      tog('god', 'God mode', 'hits land, you never go down'),
      tog('mp', 'Full MP', 'topped up before every cast'),
      tog('nocd', 'No cooldowns', 'every skill ready at once'),
      el('p', { className: 'sbx-note', textContent: 'Yours only, until you log out.' }),
    ];
  }
}
