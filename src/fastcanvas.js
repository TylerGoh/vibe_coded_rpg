// Docs: docs/performance.md
// Makes big straight gradient fills cheap on the game's canvas, without touching the art code.
// A browser drawing in software (old laptops, a blocklisted GPU) fills a full-screen 4-stop linear
// gradient ~16× slower than it stretches a 1px strip of the same gradient over the screen (and the more
// colour stops, the slower the real gradient; the strip costs the same however many there are). So when a
// straight (vertical or horizontal) linear gradient fills a big rect, we draw that strip instead.
// Everything else (small rects, paths, diagonal and radial gradients) goes through untouched.

const MIN_AREA = 20000; // canvas units² (e.g. 200×100): smaller gradient fills are already cheap
const MAX_LEN = 4096; // device px along the strip (past this, a plain fill)
const CACHE = 96; // strips kept (rooms that blend sky colours as you walk make a few new ones a second)

export function fastGradients(ctx) {
  const info = new WeakMap(); // gradient → { vertical, a, b, stops }
  const strips = new Map(); // key → canvas (oldest first)

  const createLinear = ctx.createLinearGradient.bind(ctx);
  ctx.createLinearGradient = (x0, y0, x1, y1) => {
    const g = createLinear(x0, y0, x1, y1);
    const vertical = x0 === x1 && y0 !== y1, horizontal = y0 === y1 && x0 !== x1;
    if (vertical || horizontal) {
      const rec = { vertical, a: vertical ? y0 : x0, b: vertical ? y1 : x1, stops: [] };
      info.set(g, rec);
      const add = g.addColorStop.bind(g);
      g.addColorStop = (offset, color) => {
        add(offset, color); // (throws on a bad colour, like the real one, before we record it)
        rec.stops.push(offset, color);
      };
    }
    return g;
  };

  const fillRect = ctx.fillRect.bind(ctx);
  ctx.fillRect = (x, y, w, h) => {
    const rec = typeof ctx.fillStyle === 'object' ? info.get(ctx.fillStyle) : undefined;
    if (!rec || !rec.stops.length || Math.abs(w * h) < MIN_AREA) return fillRect(x, y, w, h);
    const m = ctx.getTransform();
    if (m.b !== 0 || m.c !== 0 || m.a <= 0 || m.d <= 0) return fillRect(x, y, w, h); // rotated or mirrored: rare, leave it
    if (w < 0) (x += w), (w = -w);
    if (h < 0) (y += h), (h = -h);
    // only the part on screen (a wash over a whole room is mostly off it)
    const x0 = Math.max(x, -m.e / m.a), x1 = Math.min(x + w, (ctx.canvas.width - m.e) / m.a);
    const y0 = Math.max(y, -m.f / m.d), y1 = Math.min(y + h, (ctx.canvas.height - m.f) / m.d);
    if (x1 <= x0 || y1 <= y0) return;
    (x = x0), (y = y0), (w = x1 - x0), (h = y1 - y0);
    const start = rec.vertical ? y : x, span = rec.vertical ? h : w;
    const n = Math.ceil(span * (rec.vertical ? m.d : m.a));
    if (n > MAX_LEN) return fillRect(x, y, w, h);
    // where the gradient line sits along the strip (the strip covers just the rect; beyond the line the
    // gradient clamps to its end colours, same as a real fill)
    const a = ((rec.a - start) / span) * n, b = ((rec.b - start) / span) * n;
    const key = `${rec.vertical ? 'v' : 'h'}${n}|${a.toFixed(2)}|${b.toFixed(2)}|${rec.stops.join(',')}`;
    let strip = strips.get(key);
    if (strip) {
      strips.delete(key); // most recently used goes to the back
    } else {
      if (strips.size >= CACHE) {
        const oldest = strips.keys().next().value;
        strip = strips.get(oldest);
        strips.delete(oldest);
      } else strip = document.createElement('canvas');
      strip.width = rec.vertical ? 1 : n;
      strip.height = rec.vertical ? n : 1;
      const g = strip.getContext('2d');
      const grad = rec.vertical ? g.createLinearGradient(0, a, 0, b) : g.createLinearGradient(a, 0, b, 0);
      for (let i = 0; i < rec.stops.length; i += 2) grad.addColorStop(rec.stops[i], rec.stops[i + 1]);
      g.fillStyle = grad;
      g.fillRect(0, 0, strip.width, strip.height);
    }
    strips.set(key, strip);
    // A 1px-wide strip stretched sideways is the browser's fast path; a 1px-tall one stretched down is
    // slow when smoothed, but it's built at the rect's width in device px, so unsmoothed is exact.
    const smooth = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = rec.vertical;
    ctx.drawImage(strip, x, y, w, h);
    ctx.imageSmoothingEnabled = smooth;
  };
  return ctx;
}
