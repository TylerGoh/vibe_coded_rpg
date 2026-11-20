// Docs: docs/places/pocket.md
// The pocket world's multiplayer (the 3D beach through the fair's upside-down mirror): who's on the beach and where.
// The beach is drawn and walked on each client (src/pocket.js); the server only passes positions round, like the
// client-decided parts of combat: it checks you went in at the mirror and keeps what you say inside the beach.
//   → {t:'pk', a:'in'}   at the fair's upside-down mirror: you're on the beach  ← {t:'pk', a:'in', id} to everyone
//                        (the 2D fair marks your waiting slime) and {t:'pk', a:'who', ids} back to you
//   → {t:'pk', a:'at', p:[x, y, z, face, flags]}  where you are, ~10 a second (flags: 1 grounded, 2 swimming, 4 moving)
//   → {t:'pk', a:'out'}  home through the mirror (also on leaving the fair or the game)  ← {t:'pk', a:'out', id} to everyone
//   ← {t:'pk', a:'all', s:[[id, x, y, z, face, flags], …]}  everyone on the beach, PK_HZ a second, to everyone on it
//   (only while two or more are there)
// Joining the fair: ← {t:'pk', a:'who', ids} (who's away on the beach, for the 2D marks).
import { FAIR, POCKET_X } from '../src/shared/fair.js';
import { WORLD_R } from '../src/pocket-beach.js';

export const PK_HZ = 10;
const MIRROR_REACH = 140; // px from the mirror in the fair that counts as at it (it's E range plus a margin)

export function createPocket({ players, send, broadcast }) {
  const inside = new Map(); // id → [x, y, z, face, flags]
  const num = (v, lo, hi) => (Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : 0);
  const r2 = (v) => Math.round(v * 100) / 100;

  function leave(id) {
    if (inside.delete(id)) broadcast({ t: 'pk', a: 'out', id });
  }

  setInterval(() => {
    if (inside.size < 2) return; // alone on the beach: nothing to tell anyone
    const s = [...inside].map(([id, v]) => [id, ...v]), data = JSON.stringify({ t: 'pk', a: 'all', s });
    for (const id of inside.keys()) {
      const q = players.get(id);
      if (q) send(q.ws, data);
    }
  }, 1000 / PK_HZ).unref();

  return {
    receive(id, p, m) {
      if (m.a === 'in') {
        if (p.state.room !== FAIR || Math.abs(p.state.x - POCKET_X) > MIRROR_REACH) return;
        const was = inside.has(id);
        inside.set(id, inside.get(id) ?? [0, 0, 0, 0, 1]);
        send(p.ws, { t: 'pk', a: 'who', ids: [...inside.keys()] });
        if (!was) broadcast({ t: 'pk', a: 'in', id });
      } else if (m.a === 'out') leave(id);
      else if (m.a === 'at' && inside.has(id) && Array.isArray(m.p)) {
        const [x, y, z, f, fl] = m.p;
        // (kept on the beach: inside its ring, between the sea floor and a jump's height)
        const r = Math.hypot(Number(x) || 0, Number(z) || 0), k = r > WORLD_R + 1 ? (WORLD_R + 1) / r : 1;
        inside.set(id, [r2(num(x * k, -99, 99)), r2(num(y, -10, 20)), r2(num(z * k, -99, 99)), r2(num(f, -1e3, 1e3)), num(fl | 0, 0, 7)]);
      }
    },
    // walked out of the fair (a waystone, a warp, the tent flap) or out of the game: off the beach too
    moved(id, p) {
      if (inside.has(id) && p.state.room !== FAIR) leave(id);
    },
    leave,
    // someone came into the fair: who's away on the beach
    who: () => ({ t: 'pk', a: 'who', ids: [...inside.keys()] }),
  };
}
