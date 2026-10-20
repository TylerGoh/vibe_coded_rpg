// Docs: docs/places/houses.md
// Personal houses: every account's house room, its saved layout (furniture, wallpaper, floor), invites,
// sending guests home, buying a bigger house, and the furniture each account owns (bought at the
// furniture store, src/store.js; saved with the layout as `owned`). House rooms are numbered from HOUSE_BASE as accounts first log in after a
// start (room ids are only for this run of the server; layouts are saved by username).
import { DatabaseSync } from 'node:sqlite';
import { HOUSE_BASE, HOUSE_EXIT_X, HOME_DOOR_X, VILLAGE, isHouse, roomDef, setHouseRoom, newState, STORE } from '../src/shared/sim.js';
import { cleanLayout, cleanOwned, placed, houseRoom, DEFAULT_LAYOUT, HOUSE_SIZES, STARTER, FURNITURE } from '../src/shared/house.js';

export const INVITE_MS = 120_000; // how long an invite stays open
const INVITE_GAP_MS = 4000; // the same host can't re-invite the same guest faster than this

// players: the server's id → player map. send(ws, msg). toRoom(room)(msg). pay(p, gold) → true if p had
// that much gold and it's now been spent (server/rpg.js).
export function createHouses({ dbPath, players, send, toRoom, pay }) {
  const db = new DatabaseSync(dbPath);
  db.exec(`CREATE TABLE IF NOT EXISTS houses (user TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at INTEGER NOT NULL)`);
  const loadRow = db.prepare('SELECT data FROM houses WHERE user = ?');
  const saveRow = db.prepare(`INSERT INTO houses (user, data, updated_at) VALUES (?, ?, ?)
                              ON CONFLICT(user) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`);
  const rooms = new Map(); // username → house room id
  const owners = new Map(); // house room id → { user, layout }
  let next = HOUSE_BASE;

  const toast = (p, text) => send(p.ws, { t: 'toast', text });
  const houseMsg = (room) => ({ t: 'house', room, owner: owners.get(room).user, layout: owners.get(room).layout });
  const byName = (name) => [...players.entries()].find(([, q]) => q.joined && q.name === name);
  // Server-side move, like waking up from a faint: the client's prediction snaps to it on the next snapshot
  const moveTo = (p, room, x) => Object.assign(p.state, newState(x), { room, y: roomDef(room).ground, home: p.state.home, mv: p.state.mv, facing: p.state.facing });

  // A layout changed: the room's shape follows, it's saved, and everyone inside gets it
  function store(room, h) {
    setHouseRoom(room, houseRoom(h.layout));
    saveRow.run(h.user, JSON.stringify({ ...h.layout, owned: h.owned }), Date.now());
    toRoom(room)(houseMsg(room));
  }

  return {
    // At login: the account's house room (made, and its layout loaded, the first time)
    homeOf(user) {
      let room = rooms.get(user);
      if (room) return room;
      room = next++;
      rooms.set(user, room);
      let layout = DEFAULT_LAYOUT, owned = STARTER;
      try {
        const row = loadRow.get(user);
        if (row) {
          layout = JSON.parse(row.data);
          owned = layout.owned ?? {}; // (houses from before the store own what they'd put out)
        }
      } catch (e) {
        console.error('bad house layout for', user, e);
      }
      layout = cleanLayout(layout);
      owned = cleanOwned(owned);
      for (const [k, n] of Object.entries(placed(layout))) owned[k] = Math.max(owned[k] ?? 0, n);
      owners.set(room, { user, layout, owned });
      setHouseRoom(room, houseRoom(layout));
      return room;
    },
    // Walked into a house: here's how it looks
    entered(p) {
      if (isHouse(p.state.room) && owners.has(p.state.room)) send(p.ws, houseMsg(p.state.room));
    },
    ownerOf: (room) => owners.get(room)?.user,
    // At login (after homeOf): the furniture you own, for the decorate panel and the store
    sendOwned(p) {
      const h = owners.get(rooms.get(p.name));
      if (h) send(p.ws, { t: 'furni', owned: h.owned });
    },

    // → {t:'furni-buy', k}: buy one piece of furniture (in the furniture store)
    buy(p, m) {
      const h = owners.get(rooms.get(p.name)), def = FURNITURE[m.k];
      if (!h || !def || p.state.room !== STORE) return;
      if ((h.owned[m.k] ?? 0) >= 999) return;
      if (!pay(p, def.price)) return toast(p, `Not enough gold: the ${def.name} costs ${def.price.toLocaleString('en-US')}`);
      h.owned[m.k] = (h.owned[m.k] ?? 0) + 1;
      saveRow.run(h.user, JSON.stringify({ ...h.layout, owned: h.owned }), Date.now());
      send(p.ws, { t: 'furni', owned: h.owned, bought: m.k });
    },

    // → {t:'house-set', layout}: the owner redecorated (only from inside their own house)
    set(p, m) {
      const room = p.state.room, h = owners.get(room);
      if (!h || h.user !== p.name) return;
      h.layout = cleanLayout({ ...m.layout, size: h.layout.size }, h.owned); // (the size only grows by paying)
      store(room, h);
    },

    // → {t:'house-grow', size}: pay for the next size up (from inside your own house). size: the one the
    // client is buying, so a double click can't buy two.
    grow(p, m) {
      const room = p.state.room, h = owners.get(room);
      if (!h || h.user !== p.name) return;
      const size = h.layout.size + 1, next = HOUSE_SIZES[size];
      if (!next || m.size !== size) return;
      if (!pay(p, next.price)) return toast(p, `Not enough gold: the ${next.name} costs ${next.price.toLocaleString('en-US')}`);
      h.layout = cleanLayout({ ...h.layout, size }, h.owned);
      store(room, h);
      toRoom(room)({ t: 'house-grew', room, name: next.name, by: p.name });
    },

    // → {t:'invite', to}: from the village or your own house, to someone standing in the village
    invite(id, p, m) {
      const [qid, q] = [m.to, players.get(m.to)];
      if (!q?.joined || qid === id) return;
      if (p.state.room !== VILLAGE && p.state.room !== p.state.home) return toast(p, 'You can only invite slimes from the village or your own house');
      if (q.state.room !== VILLAGE) return toast(p, `${q.name} has to be in the village to get an invite`);
      q.invites ??= new Map();
      const was = q.invites.get(p.name);
      if (was && Date.now() - was.at < INVITE_GAP_MS) return;
      q.invites.set(p.name, { room: p.state.home, at: Date.now() });
      send(q.ws, { t: 'invite', from: id, name: p.name, ms: INVITE_MS });
      toast(p, `Invited ${q.name} over to your house`);
    },

    // → {t:'visit', host, no?}: say yes (or no thanks) to an invite. Yes takes you straight inside.
    visit(id, p, m) {
      const inv = p.invites?.get(m.host);
      if (!inv) return;
      p.invites.delete(m.host);
      const host = byName(m.host)?.[1];
      if (m.no) return host && toast(host, `${p.name} can't come over right now`);
      if (Date.now() - inv.at > INVITE_MS) return toast(p, 'That invite has expired');
      if (p.state.room !== VILLAGE) return toast(p, 'Go back to the village to accept the invite');
      if (p.faintUntil) return;
      moveTo(p, inv.room, HOUSE_EXIT_X + 70 + Math.round(Math.random() * 60));
      if (host) toast(host, `${p.name} came over!`);
    },

    // → {t:'house-kick'}: the owner sends every guest back out to the village
    kick(id, p) {
      const room = p.state.room;
      if (owners.get(room)?.user !== p.name) return;
      for (const q of players.values()) {
        if (q === p || !q.joined || q.state.room !== room) continue;
        moveTo(q, VILLAGE, HOME_DOOR_X + (Math.random() < 0.5 ? -1 : 1) * (60 + Math.round(Math.random() * 60)));
        toast(q, `${p.name} sent everyone home`);
      }
    },
  };
}
