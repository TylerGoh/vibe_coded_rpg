// Docs: docs/combat/skills.md
// The skill tree (K, or the Skills button): a node tree in three tabs, Novice, your class and Mobility.
// The class tab shows the basics on top, then the two branches as columns (one per branch) with a row per
// advancement, nodes joined by lines. A Novice sees both classes' trees greyed, to look ahead. Clicking a
// node opens its card under the tree: + spends a point, − takes one back, Hotbar puts an active skill on
// keys 1–6, Cast casts it from here (SP1, owner: "let them cast directly from skills"; double-click a node does
// too on desktop), the same {t:'skill'} the hotbar sends, so the panel stays open and the node shows its cooldown.
// "Reset all" refunds everything for free, so nobody gets stuck with a build.
// Rules: src/shared/skills.js. On phones the card sits in the scroll after the tree (docs/ui/mobile.md).
import { drawSkillIcon } from './skillfx.js';
import { audio } from './audio.js';
import { TREES, SKILLS, ACTIVE, giftsOf, CLASSES, CLASS_LVL, ADVANCEMENTS, rankOf, cantLearn, cantUnlearn, pointsIn, branchPoints, cooldownOf, branchOf, spLeft, spFree } from './shared/skills.js';
import { isCombat } from './shared/rpg.js';

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};
const skillsOf = (tree, pred = () => true) => Object.keys(SKILLS).filter((id) => SKILLS[id].tree === tree && pred(SKILLS[id]));
const ADV_NAMES = { 30: 'the branches', 60: '3rd advancement', 100: '4th advancement' };
// nodes in one line of a cell: a branch column holds 5 (SP1: more skills per advancement), a full-width row 10;
// more wrap onto another line of their own (the panel fits them at 667×375 on a phone, docs/ui/mobile.md)
const PER_ROW = { branch: 5, wide: 10 };

export class SkillTree {
  // cast(id) → true if it went off: casts like a hotbar key (main.js castSkill) · room() → the room you're in
  constructor({ rpg, send, onOpenChange, cast, room }) {
    this.rpg = rpg;
    this.send = send;
    this.onOpenChange = onOpenChange;
    this.castFn = cast;
    this.roomFn = room;
    this.nodeEls = new Map(); // skill id → its node's icon (for the cooldown sweep)
    this.el = document.getElementById('skills');
    this.tabsEl = document.getElementById('skills-tabs');
    this.body = document.getElementById('skills-body');
    this.treeEl = document.getElementById('skills-tree');
    this.cardEl = document.getElementById('skills-card');
    this.tab = null; // 'novice' | 'class' | 'wind' (null: pick one on opening)
    this.peek = 'warrior'; // the class a Novice is looking ahead at
    this.sel = null; // the skill whose card is open
    this.icons = new Map(); // `${id}@${px}` → its icon canvas (drawn once, reused across renders)
    document.getElementById('skills-close').onclick = () => this.close();
    document.getElementById('skills-reset').onclick = () => this.reset();
  }

  get isOpen() {
    return !this.el.hidden;
  }
  toggle() {
    if (this.isOpen) this.close();
    else {
      this.el.hidden = false;
      const cls = this.rpg.me?.cls ?? 'novice';
      if (!this.tab) this.tab = cls === 'novice' ? 'novice' : 'class';
      this.render();
      this.onOpenChange(true);
    }
  }
  close() {
    if (this.el.hidden) return;
    this.el.hidden = true;
    this.onOpenChange(false);
  }

