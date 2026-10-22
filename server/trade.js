// Docs: docs/social/trading.md
// Trading coins and items between two players standing near each other. The server decides
// everything: offers are re-read from the bag, any change un-readies both sides, and the swap re-checks
// both bags and purses at that moment and moves both sides at once (all or nothing). Every trade is
// logged in table `trade_log`.
import { DatabaseSync } from 'node:sqlite';
import { ITEMS, STACKS, BAG_SLOTS } from '../src/shared/rpg.js';
import { TRADE_ITEMS, TRADE_ASK_MS, TRADE_LEAVE, tradeBlock } from '../src/shared/trade.js';
import { caughtBy } from './accuse.js';

const sameE = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

// c's bag after giving `out` and getting `got` (lists of {id, n, e}) → the new bag, or null if c no
// longer has what they offered or the bag can't hold what comes in
function after(c, out, got) {
  const bag = c.bag.map((b) => ({ ...b }));
  for (const o of out) {
    let need = o.n;
    for (const b of bag) {
      if (need <= 0) break;
      if (b.id !== o.id || !sameE(b.e, o.e)) continue;
      const k = Math.min(b.n, need);
      b.n -= k;
      need -= k;
    }
    if (need > 0) return null;
  }
  const kept = bag.filter((b) => b.n > 0);
  for (const g of got) {
    const slot = STACKS(g.id) && kept.find((b) => b.id === g.id);
    if (slot) slot.n += g.n;
    else if (kept.length < BAG_SLOTS) kept.push(g.e ? { id: g.id, n: g.n, e: g.e } : { id: g.id, n: g.n });
    else return false;
  }
  return kept;
}

