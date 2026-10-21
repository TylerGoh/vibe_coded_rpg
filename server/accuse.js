// Docs: docs/social/accuse.md
// Accusing someone of botting, for fun: anyone can accuse one slime every ACCUSE_COOLDOWN_MS. The accused
// gets ACCUSE_WINDOW_MS to deny it (a button the client draws on the canvas, somewhere random, so a bot
// can't find it in the page). If they don't, they're caught: for BOT_PENALTY_MS they gain no EXP, and
// BOT_CUT of what they'd have gained goes to the accuser (server/rpg.js gainExp). Nothing is blocked while
// it's open, so a bot keeps botting. State lives on the character (`bot`, `accusedAt`) and is saved with it.
const FAST = Number(process.env.TEST_ACCUSE_FAST) || 1; // tests only: everything this many times faster
export const ACCUSE_COOLDOWN_MS = (30 * 60_000) / FAST; // per accuser
export const ACCUSE_WINDOW_MS = (5 * 60_000) / FAST; // time to deny it
export const BOT_PENALTY_MS = (30 * 60_000) / FAST; // how long a caught slime's EXP goes elsewhere
export const BOT_CUT = 0.2; // the accuser's share of it (the rest is lost)

// c.bot: { by, until, caught? }: an open accusation (until = deny deadline) or, caught, the penalty's end
export const caughtBy = (c, t = Date.now()) => (c?.bot?.caught && c.bot.until > t ? c.bot.by : null);

// A saved character's fields, cleaned on load
export function cleanBot(c) {
  const b = c.bot;
  c.bot = b && typeof b.by === 'string' && Number.isFinite(b.until) ? { by: b.by, until: b.until, caught: !!b.caught || undefined } : null;
  c.accusedAt = Number.isFinite(c.accusedAt) ? c.accusedAt : 0;
}

export function createAccuse({ players, send }) {
  const toast = (p, text) => send(p.ws, { t: 'toast', text });
  const byName = (name) => [...players.values()].find((q) => q.joined && q.rpg && q.name === name);
  // ← {t:'accused', by?, ms?, caught?}: your state (nothing open when `by` is missing)
  const tell = (p) => {
    const b = p.rpg.bot, ms = b ? Math.max(0, b.until - Date.now()) : 0;
    send(p.ws, b ? { t: 'accused', by: b.by, ms, caught: b.caught } : { t: 'accused' });
  };

  // a deadline passed: an open accusation becomes a penalty, a penalty ends
  function check(p, t = Date.now()) {
    const b = p.rpg?.bot;
    if (!b || b.until > t) return;
    const by = byName(b.by);
    if (!b.caught) {
      p.rpg.bot = { by: b.by, until: b.until + BOT_PENALTY_MS, caught: true };
      toast(p, `You didn't deny it: ${b.by} says you're a bot! For ${BOT_PENALTY_MS / 60_000} min your EXP is theirs to skim`);
      if (by) toast(by, `${p.name} never denied it: you get ${Math.round(BOT_CUT * 100)}% of their EXP for ${BOT_PENALTY_MS / 60_000} min`);
    } else {
      p.rpg.bot = null;
      toast(p, 'Your botting penalty is over: your EXP is your own again');
    }
    p.dirty = true;
    tell(p);
  }

  return {
    // → {t:'accuse', to}: accuse that player (any online slime but you)
    accuse(id, p, m) {
      const q = players.get(m.to);
      if (!q?.joined || !q.rpg || q === p || !p.rpg) return;
      const wait = p.rpg.accusedAt + ACCUSE_COOLDOWN_MS - Date.now();
      if (wait > 0) return toast(p, `You can accuse someone again in ${Math.ceil(wait / 60_000)} min`);
      if (q.rpg.bot) return toast(p, q.rpg.bot.caught ? `${q.name} has already been caught botting` : `${q.name} is already accused`);
      q.rpg.bot = { by: p.name, until: Date.now() + ACCUSE_WINDOW_MS };
      p.rpg.accusedAt = Date.now();
      p.dirty = q.dirty = true;
      tell(q);
      toast(p, `You accused ${q.name} of botting! If they don't deny it in ${ACCUSE_WINDOW_MS / 60_000} min, you get ${Math.round(BOT_CUT * 100)}% of their EXP`);
    },
    // → {t:'deny'}: not a bot
    deny(p) {
      const b = p.rpg?.bot;
      if (!b || b.caught || b.until <= Date.now()) return;
      p.rpg.bot = null;
      p.dirty = true;
      tell(p);
      toast(p, 'Denied! Nobody gets your EXP');
      const by = byName(b.by);
      if (by) toast(by, `${p.name} denied it: not a bot after all`);
    },
    // at login (and after a takeover)
    entered: tell,
    // once a second
    tick() {
      const t = Date.now();
      for (const p of players.values()) if (p.joined) check(p, t);
    },
    byName,
  };
}
