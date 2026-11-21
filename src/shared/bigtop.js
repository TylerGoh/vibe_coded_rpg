// Docs: docs/places/rides.md
// The Big Top (F3, story/fair-plan.md): its own room through the big striped tent in the Gathering Fair. Shared by the
// client and the server: the room (the ring, its trampolines, the bleachers), the trampolines' bounce (a platform kind that
// step() in src/shared/sim.js bounces you off), and Ringmaster Fizz's show, which runs on the server's clock so everyone in
// the tent sees the same act at the same moment (drawn by src/bigtop.js). Cosmetic only: no gold, EXP or power.
export const BIGTOP = 113; // room id
export const BIGTOP_W = 1800;
export const BIGTOP_GROUND = 450;
export const BIGTOP_EXIT_X = 150; // the flap: where you come in from the fair, and the way back out
export const RING_X = 980, RING_R = 340; // the ring's middle and its half-width (the curb)

// The trampolines: one-way platforms you bounce off instead of landing on. Each bounce keeps TRAMP_KEEP of the speed you
// came down at, at least TRAMP_MIN; holding Jump as you land adds TRAMP_KICK, up to TRAMP_MAX (which keeps you under the
// tent's roof, on screen). Holding Down lands you like on any platform (and then drops you through it, off).
export const TRAMPS = [-180, 0, 180].map((dx, i) => ({ x: RING_X + dx - 60, y: 414, w: 120, kind: 'tramp', i }));
export const TRAMP_MIN = 820, TRAMP_MAX = 1250, TRAMP_KEEP = 0.9, TRAMP_KICK = 240;
export const bounceOf = (vy, jump) => Math.min(TRAMP_MAX, Math.max(TRAMP_MIN, vy * TRAMP_KEEP + (jump ? TRAMP_KICK : 0)));

// the bleachers either side of the ring (stepped, one-way), and the ring's curb
export const BIGTOP_PLATFORMS = [
  ...TRAMPS,
  { x: 460, y: 410, w: 120, kind: 'bench' },
  { x: 380, y: 370, w: 120, kind: 'bench' },
  { x: 300, y: 330, w: 120, kind: 'bench' },
  { x: 1380, y: 410, w: 120, kind: 'bench' },
  { x: 1460, y: 370, w: 120, kind: 'bench' },
  { x: 1540, y: 330, w: 120, kind: 'bench' },
];

// ——— Fizz's show ———
// Every SHOW_EVERY ticks of the server's clock the lights go down and the show runs for SHOW_LEN: Fizz's welcome, the
// Tumbling Trio on the trampolines, the trapeze, the cannon, the bow. Between shows the ring's open for bouncing.
export const SHOW_EVERY = 5 * 60 * 60;
export const SHOW_LEN = 70 * 60;
// the acts: from (seconds into the show), and Fizz's line as it starts
export const ACTS = [
  { id: 'open', at: 0, says: 'Ladies, gentlemen and jellies! Welcome to the Big Top!' },
  { id: 'tumble', at: 9, says: 'The Tumbling Trio! Higher! HIGHER!' },
  { id: 'trapeze', at: 25, says: 'Up on the trapeze, the Flying Wobbles! Not a net in sight. (There is a net.)' },
  { id: 'cannon', at: 42, says: 'And now... Bombo the Human Cannonball! Well, the Slime Cannonball. Three... two... one...' },
  { id: 'bow', at: 58, says: 'Thank you, you have been wonderful! The ring is yours. Next show in five minutes!' },
];
// seconds into the show at server tick `tick`, or -1 between shows
export function showAt(tick) {
  const t = ((tick % SHOW_EVERY) + SHOW_EVERY) % SHOW_EVERY;
  return t < SHOW_LEN ? t / 60 : -1;
}
// seconds until the next show starts (0 while one's on)
export function nextShow(tick) {
  const t = ((tick % SHOW_EVERY) + SHOW_EVERY) % SHOW_EVERY;
  return t < SHOW_LEN ? 0 : (SHOW_EVERY - t) / 60;
}
export const actAt = (t) => (t < 0 ? null : [...ACTS].reverse().find((a) => t >= a.at));
