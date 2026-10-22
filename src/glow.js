// Docs: docs/performance.md
// A soft radial glow: alpha `core` at the centre, `knee` at radius `at`, fading to nothing at the rim.
// Drawn as two 2-stop radial fills instead of one 3-stop one: browsers drawing in software fill a 2-stop
// radial ~4× faster. The big disc fades knee → 0 from radius `at` outwards (and is flat `knee` inside);
// the small disc on top fades the rest of the way up to `core`, with its alpha worked out so the two
// stacked give exactly the 3-stop curve (and it's 0 at its own rim, so there's no seam).
import { TAU } from './util.js';

export function glow(ctx, x, y, rx, ry, rgb, a = 1, core = 0.9, at = 0.35, knee = 0.35) {
  const g = ctx.globalAlpha * Math.min(1, a);
  if (g <= 0.004 || rx <= 0 || ry <= 0) return;
  const outer = g * knee; // the big disc's alpha inside `at`
  // the small disc's alpha at the centre: outer + inner·(1 − outer) = g·core
  const inner = outer < 1 ? Math.max(0, (g * core - outer) / (1 - outer)) : 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(rx, ry);
  ctx.globalAlpha = 1;
  let grad = ctx.createRadialGradient(0, 0, at, 0, 0, 1);
  grad.addColorStop(0, `rgba(${rgb},${outer})`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, TAU);
  ctx.fill();
  if (inner > 0.002) {
    grad = ctx.createRadialGradient(0, 0, 0, 0, 0, at);
    grad.addColorStop(0, `rgba(${rgb},${inner})`);
    grad.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, at, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
