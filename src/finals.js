// Docs: docs/combat/bosses.md
// The final bosses on the client (FB2 generalised FB1's): one object per final boss, each with the same face (receive,
// reach / reachAround, event, ult, hits, update, draw, drawHud, clear), and this one routing to them, so the Rpg
// (src/rpg.js) talks to `this.final` whichever it is. Ladon: src/ladon.js; Fenrir: src/fenrir.js. A 'final' message
// says whose it is (`fb`); a hit asks the boss's own (`MOBS[kind].final`); events and ultimates go to the room's.
import { MOBS, FENRIR_DEN } from './shared/rpg.js';
import { Final } from './ladon.js';
import { FenrirFinal } from './fenrir.js';

export class Finals {
  constructor(rpg) {
    this.rpg = rpg;
    this.ladon = new Final(rpg);
    this.fenrir = new FenrirFinal(rpg);
    this.all = [this.ladon, this.fenrir];
  }
  get st() {
    return this.fenrir.st ?? this.ladon.st;
  }
  by(v) {
    return MOBS[v?.kind]?.final === 'fenrir' ? this.fenrir : this.ladon;
  }
  here() {
    return this.rpg.room === FENRIR_DEN ? this.fenrir : this.ladon;
  }
  clear() {
    for (const f of this.all) f.clear();
  }
  receive(m) {
    (m.fb === 'fenrir' ? this.fenrir : this.ladon).receive(m);
  }
  reach(v, ...a) {
    return this.by(v).reach(v, ...a);
  }
  reachAround(v, ...a) {
    return this.by(v).reachAround(v, ...a);
  }
  event(m, pan, me) {
    return this.here().event(m, pan, me);
  }
  ult(m, me) {
    return this.here().ult(m, me);
  }
  hits(me) {
    return this.here().hits(me);
  }
  update(dt) {
    for (const f of this.all) f.update(dt);
  }
  draw(ctx) {
    for (const f of this.all) f.draw(ctx);
  }
  drawHud(ctx, H) {
    for (const f of this.all) f.drawHud(ctx, H);
  }
}
