// Docs: docs/places/museum.md
// The Grand Museum of History (room 3): a lobby with portals to seven wings, then a long gallery of
// exhibits laid out as a walk through time. Stand in front of an exhibit and press E to read its fact
// sheet (←/→ browse neighbouring exhibits). Layout numbers are in src/shared/sim.js, content in src/history.js.
import { W, H, TAU, clamp, circle, ellipse, mix } from './util.js';
import { Slime } from './slime.js';
import { text } from './village.js';
import { WINGS } from './history.js';
import { ROOMS, MUSEUM, MUSEUM_WINGS, MUSEUM_LOBBY, MUSEUM_EXIT_X, EXHIBIT_SPACING, exhibitX, wingPortalX, wingReturnX } from './shared/sim.js';

const ROOM = ROOMS[MUSEUM];
const FLOOR = ROOM.ground;
const FONT = "Fredoka, 'Trebuchet MS', sans-serif";
const READ_RANGE = 70;

// Wing colour schemes: wall, wall stripe, accent, trim, and whether the wing is dark
const THEMES = {
  lobby: { wall: '#f6f1ea', stripe: '#efe7da', accent: '#c9a86a', trim: '#e8dcc4', dark: false },
  ancient: { wall: '#f3e6c8', stripe: '#ecdcb6', accent: '#b8894a', trim: '#e2cc9c', dark: false },
  medieval: { wall: '#dfe3ec', stripe: '#d4d9e5', accent: '#5f6f9a', trim: '#c4cbdd', dark: false },
  renaissance: { wall: '#f3dfd9', stripe: '#ecd2ca', accent: '#a8485a', trim: '#e3bfb5', dark: false },
  revolutions: { wall: '#e1e8f3', stripe: '#d5dfee', accent: '#3c5a9a', trim: '#c5d1e6', dark: false },
  wars: { wall: '#dfdfd2', stripe: '#d4d4c4', accent: '#6b6b4a', trim: '#c7c7b2', dark: false },
  dictators: { wall: '#34303d', stripe: '#2d2a35', accent: '#b03a3a', trim: '#4a4554', dark: true },
  modern: { wall: '#e0f3f0', stripe: '#d2ece8', accent: '#2f8f8a', trim: '#bfe3dd', dark: false },
};

// Flatten the exhibits with their positions
export const EXHIBITS = [];
WINGS.forEach((list, w) => {
  if (list.length !== MUSEUM_WINGS[w].count) console.warn(`museum: wing ${MUSEUM_WINGS[w].id} has ${list.length} exhibits, layout expects ${MUSEUM_WINGS[w].count}`);
  list.forEach((e, i) => EXHIBITS.push({ ...e, wing: w, x: exhibitX(w, i), index: EXHIBITS.length }));
});

// Each wing's archway stands midway between the previous wing's last exhibit and its own first one
const archX = (w) => (w.x - EXHIBIT_SPACING + w.firstX) / 2;
const wingAt = (x) => {
  let w = -1;
  MUSEUM_WINGS.forEach((wing, i) => x >= archX(wing) - 140 && (w = i));
  return w;
};
const themeAt = (x) => (wingAt(x) < 0 ? THEMES.lobby : THEMES[MUSEUM_WINGS[wingAt(x)].id]);

export class Museum {
  constructor({ onOpenChange }) {
    this.onOpenChange = onOpenChange;
    this.time = 0;
    this.near = null; // exhibit you're standing at
    this.sheet = document.getElementById('sheet');
    this.sheetBody = document.getElementById('sheet-body');
    this.reading = null;
    document.getElementById('sheet-close').onclick = () => this.close();
    document.getElementById('sheet-prev').onclick = () => this.browse(-1);
    document.getElementById('sheet-next').onclick = () => this.browse(1);
    // a few slime statues in the lobby
    this.statues = [0, 1].map(() => {
      const s = new Slime(40);
      s.palette = { top: '#f4f1ec', bottom: '#cfc8bd', line: '#a9a093', cheek: '#e6e0d6' };
      return s;
    });
  }

  get isOpen() {
    return !this.sheet.hidden;
  }

  // The name of the wing (or lobby) at x, for the HUD
  placeName(x) {
    const w = wingAt(x);
    return w < 0 ? 'Lobby' : MUSEUM_WINGS[w].name;
  }

  update(dt, me) {
    this.time += dt;
    this.near = null;
    if (me && me.grounded) {
      for (const e of EXHIBITS) if (Math.abs(me.x - e.x) < READ_RANGE) this.near = e;
    }
    for (const s of this.statues) s.animate(0, { x: 0, y: 0, vx: 0, vy: 0, grounded: true, facing: 1 });
  }

  // ——— the fact sheet ———
  open(e = this.near) {
    if (!e) return;
    this.reading = e;
    this.render(e);
    if (this.sheet.hidden) {
      this.sheet.hidden = false;
      this.onOpenChange(true);
    }
    this.sheet.focus();
  }

  close() {
    if (this.sheet.hidden) return;
    this.sheet.hidden = true;
    this.reading = null;
    this.onOpenChange(false);
  }

  browse(step) {
    if (!this.reading) return;
    const next = EXHIBITS[clamp(this.reading.index + step, 0, EXHIBITS.length - 1)];
    if (next !== this.reading) this.open(next);
  }

  render(e) {
    const wing = MUSEUM_WINGS[e.wing];
    const theme = THEMES[wing.id];
    this.sheet.style.setProperty('--accent', theme.accent);
    this.sheet.classList.toggle('dark', e.style === 'dictator' || e.style === 'memorial');
    const el = (tag, cls, txt) => {
      const n = document.createElement(tag);
      if (cls) n.className = cls;
      if (txt !== undefined) n.textContent = txt;
      return n;
    };
    const body = this.sheetBody;
    body.replaceChildren();
    body.append(el('p', 'sheet-wing', `${wing.name} · Exhibit ${e.index + 1} of ${EXHIBITS.length}`));
    body.append(el('h2', 'sheet-title', e.title));
    body.append(el('p', 'sheet-when', `${e.when} · ${e.where}`));
    if (e.stats) {
      const table = el('dl', 'sheet-stats');
      for (const [k, v] of e.stats) {
        table.append(el('dt', null, k), el('dd', null, v));
      }
      body.append(table);
    }
    body.append(el('p', 'sheet-summary', e.summary));
    body.append(el('h3', null, e.stats ? 'Rise, rule & fall' : 'Key facts'));
    const ul = el('ul');
    for (const f of e.facts) ul.append(el('li', null, f));
    body.append(ul);
    body.append(el('h3', null, 'Legacy'));
    body.append(el('p', 'sheet-legacy', e.legacy));
    body.scrollTop = 0;
    document.getElementById('sheet-prev').disabled = e.index === 0;
    document.getElementById('sheet-next').disabled = e.index === EXHIBITS.length - 1;
  }

  // ——— drawing (camera applied) ———
  draw(ctx, camX) {
    const L = camX - 20, R = camX + W + 20;
    this.drawWalls(ctx, L, R);
    this.drawTimeline(ctx, L, R);
    if (L < MUSEUM_LOBBY + 100) this.drawLobby(ctx);
    MUSEUM_WINGS.forEach((w, i) => {
      if (archX(w) + 200 > L && archX(w) - 200 < R) this.drawArch(ctx, w, i);
    });
    for (const e of EXHIBITS) if (e.x + 110 > L && e.x - 110 < R) this.drawExhibit(ctx, e);
    this.drawFloor(ctx, L, R);
  }

