// Docs: docs/combat/skills.md
// The skill tree (K, or the Skills button): columns for the Novice tree, your class (a Novice sees both
// classes' trees to look ahead) and Mobility. + spends a point, − takes one back, "Reset all" refunds
// everything for free, so nobody gets stuck with a build. Active skills can be put on the hotbar (1–6).
// Rules: src/shared/skills.js. (S2.1 kept this list working on the class data; S2.2 makes it a node tree.)
import { drawSkillIcon } from './skillfx.js';
import { audio } from './audio.js';
import { TREES, SKILLS, ACTIVE, CLASSES, CLASS_LVL, rankOf, cantLearn, cantUnlearn, pointsIn, cooldownOf, branchOf, spLeft, spFree } from './shared/skills.js';

export class SkillTree {
  constructor({ rpg, send, onOpenChange }) {
    this.rpg = rpg;
    this.send = send;
    this.onOpenChange = onOpenChange;
    this.el = document.getElementById('skills');
    this.cols = document.getElementById('skills-cols');
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
    this.change({});
    this.rpg.toast('Skill points refunded: spend them however you like');
  }

  render() {
    const m = this.rpg.me;
    if (!m || !this.isOpen) return;
    const cls = m.cls ?? 'novice', left = m.spLeft ?? spLeft(m);
    document.getElementById('skills-sp').textContent = cls === 'novice'
      ? `Novice points: ${left.novice}${m.lvl >= CLASS_LVL ? ` · ${left.cls} class points waiting: choose a class at the Rebirth Pool` : ` · choose a class at Lv ${CLASS_LVL}`}`
      : `${CLASSES[cls].name} · class points: ${left.cls} · Novice points: ${left.novice}`;
    document.getElementById('skills-mp').textContent = `MP ${Math.floor(m.mp)} / ${m.maxMp}`;
    this.cols.replaceChildren();
    // a Novice looks ahead at both classes' trees; a class sees its own
    for (const tree of TREES.filter((t) => t.id === 'novice' || t.id === 'wind' || cls === 'novice' || t.id === cls)) {
      const col = document.createElement('div');
      col.className = 'sk-col';
      col.style.setProperty('--tree', tree.color);
      const head = document.createElement('div');
      head.className = 'sk-head';
      head.innerHTML = '<b></b><span></span>';
      head.querySelector('b').textContent = `${tree.name} · ${pointsIn(m.skills, tree.id)} pts`;
      head.querySelector('span').textContent = tree.blurb;
      col.append(head);
      for (const [id, sk] of Object.entries(SKILLS).filter(([, s]) => s.tree === tree.id).sort((a, b) => a[1].adv - b[1].adv || (a[1].branch ?? '').localeCompare(b[1].branch ?? ''))) {
        const rank = rankOf(m.skills, id), why = cantLearn(m, id);
        const locked = !rank && !!why && !/Maxed|No .*points left/.test(why);
        const card = document.createElement('div');
        card.className = 'sk-card' + (locked ? ' locked' : '') + (rank ? ' learned' : '');
        const icon = document.createElement('canvas');
        const dpr = Math.min(2, devicePixelRatio || 1), size = 44;
        icon.width = icon.height = size * dpr;
        const g = icon.getContext('2d');
        g.scale(dpr, dpr);
        drawSkillIcon(g, id, size / 2, size / 2, size);
        const body = document.createElement('div');
        body.className = 'sk-body';
        const name = document.createElement('b');
        name.textContent = `${sk.name}  ${rank}/${sk.max}`;
        const tag = document.createElement('span');
        tag.className = 'sk-tag';
        tag.textContent = (sk.branch ? `${branchOf(sk.branch).name} · ` : '') + (sk.adv > 1 ? `Lv ${sk.adv} · ` : '') + (sk.kind === 'move' ? `${sk.key} · ${cooldownOf(id, Math.max(1, rank))}s · no MP` : ACTIVE(id) ? `${sk.mp} MP · ${cooldownOf(id, Math.max(1, rank))}s` : 'passive');
        const desc = document.createElement('p');
        desc.textContent = (locked ? `${why}. ` : '') + sk.desc(Math.max(1, rank)) + (rank && rank < sk.max ? ` Next: ${sk.desc(rank + 1)}` : '');
        body.append(name, tag, desc);
        const btns = document.createElement('div');
        btns.className = 'sk-btns';
        const btn = (label, cls, fn, off) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.textContent = label;
          b.className = cls;
          b.disabled = off;
          b.onclick = fn;
          btns.append(b);
        };
        btn('+', 'sk-plus', () => this.learn(id), !!why);
        btn('−', 'sk-minus', () => this.unlearn(id), !rank);
        if (ACTIVE(id) && rank) {
          const on = m.hotbar.indexOf(id);
          btn(on >= 0 ? `Key ${on + 1}` : 'Hotbar', 'sk-bar', () => {
            this.rpg.startAssign('skill', id);
            this.close();
          }, false);
        }
        card.append(icon, body, btns);
        col.append(card);
      }
      this.cols.append(col);
    }
  }
}
