// Docs: docs/places/fair.md
// The Gathering Fair's booths and prize counter on the server (created by server/rpg.js, which routes {t:'fair'} here).
// A round: → {a:'start', g} at a booth → ← {t:'fair', a:'go', g, seed} (and everyone in the fair sees you playing:
// {a:'play', id, g}) → you play it out on your own screen (src/fair-games.js) → {a:'end', score} → the score is capped at
// the best that seed allows (maxScore, src/shared/fair.js), scaled down if you stopped early, and turned into tickets
// (ticketsFor) → ← {t:'fair', a:'won', g, score, tickets, total} to you, {a:'score', id, g, score} to the fair. The best
// score at each booth today (kept in memory: a restart or midnight clears it) is sent on {a:'hello'} and when it's beaten.
// Prizes: {a:'prize', id} at the counter trades tickets for a cosmetic (COSMETICS with `tickets`). Cosmetic only: no gold,
// EXP or power moves here (owner, 2026-11-20).
// The Green (F3, docs/places/rides.md): {a:'strike'} at the High Striker (a slap or E on its pad): the server rolls how high
// the puck goes from the tick the client saw the tower's light at ({a:'strike', vt}: strikeHeight, skill not luck) and
// tells the fair ({a:'strike', id, h}); the bell is worth
// STRIKE_TICKETS. {a:'throw'} from the dunk tank's line: the server rolls a hit (DUNK_HIT) and tells the fair ({a:'throw',
// id, hit, who}); a hit drops the plank (pf DUNK_BIT on everyone sitting on it, for DUNK_MS: step() lets them fall
// through it into the water).
import { FAIR, FAIR_GAMES, ROUND_S, maxScore, ticketsFor, boothAt, PRIZES, prizeX, PRIZE_RANGE, TICKETS_MAX, STRIKER_X, STRIKER_RANGE, STRIKE_CD_MS, STRIKE_TICKETS, STRIKE_LAG, strikeHeight, THROW_X, THROW_RANGE, THROW_CD_MS, DUNK_HIT, PLANK, DUNK_BIT, DUNK_MS } from '../src/shared/fair.js';
import { COSMETICS } from '../src/shared/rpg.js';

const ROUND_MS = ROUND_S * 1000;
const SLACK_MS = 1500; // a round's end can arrive this much before ROUND_MS and still count as finished (timers drift)
const STALE_MS = ROUND_MS + 20000; // a round never ended (a closed tab): forgotten after this

