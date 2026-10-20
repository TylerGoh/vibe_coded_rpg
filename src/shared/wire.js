// Docs: docs/netcode.md
// Binary encodings for the three high-rate messages (everything else stays JSON):
//   SNAP  server → client, 60 Hz: the tick, your last applied input, and every slime's physics state
//   INPUT client → server, 60 Hz: one input (seq, keys)
//   MOBS  server → each combat room, 30 Hz: every live mob
// They decode to exactly the arrays the JSON versions carried (sim.js pack / unpack; the mobs list in
// server/rpg.js), so nothing past the decoder changes. Physics numbers are quantised to 1/100 in step(),
// so sending them as integer hundredths is lossless. Little-endian throughout.
export const SNAP = 1, INPUT = 2, MOBS = 3;

const SLIME_BYTES = 32; // id u32 · x y vx vy i32 (×100) · flags u8 · drop u16 (×100) · room u16 · mv u8 · dt u8 · dc u16 · bc u16 · ifr u8
const c = (v) => Math.round(v * 100);

// The per-slime part of a snapshot, shared by every recipient: packed = [sim.js pack() arrays]
export function encodeSlimes(packed) {
  const buf = new ArrayBuffer(packed.length * SLIME_BYTES), v = new DataView(buf);
  packed.forEach((a, i) => {
    const o = i * SLIME_BYTES;
    v.setUint32(o, a[0], true);
    v.setInt32(o + 4, c(a[1]), true);
    v.setInt32(o + 8, c(a[2]), true);
    v.setInt32(o + 12, c(a[3]), true);
    v.setInt32(o + 16, c(a[4]), true);
    v.setUint8(o + 20, a[5]);
    v.setUint16(o + 21, c(a[6]), true);
    v.setUint16(o + 23, a[7], true);
    v.setUint8(o + 25, a[8]);
    v.setUint8(o + 26, Math.min(255, a[9]));
    v.setUint16(o + 27, a[10], true);
    v.setUint16(o + 29, a[11], true);
    v.setUint8(o + 31, Math.min(255, a[12]));
  });
  return new Uint8Array(buf);
}
// One recipient's snapshot: a 9-byte header (type, tick, ack) + the shared slimes
export function encodeSnap(tick, ack, slimes) {
  const out = new Uint8Array(9 + slimes.length), v = new DataView(out.buffer);
  v.setUint8(0, SNAP);
  v.setUint32(1, tick, true);
  v.setUint32(5, ack, true);
  out.set(slimes, 9);
  return out;
}

export function encodeInput(seq, keys) {
  const v = new DataView(new ArrayBuffer(6));
  v.setUint8(0, INPUT);
  v.setUint32(1, seq, true);
  v.setUint8(5, keys);
  return v.buffer;
}

// list: [[id, kind, x, y, hp, flags, maxHp, (eggHp, eggMax)?]] · b: seconds until a den's boss is back (0 = n/a)
export function encodeMobs(tick, list, b = 0) {
  let size = 9;
  for (const m of list) size += m.length > 7 ? 31 : 23;
  const buf = new ArrayBuffer(size), v = new DataView(buf);
  v.setUint8(0, MOBS);
  v.setUint32(1, tick, true);
  v.setUint16(5, Math.max(0, Math.min(65535, b)), true);
  v.setUint16(7, list.length, true);
  let o = 9;
  for (const m of list) {
    v.setUint32(o, m[0], true);
    v.setUint8(o + 4, m[1]);
    v.setInt32(o + 5, m[2], true);
    v.setInt32(o + 9, m[3], true);
    v.setUint32(o + 13, m[4], true);
    v.setUint8(o + 17, m[5]);
    v.setUint32(o + 18, Math.round(m[6]), true);
    v.setUint8(o + 22, m.length > 7 ? 1 : 0);
    o += 23;
    if (m.length > 7) {
      v.setUint32(o, m[7], true);
      v.setUint32(o + 4, m[8], true);
      o += 8;
    }
  }
  return buf;
}

// Any of the above, back into the JSON-shaped message: {t:'s', k, a, p} · {t:'in', s, k} · {t:'mobs', k, m, b?}
export function decode(data) {
  const v = new DataView(data.buffer ?? data, data.byteOffset ?? 0, data.byteLength);
  const type = v.getUint8(0);
  if (type === INPUT) return v.byteLength >= 6 ? { t: 'in', s: v.getUint32(1, true), k: v.getUint8(5) } : null;
  if (type === SNAP) {
    const p = [];
    for (let o = 9; o + SLIME_BYTES <= v.byteLength; o += SLIME_BYTES) {
      p.push([v.getUint32(o, true), v.getInt32(o + 4, true) / 100, v.getInt32(o + 8, true) / 100, v.getInt32(o + 12, true) / 100, v.getInt32(o + 16, true) / 100,
        v.getUint8(o + 20), v.getUint16(o + 21, true) / 100, v.getUint16(o + 23, true), v.getUint8(o + 25), v.getUint8(o + 26), v.getUint16(o + 27, true), v.getUint16(o + 29, true), v.getUint8(o + 31)]);
    }
    return { t: 's', k: v.getUint32(1, true), a: v.getUint32(5, true), p };
  }
  if (type === MOBS) {
    const m = [], n = v.getUint16(7, true);
    let o = 9;
    for (let i = 0; i < n; i++) {
      const a = [v.getUint32(o, true), v.getUint8(o + 4), v.getInt32(o + 5, true), v.getInt32(o + 9, true), v.getUint32(o + 13, true), v.getUint8(o + 17), v.getUint32(o + 18, true)];
      const egg = v.getUint8(o + 22);
      o += 23;
      if (egg) {
        a.push(v.getUint32(o, true), v.getUint32(o + 4, true));
        o += 8;
      }
      m.push(a);
    }
    const b = v.getUint16(5, true);
    return { t: 'mobs', k: v.getUint32(1, true), m, ...(b ? { b } : {}) };
  }
  return null;
}
