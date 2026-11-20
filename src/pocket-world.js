// Docs: docs/places/pocket.md
// The pocket world's blocks (src/pocket.js draws and drives it): a SIZE × HEIGHT × SIZE grid of block ids, what each block
// looks like, the player's box against the blocks (collide), what the crosshair points at (aim) and turning a chunk of the
// grid into a mesh's arrays (meshChunk). No Three.js and no DOM here, so it runs in Node too.
// World units are blocks. x and z run from -SIZE/2 to SIZE/2; the grass's top is y = 0, so grid row iy spans
// iy - GROUND .. iy - GROUND + 1.

export const SIZE = 64, HEIGHT = 32, GROUND = 4; // the grass is row GROUND - 1; rows below it are dirt, row 0 bedrock
export const CHUNK = 16;
const HALF = SIZE / 2;

// Block ids: 0 is air. top / side / bottom colours (0xRRGGBB); `fixed` can't be broken (the bedrock under it all)
export const BLOCKS = [
  null,
  { name: 'Grass', top: 0x8fd17f, side: 0xc49a78, bottom: 0xb8906f },
  { name: 'Dirt', top: 0xc49a78, side: 0xc49a78, bottom: 0xb8906f },
  { name: 'Stone', top: 0xc8c4d4, side: 0xb9b5c8, bottom: 0xa9a5ba },
  { name: 'Planks', top: 0xe8c08a, side: 0xdcb07a, bottom: 0xcfa16e },
  { name: 'Brick', top: 0xe89a90, side: 0xe0857c, bottom: 0xcf766e },
  { name: 'Leaves', top: 0xffb3c7, side: 0xf7a3ba, bottom: 0xe993ab },
  { name: 'Jelly', top: 0x9fe3ff, side: 0x8ad6f5, bottom: 0x7cc8e8 },
  { name: 'Sand', top: 0xf6e3b0, side: 0xf0d9a2, bottom: 0xe6cc93 },
  { name: 'Bedrock', top: 0x8a8098, side: 0x7d7390, bottom: 0x6f6582, fixed: true },
];
export const BEDROCK = 9;
export const HOTBAR = [1, 2, 3, 4, 5, 6, 7, 8]; // what you can place, in the hotbar's order (keys 1–8)

const idx = (x, y, z) => x + z * SIZE + y * SIZE * SIZE;

export class World {
  constructor() {
    this.cells = new Uint8Array(SIZE * SIZE * HEIGHT);
    for (let x = 0; x < SIZE; x++) {
      for (let z = 0; z < SIZE; z++) {
        this.cells[idx(x, 0, z)] = BEDROCK;
        for (let y = 1; y < GROUND - 1; y++) this.cells[idx(x, y, z)] = 2;
        this.cells[idx(x, GROUND - 1, z)] = 1;
      }
    }
  }
  // the block at grid cell (x, y, z): 0 outside the grid
  get(x, y, z) {
    return x < 0 || y < 0 || z < 0 || x >= SIZE || y >= HEIGHT || z >= SIZE ? 0 : this.cells[idx(x, y, z)];
  }
  set(x, y, z, b) {
    if (x < 0 || y < 0 || z < 0 || x >= SIZE || y >= HEIGHT || z >= SIZE) return false;
    this.cells[idx(x, y, z)] = b;
    return true;
  }
  // the block at a world point
  at(wx, wy, wz) {
    return this.get(Math.floor(wx + HALF), Math.floor(wy + GROUND), Math.floor(wz + HALF));
  }
  // the top of the highest block in the column under world (x, z) (for putting someone back on the ground)
  topAt(wx, wz) {
    const x = Math.floor(wx + HALF), z = Math.floor(wz + HALF);
    for (let y = HEIGHT - 1; y >= 0; y--) if (this.get(x, y, z)) return y + 1 - GROUND;
    return -GROUND;
  }
}

// ——— the player's box (feet at p, PW wide, PH tall) against the blocks ———
export const PW = 0.6, PH = 1.75;
const E = 1e-4;
function overlaps(world, x0, y0, z0, x1, y1, z1) {
  for (let x = Math.floor(x0 + HALF); x <= Math.floor(x1 + HALF - E); x++)
    for (let y = Math.floor(y0 + GROUND); y <= Math.floor(y1 + GROUND - E); y++)
      for (let z = Math.floor(z0 + HALF); z <= Math.floor(z1 + HALF - E); z++) if (world.get(x, y, z)) return true;
  return false;
}
const boxHits = (world, p) => overlaps(world, p.x - PW / 2, p.y, p.z - PW / 2, p.x + PW / 2, p.y + PH, p.z + PW / 2);
// Move p by (dx, dy, dz), one axis at a time, stopping at blocks: → { grounded, bumped (hit something on the way up) }
export function collide(world, p, dx, dy, dz) {
  let grounded = false, bumped = false;
  for (const [axis, d] of [['x', dx], ['z', dz], ['y', dy]]) {
    if (!d) continue;
    // in small steps, so a fast fall can't pass through a block
    const n = Math.ceil(Math.abs(d) / 0.4), step = d / n;
    for (let i = 0; i < n; i++) {
      p[axis] += step;
      if (!boxHits(world, p)) continue;
      // back out to the block's face
      if (axis === 'y') {
        if (step < 0) {
          p.y = Math.floor(p.y + GROUND) + 1 - GROUND;
          grounded = true;
        } else {
          p.y = Math.floor(p.y + PH + GROUND - E) - GROUND - PH - E;
          bumped = true;
        }
      } else {
        // (x and z are both offset by HALF in the grid)
        p[axis] = step > 0 ? Math.floor(p[axis] + PW / 2 + HALF) - HALF - PW / 2 - E : Math.floor(p[axis] - PW / 2 + HALF) + 1 - HALF + PW / 2 + E;
      }
      break;
    }
  }
  return { grounded, bumped };
}
// does the player's box overlap grid cell (x, y, z)? (so you can't build a block inside yourself)
export function boxInCell(p, x, y, z) {
  const bx = x - HALF, by = y - GROUND, bz = z - HALF;
  return p.x + PW / 2 > bx && p.x - PW / 2 < bx + 1 && p.y + PH > by && p.y < by + 1 && p.z + PW / 2 > bz && p.z - PW / 2 < bz + 1;
}