  drawWalls(ctx, L, R) {
    // walls tinted by wing, blended over 200px at each archway
    for (let x = Math.floor(L / 40) * 40; x < R; x += 40) {
      const t = themeAt(x + 20);
      ctx.fillStyle = (x / 40) % 2 ? t.wall : t.stripe;
      ctx.fillRect(x, 0, 40, FLOOR);
    }
    // ceiling cornice and skirting
    for (let x = Math.floor(L / 200) * 200; x < R; x += 200) {
      const t = themeAt(x + 100);
      ctx.fillStyle = t.trim;
      ctx.fillRect(x, 0, 200, 14);
      ctx.fillRect(x, FLOOR - 30, 200, 30);
      ctx.fillStyle = t.dark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.5)';
      ctx.fillRect(x, 14, 200, 3);
      ctx.fillRect(x, FLOOR - 30, 200, 3);
    }
    // pillars between exhibits, and chandeliers
    for (const e of EXHIBITS) {
      const px = e.x + EXHIBIT_SPACING / 2;
      if (px < L - 30 || px > R + 30 || e.index === EXHIBITS.length - 1) continue;
      if (MUSEUM_WINGS[e.wing].count - 1 === e.index - EXHIBITS.findIndex((x) => x.wing === e.wing)) continue; // archway instead
      const t = themeAt(px);
      ctx.fillStyle = t.trim;
      ctx.fillRect(px - 16, 30, 32, FLOOR - 60);
      ctx.fillStyle = t.dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.55)';
      ctx.fillRect(px - 10, 36, 6, FLOOR - 72);
      ctx.fillStyle = mix(t.trim, '#000000', 0.08);
      ctx.fillRect(px - 22, 26, 44, 10);
      ctx.fillRect(px - 22, FLOOR - 40, 44, 10);
    }
    for (let x = Math.floor(L / 400) * 400 + 200; x < R + 200; x += 400) this.drawChandelier(ctx, x, themeAt(x).dark);
  }

  drawChandelier(ctx, x, dark) {
    const glow = ctx.createRadialGradient(x, 70, 4, x, 70, 120);
    glow.addColorStop(0, `rgba(255,226,140,${dark ? 0.35 : 0.3})`);
    glow.addColorStop(1, 'rgba(255,226,140,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 120, -50, 240, 240);
    ctx.strokeStyle = '#b8894a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 14);
    ctx.lineTo(x, 50);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x, 62, 30, 9, 0, 0, Math.PI);
    ctx.stroke();
    ctx.fillStyle = '#d9b36a';
    circle(ctx, x, 52, 5);
    for (let i = -2; i <= 2; i++) {
      const cx = x + i * 13, cy = 62 + (2 - Math.abs(i)) * 3;
      ctx.fillStyle = '#fff6dc';
      ctx.fillRect(cx - 1.5, cy - 9, 3, 9);
      ctx.fillStyle = `rgba(255,210,110,${0.8 + 0.2 * Math.sin(this.time * 7 + i)})`;
      ellipse(ctx, cx, cy - 12, 2.2, 3.5);
    }
  }

  // A timeline running along the top of the wall: a dot and the year at every exhibit
  drawTimeline(ctx, L, R) {
    const y = 90;
    ctx.strokeStyle = 'rgba(120,100,80,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(Math.max(L, MUSEUM_LOBBY + 120), y);
    ctx.lineTo(Math.min(R, ROOM.width - 100), y);
    ctx.stroke();
    for (const e of EXHIBITS) {
      if (e.x < L - 60 || e.x > R + 60) continue;
      const t = THEMES[MUSEUM_WINGS[e.wing].id];
      ctx.fillStyle = t.accent;
      circle(ctx, e.x, y, 4);
      text(ctx, e.year, e.x, y + 13, 10, t.dark ? '#e8e0f0' : mix(t.accent, '#000000', 0.2));
    }
  }

  drawFloor(ctx, L, R) {
    for (let x = Math.floor(L / 60) * 60; x < R; x += 60) {
      const t = themeAt(x + 30);
      const light = t.dark ? '#4a4554' : '#f4efe7', darkTile = t.dark ? '#3a3542' : '#e3dace';
      for (let row = 0; row * 35 < H - FLOOR; row++) {
        ctx.fillStyle = (x / 60 + row) % 2 ? light : darkTile;
        ctx.fillRect(x, FLOOR + row * 35, 60, 35);
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(L, FLOOR, R - L, 3);
    // a red carpet running down the middle of the gallery
    ctx.fillStyle = '#b8485a';
    ctx.fillRect(Math.max(L, 0), FLOOR + 22, R - L, 26);
    ctx.fillStyle = '#d9b36a';
    ctx.fillRect(Math.max(L, 0), FLOOR + 22, R - L, 3);
    ctx.fillRect(Math.max(L, 0), FLOOR + 45, R - L, 3);
  }

  drawLobby(ctx) {
    // big title banner
    ctx.fillStyle = '#b8894a';
    ctx.beginPath();
    ctx.roundRect(330, 46, 640, 62, 14);
    ctx.fill();
    ctx.fillStyle = '#fff6dc';
    ctx.beginPath();
    ctx.roundRect(338, 54, 624, 46, 10);
    ctx.fill();
    text(ctx, 'GRAND MUSEUM OF HISTORY', 650, 78, 28, '#8a6420');
    text(ctx, 'A walk through ten thousand years — choose a wing, or start at the beginning →', 650, 128, 14, '#8a7a6a');
    // exit
    drawDoor(ctx, MUSEUM_EXIT_X, '#8f6240', 'EXIT', '#4fbf86');
    // wing portals
    MUSEUM_WINGS.forEach((w, i) => {
      const t = THEMES[w.id];
      const x = wingPortalX(i);
      drawDoor(ctx, x, t.accent, String(i + 1), mix(t.accent, '#000000', 0.25));
      ctx.save();
      ctx.translate(x, FLOOR - 128);
      ctx.font = `700 11px ${FONT}`;
      const words = w.name.replace('The ', '').split(' ');
      ctx.textAlign = 'center';
      ctx.fillStyle = mix(t.accent, '#000000', 0.2);
      words.slice(0, 3).forEach((wd, j) => ctx.fillText(wd, 0, -28 + j * 12 - (words.length > 2 ? 6 : 0)));
      ctx.restore();
    });
    // slime statues on plinths, either side of the banner
    [[250, -1], [1220, 1]].forEach(([x, f], i) => {
      const s = this.statues[i];
      ctx.fillStyle = '#d9d2c4';
      ctx.fillRect(x - 34, FLOOR - 96, 68, 96);
      ctx.fillStyle = '#ece6da';
      ctx.fillRect(x - 40, FLOOR - 104, 80, 12);
      ctx.save();
      ctx.translate(x, FLOOR - 104);
      ctx.scale(f * 1.5, 1.5);
      s.draw(ctx);
      ctx.restore();
    });
  }

  drawArch(ctx, w, i) {
    const t = THEMES[w.id];
    const x = archX(w);
    // archway spanning the gallery
    ctx.fillStyle = t.accent;
    ctx.fillRect(x - 160, 40, 26, FLOOR - 40);
    ctx.fillRect(x + 134, 40, 26, FLOOR - 40);
    ctx.beginPath();
    ctx.moveTo(x - 160, 120);
    ctx.quadraticCurveTo(x, -10, x + 160, 120);
    ctx.lineTo(x + 134, 120);
    ctx.quadraticCurveTo(x, 20, x - 134, 120);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(x - 155, 120, 6, FLOOR - 140);
    ctx.fillRect(x + 139, 120, 6, FLOOR - 140);
    // wing name plaque
    ctx.fillStyle = t.dark ? '#1f1b26' : '#fffaf0';
    ctx.strokeStyle = t.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x - 120, 128, 240, 62, 12);
    ctx.fill();
    ctx.stroke();
    text(ctx, `WING ${i + 1}`, x, 145, 11, t.accent);
    text(ctx, w.name, x, 163, 17, t.dark ? '#f4ecff' : '#3a3550');
    text(ctx, w.span, x, 181, 11, t.dark ? '#c9bcd9' : '#8a7a6a');
    if (w.id === 'dictators') {
      for (const [i2, line] of ['How dictators rise, rule and fall —', 'and who paid the price. We remember', 'so that it does not happen again.'].entries()) {
        text(ctx, line, x, 208 + i2 * 14, 11, '#e6a0a0');
      }
    }
    drawDoor(ctx, wingReturnX(i), mix(t.accent, '#ffffff', 0.15), '↩', mix(t.accent, '#000000', 0.3));
    text(ctx, 'Lobby', wingReturnX(i), FLOOR - 128, 11, t.dark ? '#e8e0f0' : '#5b4a6b');
  }

  drawExhibit(ctx, e) {
    const t = THEMES[MUSEUM_WINGS[e.wing].id];
    const x = e.x, near = this.near === e;
    if (e.style === 'case') this.drawCase(ctx, e, t);
    else this.drawFrame(ctx, e, t);
    // spotlight in the dark wing (and on whatever you're standing at)
    if (t.dark || near) {
      const g = ctx.createLinearGradient(0, 20, 0, FLOOR);
      g.addColorStop(0, `rgba(255,244,220,${near ? 0.22 : 0.12})`);
      g.addColorStop(1, 'rgba(255,244,220,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x - 14, 20);
      ctx.lineTo(x + 14, 20);
      ctx.lineTo(x + 95, FLOOR);
      ctx.lineTo(x - 95, FLOOR);
      ctx.closePath();
      ctx.fill();
    }
    // velvet rope in front
    ctx.fillStyle = '#d9b36a';
    for (const px of [x - 62, x + 62]) {
      ctx.fillRect(px - 2, FLOOR - 40, 4, 40);
      circle(ctx, px, FLOOR - 42, 4);
      ctx.fillRect(px - 7, FLOOR - 4, 14, 4);
    }
    ctx.strokeStyle = t.dark ? '#7a2a2a' : '#a8304a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 60, FLOOR - 38);
    ctx.quadraticCurveTo(x, FLOOR - 18, x + 60, FLOOR - 38);
    ctx.stroke();
  }

  // Paintings, portraits and memorials: a frame with an emblem, and a plaque beneath
  drawFrame(ctx, e, t) {
    const x = e.x, top = 122, fw = 150, fh = 150;
    const frame = { dictator: '#2a2630', memorial: '#3a3550', portrait: '#c9a14a' }[e.style] ?? mix(t.accent, '#7a5a2a', 0.5);
    const canvas = { dictator: '#57525e', memorial: '#2d2a3e', portrait: '#3f3a52' }[e.style] ?? mix(t.wall, '#ffffff', 0.4);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(x - fw / 2 + 5, top + 6, fw, fh); // shadow on the wall
    ctx.fillStyle = frame;
    ctx.beginPath();
    ctx.roundRect(x - fw / 2, top, fw, fh, e.style === 'portrait' ? 18 : 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(x - fw / 2 + 4, top + 4, fw - 8, 3);
    ctx.fillStyle = canvas;
    ctx.beginPath();
    ctx.roundRect(x - fw / 2 + 10, top + 10, fw - 20, fh - 20, e.style === 'portrait' ? 12 : 2);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - fw / 2 + 10, top + 10, fw - 20, fh - 20);
    ctx.clip();
    ctx.translate(x, top + fh / 2);
    drawIcon(ctx, e.icon, this.time, e);
    ctx.restore();
    this.drawPlaque(ctx, e, t, top + fh + 14);
  }

  // Artifacts: a glass display case on a pedestal
  drawCase(ctx, e, t) {
    const x = e.x;
    ctx.fillStyle = mix(t.trim, '#000000', 0.08);
    ctx.fillRect(x - 46, FLOOR - 120, 92, 120);
    ctx.fillStyle = t.trim;
    ctx.fillRect(x - 52, FLOOR - 128, 104, 12);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(x - 40, FLOOR - 112, 6, 104);
    // the glass box
    const top = FLOOR - 250;
    ctx.save();
    ctx.translate(x, top + 62);
    drawIcon(ctx, e.icon, this.time, e);
    ctx.restore();
    ctx.fillStyle = 'rgba(200,230,255,0.18)';
    ctx.strokeStyle = 'rgba(160,190,220,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(x - 58, top, 116, 122);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.moveTo(x - 50, top + 8);
    ctx.lineTo(x - 30, top + 8);
    ctx.lineTo(x - 52, top + 60);
    ctx.closePath();
    ctx.fill();
    this.drawPlaque(ctx, e, t, FLOOR - 104, 84);
  }

  drawPlaque(ctx, e, t, y, width = 170) {
    const x = e.x;
    ctx.font = `700 12px ${FONT}`;
    const lines = wrapText(ctx, e.title, width - 16).slice(0, 3);
    const h = lines.length * 14 + 22;
    const dark = e.style === 'dictator' || e.style === 'memorial' || t.dark;
    ctx.fillStyle = dark ? '#1f1b26' : '#fffaf0';
    ctx.strokeStyle = e.style === 'dictator' ? '#b03a3a' : t.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - width / 2, y, width, h, 6);
    ctx.fill();
    ctx.stroke();
    lines.forEach((l, i) => text(ctx, l, x, y + 11 + i * 14, 12, dark ? '#f4ecff' : '#3a3550'));
    text(ctx, e.year, x, y + h - 9, 10, dark ? '#c9bcd9' : '#8a7a6a');
  }
}