export function createFair({ send, players, toRoom, sendMe, showLook, toast, tick = () => 0, now = Date.now }) {
  const bests = {}; // game → { name, score } (today's best)
  let bestDay = new Date().toDateString();
  const today = () => {
    const d = new Date().toDateString();
    if (d !== bestDay) for (const k of Object.keys(bests)) delete bests[k];
    bestDay = d;
    return bests;
  };

  function start(id, p, m) {
    const s = p.state, b = boothAt(s.x);
    if (s.room !== FAIR || !b || b.game !== m.g || !FAIR_GAMES[m.g]) return toast(p, 'Walk up to the booth first');
    if (p.fairGame && now() - p.fairGame.at < STALE_MS) return; // one round at a time
    const seed = (Math.random() * 0x7fffffff) | 0;
    p.fairGame = { g: m.g, seed, at: now() };
    send(p.ws, { t: 'fair', a: 'go', g: m.g, seed });
    toRoom(FAIR)({ t: 'fair', a: 'play', id, g: m.g });
  }

  function end(id, p, m) {
    const r = p.fairGame;
    if (!r) return;
    p.fairGame = null;
    const c = p.rpg, played = now() - r.at, max = maxScore(r.g, r.seed);
    const cap = played >= ROUND_MS - SLACK_MS ? max : Math.floor(max * Math.max(0, played / ROUND_MS));
    const score = Math.max(0, Math.min(cap, Math.floor(Number(m.score) || 0)));
    const tickets = p.state.room === FAIR ? ticketsFor(score, max) : 0;
    c.tickets = Math.min(TICKETS_MAX, (c.tickets | 0) + tickets);
    send(p.ws, { t: 'fair', a: 'won', g: r.g, score, tickets, total: c.tickets });
    toRoom(FAIR)({ t: 'fair', a: 'score', id, g: r.g, score });
    const best = today()[r.g];
    if (score > 0 && (!best || score > best.score)) {
      bests[r.g] = { name: p.name, score };
      toRoom(FAIR)({ t: 'fair', a: 'bests', bests });
    }
    if (tickets) sendMe(p);
  }

  function prize(id, p, m) {
    const s = p.state, c = p.rpg, i = PRIZES.indexOf(m.id), cos = COSMETICS[m.id];
    if (i < 0 || !cos?.tickets) return;
    if (s.room !== FAIR || Math.abs(s.x - prizeX(i)) > PRIZE_RANGE + 60) return toast(p, 'Walk over to the prize counter first');
    if (c.cosmetics.includes(m.id)) return toast(p, `You already have the ${cos.name}`);
    if ((c.tickets | 0) < cos.tickets) return toast(p, `Not enough tickets (the ${cos.name} is ${cos.tickets}; you have ${c.tickets | 0})`);
    c.tickets -= cos.tickets;
    c.cosmetics.push(m.id);
    c.wear.push(m.id); // on straight away, like the Boutique's
    send(p.ws, { t: 'fair', a: 'prized', id: m.id, total: c.tickets });
    sendMe(p);
    showLook(id, p);
  }

  // ——— the High Striker ———
  function strike(id, p, m) {
    const s = p.state, c = p.rpg;
    if (s.room !== FAIR || Math.abs(s.x - STRIKER_X) > STRIKER_RANGE + 30 || s.rd) return;
    if (now() - (p.struckAt ?? 0) < STRIKE_CD_MS) return;
    p.struckAt = now();
    const t = tick(), vt = Math.round(Number(m.vt));
    const at = Number.isFinite(vt) && vt <= t + 5 && vt >= t - STRIKE_LAG ? vt : t - STRIKE_LAG; // (too old or from the future: judged at the oldest allowed)
    const h = strikeHeight(at), bell = h >= 1;
    if (bell) c.tickets = Math.min(TICKETS_MAX, (c.tickets | 0) + STRIKE_TICKETS);
    toRoom(FAIR)({ t: 'fair', a: 'strike', id, h: Math.round(h * 100) / 100, tickets: bell ? STRIKE_TICKETS : 0 });
    if (bell) sendMe(p);
  }

  // ——— the dunk tank ———
  const sitting = (q) => q.joined && q.state.room === FAIR && !q.state.rd && q.state.onPlat && Math.abs(q.state.y - PLANK.y) < 1 && q.state.x >= PLANK.x - 20 && q.state.x <= PLANK.x + PLANK.w + 20;
  function toss(id, p) {
    const s = p.state;
    if (s.room !== FAIR || Math.abs(s.x - THROW_X) > THROW_RANGE + 30 || s.rd) return;
    if (now() - (p.threwAt ?? 0) < THROW_CD_MS) return;
    p.threwAt = now();
    const hit = Math.random() < DUNK_HIT, who = [];
    if (hit) {
      for (const [qid, q] of players) {
        if (!sitting(q)) continue;
        q.state.pf = (q.state.pf | 0) | DUNK_BIT; // (step() lets them through the plank: they fall in)
        who.push(qid);
        setTimeout(() => {
          if (q.state) q.state.pf = (q.state.pf | 0) & ~DUNK_BIT;
        }, DUNK_MS);
      }
    }
    toRoom(FAIR)({ t: 'fair', a: 'throw', id, hit, who });
  }

  return {
    // {t:'fair', a:'hello' | 'start' | 'end' | 'prize' | 'strike' | 'throw', …}
    receive(id, p, m) {
      if (m.a === 'hello') send(p.ws, { t: 'fair', a: 'bests', bests: today() });
      else if (m.a === 'start' && typeof m.g === 'string') start(id, p, m);
      else if (m.a === 'end') end(id, p, m);
      else if (m.a === 'prize' && typeof m.id === 'string') prize(id, p, m);
      else if (m.a === 'strike') strike(id, p, m);
      else if (m.a === 'throw') toss(id, p);
    },
  };
}