// ——— what the crosshair points at: a grid walk from the eye along dir, up to `reach` blocks ———
// → { x, y, z (the block's cell), nx, ny, nz (the face it was entered through: place a block at cell + n) } or null
export function aim(world, ox, oy, oz, dx, dy, dz, reach) {
  let x = Math.floor(ox + HALF), y = Math.floor(oy + GROUND), z = Math.floor(oz + HALF);
  const gx = ox + HALF, gy = oy + GROUND, gz = oz + HALF;
  const sx = Math.sign(dx), sy = Math.sign(dy), sz = Math.sign(dz);
  const tdx = sx ? Math.abs(1 / dx) : Infinity, tdy = sy ? Math.abs(1 / dy) : Infinity, tdz = sz ? Math.abs(1 / dz) : Infinity;
  let tx = sx > 0 ? (x + 1 - gx) * tdx : sx < 0 ? (gx - x) * tdx : Infinity;
  let ty = sy > 0 ? (y + 1 - gy) * tdy : sy < 0 ? (gy - y) * tdy : Infinity;
  let tz = sz > 0 ? (z + 1 - gz) * tdz : sz < 0 ? (gz - z) * tdz : Infinity;
  let nx = 0, ny = 0, nz = 0, t = 0;
  while (t <= reach) {
    if (world.get(x, y, z)) return { x, y, z, nx, ny, nz };
    if (tx < ty && tx < tz) [x, t, tx, nx, ny, nz] = [x + sx, tx, tx + tdx, -sx, 0, 0];
    else if (ty < tz) [y, t, ty, nx, ny, nz] = [y + sy, ty, ty + tdy, 0, -sy, 0];
    else [z, t, tz, nx, ny, nz] = [z + sz, tz, tz + tdz, 0, 0, -sz];
  }
  return null;
}

// ——— meshing: every face of a block that touches air, coloured and shaded (baked: no lights needed) ———
// each face: its normal, its four corners (unit cube), which colour (top / side / bottom) and how bright
const FACES = [
  { n: [0, 1, 0], c: [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]], k: 'top', s: 1 },
  { n: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], k: 'bottom', s: 0.58 },
  { n: [1, 0, 0], c: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], k: 'side', s: 0.82 },
  { n: [-1, 0, 0], c: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], k: 'side', s: 0.74 },
  { n: [0, 0, 1], c: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], k: 'side', s: 0.9 },
  { n: [0, 0, -1], c: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]], k: 'side', s: 0.68 },
];
// (wind each face's corners so they face out: front faces only get drawn)
for (const f of FACES) {
  const [a, b, c] = f.c, u = b.map((v, i) => v - a[i]), w = c.map((v, i) => v - a[i]);
  const cr = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
  if (cr[0] * f.n[0] + cr[1] * f.n[1] + cr[2] * f.n[2] < 0) f.c.reverse();
}
const hash = (x, y, z) => {
  let h = (x * 374761393 + y * 1442695041 + z * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
// chunk (cx, cz): → { positions, colors, indices } (Float32Array, Float32Array, Uint32Array)
export function meshChunk(world, cx, cz) {
  const pos = [], col = [], ind = [];
  for (let x = cx * CHUNK; x < (cx + 1) * CHUNK; x++) {
    for (let z = cz * CHUNK; z < (cz + 1) * CHUNK; z++) {
      for (let y = 0; y < HEIGHT; y++) {
        const b = world.get(x, y, z);
        if (!b) continue;
        const def = BLOCKS[b], j = 1 + (hash(x, y, z) * 0.1 - 0.05); // each block a shade off its neighbours
        for (const f of FACES) {
          if (world.get(x + f.n[0], y + f.n[1], z + f.n[2])) continue;
          const c = def[f.k], k = f.s * j, v = pos.length / 3;
          for (const [ox, oy, oz] of f.c) {
            pos.push(x + ox - HALF, y + oy - GROUND, z + oz - HALF);
            col.push(Math.min(1, ((c >> 16) / 255) * k), Math.min(1, (((c >> 8) & 255) / 255) * k), Math.min(1, ((c & 255) / 255) * k));
          }
          ind.push(v, v + 1, v + 2, v, v + 2, v + 3);
        }
      }
    }
  }
  return { positions: new Float32Array(pos), colors: new Float32Array(col), indices: new Uint32Array(ind) };
}
