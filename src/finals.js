// Docs: docs/combat/bosses.md
// The final bosses on the client (FB2 generalised FB1's): one object per final boss, each with the same face (receive,
// reach / reachAround, event, ult, hits, update, draw, drawHud, clear), and this one routing to them, so the Rpg
// (src/rpg.js) talks to `this.final` whichever it is. Ladon: src/ladon.js; Fenrir: src/fenrir.js; Typhon: src/typhon.js (E5); the
// Wickmother: src/wickmother.js (L5, with a hold: her Hold on hits to her body, Party.mod); the Escapement: src/escapement.js (the
// Citadel's C6 (c): its hold is the Tick's open window, more than 1); Old Carapace: src/carapace.js (atlas Phase 9 A5 (c): its hold is
// the drink's window, more than 1). A 'final' message
// says whose it is (`fb`); a hit asks the boss's own (`MOBS[kind].final`); events and ultimates go to the room's.
import { MOBS, FENRIR_DEN, TYPHON_DEN, WICK_DEN, CATCH_DEN, LONG_DEN } from './shared/rpg.js';
import { Final } from './ladon.js';
import { FenrirFinal } from './fenrir.js';
import { TyphonFinal } from './typhon.js';
import { WickFinal } from './wickmother.js';
import { EscFinal } from './escapement.js';
import { CarapaceFinal } from './carapace.js';

export class Finals {
  constructor(rpg) {
    this.rpg = rpg;
    this.ladon = new Final(rpg);
    this.fenrir = new FenrirFinal(rpg);
    this.typhon = new TyphonFinal(rpg);
    this.wick = new WickFinal(rpg);
    this.esc = new EscFinal(rpg);
    this.shell = new CarapaceFinal(rpg);
    this.all = [this.ladon, this.fenrir, this.typhon, this.wick, this.esc, this.shell];
  }
  get st() {
    return this.shell.st ?? this.esc.st ?? this.wick.st ?? this.typhon.st ?? this.fenrir.st ?? this.ladon.st;
  }
  by(v) {
    const fb = MOBS[v?.kind]?.final;
    return fb === 'fenrir' ? this.fenrir : fb === 'typhon' ? this.typhon : fb === 'wickmother' ? this.wick : fb === 'escapement' ? this.esc : fb === 'old_carapace' ? this.shell : this.ladon;
  }
  here() {
    return this.rpg.room === FENRIR_DEN ? this.fenrir : this.rpg.room === TYPHON_DEN ? this.typhon : this.rpg.room === WICK_DEN ? this.wick : this.rpg.room === CATCH_DEN ? this.esc : this.rpg.room === LONG_DEN ? this.shell : this.ladon;
  }
  clear() {
    for (const f of this.all) f.clear();
  }
  receive(m) {
    (m.fb === 'fenrir' ? this.fenrir : m.fb === 'typhon' ? this.typhon : m.fb === 'wickmother' ? this.wick : m.fb === 'escapement' ? this.esc : m.fb === 'old_carapace' ? this.shell : this.ladon).receive(m);
  }
  // what's left of a hit on boss v's body (1 but for the Wickmother's Hold and the Escapement's Tick)
  hold(v) {
    return this.by(v).hold?.(v) ?? 1;
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