  // what the tree looks like after a change (shown straight away; the server's 'me' confirms)
  change(skills) {
    const m = this.rpg.me;
    m.skills = skills;
    m.sp = spFree(m);
    m.spLeft = spLeft(m);
    this.render();
  }
  learn(id) {
    const m = this.rpg.me, why = cantLearn(m, id);
    if (why) return this.rpg.toast(why), audio.sfx('error');
    this.send({ t: 'learn', skill: id });
    audio.sfx('skillUp');
    this.change({ ...m.skills, [id]: rankOf(m.skills, id) + 1 });
  }
  unlearn(id) {
    const m = this.rpg.me, why = cantUnlearn(m, id);
    if (why) return this.rpg.toast(why), audio.sfx('error');
    this.send({ t: 'unlearn', skill: id });
    audio.sfx('reset');
    const skills = { ...m.skills, [id]: rankOf(m.skills, id) - 1 };
    if (!skills[id]) delete skills[id];
    this.change(skills);
  }
  reset() {
    const m = this.rpg.me;
    if (!m || !Object.keys(m.skills).length) return;
    this.send({ t: 'respec' });
    audio.sfx('reset');
    this.change(giftsOf(m.skills));
    this.rpg.toast('Skill points refunded: spend them however you like');
  }
  // Cast id from the panel (Cast / a double-click): the panel stays open
  cast(id) {
    const sk = SKILLS[id];
    if (!sk || !ACTIVE(id) || !rankOf(this.rpg.me?.skills, id)) return;
    if (!isCombat(this.roomFn?.())) return this.rpg.toast('Skills only work in combat areas'), audio.sfx('error');
    this.castFn?.(id);
    this.tick();
  }
  // every frame while open: each node's cooldown sweep (--cd: the share of its cooldown still to go), and Cast
  // greyed outside combat areas
  tick() {
    if (!this.isOpen) return;
    for (const [key, ic] of this.nodeEls) {
      const id = key.replace(/^card:/, ''), left = this.rpg.cooldown(id), full = cooldownOf(id, Math.max(1, rankOf(this.rpg.me?.skills, id))) || 1;
      const k = left > 0 ? Math.min(1, left / full).toFixed(3) : '0';
      if (ic.dataset.cd !== k) {
        ic.dataset.cd = k;
        ic.style.setProperty('--cd', k);
        ic.classList.toggle('cooling', left > 0);
      }
    }
    const b = this.castBtn, combat = isCombat(this.roomFn?.());
    if (b && b.dataset.combat !== String(combat)) {
      b.dataset.combat = String(combat);
      b.disabled = !combat;
      b.textContent = combat ? 'Cast' : 'Only in combat areas';
      b.classList.toggle('off', !combat);
    }
  }
  select(id) {
    this.sel = id;
    this.render();
    // phones: the card is in the scroll under the tree, so bring it into view
    if (this.sel && document.body.classList.contains('touch')) this.cardEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // a skill's round icon, cached per size
  icon(id, size, card = false) {
    const s = parseFloat(getComputedStyle(this.el).getPropertyValue('--s')) || 1;
    const px = Math.round(size * s * Math.min(2, devicePixelRatio || 1));
    const key = `${card ? 'card:' : ''}${id}@${px}`; // the card has its own (a canvas can only be in one place)
    let c = this.icons.get(key);
    if (!c) {
      c = document.createElement('canvas');
      c.width = c.height = px;
      // the badge is 44/48 of the size: draw it a touch bigger than the canvas so the round crop
      // (border-radius in CSS) sits inside it
      drawSkillIcon(c.getContext('2d'), id, px / 2, px / 2, px * (48 / 44) * 1.02);
      this.icons.set(key, c);
    }
    return c;
  }

  // why a skill can't take a point, as the card says it (null: it can)
  why(m, id) {
    const sk = SKILLS[id], cls = m.cls ?? 'novice';
    if (cls === 'novice' && sk.cls !== 'novice' && sk.cls !== 'any' && !sk.gift) return `Choose ${CLASSES[sk.cls].name} at the Rebirth Pool (from Lv ${CLASS_LVL}) to learn this`;
    return cantLearn(m, id);
  }

  node(m, id) {
    const sk = SKILLS[id], rank = rankOf(m.skills, id), why = cantLearn(m, id);
    const b = el('button', 'skt-node');
    b.type = 'button';
    if (rank) b.classList.add('has');
    if (rank >= sk.max) b.classList.add('max');
    if (!why) b.classList.add('can');
    if (this.sel === id) b.classList.add('sel');
    b.setAttribute('aria-label', `${sk.name} ${rank} of ${sk.max}`);
    const ic = el('span', 'skt-ic');
    ic.append(this.icon(id, document.body.classList.contains('touch') ? 64 : 52), el('span', 'skt-rank', `${rank}/${sk.max}`));
    b.append(ic, el('span', 'skt-name', sk.name));
    b.onclick = () => this.select(id);
    // desktop: a double-click casts it (SP1; phones have the card's Cast button)
    if (ACTIVE(id) && rank && !document.body.classList.contains('touch')) b.ondblclick = () => this.cast(id);
    if (ACTIVE(id)) this.nodeEls.set(id, ic);
    return b;
  }
  // a cell's nodes, `per` to a line (the line through each line's icons is CSS: --n nodes)
  nodes(m, ids, per = PER_ROW.wide) {
    const box = el('div', 'skt-rows');
    for (let i = 0; i < ids.length; i += per) {
      const line = ids.slice(i, i + per), row = el('div', 'skt-nodes');
      row.style.setProperty('--n', line.length);
      for (const id of line) row.append(this.node(m, id));
      box.append(row);
    }
    return box;
  }
  // a cell: a level pill, then the nodes; shut when the level hasn't opened it yet
  cell(m, lvl, ids, label, preview = false, per = PER_ROW.wide) {
    const c = el('div', 'skt-cell');
    const open = preview || m.lvl >= lvl; // a Novice's look-ahead is greyed as a whole instead
    if (!open) c.classList.add('shut');
    c.append(el('span', 'skt-lv', open ? label ?? `Lv ${lvl}` : `opens at Lv ${lvl}`));
    if (ids.length) c.append(this.nodes(m, ids, per));
    else c.classList.add('empty');
    return c;
  }

  render() {
    const m = this.rpg.me;
    if (!m || !this.isOpen) return;
    const cls = m.cls ?? 'novice', left = m.spLeft ?? spLeft(m), novice = cls === 'novice';
    const touch = document.body.classList.contains('touch');
    this.nodeEls.clear();
    this.castBtn = null;
    // header: points left, MP, the next advancement
    document.getElementById('skills-sp').textContent = novice
      ? `Novice points: ${left.novice}${m.lvl >= CLASS_LVL ? ` · class points waiting: ${left.cls}` : ''}`
      : `${CLASSES[cls].name} · class points: ${left.cls} · Novice points: ${left.novice}`;
    const next = ADVANCEMENTS.find((a) => a.lvl > m.lvl);
    document.getElementById('skills-next').textContent = `MP ${Math.floor(m.mp)} / ${m.maxMp} · ` + (novice
      ? (m.lvl < CLASS_LVL ? `Next: Lv ${CLASS_LVL}, choose a class` : 'Your class is waiting at the Rebirth Pool')
      : next ? `Next: Lv ${next.lvl}, ${ADV_NAMES[next.lvl] ?? next.name}${next.lvl === 30 ? ` (${CLASSES[cls].branches.map((b) => b.name).join(' and ')})` : ''}` : 'Every advancement is open');
    // a Novice past CLASS_LVL: class points are piling up
    const remind = document.getElementById('skills-remind');
    remind.hidden = !(novice && m.lvl >= CLASS_LVL);
    if (!remind.hidden) remind.textContent = `${left.cls} class point${left.cls === 1 ? ' is' : 's are'} piling up. Choose your class at the Rebirth Pool by Elder Mochi in Slimeville: the first choice is free.`;

    // tabs
    const tabs = [
      { id: 'novice', label: 'Novice', pts: left.novice },
      { id: 'class', label: novice ? 'Classes' : CLASSES[cls].name, pts: novice ? 0 : left.cls },
      { id: 'wind', label: 'Mobility', pts: novice ? 0 : left.cls },
    ];
    this.tabsEl.replaceChildren();
    for (const t of tabs) {
      const b = el('button', 'skt-tab' + (this.tab === t.id ? ' on' : ''), t.label);
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', this.tab === t.id);
      if (t.pts > 0) b.append(el('span', 'skt-pts', String(t.pts)));
      b.onclick = () => {
        if (this.tab === t.id) return;
        this.tab = t.id;
            this.treeEl.scrollTop = this.body.scrollTop = 0;
        this.render();
      };
      this.tabsEl.append(b);
    }

    // the tree
    const tree = el('div', 'skt');
    let shown = [];
    if (this.tab === 'novice' || this.tab === 'wind') {
      const t = TREES.find((x) => x.id === this.tab);
      tree.style.setProperty('--tree', t.color);
      const head = el('div', 'skt-head');
      head.append(el('b', null, `${t.name} · ${pointsIn(m.skills, t.id)} pts`), el('span', null, t.id === 'wind' && novice ? `${t.blurb} Paid with class points: choose a class first.` : t.blurb));
      tree.append(head);
      const lvls = [...new Set(skillsOf(t.id).map((id) => SKILLS[id].adv))].sort((a, b) => a - b);
      const col = el('div', 'skt-col');
      lvls.forEach((lv, i) => {
        const ids = skillsOf(t.id, (s) => s.adv === lv);
        shown.push(...ids);
        const c = this.cell(m, lv, ids, t.id === 'novice' ? 'Lv 1' : undefined);
        if (i === 0) c.classList.add('from');
        if (i === lvls.length - 1) c.classList.add('to');
        col.append(c);
      });
      if (t.id === 'wind' && novice) col.classList.add('preview');
      tree.append(col);
      // a gift skill (one player's own, SKILLS[id].gift) gets a row of its own under the Novice tree
      const gifts = t.id === 'novice' ? Object.keys(giftsOf(m.skills)) : [];
      if (gifts.length) {
        shown.push(...gifts);
        const g = el('div', 'skt-col gift');
        const c = this.cell(m, 1, gifts, gifts.every((id) => SKILLS[id].test) ? 'Test skills (TEST_SKILLS: test servers only)' : 'A gift from the gods');
        c.classList.add('from', 'to');
        g.append(c);
        tree.append(g);
      }
    } else {
      const k = novice ? this.peek : cls, C = CLASSES[k];
      tree.style.setProperty('--tree', C.color);
      if (novice) {
        // look ahead: both classes' trees, greyed, with a switch between them
        const pick = el('div', 'skt-pick');
        pick.append(el('b', null, m.lvl < CLASS_LVL ? `Choose a class at Lv ${CLASS_LVL} at the Rebirth Pool` : 'Choose your class at the Rebirth Pool by Elder Mochi'));
        const sw = el('div', 'skt-peek');
        for (const id of Object.keys(CLASSES).filter((c) => c !== 'novice')) {
          const b = el('button', 'skt-tab' + (k === id ? ' on' : ''), CLASSES[id].name);
          b.type = 'button';
          b.style.setProperty('--tree', CLASSES[id].color);
          b.onclick = () => {
            if (this.peek === id) return;
            this.peek = id;
            this.sel = null;
                    this.render();
          };
          sw.append(b);
        }
        pick.append(sw, el('span', null, `${C.blurb} Strong at ${C.strong}; weak at ${C.bad}.`));
        tree.append(pick);
      } else {
        const head = el('div', 'skt-head');
        head.append(el('b', null, `${C.name} · ${pointsIn(m.skills, k)} pts`), el('span', null, C.blurb));
        tree.append(head);
      }
      const body = el('div', 'skt-class' + (novice ? ' preview' : ''));
      // the basics (no branch), on top
      const basics = skillsOf(k, (s) => !s.branch);
      shown.push(...basics);
      const top = this.cell(m, CLASS_LVL, basics, `Lv ${CLASS_LVL} · ${C.name} basics`, novice);
      top.classList.add('from', 'basics');
      body.append(top, el('div', 'skt-fork'));
      // the branches: a column per branch, a row per advancement past the basics
      const grid = el('div', 'skt-grid');
      const rows = ADVANCEMENTS.map((a) => a.lvl).filter((lv) => lv > CLASS_LVL);
      C.branches.forEach((br, ci) => {
        const head = el('div', 'skt-branch' + (!novice && branchPoints(m.skills, br.id) ? ' held' : ''));
        head.style.gridColumn = String(ci + 1);
        head.style.gridRow = '1';
        head.append(el('b', null, `${br.name} · ${branchPoints(m.skills, br.id)} pts`), el('span', null, br.blurb));
        grid.append(head);
        rows.forEach((lv, ri) => {
          const ids = skillsOf(k, (s) => s.branch === br.id && s.adv === lv);
          shown.push(...ids);
          const c = this.cell(m, lv, ids, undefined, novice, PER_ROW.branch);
          if (ri === rows.length - 1) c.classList.add('to');
          c.style.gridColumn = String(ci + 1);
          c.style.gridRow = String(ri + 2);
          grid.append(c);
        });
      });
      body.append(grid);
      tree.append(body);
    }
    this.treeEl.replaceChildren(tree);
    if (this.sel && !shown.includes(this.sel)) this.sel = null;

    // the card of the selected skill
    this.cardEl.replaceChildren();
    if (!this.sel) {
      this.cardEl.className = 'empty';
      this.cardEl.textContent = `${touch ? 'Tap' : 'Click'} a skill to see what it does, learn it or put it on the hotbar.`;
      return;
    }
    const id = this.sel, sk = SKILLS[id], rank = rankOf(m.skills, id), why = this.why(m, id);
    this.cardEl.className = '';
    this.cardEl.style.setProperty('--tree', TREES.find((t) => t.id === sk.tree)?.color ?? '#8a6fc4');
    const ic = el('span', 'skt-ic');
    ic.append(this.icon(id, touch ? 64 : 52, true));
    const text = el('div', 'skc-body');
    const cd = cooldownOf(id, Math.max(1, rank));
    const tag = [sk.branch && branchOf(sk.branch).name, sk.adv > 1 && `Lv ${sk.adv}`, sk.kind === 'move' ? `${sk.key} · ${cd} s cooldown · no MP` : sk.kind === 'chase' ? `${sk.how}${cd ? ` · ${Math.round(cd * 10) / 10} s cooldown` : ''} · no MP` : ACTIVE(id) ? `${sk.mp} MP · ${cd} s cooldown` : 'passive'].filter(Boolean).join(' · ');
    const title = el('div', 'skc-title');
    title.append(el('b', null, sk.name), el('span', 'skc-rank', `${rank}/${sk.max}`), el('span', 'skc-tag', tag));
    text.append(title, el('p', null, rank ? `Now: ${sk.desc(rank)}` : `Rank 1: ${sk.desc(1)}`));
    if (rank && rank < sk.max) text.append(el('p', 'skc-next', `Next rank: ${sk.desc(rank + 1)}`));
    if (why && rank < sk.max && !sk.gift) text.append(el('p', 'skc-why', `${why}.`.replace(/\.\.$/, '.')));
    const btns = el('div', 'skc-btns');
    const btn = (label, c, fn, off) => {
      const b = el('button', c, label);
      b.type = 'button';
      b.disabled = off;
      b.onclick = fn;
      btns.append(b);
    };
    btn('+', 'sk-plus', () => this.learn(id), !!why);
    btn('−', 'sk-minus', () => this.unlearn(id), !rank || !!sk.gift);
    if (ACTIVE(id)) {
      const on = m.hotbar?.indexOf(id) ?? -1;
      btn(on >= 0 ? `Key ${on + 1}` : 'Hotbar', 'sk-bar', () => {
        this.rpg.startAssign('skill', id);
        this.close();
      }, !rank);
      // Cast (SP1): every active skill you hold, from here; greyed outside combat areas (tick keeps it right)
      if (rank) {
        btn('Cast', 'sk-cast', () => this.cast(id), false);
        this.castBtn = btns.lastChild;
        this.nodeEls.set(`card:${id}`, ic);
      }
    }
    this.cardEl.append(ic, text, btns);
    this.tick();
  }
}