export function createTrade({ dbPath, players, send, rpg }) {
  const db = new DatabaseSync(dbPath);
  db.exec(`CREATE TABLE IF NOT EXISTS trade_log (at INTEGER NOT NULL, a TEXT NOT NULL, b TEXT NOT NULL, a_gave TEXT NOT NULL, b_gave TEXT NOT NULL)`);
  const logRow = db.prepare('INSERT INTO trade_log (at, a, b, a_gave, b_gave) VALUES (?, ?, ?, ?, ?)');
  const asks = new Map(); // `${from}>${to}` → until
  const toast = (p, text) => send(p.ws, { t: 'toast', text });
  const live = (id) => {
    const p = players.get(id);
    return p?.joined && p.rpg ? p : null;
  };
  const why = (p, q) => (caughtBy(p.rpg) ? 'You were caught botting: deny it before trading' : caughtBy(q.rpg) ? `${q.name} was caught botting and can't trade` : tradeBlock(p.state, q.state));

  // the trade as one side sees it
  function show(t) {
    for (const [i, j] of [[0, 1], [1, 0]]) {
      const p = live(t.ids[i]);
      if (p) send(p.ws, { t: 'trade', with: t.names[j], withId: t.ids[j], v: t.v, mine: t.sides[i], theirs: t.sides[j] });
    }
  }
  function end(t, text, done = false) {
    for (const id of t.ids) {
      const p = live(id);
      if (!p || p.trade !== t) continue;
      p.trade = null;
      send(p.ws, { t: 'trade-end', text, done });
    }
  }
  function open(a, aId, b, bId) {
    const t = { ids: [aId, bId], names: [a.name, b.name], v: 1, sides: [0, 1].map(() => ({ items: [], coins: 0, ready: false })) };
    a.trade = b.trade = t;
    show(t);
  }
  // a change to the trade un-readies both sides (so nobody is fooled by a last-second swap)
  function changed(t) {
    t.v++;
    for (const s of t.sides) s.ready = false;
    show(t);
  }

  function swap(t) {
    const [a, b] = t.ids.map(live);
    if (!a || !b) return end(t, 'The trade was called off');
    const [sa, sb] = t.sides;
    const ba = after(a.rpg, sa.items, sb.items), bb = after(b.rpg, sb.items, sa.items);
    const short = ba === null ? a : bb === null ? b : a.rpg.coins < sa.coins ? a : b.rpg.coins < sb.coins ? b : null;
    if (short) {
      sa.ready = sb.ready = false;
      t.v++;
      show(t);
      for (const p of [a, b]) toast(p, `${p === short ? 'You no longer have' : `${short.name} no longer has`} everything in the offer: check it again`);
      return;
    }
    const full = ba === false ? a : bb === false ? b : null;
    if (full) {
      sa.ready = sb.ready = false;
      t.v++;
      show(t);
      for (const p of [a, b]) toast(p, p === full ? 'Your bag is too full for this trade: make room first' : `${full.name}'s bag is too full for this trade`);
      return;
    }
    a.rpg.bag = ba;
    b.rpg.bag = bb;
    a.rpg.coins += sb.coins - sa.coins;
    b.rpg.coins += sa.coins - sb.coins;
    for (const p of [a, b]) {
      rpg.sendMe(p);
      rpg.save(p);
    }
    logRow.run(Date.now(), a.name, b.name, JSON.stringify({ coins: sa.coins, items: sa.items }), JSON.stringify({ coins: sb.coins, items: sb.items }));
    console.log(`trade: ${a.name} gave ${sa.coins}g + ${sa.items.map((x) => `${x.id}×${x.n}`).join(',') || '-'}; ${b.name} gave ${sb.coins}g + ${sb.items.map((x) => `${x.id}×${x.n}`).join(',') || '-'}`);
    end(t, 'Trade done!', true);
  }

  return {
    // → {t:'trade-ask', to}
    ask(id, p, m) {
      const q = live(m.to);
      if (!q || q === p) return;
      if (p.trade) return toast(p, 'You are already trading');
      const no = why(p, q);
      if (no) return toast(p, no);
      if (q.trade) return toast(p, `${q.name} is busy trading`);
      // they asked us first: that's a yes
      if ((asks.get(`${m.to}>${id}`) ?? 0) > Date.now()) {
        asks.delete(`${m.to}>${id}`);
        return open(q, m.to, p, id);
      }
      asks.set(`${id}>${m.to}`, Date.now() + TRADE_ASK_MS);
      send(q.ws, { t: 'trade-ask', from: id, name: p.name, ms: TRADE_ASK_MS });
      toast(p, `Asked ${q.name} to trade`);
    },
    // → {t:'trade-answer', from, yes}
    answer(id, p, m) {
      const key = `${m.from}>${id}`, until = asks.get(key) ?? 0;
      asks.delete(key);
      const q = live(m.from);
      if (!q || until < Date.now()) return m.yes && toast(p, 'That trade request ran out');
      if (!m.yes) return toast(q, `${p.name} doesn't want to trade right now`);
      const no = why(p, q);
      if (no) return toast(p, no);
      if (p.trade || q.trade) return toast(p, `${p.trade ? 'You are' : `${q.name} is`} already trading`);
      open(q, m.from, p, id);
    },
    // → {t:'trade-offer', items: [{slot, n}], coins}  your whole offer, read from your bag now
    offer(id, p, m) {
      const t = p.trade;
      if (!t || !Array.isArray(m.items)) return;
      const c = p.rpg, seen = new Set(), items = [];
      for (const o of m.items.slice(0, TRADE_ITEMS)) {
        const slot = o?.slot >>> 0, b = c.bag[slot];
        if (!b || seen.has(slot) || !ITEMS[b.id]) continue;
        seen.add(slot);
        const n = Math.max(1, Math.min(b.n, Math.floor(Number(o.n)) || b.n));
        items.push(b.e ? { id: b.id, n, e: b.e } : { id: b.id, n });
      }
      const coins = Math.max(0, Math.min(c.coins, Math.floor(Number(m.coins)) || 0));
      t.sides[t.ids.indexOf(id)] = { items, coins, ready: false };
      changed(t);
    },
    // → {t:'trade-ready', on, v}  v: the version you were looking at (a stale one is ignored)
    ready(id, p, m) {
      const t = p.trade;
      if (!t || m.v !== t.v) return;
      t.sides[t.ids.indexOf(id)].ready = !!m.on;
      if (t.sides.every((s) => s.ready)) swap(t);
      else show(t);
    },
    // → {t:'trade-cancel'}
    cancel(id, p) {
      if (p.trade) end(p.trade, `${p.name} called off the trade`);
    },
    // every second: a trade ends when someone leaves, walks off, or goes somewhere else
    tick() {
      const t0 = Date.now();
      for (const [k, until] of asks) if (until < t0) asks.delete(k);
      const seen = new Set();
      for (const p of players.values()) {
        const t = p.trade;
        if (!t || seen.has(t)) continue;
        seen.add(t);
        const [a, b] = t.ids.map(live);
        if (!a || !b || a.trade !== t || b.trade !== t) end(t, 'The other slime left, so the trade was called off');
        else if (a.state.room !== b.state.room || tradeBlock(a.state, { ...b.state, x: a.state.x }) || Math.abs(a.state.x - b.state.x) > TRADE_LEAVE) end(t, 'You walked apart, so the trade was called off');
      }
    },
  };
}
