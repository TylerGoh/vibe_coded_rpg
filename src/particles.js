// Docs: docs/art.md
import { TAU, clamp } from './util.js';

export class Particles {
  constructor() {
    this.list = [];
  }

  add(p) {
    const q = { vx: 0, vy: 0, g: 0, drag: 0, size: 4, color: '#fff', shape: 'circle', rot: 0, vr: 0, sway: 0, life: 1, ...p };
    q.maxLife = q.life;
    this.list.push(q);
  }

  update(dt) {
    for (const p of this.list) {
      p.vy += p.g * dt;
      if (p.drag) {
        p.vx *= 1 - clamp(p.drag * dt, 0, 1);
        p.vy *= 1 - clamp(p.drag * dt, 0, 1);
      }
      p.x += p.vx * dt + Math.sin(p.life * 2) * p.sway * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      p.life -= dt;
    }
    this.list = this.list.filter((p) => p.life > 0);
  }

  draw(ctx) {
    // Raindrops are all drawn as one batched path of short streaks.
    let rain = false;
    ctx.beginPath();
    for (const p of this.list) {
      if (p.shape !== 'drop') continue;
      rain = true;
      const len = p.size * 3.6 / Math.hypot(p.vx, p.vy);
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * len, p.y - p.vy * len);
    }
    if (rain) {
      ctx.strokeStyle = 'rgba(200,210,255,0.7)';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    for (const p of this.list) {
      if (p.shape === 'drop') continue;
      let a = Math.min(1, (p.life / p.maxLife) * 2);
      if (p.twinkle) a *= 0.5 + 0.5 * Math.sin(p.life * 7);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.beginPath();
      if (p.shape === 'leaf') {
        ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, TAU);
      } else if (p.shape === 'sparkle') {
        const s = p.size, i = s * 0.3;
        ctx.moveTo(0, -s);
        ctx.lineTo(i, -i); ctx.lineTo(s, 0); ctx.lineTo(i, i);
        ctx.lineTo(0, s); ctx.lineTo(-i, i); ctx.lineTo(-s, 0); ctx.lineTo(-i, -i);
        ctx.closePath();
      } else {
        ctx.arc(0, 0, p.size, 0, TAU);
      }
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
}