function wrapText(ctx, str, maxW) {
  const lines = [];
  let line = '';
  for (const word of str.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxW && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function drawDoor(ctx, x, color, label, labelBg) {
  ctx.fillStyle = mix(color, '#000000', 0.3);
  ctx.beginPath();
  ctx.roundRect(x - 30, FLOOR - 96, 60, 96, [30, 30, 0, 0]);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x - 25, FLOOR - 91, 50, 91, [25, 25, 0, 0]);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.arc(x, FLOOR - 66, 18, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#ffd36b';
  circle(ctx, x + 14, FLOOR - 44, 2.5);
  ctx.fillStyle = labelBg;
  ctx.beginPath();
  ctx.roundRect(x - 18, FLOOR - 120, 36, 18, 5);
  ctx.fill();
  text(ctx, label, x, FLOOR - 110.5, 12, '#ffffff');
}

// ——— exhibit emblems, each drawn centred on (0, 0) in about a 120 × 120 box ———
function drawIcon(ctx, name, time, e) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const f = ICONS[name];
  if (f) f(ctx, time, e);
}

const ink = (ctx, c, w = 3) => {
  ctx.strokeStyle = c;
  ctx.lineWidth = w;
};
const poly = (ctx, pts, fill) => {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
};
const sky = (ctx, top, bottom) => {
  const g = ctx.createLinearGradient(0, -65, 0, 65);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(-65, -65, 130, 130);
};

// A dignified bust (portraits), with optional headwear
function bust(ctx, body, skin, hat) {
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-46, 66);
  ctx.quadraticCurveTo(-44, 22, 0, 18);
  ctx.quadraticCurveTo(44, 22, 46, 66);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(0, -10, 24, 29, 0, 0, TAU);
  ctx.fill();
  ctx.fillRect(-9, 12, 18, 12);
  if (hat) hat(ctx);
}

const ICONS = {
  wheat(ctx) {
    sky(ctx, '#ffe9b0', '#f6d27a');
    ctx.fillStyle = '#fff3c4';
    circle(ctx, 30, -30, 16);
    for (const [dx, lean] of [[-30, -0.2], [-10, 0], [10, 0.1], [30, 0.25]]) {
      ctx.save();
      ctx.translate(dx, 60);
      ctx.rotate(lean);
      ink(ctx, '#b8894a', 3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -80);
      ctx.stroke();
      ctx.fillStyle = '#d9a840';
      for (let k = 0; k < 6; k++) {
        ellipse(ctx, -5, -70 + k * 7, 4, 7, -0.5);
        ellipse(ctx, 5, -70 + k * 7, 4, 7, 0.5);
      }
      ctx.restore();
    }
  },
  tablet(ctx) {
    ctx.fillStyle = '#c9a07a';
    ctx.beginPath();
    ctx.roundRect(-34, -44, 68, 88, 10);
    ctx.fill();
    ctx.fillStyle = '#b8895f';
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 5; c++) {
        if ((r * 7 + c * 3) % 5 === 0) continue;
        poly(ctx, [[-24 + c * 11, -34 + r * 11], [-18 + c * 11, -31 + r * 11], [-24 + c * 11, -28 + r * 11]], '#9a6f48');
      }
    }
  },
  pyramid(ctx, time) {
    sky(ctx, '#ffd9a0', '#ffb87a');
    ctx.fillStyle = '#fff1c4';
    circle(ctx, 34, -34, 14);
    ctx.fillStyle = '#e8c27a';
    ctx.fillRect(-65, 34, 130, 40);
    poly(ctx, [[-56, 40], [-6, -36], [44, 40]], '#e0b060');
    poly(ctx, [[-6, -36], [44, 40], [6, 40]], '#c9984a');
    poly(ctx, [[20, 40], [42, 10], [62, 40]], '#d8a858');
    ink(ctx, 'rgba(140,100,40,0.35)', 1);
    ctx.beginPath();
    for (let k = 1; k < 7; k++) {
      const y = -36 + k * 11;
      ctx.moveTo(-6 - (y + 36) * 0.66, y);
      ctx.lineTo(-6 + (y + 36) * 0.66, y);
    }
    ctx.stroke();
    void time;
  },
  column(ctx) {
    sky(ctx, '#cfe8ff', '#f4f8ff');
    ctx.fillStyle = '#f4efe6';
    poly(ctx, [[-50, -30], [0, -55], [50, -30]], '#efe7da');
    ctx.fillRect(-50, -30, 100, 8);
    for (const cx of [-36, -12, 12, 36]) {
      ctx.fillStyle = '#fbf8f2';
      ctx.fillRect(cx - 7, -22, 14, 70);
      ctx.fillStyle = '#e6ddd0';
      ctx.fillRect(cx - 1, -20, 2, 66);
    }
    ctx.fillStyle = '#e6ddd0';
    ctx.fillRect(-56, 48, 112, 10);
  },
  helmet(ctx) {
    bust(ctx, '#7a4a9a', '#e8c9a4', (c) => {
      c.fillStyle = '#d9b36a';
      c.beginPath();
      c.arc(0, -16, 27, Math.PI, 0);
      c.fill();
      c.fillRect(-27, -16, 8, 22);
      c.fillRect(19, -16, 8, 22);
      c.fillStyle = '#c84a4a';
      c.beginPath();
      c.moveTo(-6, -44);
      c.quadraticCurveTo(10, -66, 34, -48);
      c.quadraticCurveTo(14, -52, 6, -40);
      c.fill();
    });
  },
  wall(ctx) {
    sky(ctx, '#d9efe0', '#a8d0b0');
    ctx.fillStyle = '#7fb88a';
    poly(ctx, [[-65, 30], [-30, -10], [0, 20], [30, -20], [65, 25], [65, 65], [-65, 65]], '#7fb88a');
    ctx.fillStyle = '#c9b8a0';
    ctx.beginPath();
    ctx.moveTo(-65, 10);
    ctx.quadraticCurveTo(-30, -18, 0, 4);
    ctx.quadraticCurveTo(30, 24, 65, -6);
    ctx.lineTo(65, 6);
    ctx.quadraticCurveTo(30, 36, 0, 16);
    ctx.quadraticCurveTo(-30, -6, -65, 22);
    ctx.fill();
    for (const [x, y] of [[-40, -6], [10, 2], [48, 0]]) {
      ctx.fillStyle = '#b8a688';
      ctx.fillRect(x - 6, y - 14, 12, 14);
      ctx.fillRect(x - 8, y - 18, 16, 4);
    }
  },
  laurel(ctx) {
    bust(ctx, '#a8304a', '#e8c9a4', (c) => {
      c.fillStyle = '#7fb84a';
      for (let k = 0; k < 7; k++) {
        const a = Math.PI + 0.25 + k * 0.42;
        ellipse(c, Math.cos(a) * 25, -16 + Math.sin(a) * 22, 7, 3.5, a + 1.3);
      }
    });
  },
  ruin(ctx) {
    sky(ctx, '#ffd0b0', '#e89a8a');
    ctx.fillStyle = '#ecdcc8';
    ctx.fillRect(-46, -10, 18, 64);
    ctx.fillRect(-52, -16, 30, 8);
    poly(ctx, [[0, 54], [0, 8], [8, 0], [14, 12], [18, 4], [18, 54]], '#ecdcc8');
    ctx.save();
    ctx.translate(36, 46);
    ctx.rotate(-0.25);
    ctx.fillRect(-28, -7, 56, 14);
    ctx.restore();
    ctx.fillStyle = '#c9b39a';
    ctx.fillRect(-65, 54, 130, 12);
  },
  astrolabe(ctx, time) {
    ink(ctx, '#c9a14a', 4);
    ctx.beginPath();
    ctx.arc(0, 4, 40, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = '#e8c87a';
    circle(ctx, 0, 4, 34);
    ink(ctx, '#a8803a', 1.5);
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 28, 4 + Math.sin(a) * 28);
      ctx.lineTo(Math.cos(a) * 34, 4 + Math.sin(a) * 34);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(-6, 0, 18, 0, TAU);
    ctx.stroke();
    ink(ctx, '#7a5a20', 3);
    const a = time * 0.4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * -30, 4 + Math.sin(a) * -30);
    ctx.lineTo(Math.cos(a) * 30, 4 + Math.sin(a) * 30);
    ctx.stroke();
    ctx.fillStyle = '#c9a14a';
    ctx.beginPath();
    ctx.arc(0, -40, 7, 0, TAU);
    ctx.fill();
  },
  crown(ctx) {
    bust(ctx, '#3c5a9a', '#e8c9a4', (c) => {
      poly(c, [[-24, -26], [-24, -46], [-12, -36], [0, -52], [12, -36], [24, -46], [24, -26]], '#e0b84a');
      c.fillStyle = '#c84a4a';
      circle(c, 0, -34, 3.5);
      c.fillStyle = '#4a7ad0';
      circle(c, -14, -31, 2.5);
      circle(c, 14, -31, 2.5);
    });
  },
  furhat(ctx) {
    bust(ctx, '#8a5a3a', '#e3c094', (c) => {
      c.fillStyle = '#5a3a2a';
      c.beginPath();
      c.ellipse(0, -30, 30, 14, 0, 0, TAU);
      c.fill();
      c.fillStyle = '#c84a4a';
      c.beginPath();
      c.arc(0, -36, 18, Math.PI, 0);
      c.fill();
    });
  },
  scroll(ctx) {
    ctx.fillStyle = '#f4e4c0';
    ctx.fillRect(-36, -46, 72, 92);
    ctx.fillStyle = '#e0c894';
    ellipse(ctx, 0, -46, 40, 7);
    ellipse(ctx, 0, 46, 40, 7);
    ink(ctx, '#8a7a5a', 1.5);
    ctx.beginPath();
    for (let k = 0; k < 9; k++) {
      ctx.moveTo(-26, -32 + k * 8);
      ctx.lineTo(18 - (k % 3) * 8, -32 + k * 8);
    }
    ctx.stroke();
    ctx.fillStyle = '#c84a4a';
    circle(ctx, 18, 30, 10);
    ctx.fillStyle = '#a8303a';
    circle(ctx, 18, 30, 5);
  },
  plague(ctx) {
    // the beaked mask of a plague doctor, in sombre tones
    ctx.fillStyle = '#2d2a3e';
    ctx.beginPath();
    ctx.arc(-6, -30, 30, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-46, -32, 80, 8);
    ctx.fillStyle = '#d8ccb8';
    ctx.beginPath();
    ctx.moveTo(-28, -20);
    ctx.quadraticCurveTo(-24, 10, -4, 16);
    ctx.lineTo(48, 40);
    ctx.quadraticCurveTo(14, 0, 16, -20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2d2a3e';
    circle(ctx, -14, -10, 7);
    ctx.fillStyle = '#c9e0ff';
    circle(ctx, -14, -10, 4);
  },
  walls(ctx) {
    sky(ctx, '#ffd9b0', '#e8a080');
    ctx.fillStyle = '#d9c0a0';
    ctx.beginPath();
    ctx.arc(0, -4, 26, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-30, -6, 60, 30);
    ctx.fillStyle = '#c9a880';
    ctx.fillRect(-2, -42, 4, 14);
    ctx.fillStyle = '#b8a080';
    ctx.fillRect(-65, 20, 130, 46);
    for (let x = -60; x < 65; x += 16) ctx.fillRect(x, 12, 9, 10);
    for (const tx of [-44, 44]) {
      ctx.fillRect(tx - 10, 0, 20, 30);
      ctx.fillRect(tx - 13, -6, 26, 8);
    }
  },
  press(ctx) {
    ctx.fillStyle = '#8f6240';
    ctx.fillRect(-40, -46, 10, 96);
    ctx.fillRect(30, -46, 10, 96);
    ctx.fillRect(-44, -50, 88, 12);
    ctx.fillRect(-44, 10, 88, 8);
    ctx.fillStyle = '#5b4a6b';
    ctx.fillRect(-4, -38, 8, 26);
    ctx.fillStyle = '#7a5a3a';
    ctx.fillRect(-24, -14, 48, 10);
    ink(ctx, '#5b4a6b', 4);
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(28, -40);
    ctx.stroke();
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(-22, 2, 44, 8);
    ink(ctx, '#3a3550', 1);
    ctx.beginPath();
    for (let k = 0; k < 4; k++) {
      ctx.moveTo(-16, 4 + k * 1.5);
      ctx.lineTo(16, 4 + k * 1.5);
    }
    ctx.stroke();
  },
  ship(ctx, time) {
    sky(ctx, '#bfe6ff', '#7ab8e0');
    const bob = Math.sin(time * 1.5) * 2;
    ctx.fillStyle = '#4a8ac0';
    ctx.fillRect(-65, 34, 130, 32);
    ctx.save();
    ctx.translate(0, bob);
    poly(ctx, [[-44, 20], [44, 20], [32, 40], [-34, 40]], '#8f6240');
    ink(ctx, '#5a3a20', 3);
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(0, -50);
    ctx.moveTo(-26, 20);
    ctx.lineTo(-26, -30);
    ctx.stroke();
    ctx.fillStyle = '#fffaf0';
    ctx.beginPath();
    ctx.moveTo(-2, -46);
    ctx.quadraticCurveTo(26, -26, -2, 10);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-28, -28);
    ctx.quadraticCurveTo(-8, -12, -28, 10);
    ctx.fill();
    ctx.fillStyle = '#c84a4a';
    ctx.fillRect(-6, -18, 10, 10);
    ctx.restore();
  },
  theses(ctx) {
    ctx.fillStyle = '#8f6240';
    ctx.beginPath();
    ctx.roundRect(-42, -56, 84, 120, [42, 42, 0, 0]);
    ctx.fill();
    ink(ctx, '#6a4830', 2);
    ctx.beginPath();
    ctx.moveTo(0, -50);
    ctx.lineTo(0, 64);
    ctx.stroke();
    ctx.save();
    ctx.translate(8, -2);
    ctx.rotate(0.06);
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(-20, -26, 40, 54);
    ink(ctx, '#5b4a6b', 1);
    ctx.beginPath();
    for (let k = 0; k < 9; k++) {
      ctx.moveTo(-14, -18 + k * 5);
      ctx.lineTo(12 - (k % 2) * 6, -18 + k * 5);
    }
    ctx.stroke();
    ctx.fillStyle = '#5b4a6b';
    circle(ctx, 0, -22, 2);
    ctx.restore();
  },
  chains(ctx) {
    ink(ctx, '#9a9aa8', 5);
    for (let k = -2; k <= 2; k++) {
      ctx.beginPath();
      ctx.ellipse(k * 20, k % 2 ? 4 : 0, 12, 8, k % 2 ? 0 : 0, 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    text(ctx, 'In memory', 0, 44, 12, 'rgba(255,255,255,0.7)');
  },
  telescope(ctx) {
    ctx.save();
    ctx.rotate(-0.6);
    ctx.fillStyle = '#8f6240';
    ctx.fillRect(-44, -8, 60, 16);
    ctx.fillStyle = '#c9a14a';
    ctx.fillRect(16, -10, 26, 20);
    ctx.fillRect(-48, -6, 6, 12);
    ctx.restore();
    ink(ctx, '#5a3a20', 3);
    ctx.beginPath();
    ctx.moveTo(-6, 4);
    ctx.lineTo(-24, 50);
    ctx.moveTo(-6, 4);
    ctx.lineTo(12, 50);
    ctx.moveTo(-6, 4);
    ctx.lineTo(-6, 52);
    ctx.stroke();
    ctx.fillStyle = '#ffe28a';
    for (const [sx, sy] of [[34, -44], [46, -30], [24, -54]]) circle(ctx, sx, sy, 2.5);
  },
  bell(ctx) {
    ctx.fillStyle = '#8f6240';
    ctx.fillRect(-40, -52, 80, 10);
    ctx.fillStyle = '#b08a4a';
    ctx.beginPath();
    ctx.moveTo(-26, -40);
    ctx.quadraticCurveTo(-30, 20, -42, 36);
    ctx.lineTo(42, 36);
    ctx.quadraticCurveTo(30, 20, 26, -40);
    ctx.closePath();
    ctx.fill();
    ink(ctx, '#5a4020', 2);
    ctx.beginPath();
    ctx.moveTo(4, -6);
    ctx.lineTo(-2, 8);
    ctx.lineTo(6, 20);
    ctx.stroke();
    ctx.fillStyle = '#7a5a2a';
    circle(ctx, 0, 42, 7);
  },
  cockade(ctx) {
    for (const [r, c] of [[44, '#c84a4a'], [32, '#fffaf0'], [20, '#3c5a9a']]) {
      ctx.fillStyle = c;
      circle(ctx, 0, -6, r);
    }
    poly(ctx, [[-14, 30], [-26, 62], [-12, 56], [-4, 66], [0, 34]], '#c84a4a');
    poly(ctx, [[14, 30], [26, 62], [12, 56], [4, 66], [0, 34]], '#3c5a9a');
  },
  bicorne(ctx) {
    bust(ctx, '#2d3a6a', '#e8c9a4', (c) => {
      c.fillStyle = '#1f1b2e';
      c.beginPath();
      c.moveTo(-46, -24);
      c.quadraticCurveTo(0, -66, 46, -24);
      c.quadraticCurveTo(0, -34, -46, -24);
      c.fill();
      c.fillStyle = '#c84a4a';
      circle(c, 0, -38, 4);
    });
  },
  brokenchains(ctx) {
    sky(ctx, '#ffe6a0', '#ff9f7a');
    ink(ctx, '#5b4a6b', 5);
    for (const [x, y, a] of [[-38, 10, 0.3], [-20, 4, -0.2], [20, 4, 0.2], [38, 10, -0.3]]) {
      ctx.beginPath();
      ctx.ellipse(x, y, 11, 7, a, 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = '#fff6c4';
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU;
      ctx.save();
      ctx.rotate(a);
      ctx.fillRect(14, -1.5, 16, 3);
      ctx.restore();
    }
  },
  factory(ctx, time) {
    sky(ctx, '#d0d0d8', '#e8dcc8');
    ctx.fillStyle = '#9a5a4a';
    poly(ctx, [[-60, 60], [-60, 10], [-36, 22], [-36, 10], [-12, 22], [-12, 10], [12, 22], [12, 60]], '#9a5a4a');
    ctx.fillRect(22, -30, 14, 90);
    ctx.fillRect(42, -14, 12, 74);
    ctx.fillStyle = '#ffe28a';
    for (const wx of [-50, -30, -10]) ctx.fillRect(wx, 34, 10, 12);
    for (let k = 0; k < 4; k++) {
      const p = (time * 0.4 + k / 4) % 1;
      ctx.fillStyle = `rgba(110,110,120,${0.6 * (1 - p)})`;
      circle(ctx, 29 + p * 18, -36 - p * 34, 6 + p * 10);
    }
  },
  cannon(ctx) {
    sky(ctx, '#d8dfe8', '#b8c4d0');
    ctx.fillStyle = '#7fae6a';
    ctx.fillRect(-65, 36, 130, 30);
    ctx.save();
    ctx.translate(-4, 14);
    ctx.rotate(-0.25);
    ctx.fillStyle = '#3a3a42';
    ctx.beginPath();
    ctx.roundRect(-34, -10, 72, 20, 8);
    ctx.fill();
    ctx.restore();
    ink(ctx, '#6a4830', 5);
    ctx.beginPath();
    ctx.arc(-12, 30, 16, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-12, 14);
    ctx.lineTo(-12, 46);
    ctx.moveTo(-28, 30);
    ctx.lineTo(4, 30);
    ctx.stroke();
  },
  poppy(ctx, time) {
    sky(ctx, '#cfd8c0', '#a8b090');
    ink(ctx, '#4a6a3a', 3);
    ctx.beginPath();
    ctx.moveTo(0, 60);
    ctx.quadraticCurveTo(-6, 20, 0, 0);
    ctx.stroke();
    const sway = Math.sin(time) * 0.05;
    ctx.save();
    ctx.rotate(sway);
    ctx.fillStyle = '#d03a3a';
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * TAU + 0.4;
      ellipse(ctx, Math.cos(a) * 16, -10 + Math.sin(a) * 14, 20, 15, a);
    }
    ctx.fillStyle = '#1f1b26';
    circle(ctx, 0, -10, 8);
    ctx.restore();
  },
  redflag(ctx, time) {
    sky(ctx, '#e8d8c8', '#c8b0a0');
    ink(ctx, '#5a3a20', 4);
    ctx.beginPath();
    ctx.moveTo(-36, 60);
    ctx.lineTo(-36, -52);
    ctx.stroke();
    ctx.fillStyle = '#c83a3a';
    ctx.beginPath();
    ctx.moveTo(-34, -50);
    for (let x = 0; x <= 70; x += 7) ctx.lineTo(-34 + x, -50 + Math.sin(time * 3 + x * 0.1) * 4);
    for (let x = 70; x >= 0; x -= 7) ctx.lineTo(-34 + x, -6 + Math.sin(time * 3 + x * 0.1) * 4);
    ctx.closePath();
    ctx.fill();
  },
  crash(ctx) {
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(-56, -50, 112, 100);
    ink(ctx, '#d0d0d8', 1);
    ctx.beginPath();
    for (let k = 1; k < 5; k++) {
      ctx.moveTo(-50, -50 + k * 20);
      ctx.lineTo(50, -50 + k * 20);
    }
    ctx.stroke();
    ink(ctx, '#c83a3a', 4);
    ctx.beginPath();
    ctx.moveTo(-48, -10);
    ctx.lineTo(-30, -24);
    ctx.lineTo(-14, -34);
    ctx.lineTo(0, -38);
    ctx.lineTo(10, 10);
    ctx.lineTo(24, 26);
    ctx.lineTo(44, 38);
    ctx.stroke();
    poly(ctx, [[44, 38], [32, 38], [42, 28]], '#c83a3a');
  },
  plane(ctx, time) {
    sky(ctx, '#b8c8d8', '#e0e4e8');
    ctx.save();
    ctx.translate(Math.sin(time) * 4, Math.cos(time * 1.3) * 3);
    ctx.fillStyle = '#6a7a5a';
    ctx.beginPath();
    ctx.roundRect(-40, -8, 80, 16, 8);
    ctx.fill();
    ctx.fillRect(-12, -36, 22, 72);
    poly(ctx, [[-40, -6], [-54, -22], [-48, 0]], '#6a7a5a');
    ctx.fillStyle = '#9fd8ff';
    ellipse(ctx, 18, -3, 9, 5);
    ctx.fillStyle = '#3a3a42';
    ctx.fillRect(40, -12, 3, 24);
    ctx.restore();
  },
  candle(ctx, time) {
    const glow = ctx.createRadialGradient(0, -24, 2, 0, -24, 60);
    glow.addColorStop(0, 'rgba(255,220,140,0.5)');
    glow.addColorStop(1, 'rgba(255,220,140,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-65, -65, 130, 130);
    ctx.fillStyle = '#f4efe6';
    ctx.fillRect(-10, -14, 20, 62);
    ctx.fillStyle = '#d9d2c4';
    ctx.fillRect(-16, 46, 32, 8);
    const f = 1 + Math.sin(time * 9) * 0.08;
    ctx.fillStyle = '#ffd36b';
    ctx.beginPath();
    ctx.moveTo(0, -42 * f);
    ctx.quadraticCurveTo(10, -24, 0, -16);
    ctx.quadraticCurveTo(-10, -24, 0, -42 * f);
    ctx.fill();
    ctx.fillStyle = '#fff6dc';
    ellipse(ctx, 0, -22, 3, 5);
  },
  crane(ctx) {
    poly(ctx, [[-50, 10], [0, -6], [10, 6]], '#f4f1ec');
    poly(ctx, [[50, -26], [0, -6], [10, 6]], '#e8e2d8');
    poly(ctx, [[0, -6], [10, 6], [-6, 30], [-14, 8]], '#ddd5c8');
    poly(ctx, [[-50, 10], [-58, -12], [-44, 4]], '#f4f1ec');
    poly(ctx, [[10, 6], [22, -20], [16, 8]], '#ece6dc');
    text(ctx, 'Peace', 0, 50, 13, 'rgba(255,255,255,0.75)');
  },
  bust(ctx, time, e) {
    // a dignified, featureless grey bust: no likeness, no symbols
    ctx.fillStyle = '#6a6474';
    ctx.fillRect(-65, -65, 130, 130);
    bust(ctx, '#3e3a46', '#8a8494', null);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ellipse(ctx, -8, -20, 9, 14, -0.3);
    void time;
    void e;
  },
  curtain(ctx) {
    ctx.fillStyle = '#4a7ad0';
    circle(ctx, 0, 0, 44);
    ctx.fillStyle = '#7fb84a';
    ellipse(ctx, -16, -10, 16, 22, 0.4);
    ellipse(ctx, 18, 12, 14, 18, -0.3);
    ctx.fillStyle = 'rgba(40,40,50,0.85)';
    ctx.fillRect(-4, -60, 8, 120);
    ctx.fillStyle = '#c8c8d0';
    for (let y = -56; y < 60; y += 10) ctx.fillRect(-7, y, 14, 3);
  },
  charkha(ctx, time) {
    ink(ctx, '#8f6240', 3);
    ctx.save();
    ctx.translate(-14, -4);
    ctx.rotate(time * 0.6);
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, TAU);
    for (let k = 0; k < 8; k++) {
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos((k / 8) * TAU) * 30, Math.sin((k / 8) * TAU) * 30);
    }
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#8f6240';
    ctx.fillRect(-50, 36, 100, 8);
    ctx.fillRect(-16, 20, 4, 18);
    ink(ctx, '#f4efe6', 1.5);
    ctx.beginPath();
    ctx.moveTo(-14, -34);
    ctx.lineTo(40, 6);
    ctx.stroke();
    ctx.fillStyle = '#f4efe6';
    ellipse(ctx, 42, 8, 8, 5);
  },
  dove(ctx) {
    ctx.fillStyle = '#fffaf0';
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 16, -0.2, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-6, -6);
    ctx.quadraticCurveTo(-20, -50, 14, -40);
    ctx.quadraticCurveTo(4, -20, 10, -4);
    ctx.fill();
    circle(ctx, 26, -10, 10);
    poly(ctx, [[34, -10], [44, -6], [34, -4]], '#e0a040');
    poly(ctx, [[-28, 4], [-50, 0], [-46, 14]], '#fffaf0');
    ctx.fillStyle = '#3a3550';
    circle(ctx, 28, -12, 1.8);
    ink(ctx, '#5a9a4a', 2);
    ctx.beginPath();
    ctx.moveTo(44, -4);
    ctx.quadraticCurveTo(52, 8, 46, 18);
    ctx.stroke();
    ctx.fillStyle = '#7fb84a';
    ellipse(ctx, 50, 6, 4, 2, 0.8);
    ellipse(ctx, 47, 14, 4, 2, -0.6);
  },
  mic(ctx) {
    sky(ctx, '#d0dcf0', '#f0e8d8');
    ctx.fillStyle = '#5b5b66';
    ctx.beginPath();
    ctx.roundRect(-12, -46, 24, 40, 12);
    ctx.fill();
    ink(ctx, '#3a3a42', 2);
    ctx.beginPath();
    for (let k = 0; k < 4; k++) {
      ctx.moveTo(-10, -38 + k * 8);
      ctx.lineTo(10, -38 + k * 8);
    }
    ctx.stroke();
    ink(ctx, '#3a3a42', 4);
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 50);
    ctx.moveTo(-18, 50);
    ctx.lineTo(18, 50);
    ctx.stroke();
    ctx.fillStyle = '#8a6fc4';
    for (const [x, y] of [[-40, 40], [-28, 44], [30, 42], [42, 38]]) circle(ctx, x, y, 7);
  },
  rocket(ctx, time) {
    ctx.fillStyle = '#1f1b3a';
    ctx.fillRect(-65, -65, 130, 130);
    ctx.fillStyle = '#fffbe8';
    for (const [x, y] of [[-50, -50], [40, -40], [-20, 30], [50, 20], [10, -56]]) circle(ctx, x, y, 1.5);
    ctx.fillStyle = '#e6e0d6';
    circle(ctx, 30, 40, 36);
    ctx.fillStyle = '#cfc8bd';
    circle(ctx, 20, 30, 6);
    circle(ctx, 42, 50, 4);
    ctx.save();
    ctx.translate(-16, -4 + Math.sin(time * 2) * 2);
    ctx.rotate(0.5);
    ctx.fillStyle = '#fffaf0';
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.quadraticCurveTo(12, -20, 10, 14);
    ctx.lineTo(-10, 14);
    ctx.quadraticCurveTo(-12, -20, 0, -34);
    ctx.fill();
    ctx.fillStyle = '#c84a4a';
    poly(ctx, [[-10, 6], [-18, 20], [-10, 16]], '#c84a4a');
    poly(ctx, [[10, 6], [18, 20], [10, 16]], '#c84a4a');
    ctx.fillStyle = '#9fd8ff';
    circle(ctx, 0, -12, 4);
    ctx.fillStyle = `rgba(255,180,80,${0.7 + 0.3 * Math.sin(time * 20)})`;
    poly(ctx, [[-6, 14], [6, 14], [0, 30 + Math.sin(time * 25) * 4]], ctx.fillStyle);
    ctx.restore();
  },
  wallpiece(ctx) {
    ctx.fillStyle = '#c9c4bc';
    ctx.fillRect(-36, -50, 72, 96);
    ctx.fillStyle = '#b8b2a8';
    ctx.fillRect(-36, 40, 72, 8);
    ctx.font = `700 15px ${FONT}`;
    ctx.textAlign = 'center';
    for (const [t, x, y, c, a] of [['FREE', -8, -20, '#c83a3a', -0.2], ['♥', 18, 6, '#e06aa8', 0.1], ['1989', 0, 26, '#3c6ad0', 0.05]]) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.fillStyle = c;
      ctx.fillText(t, 0, 0);
      ctx.restore();
    }
    ctx.fillStyle = '#4fbf86';
    ellipse(ctx, -20, 10, 8, 5);
  },
  ballot(ctx) {
    sky(ctx, '#ffe6a0', '#a8d8a0');
    ctx.fillStyle = '#8f6240';
    ctx.fillRect(-36, -6, 72, 56);
    ctx.fillStyle = '#6a4830';
    ctx.fillRect(-18, -8, 36, 5);
    ctx.save();
    ctx.translate(0, -24);
    ctx.rotate(-0.1);
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(-16, -18, 32, 30);
    ink(ctx, '#2f8f5f', 3);
    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.lineTo(-2, 4);
    ctx.lineTo(10, -10);
    ctx.stroke();
    ctx.restore();
  },
  computer(ctx, time) {
    ctx.fillStyle = '#e6e0d6';
    ctx.beginPath();
    ctx.roundRect(-46, -44, 92, 70, 8);
    ctx.fill();
    ctx.fillStyle = '#1f3a3a';
    ctx.fillRect(-38, -36, 76, 52);
    ctx.font = `700 11px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#7fe0a0';
    ctx.fillText('> LO', -32, -20);
    if (Math.sin(time * 6) > 0) ctx.fillRect(-4, -26, 6, 10);
    ctx.fillText('> www', -32, 0);
    ctx.fillStyle = '#d9d2c4';
    ctx.fillRect(-10, 26, 20, 12);
    ctx.fillRect(-30, 38, 60, 6);
  },
  beams(ctx, time) {
    ctx.fillStyle = '#141428';
    ctx.fillRect(-65, -65, 130, 130);
    for (const bx of [-12, 12]) {
      const g = ctx.createLinearGradient(0, 60, 0, -65);
      g.addColorStop(0, `rgba(200,220,255,${0.75 + 0.1 * Math.sin(time + bx)})`);
      g.addColorStop(1, 'rgba(200,220,255,0.05)');
      ctx.fillStyle = g;
      poly(ctx, [[bx - 8, 60], [bx + 8, 60], [bx + 12, -65], [bx - 12, -65]], g);
    }
    ctx.fillStyle = '#2a2a40';
    for (let x = -64; x < 64; x += 12) ctx.fillRect(x, 50 - ((x * 7) % 20 + 20) / 2, 10, 30);
  },
};

// The Grand Museum of History, seen from the village (drawn by village.js): a domed, columned hall
export function drawMuseumOutside(ctx, doorX, ground, time) {
  const w = 560, x = doorX - w / 2, top = ground - 190;
  // dome and drum, behind the facade
  ctx.fillStyle = '#e6dccb';
  ctx.fillRect(doorX - 110, top - 64, 220, 70);
  ctx.fillStyle = '#f4efe6';
  for (let k = -4; k <= 4; k++) ctx.fillRect(doorX + k * 24 - 4, top - 60, 8, 60);
  ctx.fillStyle = '#9fc8c0';
  ctx.beginPath();
  ctx.arc(doorX, top - 64, 104, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.arc(doorX - 30, top - 100, 46, Math.PI * 1.1, Math.PI * 1.6);
  ctx.lineTo(doorX - 30, top - 100);
  ctx.fill();
  ctx.strokeStyle = '#86b0a8';
  ctx.lineWidth = 2;
  for (const a of [0.25, 0.42, 0.58, 0.75]) {
    ctx.beginPath();
    ctx.ellipse(doorX, top - 64, 104 * Math.abs(Math.cos(a * Math.PI)), 104, 0, Math.PI, 0);
    ctx.stroke();
  }
  ctx.fillStyle = '#e6dccb';
  ctx.fillRect(doorX - 10, top - 186, 20, 20); // lantern on top
  ctx.fillStyle = '#c9a14a';
  circle(ctx, doorX, top - 190, 8);
  // flag
  ctx.strokeStyle = '#8f6240';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(doorX, top - 196);
  ctx.lineTo(doorX, top - 250);
  ctx.stroke();
  ctx.fillStyle = '#a8485a';
  ctx.beginPath();
  ctx.moveTo(doorX + 2, top - 250);
  for (let k = 0; k <= 40; k += 5) ctx.lineTo(doorX + 2 + k, top - 250 + Math.sin(time * 3 + k * 0.15) * 3);
  for (let k = 40; k >= 0; k -= 5) ctx.lineTo(doorX + 2 + k, top - 230 + Math.sin(time * 3 + k * 0.15) * 3);
  ctx.closePath();
  ctx.fill();
  // body
  ctx.fillStyle = '#efe7da';
  ctx.fillRect(x + 20, top, w - 40, ground - top);
  // steps
  for (let k = 0; k < 3; k++) {
    ctx.fillStyle = k % 2 ? '#e2d8c6' : '#ece4d4';
    ctx.fillRect(x - 10 + k * 12, ground - 12 - k * 10, w + 20 - k * 24, 12);
  }
  // pediment and frieze
  ctx.fillStyle = '#e6dccb';
  ctx.beginPath();
  ctx.moveTo(x - 6, top + 8);
  ctx.lineTo(doorX, top - 56);
  ctx.lineTo(x + w + 6, top + 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f6f1ea';
  ctx.beginPath();
  ctx.moveTo(x + 34, top + 2);
  ctx.lineTo(doorX, top - 42);
  ctx.lineTo(x + w - 34, top + 2);
  ctx.closePath();
  ctx.fill();
  // an hourglass in the pediment
  ctx.fillStyle = '#c9a14a';
  ctx.fillRect(doorX - 12, top - 32, 24, 4);
  ctx.fillRect(doorX - 12, top - 6, 24, 4);
  ctx.fillStyle = '#f4e4c0';
  ctx.beginPath();
  ctx.moveTo(doorX - 9, top - 28);
  ctx.lineTo(doorX + 9, top - 28);
  ctx.lineTo(doorX, top - 17);
  ctx.lineTo(doorX + 9, top - 6);
  ctx.lineTo(doorX - 9, top - 6);
  ctx.lineTo(doorX, top - 17);
  ctx.closePath();
  ctx.fill();
  const sand = (time * 0.15) % 1;
  ctx.fillStyle = '#d9a840';
  ctx.beginPath();
  ctx.moveTo(doorX - 9 * (1 - sand), top - 28 + 11 * sand);
  ctx.lineTo(doorX + 9 * (1 - sand), top - 28 + 11 * sand);
  ctx.lineTo(doorX, top - 17);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(doorX - 9 * sand, top - 6 - 11 * sand);
  ctx.lineTo(doorX + 9 * sand, top - 6 - 11 * sand);
  ctx.lineTo(doorX + 9, top - 6);
  ctx.lineTo(doorX - 9, top - 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c9b48a';
  ctx.fillRect(x + 6, top + 8, w - 12, 30);
  text(ctx, 'GRAND MUSEUM OF HISTORY', doorX, top + 24, 18, '#ffffff');
  // columns
  for (let k = 0; k < 8; k++) {
    const cx = x + 44 + k * ((w - 88) / 7);
    if (Math.abs(cx - doorX) < 60) continue;
    ctx.fillStyle = '#fbf8f2';
    ctx.fillRect(cx - 13, top + 46, 26, ground - top - 82);
    ctx.fillStyle = '#e8e0d2';
    for (let f = -7; f <= 7; f += 7) ctx.fillRect(cx + f - 1, top + 52, 2, ground - top - 94);
    ctx.fillStyle = '#f4efe6';
    ctx.fillRect(cx - 17, top + 38, 34, 10);
    ctx.fillRect(cx - 17, ground - 46, 34, 10);
  }
  // banners between columns, one per wing colour
  ['#b8894a', '#5f6f9a', '#a8485a', '#3c5a9a', '#6b6b4a', '#b03a3a', '#2f8f8a'].forEach((c, k) => {
    if (k === 3) return;
    const bx = x + 78 + k * ((w - 156) / 6), sway = Math.sin(time * 1.3 + k) * 1.5;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(bx - 9, top + 56);
    ctx.lineTo(bx + 9, top + 56);
    ctx.lineTo(bx + 9 + sway, top + 112);
    ctx.lineTo(bx + sway, top + 104);
    ctx.lineTo(bx - 9 + sway, top + 112);
    ctx.closePath();
    ctx.fill();
  });
  // great doors
  ctx.fillStyle = '#6a4830';
  ctx.beginPath();
  ctx.roundRect(doorX - 46, ground - 150, 92, 120, [46, 46, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#8f6240';
  ctx.beginPath();
  ctx.roundRect(doorX - 40, ground - 144, 80, 114, [40, 40, 0, 0]);
  ctx.fill();
  ctx.strokeStyle = '#6a4830';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(doorX, ground - 140);
  ctx.lineTo(doorX, ground - 30);
  for (const dx of [-20, 20]) {
    ctx.rect(doorX + dx - 13, ground - 104, 26, 30);
    ctx.rect(doorX + dx - 13, ground - 68, 26, 30);
  }
  ctx.stroke();
  ctx.fillStyle = '#ffd36b';
  circle(ctx, doorX - 6, ground - 84, 3);
  circle(ctx, doorX + 6, ground - 84, 3);
  ctx.fillStyle = 'rgba(255,226,140,0.75)';
  ctx.beginPath();
  ctx.arc(doorX, ground - 112, 26, Math.PI, 0);
  ctx.fill();
  // lion-ish slime statues guarding the steps
  for (const sx of [x - 26, x + w + 26]) {
    ctx.fillStyle = '#d9d2c4';
    ctx.fillRect(sx - 26, ground - 70, 52, 70);
    ctx.fillStyle = '#ece6da';
    ctx.fillRect(sx - 30, ground - 76, 60, 8);
    ctx.fillStyle = '#f4f1ec';
    ctx.beginPath();
    ctx.moveTo(sx - 24, ground - 76);
    ctx.bezierCurveTo(sx - 24, ground - 108, sx - 14, ground - 118, sx, ground - 118);
    ctx.bezierCurveTo(sx + 14, ground - 118, sx + 24, ground - 108, sx + 24, ground - 76);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#b8b0a2';
    circle(ctx, sx - 6, ground - 98, 2.5);
    circle(ctx, sx + 6, ground - 98, 2.5);
  }
}
