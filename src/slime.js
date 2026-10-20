// Docs: docs/art.md
import { TAU, rand, clamp, ellipse, circle } from './util.js';
import { drawSword, drawHelmet, SWORD_LEN } from './field.js';
import { drawEnhanceGlow } from './skillfx.js';
import { FOLK_PALETTE, drawFolk, drawFolkDress } from './fjord-art.js';

// yr's laptop notifications: icon colours, and how long each one floats
const NOTIF_KINDS = ['#ff5a5f', '#4fbf86', '#5b8def', '#ffb020']; // alert, message, mail, calendar
const NOTIF_LIFE = 1.8;
// Special notifications and how yr reacts to each: [chance, face, seconds]
export const SLAP_TIME = 0.3; // seconds a slap swing takes
const MOODS = { angry: [0.2, 'wince', 0.65], praise: [0.2, 'happy', 0.9], party: [0.15, 'party', 1.1] };
function pickMood() {
  let r = Math.random();
  for (const [mood, [chance]] of Object.entries(MOODS)) if ((r -= chance) < 0) return mood;
  return null; // an ordinary notification
}

// Where yr's laptop floats, relative to him; and the code that reflects off his face from its screen
const laptopSpot = (w, h) => ({ lw: 24, lh: 15, lx: w * 0.5 + 15, top: -h * 0.62 });
const SCREEN_BLUE = [140, 200, 255];
// yr puts his laptop away and switches to his phone once the speed counter passes this.
const PHONE_KMH = 50;
const PHONE_SWAP = 0.6; // seconds to put the laptop away / bring the phone out
const PHONE_LINES = ['mhm', 'ok ok', 'wait what?!', 'yeah yeah', 'no way', 'brb', 'one sec', 'lol'];
const PAGE_FLIP = 0.35; // seconds for s to turn a page
const SCRIBBLE_TIME = 2.5; // seconds s spends scribbling when she gets serious
const GLOW_FLASH = 0.9; // seconds a notification's colour lingers on his face
const MOOD_GLOW = { angry: [255, 70, 60], praise: [255, 200, 60], party: 'rainbow' };
const hexRGB = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const hueRGB = (deg) => [0, 120, 240].map((o) => Math.round(160 + 95 * Math.cos(((deg - o) * Math.PI) / 180)));

// small seeded random generator, so each page of notes keeps the same scribbles
function mulberrySeed(seed) {
  let a = seed * 7919 + 13;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Body colours for a hue (Slime Hop's slime is hue ~148: #a6f5c9 → #5ccf93, outline #3fa673).
export const paletteFor = (hue) => ({
  top: `hsl(${hue} 80% 81%)`,
  bottom: `hsl(${hue} 55% 59%)`,
  line: `hsl(${hue} 45% 45%)`,
  cheek: `hsl(${hue} 78% 78%)`,
});

export class Slime {
  constructor(hue = 148) {
    this.x = 0;
    this.y = 0; // y is the bottom of the slime
    this.vy = 0;
    this.facing = 1;
    this.hue = hue;
    this.palette = paletteFor(hue);
    this.w = 50;
    this.h = 42;
    this.grounded = true;
    this.grit = 0; // 0..1: how determined it looks, rising over a run
    this.d = 0; // squash amount: +squash, -stretch
    this.dv = 0;
    this.t = 0;
    this.blink = 0;
    this.nextBlink = 2;
    this.dead = false;
    this.rot = 0;
    this.name = '';
    this.accessories = [];
    this.gear = { helmet: null, sword: null }; // equipped Wildwood gear (item ids from src/shared/rpg.js)
    this.blow = 0; // dd's flute toot animation, counts down after each jump
    this.notifs = []; // yr's laptop notifications floating up
    this.nextNotif = rand(1, 3);
    this.reaction = null; // yr's face for a moment after a special notification: 'wince' | 'happy' | 'party'
    this.reactTime = 0;
    this.glowFlash = 0; // yr's screen glow briefly takes on a notification's colour
    this.glowRGB = SCREEN_BLUE;
    this.page = 0; // s's study notes: which page she's on, and the page-flip animation
    this.flip = 0;
    this.nextFlip = rand(3, 6);
    this.scribble = 0; // counts down while s is seriously scribbling
    this.kmh = 10; // the speed counter, set by the game (yr switches to his phone at PHONE_KMH)
    this.phoneT = 0; // 0 = laptop out, 1 = phone out
    this.talk = 0; // counts down while yr is talking on the phone
    this.talkBlend = 0; // 0 = phone in front, 1 = phone at his ear
    this.nextTalk = rand(2, 4);
    this.line = PHONE_LINES[0];
    this.nextScribble = rand(6, 12);
  }

  has(accessory) {
    return this.accessories.includes(accessory);
  }

  // Another island's people (story/characters/people.md): 'fjord' = Frostpeak's fjord folk, pale and
  // frosted, half-solid in the cold, with a slow wobble (lively: a child, who still bounces)
  setFolk(folk, lively = false) {
    this.folk = folk;
    this.lively = lively;
    if (folk === 'fjord') this.palette = FOLK_PALETTE(this.hue);
  }

  setName(name) {
    this.name = name;
    this.accessories = [];
  }

  // What a player has on (src/rpg.js): gear, the Boutique cosmetics they wear,
  // and whether the helmet shows (hiding it lets cosmetics like the ribbon show)
  setLook({ gear, wear, showHelmet, plus, gearE } = {}) {
    if (gear) this.gear = showHelmet === false ? { ...gear, helmet: null } : gear;
    if (plus !== undefined || gearE) this.plus = plus ?? gearE?.sword?.s ?? 0; // scroll successes on the sword: it glows
    this.accessories = [...new Set(wear ?? [])];
  }

  // Swing a slap toward dir (-1 left, 1 right)
  slap(dir) {
    this.slapT = SLAP_TIME;
    this.slapDir = dir;
    this.dv += 3; // a little lean into it
  }

  // Got slapped: the > < squeeze, a shudder and a wobbly grimace (same as an angry notification)
  wince() {
    this.reaction = 'wince';
    this.reactTime = MOODS.angry[2];
    this.dv -= 6;
  }

  // The slapping mitten: winds back, then sweeps forward and down, with a whoosh at the fastest point.
  // Drawn in the slime's own (already mirrored) space, so +x is the way it's slapping.
  drawSlap(ctx, w, h) {
    const k = 1 - this.slapT / SLAP_TIME; // 0 → 1 over the swing
    const ease = k < 0.25 ? -k / 0.25 * 0.3 : -0.3 + ((k - 0.25) / 0.75) ** 0.6 * 1.3; // wind-up, then whip
    const ang = -1.3 + ease * 1.6;
    const reach = 14 + Math.sin(Math.min(1, k * 1.4) * Math.PI) * 14;
    const sx = w * 0.5 - 2, sy = -h * 0.28; // from the side of its body, well below the eyes
    const hx = sx + Math.cos(ang) * reach, hy = sy + Math.sin(ang) * reach;
    ctx.save();
    if (k > 0.3 && k < 0.85) {
      ctx.strokeStyle = `rgba(255,255,255,${0.8 * Math.sin(((k - 0.3) / 0.55) * Math.PI)})`;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      for (const r of [reach + 8, reach + 14]) {
        ctx.beginPath();
        ctx.arc(sx, sy, r, ang - 0.9, ang - 0.15);
        ctx.stroke();
      }
    }
    ctx.strokeStyle = this.palette.line; // a stubby jelly arm
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    ctx.strokeStyle = this.palette.bottom;
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.translate(hx, hy);
    ctx.rotate(ang + Math.PI / 2);
    ctx.fillStyle = '#fff6ea';
    ctx.strokeStyle = '#c9a98a';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.roundRect(-6, -13, 12, 15, 6);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(-6.5, -4, 2.6, 4.5, -0.5, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // An equipped sword, carried on its back: drawn before the body, so the hilt hides behind the
  // jelly and the blade sticks up behind its head, leaning back.
  drawSwordOnBack(ctx, w, h, id) {
    ctx.save();
    ctx.translate(-w * 0.3, -h * 0.4);
    ctx.rotate(-0.45 + Math.sin(this.t * 3) * 0.03 + this.d * 0.4);
    ctx.scale(0.9, 0.9);
    if (this.plus) drawEnhanceGlow(ctx, this.plus, this.t, SWORD_LEN[id] ?? 50);
    drawSword(ctx, id, this.t);
    ctx.restore();
  }

  // The sword swing that replaces the slap mitten: a short wind-up behind its head, then a fast
  // overhead arc forward and down, with a swoosh trail. Longer swords sweep a bigger arc.
  drawSwordSwing(ctx, w, h, id) {
    const k = 1 - this.slapT / SLAP_TIME; // 0 → 1 over the swing
    const START = -1.95, BACK = -2.25, END = 0.65;
    const angAt = (q) => {
      if (q < 0.18) return START + (BACK - START) * Math.sin((q / 0.18) * Math.PI * 0.5);
      const e = Math.min(1, (q - 0.18) / 0.5);
      const whip = 1 - (1 - e) ** 3;
      return BACK + (END - BACK) * whip - (q > 0.68 ? Math.sin(((q - 0.68) / 0.32) * Math.PI) * 0.12 : 0);
    };
    const ang = angAt(k);
    const L = SWORD_LEN[id] ?? 34, arm = 10;
    const px = w * 0.36, py = -h * 0.48; // shoulder, at the front edge clear of the face
    // swoosh: a crescent from where the blade was a moment ago to where it is now
    if (k > 0.2 && k < 0.92) {
      const a0 = angAt(Math.max(0.18, k - 0.22)), a1 = ang;
      const fade = Math.sin(((k - 0.2) / 0.72) * Math.PI);
      const rIn = arm + L * 0.35, rOut = arm + L + 6;
      const tint = { crystal_sword: '255,170,230', wood_sword: '255,244,214', magma_maul: '255,150,80', phoenix_blade: '255,190,90', cog_cleaver: '255,220,150', chrono_blade: '200,170,255' }[id] ?? '235,245,255';
      ctx.save();
      ctx.globalAlpha *= 0.75 * fade;
      const g = ctx.createRadialGradient(px, py, rIn, px, py, rOut);
      g.addColorStop(0, `rgba(${tint},0)`);
      g.addColorStop(0.7, `rgba(${tint},0.55)`);
      g.addColorStop(1, `rgba(${tint},0.95)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, rOut, a0, a1);
      ctx.arc(px, py, rIn, a1, a0, true);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(px, py, rOut + 3, a0 + (a1 - a0) * 0.35, a1 - 0.05);
      ctx.stroke();
      ctx.restore();
    }
    const hx = px + Math.cos(ang) * arm, hy = py + Math.sin(ang) * arm;
    ctx.save();
    ctx.strokeStyle = this.palette.line; // a stubby jelly arm
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    ctx.strokeStyle = this.palette.bottom;
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.translate(hx, hy);
    ctx.rotate(ang + Math.PI / 2);
    if (this.plus) drawEnhanceGlow(ctx, this.plus, this.t, SWORD_LEN[id] ?? 50);
    drawSword(ctx, id, k * 2);
    ctx.fillStyle = this.palette.bottom; // a jelly fist round the grip
    ctx.strokeStyle = this.palette.line;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 2, 3.6, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Follow a simulated state (from src/shared/sim.js) and run the jelly and accessory animations.
  // The physics lives in the shared sim; this is only how it looks.
  animate(dt, st, fx = {}) {
    const wasGrounded = this.grounded, lastVy = this.vy;
    this.x = st.x;
    this.y = st.y;
    this.vy = st.vy;
    this.slapT = Math.max(0, (this.slapT ?? 0) - dt);
    this.facing = this.slapT > 0 ? this.slapDir : st.facing; // faces the way it's slapping
    this.grounded = st.grounded;
    const walking = this.grounded && Math.abs(st.vx) > 40;
    if (this.grounded && !wasGrounded) {
      this.d = clamp(lastVy / 2000, 0.12, 0.4); // landing squash
      this.dv = 0;
      fx.land?.(this, lastVy);
    } else if (!this.grounded && wasGrounded && this.vy < 0) {
      this.d = -0.25; // jump stretch
      if (this.has('flute')) this.blow = 0.4;
      fx.jump?.(this);
    }

    this.t += dt;
    this.blow = Math.max(0, this.blow - dt);
    this.reactTime = Math.max(0, this.reactTime - dt);
    this.glowFlash = Math.max(0, this.glowFlash - dt);
    if (this.has('notes')) {
      this.flip = Math.max(0, this.flip - dt);
      this.scribble = Math.max(0, this.scribble - dt);
      this.nextScribble -= dt;
      if (this.nextScribble <= 0) {
        this.nextScribble = rand(8, 15); // once in a while she gets serious and writes
        this.scribble = SCRIBBLE_TIME;
      }
      if (this.scribble === 0) this.nextFlip -= dt; // no page-turning mid-sentence
      if (this.nextFlip <= 0) {
        this.nextFlip = rand(3, 6);
        this.flip = PAGE_FLIP;
        this.page++;
      }
    }
    if (this.reactTime === 0) this.reaction = null;
    if (this.has('laptop')) {
      for (const n of this.notifs) n.age += dt;
      this.notifs = this.notifs.filter((n) => n.age < NOTIF_LIFE);
      this.nextNotif -= dt;
      if (this.nextNotif <= 0) { // the laptop's notifications
        this.nextNotif = rand(1.5, 5); // random gaps between notifications
        const mood = pickMood();
        const kind = Math.floor(Math.random() * NOTIF_KINDS.length);
        this.notifs.push({ age: 0, kind, dx: rand(-5, 5), badge: !mood && Math.random() < 0.4, mood });
        this.glowRGB = MOOD_GLOW[mood] ?? hexRGB(NOTIF_KINDS[kind]);
        this.glowFlash = GLOW_FLASH;
        if (mood) {
          [, this.reaction, this.reactTime] = MOODS[mood];
          if (mood === 'party') this.dv -= 7; // a joyful wobble
        }
        fx.notify?.(this, mood);
      }
    }
    this.blink -= dt;
    this.nextBlink -= dt;
    if (this.nextBlink <= 0) {
      this.blink = 0.12;
      this.nextBlink = rand(2, 4);
    }

    // Jelly wobble: a spring pulling toward a target squash; a bouncier jiggle while walking
    const stiff = this.folk === 'fjord' && !this.lively; // half-solid: a slow, small wobble
    const target = this.grounded
      ? Math.sin(this.t * (walking ? 20 : stiff ? 6 : 14)) * (walking ? 0.07 : stiff ? 0.012 : 0.025)
      : -clamp(Math.abs(this.vy) / 3500, 0, 0.18);
    this.dv += ((target - this.d) * 260 - this.dv * 14) * dt;
    this.d += this.dv * dt;
  }

  draw(ctx) {
    const sx = 1 + this.d, sy = 1 - this.d;
    const w = this.w * sx, h = this.h * sy;
    ctx.save();
    const shudder = this.reaction === 'wince' ? Math.sin(this.t * 70) * 0.9 * (this.reactTime / MOODS.angry[2]) : 0;
    ctx.translate(this.x + shudder, this.y); // a little shudder while wincing
    ctx.scale(this.facing, 1); // drawn facing right; mirrored when walking left
    if (this.dead) {
      ctx.translate(0, -h / 2);
      ctx.rotate(this.rot);
      ctx.translate(0, h / 2);
    } else if (this.won) {
      ctx.rotate(this.rot);
    } else {
      ctx.rotate(clamp(this.vy / 5000, -0.1, 0.1));
    }

    const helmet = this.gear?.helmet, sword = this.gear?.sword && SWORD_LEN[this.gear.sword] ? this.gear.sword : null;
    if (sword && !(this.slapT > 0)) this.drawSwordOnBack(ctx, w, h, sword);

    // leaf sprout on top (tucked away under a helmet; a Greenhollow thing, so not on other islands' folk)
    if (!helmet && !this.folk) {
    ctx.save();
    ctx.translate(-w * 0.05, -h + 3);
    ctx.rotate(-0.2 + Math.sin(this.t * 5) * 0.15 - this.d * 0.8);
    ctx.strokeStyle = '#4f9d5c';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-2, -6, 1, -11);
    ctx.stroke();
    ctx.fillStyle = '#6cc96a';
    ellipse(ctx, 6, -12, 6.5, 3.4, -0.4);
    ctx.restore();
    }

    // body
    const g = ctx.createLinearGradient(0, -h, 0, 0);
    g.addColorStop(0, this.palette.top);
    g.addColorStop(1, this.palette.bottom);
    ctx.fillStyle = g;
    bodyPath(ctx, w, h);
    ctx.fill();
    ctx.strokeStyle = this.palette.line;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    if (this.folk === 'fjord') {
      ctx.save();
      bodyPath(ctx, w, h);
      ctx.clip();
      drawFolk(ctx, w, h, this.t);
      ctx.restore();
    }

    // shine
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ellipse(ctx, -w * 0.24, -h * 0.68, w * 0.09, h * 0.14, -0.6);
    ellipse(ctx, -w * 0.34, -h * 0.45, 2.2, 2.2);
    if (this.has('laptop')) {
      this.drawScreenLight(ctx, w, h);
      this.drawPhoneLight(ctx, w, h);
    }

    // face (shifted right, the way it's hopping)
    const fx = w * 0.14, fy = -h * 0.42;
    ctx.fillStyle = 'rgba(255,140,170,0.55)';
    ellipse(ctx, fx - 14, fy + 7, 5, 3);
    ellipse(ctx, fx + 15, fy + 7, 5, 3);
    const beaming = (this.reaction === 'happy' || this.reaction === 'party') && !this.dead;
    if (beaming) {
      ctx.fillStyle = 'rgba(255,110,150,0.5)'; // extra rosy when he's pleased
      ellipse(ctx, fx - 14, fy + 7, 5.5, 3.3);
      ellipse(ctx, fx + 15, fy + 7, 5.5, 3.3);
    }

    ctx.strokeStyle = '#2d2a3e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    if (this.dead) {
      ctx.beginPath();
      for (const ex of [fx - 7, fx + 8]) {
        ctx.moveTo(ex - 3, fy - 3); ctx.lineTo(ex + 3, fy + 3);
        ctx.moveTo(ex + 3, fy - 3); ctx.lineTo(ex - 3, fy + 3);
      }
      ctx.stroke();
      ctx.fillStyle = '#2d2a3e';
      ellipse(ctx, fx + 0.5, fy + 8, 3, 3.5);
    } else {
      // (s looks seriously determined while she's scribbling notes)
      const grit = this.won ? 0 : Math.max(this.grit, this.scribble > 0 ? 0.85 : 0);
      const blinking = this.blink > 0;
      const squint = this.has('flute') && this.blow > 0.1; // dd squeezes his eyes a bit to blow
      const wincing = this.reaction === 'wince' && this.reactTime > 0.08; // yr flinches at an angry notification
      for (const [ex, inward] of [[fx - 7, 1], [fx + 8, -1]]) {
        if (beaming) {
          ctx.beginPath(); // happy ^ ^ eyes
          ctx.arc(ex, fy + 2, 3.6, Math.PI * 1.15, Math.PI * 1.85);
          ctx.stroke();
          continue;
        }
        if (squint || wincing) {
          // a > < squeeze: small for dd's effort, bigger for yr's flinch
          const arm = wincing ? 3.2 : 2.4, open = wincing ? 2.8 : 1.9;
          ctx.beginPath();
          ctx.moveTo(ex - inward * arm, fy - open);
          ctx.lineTo(ex + inward * 1.8, fy);
          ctx.lineTo(ex - inward * arm, fy + open);
          ctx.stroke();
          continue;
        }
        // yr stares across and down at his laptop, eyes a little narrowed in concentration
        const onLaptop = this.has('laptop') || this.has('notes'); // eyes on the screen / the page
        const away = onLaptop ? 1 - this.talkBlend : 0; // looks up from the phone while talking on it
        const lookX = 1.3 * away, lookY = 1.2 * away, focus = onLaptop ? 0.8 + 0.2 * this.talkBlend : 1;
        ctx.fillStyle = '#2d2a3e';
        ellipse(ctx, ex + lookX, fy + lookY, 3.4, blinking ? 0.8 : 5 * (1 - 0.3 * grit) * focus); // eyes narrow into a focused stare
        if (!blinking) {
          ctx.fillStyle = '#fff';
          ellipse(ctx, ex + lookX + 1.2, fy + lookY * 0.6 - 2 * (1 - 0.3 * grit), 1.3, 1.3);
        }
      }
      // determined eyebrows, slanting down toward the middle
      if (grit > 0.05) {
        ctx.globalAlpha = Math.min(1, grit * 2);
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(fx - 12, fy - 9 - 1.5 * grit);
        ctx.lineTo(fx - 3, fy - 7 + 2 * grit);
        ctx.moveTo(fx + 13, fy - 9 - 1.5 * grit);
        ctx.lineTo(fx + 4, fy - 7 + 2 * grit);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 2;
      }
      if (this.reaction === 'party') {
        ctx.fillStyle = '#2d2a3e'; // big open cheer
        ctx.beginPath();
        ctx.moveTo(fx - 4.5, fy + 4.5);
        ctx.quadraticCurveTo(fx + 0.5, fy + 14, fx + 5.5, fy + 4.5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ff8fa6';
        ellipse(ctx, fx + 0.5, fy + 8, 2.2, 1.3); // tongue
      } else if (this.reaction === 'happy') {
        ctx.beginPath(); // a proper smile
        ctx.arc(fx + 0.5, fy + 4, 4.2, 0.12 * Math.PI, 0.88 * Math.PI);
        ctx.stroke();
      } else if (wincing) {
        ctx.beginPath(); // wobbly grimace
        ctx.moveTo(fx - 4, fy + 7);
        for (let k = 1; k <= 4; k++) ctx.lineTo(fx - 4 + k * 2, fy + 7 + (k % 2 ? -1.3 : 0));
        ctx.stroke();
      } else if (this.has('laptop') && this.talk > 0) {
        if (Math.sin(this.t * 16) > 0) {
          ctx.fillStyle = '#2d2a3e'; // chattering away
          ellipse(ctx, fx + 0.5, fy + 7, 2.3, 1.8);
        } else {
          ctx.beginPath();
          ctx.moveTo(fx - 2, fy + 7);
          ctx.lineTo(fx + 3, fy + 7);
          ctx.stroke();
        }
      } else if (this.has('laptop')) {
        ctx.beginPath(); // all business: a flat, focused mouth, always
        ctx.moveTo(fx - 2.5, fy + 7);
        ctx.lineTo(fx + 3.5, fy + 7);
        ctx.stroke();
      } else if (this.grounded) {
        if (grit < 0.5) {
          ctx.beginPath();
          ctx.arc(fx + 0.5, fy + 5, 3.2, 0.15 * Math.PI, 0.85 * Math.PI);
          ctx.stroke();
        } else {
          ctx.beginPath(); // firm, set mouth
          ctx.moveTo(fx - 3, fy + 7);
          ctx.lineTo(fx + 4, fy + 6.5);
          ctx.stroke();
        }
      } else if (grit < 0.6) {
        ctx.fillStyle = '#2d2a3e';
        ellipse(ctx, fx + 0.5, fy + 7, 2.4, 3);
      } else {
        // gritted teeth mid-jump
        ctx.fillStyle = '#fff';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(fx - 3.5, fy + 4.5, 8, 4.5, 1.5);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(fx - 3.5, fy + 6.75);
        ctx.lineTo(fx + 4.5, fy + 6.75);
        ctx.stroke();
      }
      // a bead of effort sweat
      if (grit > 0.4 && grit < 0.95) {
        ctx.globalAlpha = Math.min(1, (grit - 0.4) * 4, (0.95 - grit) * 8);
        ctx.fillStyle = '#9fdcff';
        const sy = -h * 0.82 + Math.sin(this.t * 6) * 1.5;
        ctx.beginPath();
        ctx.moveTo(w * 0.36, sy - 5);
        ctx.quadraticCurveTo(w * 0.36 + 3.5, sy + 1, w * 0.36, sy + 2.5);
        ctx.quadraticCurveTo(w * 0.36 - 3.5, sy + 1, w * 0.36, sy - 5);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    this.drawAccessory(ctx, w, h, fx);
    if (helmet) drawHelmet(ctx, helmet, w, h, this.t);
    if (this.slapT > 0) {
      if (sword) this.drawSwordSwing(ctx, w, h, sword);
      else this.drawSlap(ctx, w, h);
    }
    if (!helmet) this.drawHeadband(ctx, w, h);
    ctx.restore();
  }

  // yr's laptop screen glowing on his face: soft blue, flashing the colour of each notification
  // (red for angry, gold for praise, rainbow for a party) and fading back. Drawn under his features.
  drawScreenLight(ctx, w, h) {
    const { lh, lx, lw, top } = laptopSpot(w, h);
    const sx = lx - lw / 2, sy = top + lh / 2; // the screen's edge nearest him
    let rgb = SCREEN_BLUE;
    if (this.glowFlash > 0) {
      const flash = this.glowRGB === 'rainbow' ? hueRGB(this.t * 720) : this.glowRGB;
      const k = Math.min(1, this.glowFlash / GLOW_FLASH) ** 0.7;
      rgb = SCREEN_BLUE.map((v, i) => Math.round(v + (flash[i] - v) * k));
    }
    const strength = (0.6 + 0.07 * Math.sin(this.t * 17) + 0.15 * Math.min(1, this.glowFlash / GLOW_FLASH)) * (1 - this.phoneT);
    if (strength < 0.01) return;
    ctx.save();
    bodyPath(ctx, w, h);
    ctx.clip();
    const glow = ctx.createRadialGradient(sx, sy, 3, sx, sy, w * 1.15);
    glow.addColorStop(0, `rgba(${rgb},${strength})`);
    glow.addColorStop(0.55, `rgba(${rgb},${strength * 0.4})`);
    glow.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(-w / 2, -h, w, h);
    ctx.restore();
  }

  // yr's phone: held in front of him while he uses it, or at his ear while he talks — at the back
  // of his head on the side nearest us, well clear of his eyes. The two crossfade rather than sliding.
  phoneSpot(w, h) {
    return { x: w * 0.5 + 9, y: -h * 0.5, earX: -w * 0.38, earY: -h * 0.5 };
  }

  // soft white glow from the phone screen on his face while he's looking at it
  drawPhoneLight(ctx, w, h) {
    const a = this.phoneT * (1 - this.talkBlend) * (0.4 + 0.05 * Math.sin(this.t * 13));
    if (a < 0.01) return;
    const { x, y } = this.phoneSpot(w, h);
    ctx.save();
    bodyPath(ctx, w, h);
    ctx.clip();
    const glow = ctx.createRadialGradient(x - 4, y, 2, x - 4, y, w * 0.8);
    glow.addColorStop(0, `rgba(235,245,255,${a})`);
    glow.addColorStop(1, 'rgba(235,245,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-w / 2, -h, w, h);
    ctx.restore();
  }

  drawPhone(ctx, w, h) {
    const { x, y, earX, earY } = this.phoneSpot(w, h);
    const atEar = this.talkBlend * this.talkBlend * (3 - 2 * this.talkBlend);
    const body = (rot) => {
      ctx.rotate(rot);
      ctx.fillStyle = '#1f2229';
      ctx.strokeStyle = '#0e0f13';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.roundRect(-3.6, -6.2, 7.2, 12.4, 1.6);
      ctx.fill();
      ctx.stroke();
    };

    // in front of him, screen showing a little chat
    if (atEar < 1) {
      ctx.save();
      ctx.globalAlpha = this.phoneT * (1 - atEar);
      ctx.translate(x, y);
      body(-0.15);
      ctx.fillStyle = '#d6ecff';
      ctx.beginPath();
      ctx.roundRect(-2.8, -5.2, 5.6, 10.2, 0.8);
      ctx.fill();
      const scroll = (this.t * 0.8) % 1;
      ctx.beginPath();
      ctx.rect(-2.8, -5.2, 5.6, 10.2);
      ctx.clip();
      for (let i = 0; i < 4; i++) {
        const mine = (i + Math.floor(this.t * 0.8)) % 2 === 0;
        ctx.fillStyle = mine ? '#4f9dff' : '#ffffff';
        ctx.beginPath();
        ctx.roundRect(mine ? -0.2 : -2.3, 3 - (i + scroll) * 2.6, 2.6, 1.6, 0.7);
        ctx.fill();
      }
      ctx.restore();
    }

    // at his near ear, on the back of his head, pressed against it (drawn in front of him)
    if (atEar > 0) {
      ctx.save();
      ctx.globalAlpha = this.phoneT * atEar;
      ctx.translate(earX, earY);
      ctx.rotate(-0.22);
      body(0);
      ctx.fillStyle = 'rgba(255,255,255,0.14)'; // edge sheen
      ctx.fillRect(-2.9, -5.6, 0.9, 11);
      ctx.restore();
    }

    // speech bubble while he's talking
    if (this.talk > 0 && atEar > 0.5) {
      const pop = Math.min(1, (atEar - 0.5) * 4);
      const bx = w * 0.62, by = -h * 1.18;
      ctx.save();
      ctx.globalAlpha = pop;
      ctx.font = '700 7px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const tw = ctx.measureText(this.line).width + 7;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'rgba(40,40,60,0.45)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.roundRect(bx - tw / 2, by - 5.5, tw, 11, 5);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath(); // tail toward his mouth
      ctx.moveTo(bx - tw / 2 + 4, by + 4.5);
      ctx.lineTo(bx - tw / 2 + 1, by + 9);
      ctx.lineTo(bx - tw / 2 + 8, by + 5);
      ctx.fill();
      ctx.fillStyle = '#4a3b5c';
      ctx.fillText(this.line, bx, by + 0.5);
      ctx.restore();
    }
  }

  drawAccessory(ctx, w, h, fx) {
    if (this.has('tutor')) {
      // Tutor Byte: square glasses, a pencil tucked on top, and a lanyard with an ID badge
      const fy = -h * 0.42;
      ctx.save();
      ctx.strokeStyle = '#2d4a3e';
      ctx.lineWidth = 1.4;
      for (const ex of [fx - 7, fx + 8]) {
        ctx.fillStyle = 'rgba(220,240,255,0.25)';
        ctx.beginPath();
        ctx.roundRect(ex - 5.5, fy - 4.5, 11, 9, 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(fx - 1.5, fy - 1);
      ctx.lineTo(fx + 2.5, fy - 1);
      ctx.stroke();
      ctx.save(); // pencil resting on top of the head
      ctx.translate(-w * 0.08, -h * 0.97);
      ctx.rotate(-0.12);
      ctx.fillStyle = '#ffcf3a';
      ctx.fillRect(-12, -2, 20, 4);
      ctx.fillStyle = '#ff8fa6';
      ctx.fillRect(-15, -2, 3, 4);
      ctx.fillStyle = '#f2d2a0';
      ctx.beginPath();
      ctx.moveTo(8, -2);
      ctx.lineTo(13, 0);
      ctx.lineTo(8, 2);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = '#3c6ad0'; // lanyard and badge
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(fx - 12, -h * 0.2);
      ctx.lineTo(fx + 1, -h * 0.02);
      ctx.lineTo(fx + 13, -h * 0.2);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#3c6ad0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(fx - 5, -h * 0.03, 12, 9, 1.5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#7fb89f';
      ctx.fillRect(fx - 3, -h * 0.03 + 2, 4, 5);
      ctx.restore();
    }
    if (this.has('curator')) {
      // Curator Clio: a plum beret, half-moon reading glasses on a chain, and a history book held open
      const fy = -h * 0.42;
      ctx.save();
      ctx.fillStyle = '#7a3a6a';
      ctx.beginPath();
      ctx.ellipse(-w * 0.04, -h * 0.94, w * 0.34, 7, -0.15, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#8f4a7e';
      ctx.beginPath();
      ctx.ellipse(-w * 0.08, -h * 0.98, w * 0.24, 5, -0.15, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#5a2a4e';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-w * 0.06, -h * 1.02);
      ctx.lineTo(-w * 0.04, -h * 1.1);
      ctx.stroke();
      ctx.strokeStyle = '#8a6420';
      ctx.lineWidth = 1.3;
      for (const ex of [fx - 7, fx + 8]) {
        ctx.beginPath();
        ctx.arc(ex, fy + 1, 4.6, 0.05 * Math.PI, 0.95 * Math.PI); // half-moons: only the lower rim
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(fx - 2.4, fy + 1.5);
      ctx.lineTo(fx + 3.4, fy + 1.5);
      ctx.moveTo(fx - 11.6, fy + 1.5); // glasses chain, looping down to the side
      ctx.quadraticCurveTo(-w * 0.42, fy + 14, -w * 0.32, fy + 22);
      ctx.stroke();
      // the book, open, held in front
      const bx = w * 0.5 + 6, by = -h * 0.36, turn = Math.sin(this.t * 0.7) * 0.06;
      ctx.translate(bx, by);
      ctx.rotate(-0.12 + turn);
      ctx.fillStyle = '#8a3a3a';
      ctx.beginPath();
      ctx.roundRect(-13, -9, 26, 18, 2);
      ctx.fill();
      ctx.fillStyle = '#fffaf0';
      ctx.fillRect(-11.5, -7.5, 11, 15);
      ctx.fillRect(0.5, -7.5, 11, 15);
      ctx.strokeStyle = '#b8a888';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (let k = 0; k < 5; k++) {
        ctx.moveTo(-10, -5 + k * 3);
        ctx.lineTo(-2, -5 + k * 3);
        ctx.moveTo(2, -5 + k * 3);
        ctx.lineTo(10 - (k % 2) * 3, -5 + k * 3);
      }
      ctx.stroke();
      ctx.restore();
    }
    if (this.has('professor')) {
      // Prof. Synapse: round spectacles, a mortarboard with a swinging tassel, and a pointer stick
      const fy = -h * 0.42;
      ctx.save();
      ctx.strokeStyle = '#3a3550';
      ctx.lineWidth = 1.3;
      for (const ex of [fx - 7, fx + 8]) {
        ctx.fillStyle = 'rgba(220,240,255,0.25)';
        ctx.beginPath();
        ctx.arc(ex, fy, 5.2, 0, TAU);
        ctx.fill();
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(fx - 1.8, fy - 0.5);
      ctx.quadraticCurveTo(fx + 0.5, fy - 2.5, fx + 2.8, fy - 0.5);
      ctx.stroke();
      // mortarboard: a skullcap and a flat square board seen at an angle
      const top = -h - 1;
      ctx.fillStyle = '#2d2a3e';
      ctx.beginPath();
      ctx.ellipse(0, top + 4, w * 0.26, 6, 0, Math.PI, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-w * 0.42, top - 1);
      ctx.lineTo(0, top - 8);
      ctx.lineTo(w * 0.42, top - 1);
      ctx.lineTo(0, top + 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ellipse(ctx, -w * 0.1, top - 3, 6, 1.5, -0.15);
      const swing = Math.sin(this.t * 2.2) * 0.25;
      ctx.strokeStyle = '#ffcf3a';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, top - 2);
      ctx.lineTo(w * 0.32, top + 1);
      ctx.lineTo(w * 0.32 + Math.sin(swing) * 9, top + 1 + Math.cos(swing) * 9);
      ctx.stroke();
      ctx.fillStyle = '#ffcf3a';
      ellipse(ctx, w * 0.32 + Math.sin(swing) * 10, top + 2 + Math.cos(swing) * 10, 1.8, 3, -swing);
      // pointer, raised toward the board now and then
      const point = Math.max(0, Math.sin(this.t * 0.9)) ** 2;
      ctx.translate(-w * 0.45, -h * 0.35);
      ctx.rotate(-2.4 - 0.5 * point);
      ctx.strokeStyle = '#8f6240';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(30, 0);
      ctx.stroke();
      ctx.fillStyle = '#ff6f91';
      ellipse(ctx, 31, 0, 2.6, 2.6);
      ctx.restore();
    }
    if (this.has('elder')) {
      // Elder Mochi: bushy white eyebrows, a tuft of moss on top, and a walking cane
      const fy = -h * 0.42;
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'rgba(120,120,140,0.5)';
      ctx.lineWidth = 0.8;
      for (const [ex, tilt] of [[fx - 7, 0.25], [fx + 8, -0.25]]) {
        for (const [dx, dy, r] of [[-3.5, 0, 2.6], [0, -1.2, 3], [3.5, 0, 2.6]]) {
          ctx.beginPath();
          ctx.arc(ex + dx, fy - 8 + dy + dx * tilt * 0.4, r, 0, TAU);
          ctx.fill();
          ctx.stroke();
        }
      }
      // moss tuft draped over the top of his head
      ctx.fillStyle = '#6a9a4a';
      for (const [dx, dy, r] of [[-12, -0.86, 5], [-5, -0.97, 6], [3, -0.98, 5.5], [10, -0.9, 4.5]]) {
        ellipse(ctx, dx, h * dy, r, r * 0.7);
      }
      ctx.fillStyle = '#8fc06a';
      ellipse(ctx, -6, -h * 0.99, 2.5, 1.6);
      ellipse(ctx, 4, -h * 1.0, 2, 1.3);
      // cane, planted in front of him, with a curled handle
      const cx = w * 0.5 + 7, lean = Math.sin(this.t * 1.3) * 0.02;
      ctx.translate(cx, 0);
      ctx.rotate(0.08 + lean);
      ctx.strokeStyle = '#8f6240';
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -h * 0.85);
      ctx.arc(-5, -h * 0.85, 5, 0, Math.PI, true);
      ctx.stroke();
      ctx.fillStyle = '#6cc96a'; // a little leaf sprouting from it
      ellipse(ctx, 3.5, -h * 0.45, 4, 2, -0.6);
      ctx.restore();
    }
    for (const kind of ['lamplighter', 'netmender', 'mittens']) if (this.has(kind)) drawFolkDress(ctx, kind, w, h, fx, this.t); // Icefang Hamlet's people
    if (this.has('captain')) {
      // Captain Brine: a salt-white beard, a navy captain's cap with a gold anchor badge, and a brass spyglass
      const fy = -h * 0.42;
      ctx.save();
      ctx.fillStyle = '#f6f4ee';
      ctx.strokeStyle = 'rgba(120,120,140,0.35)';
      ctx.lineWidth = 0.8;
      for (const [dx, dy, r] of [[-18, 13, 5], [-11, 18, 6], [-3, 21, 6.5], [6, 21, 6.5], [14, 18, 6], [21, 13, 5]]) {
        ctx.beginPath();
        ctx.arc(fx + dx, fy + dy, r, 0, TAU);
        ctx.fill();
        ctx.stroke();
      }
      for (const [dx, dy, r] of [[-20, 6, 3.4], [23, 6, 3.4]]) ellipse(ctx, fx + dx, fy + dy, r, r * 1.4); // sideburns
      ctx.fillStyle = '#3e4f78'; // the cap: crown, band and a stiff peak over the face
      ctx.beginPath();
      ctx.ellipse(-w * 0.02, -h * 0.98, w * 0.36, 9, 0, Math.PI, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(-w * 0.34, -h * 0.98, w * 0.66, 8, 2);
      ctx.fill();
      ctx.fillStyle = '#2d3a5c';
      ctx.beginPath();
      ctx.ellipse(fx + 4, -h * 0.9, w * 0.26, 4, 0.08, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = '#f6f4ee';
      ctx.fillRect(-w * 0.34, -h * 0.98 + 1.5, w * 0.66, 2);
      ctx.fillStyle = '#ffd36b';
      circle(ctx, fx - 2, -h * 1.03, 3.2);
      ctx.strokeStyle = '#ffd36b';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(fx - 2, -h * 1.03);
      ctx.lineTo(fx - 2, -h * 0.99);
      ctx.stroke();
      // spyglass, tucked against his side, glinting now and then
      ctx.translate(-w * 0.5 - 2, -h * 0.28);
      ctx.rotate(-0.5 + Math.sin(this.t * 0.9) * 0.03);
      ctx.fillStyle = '#c9963e';
      ctx.beginPath();
      ctx.roundRect(-4, -4, 26, 8, 3);
      ctx.fill();
      ctx.fillStyle = '#e8b85a';
      ctx.beginPath();
      ctx.roundRect(18, -5, 12, 10, 3);
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.4 * Math.max(0, Math.sin(this.t * 1.7))})`;
      circle(ctx, 30, 0, 2.6);
      ctx.restore();
    }
    if (this.has('merchant')) {
      // Merchant Pip: a striped apron, a flat cap, a coin pouch on his belt and a coin he flips now and then
      ctx.save();
      ctx.save();
      bodyPath(ctx, w, h);
      ctx.clip();
      const ay = -h * 0.2; // below his mouth
      ctx.fillStyle = '#fffaf0'; // apron bib and skirt across the front
      ctx.beginPath();
      ctx.roundRect(-w * 0.18, ay, w * 0.62, -ay + 4, [6, 6, 0, 0]);
      ctx.fill();
      ctx.fillStyle = '#9fd8b0';
      for (let sx = -w * 0.18 + 4; sx < w * 0.44; sx += 7) ctx.fillRect(sx, ay + 2, 2.6, -ay + 2);
      ctx.fillStyle = '#5aa97a'; // apron strings round its middle
      ctx.fillRect(-w / 2, ay - 1, w, 3.2);
      ctx.restore();
      ctx.strokeStyle = 'rgba(90,169,122,0.6)';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); // front pocket
      ctx.roundRect(w * 0.02, -h * 0.2, 13, 8, [0, 0, 3, 3]);
      ctx.stroke();
      // coin pouch hanging off the strings at its back
      const px = -w * 0.38, py = ay + 2, bob = Math.sin(this.t * 3) * 0.08;
      ctx.translate(px, py);
      ctx.rotate(bob);
      ctx.fillStyle = '#c98a5a';
      ctx.strokeStyle = '#8f6240';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-3, 1);
      ctx.quadraticCurveTo(-9, 8, -5, 14);
      ctx.quadraticCurveTo(0, 16, 5, 14);
      ctx.quadraticCurveTo(9, 8, 3, 1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#ffd23a';
      ctx.beginPath(); // drawstring
      ctx.moveTo(-3.5, 3);
      ctx.lineTo(3.5, 3);
      ctx.stroke();
      ctx.fillStyle = '#ffd23a';
      circle(ctx, 0, 9, 2.4); // a coin stamp on it
      ctx.rotate(-bob);
      ctx.translate(-px, -py);
      // flat cap with a short brim pointing forward
      const top = -h * 0.93;
      ctx.fillStyle = '#7a8cc0';
      ctx.strokeStyle = '#56679a';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(w * 0.22, top + 3, w * 0.22, 3.4, 0.08, 0, TAU); // brim
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(-w * 0.04, top + 3, w * 0.34, 9, 0, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffd23a';
      ctx.fillRect(-w * 0.36, top + 0.5, w * 0.64, 2.2); // gold band
      ctx.fillStyle = '#56679a';
      circle(ctx, -w * 0.04, top - 6, 1.8); // button
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ellipse(ctx, -w * 0.16, top - 3, 5, 1.6, -0.2);
      // the coin flip: every few seconds a coin pops up from in front of him, spinning, and lands back
      const cyc = this.t % 4.2;
      if (cyc < 0.9 && !this.dead) {
        const k = cyc / 0.9;
        const cx = w * 0.5 + 8, cy = -h * 0.42 - Math.sin(k * Math.PI) * 34;
        const spin = Math.cos(k * Math.PI * 6);
        ctx.translate(cx, cy);
        ctx.scale(Math.max(0.15, Math.abs(spin)), 1);
        ctx.fillStyle = spin > 0 ? '#ffd23a' : '#e8a82a';
        ctx.strokeStyle = '#a8701a';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        circle(ctx, -1.5, -1.5, 1.2);
      } else if (cyc < 1.2 && !this.dead) {
        const k = (cyc - 0.9) / 0.3; // a twinkle as he catches it
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = '#fff3a8';
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * TAU + 0.4;
          circle(ctx, w * 0.5 + 8 + Math.cos(a) * (5 + k * 8), -h * 0.42 + Math.sin(a) * (5 + k * 8), 1.6);
        }
      }
      ctx.restore();
    }
    if (this.has('glasses')) {
      // wide rectangular glasses over the eyes, arms running back toward the sides of the head
      const fy = -h * 0.42, lw = 11.5, lh = 7.6;
      const lenses = [fx - 7, fx + 8].map((ex) => ex - lw / 2);
      ctx.save();
      for (const x of lenses) {
        ctx.fillStyle = 'rgba(220,240,255,0.18)'; // faint lens tint
        ctx.beginPath();
        ctx.roundRect(x, fy - lh / 2, lw, lh, 2);
        ctx.fill();
        ctx.strokeStyle = '#6b3f6e';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; // little shine on each lens
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(x + 2, fy + lh / 2 - 2.2);
        ctx.lineTo(x + 4.2, fy - lh / 2 + 1.6);
        ctx.stroke();
      }
      ctx.strokeStyle = '#6b3f6e';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(lenses[0] + lw, fy - 1); // bridge
      ctx.lineTo(lenses[1], fy - 1);
      ctx.moveTo(lenses[0], fy - 1.2); // arm
      ctx.lineTo(-w * 0.36, fy - 2);
      ctx.stroke();
      ctx.restore();
    }
    if (this.has('notes')) {
      // a page of study notes held out in front, tilted toward her
      const px = w * 0.5 + 11, py = -h * 0.5, pw = 15, ph = 19;
      const turning = this.flip / PAGE_FLIP; // 1 → 0 while the page turns
      const r = mulberrySeed(this.page);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(-0.18);
      // the page underneath (visible while the top page flips over)
      ctx.fillStyle = '#efe6cf';
      ctx.strokeStyle = '#b9ab88';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.roundRect(-pw / 2 + 1, -ph / 2 + 1, pw, ph, 1.5);
      ctx.fill();
      ctx.stroke();
      // the top page; squashes sideways while flipping
      ctx.save();
      ctx.translate(-pw / 2, 0);
      ctx.scale(turning > 0 ? Math.abs(Math.cos(turning * Math.PI)) : 1, 1);
      ctx.translate(pw / 2, 0);
      ctx.fillStyle = '#fffaf0';
      ctx.strokeStyle = '#b9ab88';
      ctx.beginPath();
      ctx.roundRect(-pw / 2, -ph / 2, pw, ph, 1.5);
      ctx.fill();
      ctx.stroke();
      if (turning < 0.5) {
        ctx.strokeStyle = '#a9c8f0'; // ruled lines
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (let ly = -ph / 2 + 4; ly < ph / 2 - 1; ly += 2.6) {
          ctx.moveTo(-pw / 2 + 1, ly);
          ctx.lineTo(pw / 2 - 1, ly);
        }
        ctx.stroke();
        ctx.strokeStyle = '#ff9a9a'; // margin
        ctx.beginPath();
        ctx.moveTo(-pw / 2 + 3.5, -ph / 2 + 1);
        ctx.lineTo(-pw / 2 + 3.5, ph / 2 - 1);
        ctx.stroke();
        // handwriting scribbles, different on every page, plus one highlighted line
        const hl = Math.floor(r() * 5);
        for (let i = 0, ly = -ph / 2 + 3.6; i < 6; i++, ly += 2.6) {
          const len = 4 + r() * 6;
          if (i === hl) {
            ctx.fillStyle = 'rgba(255,230,80,0.7)';
            ctx.fillRect(-pw / 2 + 4.3, ly - 1.3, len + 0.6, 1.8);
          }
          ctx.strokeStyle = '#4a4a6a';
          ctx.lineWidth = 0.55;
          ctx.beginPath();
          ctx.moveTo(-pw / 2 + 4.5, ly - 0.4);
          for (let x = 0; x < len; x += 1) ctx.lineTo(-pw / 2 + 4.5 + x, ly - 0.4 - (x % 2 ? 0.6 : 0));
          ctx.stroke();
        }
      }
      if (this.scribble > 0) {
        // she writes a fresh squiggly line across the page, pencil jiggling as she goes
        const written = 1 - this.scribble / SCRIBBLE_TIME;
        const ly = ph / 2 - 3.2, x0 = -pw / 2 + 4.5, len = (pw - 6.5) * Math.min(1, written * 1.15);
        ctx.strokeStyle = '#2d2a5e';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(x0, ly);
        for (let x = 0; x < len; x += 0.7) ctx.lineTo(x0 + x, ly - Math.abs(Math.sin(x * 2.3)) * 0.9);
        ctx.stroke();
        const tipX = x0 + len, tipY = ly - 0.4 + Math.sin(this.t * 40) * 0.5;
        ctx.save();
        ctx.translate(tipX, tipY);
        ctx.rotate(-1.05 + Math.sin(this.t * 25) * 0.08);
        ctx.fillStyle = '#2d2a3e'; // lead
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(1.6, -0.8);
        ctx.lineTo(1.6, 0.8);
        ctx.fill();
        ctx.fillStyle = '#f2d2a0'; // sharpened wood
        ctx.beginPath();
        ctx.moveTo(0.8, -0.4);
        ctx.lineTo(3, -1);
        ctx.lineTo(3, 1);
        ctx.lineTo(0.8, 0.4);
        ctx.fill();
        ctx.fillStyle = '#ffcf3a'; // yellow body
        ctx.fillRect(3, -1, 8, 2);
        ctx.fillStyle = '#c9c9d6'; // ferrule
        ctx.fillRect(11, -1, 1.2, 2);
        ctx.fillStyle = '#ff8fa6'; // eraser
        ctx.fillRect(12.2, -1, 1.6, 2);
        ctx.restore();
      }
      ctx.restore();
      ctx.fillStyle = '#ff8fbf'; // sticky tab
      ctx.fillRect(pw / 2 - 0.5, -ph / 2 + 3, 2.5, 3.5);
      ctx.restore();
    }
    if (this.has('ribbon')) {
      // pink ribbon tied around the top of its head, with a bow
      const ry = -h * 0.84;
      ctx.save();
      bodyPath(ctx, w, h);
      ctx.clip();
      ctx.fillStyle = '#ff8fbf';
      ctx.fillRect(-w / 2, ry - h * 0.05, w, h * 0.1);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillRect(-w / 2, ry - h * 0.05, w, h * 0.03);
      ctx.restore();
      const bx = -w * 0.2, by = ry - 1, wob = Math.sin(this.t * 6) * 0.08;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(-0.25 + wob);
      ctx.fillStyle = '#ff6fae';
      ctx.strokeStyle = '#d94c8c';
      ctx.lineWidth = 1.2;
      for (const side of [-1, 1]) {
        ctx.beginPath(); // loop
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(side * 6, -9, side * 13, -5, side * 10, 1);
        ctx.bezierCurveTo(side * 8, 5, side * 3, 3, 0, 0);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath(); // tail
        ctx.moveTo(side * 1.5, 1);
        ctx.lineTo(side * 5, 9);
        ctx.lineTo(side * 2.5, 8);
        ctx.lineTo(side * 0.5, 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ff8fbf';
      ellipse(ctx, 0, 0, 2.6, 2.6); // knot
      ctx.stroke();
      ctx.restore();
    }
    if (this.has('flute')) {
      // tiny recorder held in its mouth, angled down and forward, with notes drifting from the end
      const mx = fx + 1, my = -h * 0.42 + 6;
      const blow = this.blow / 0.4; // 1 right after a jump → 0
      if (blow > 0) {
        // puffed-out cheeks while blowing
        ctx.fillStyle = this.palette.cheek;
        ctx.strokeStyle = this.palette.line;
        ctx.lineWidth = 1;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.arc(mx + side * 5.5, my - 1, 2.2 + 2.6 * blow, 0, TAU);
          ctx.fill();
          ctx.stroke();
        }
      }
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(0.5 - 0.25 * blow); // tips up as it toots
      ctx.fillStyle = '#f2dcae';
      ctx.strokeStyle = '#b8935a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-1, -1.7, 17, 3.4, 1.5); // body
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(15, -2.4, 4, 4.8, 1.5); // flared end
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#8a6a3a';
      for (const hx of [6, 9, 12]) ellipse(ctx, hx, -0.2, 0.75, 0.75); // finger holes
      ctx.restore();
      if (!this.dead) {
        const tipX = mx + Math.cos(0.5) * 19, tipY = my + Math.sin(0.5) * 19;
        if (blow > 0) {
          // a burst of notes popping out of the end with each toot
          const k = 1 - blow;
          ctx.fillStyle = '#ff6f91';
          ctx.font = '700 11px Fredoka, sans-serif';
          ctx.textAlign = 'center';
          ctx.globalAlpha = blow;
          ['♪', '♫', '♪'].forEach((n, i) => {
            const a = -0.9 + i * 0.6;
            ctx.fillText(n, tipX + Math.cos(a) * (6 + k * 18), tipY + Math.sin(a) * (6 + k * 18) - k * 6);
          });
          ctx.globalAlpha = 1;
        }
        ctx.fillStyle = '#5b4a6b';
        ctx.font = '700 9px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        for (let i = 0; i < 2; i++) {
          const k = (this.t * 0.7 + i / 2) % 1;
          ctx.globalAlpha = Math.sin(k * Math.PI) * 0.85;
          ctx.fillText(i ? '♫' : '♪', tipX + 4 + k * 10 + Math.sin(k * 9) * 2, tipY - 4 - k * 22);
        }
        ctx.globalAlpha = 1;
      }
    }
    if (this.has('laptop')) {
      // a serious laptop floating out in front of him; screen faces him (its light: drawScreenLight)
      const { lw, lh, lx, top } = laptopSpot(w, h);
      // open laptop seen from behind: the screen faces him, so all we see is the back of the lid
      // (leaning away from him) and a sliver of the base sticking out toward him — no keyboard
      ctx.save();
      ctx.globalAlpha = 1 - this.phoneT; // closing up and sliding away when the phone comes out
      ctx.translate(lx, top + lh + this.phoneT * 8); // origin at the hinge
      ctx.scale(1, 1 - 0.85 * this.phoneT);
      const quad = (pts, fill, stroke) => {
        ctx.beginPath();
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        if (stroke) {
          ctx.strokeStyle = stroke;
          ctx.stroke();
        }
      };
      ctx.lineWidth = 1;
      ctx.lineJoin = 'round';
      quad([[-14, 0.2], [9, 0.6], [9, 2.6], [-14, 2.2]], '#3b3f48', '#14161a'); // base, edge-on
      ctx.fillStyle = 'rgba(150,210,255,0.55)';
      ctx.fillRect(-13.5, 0.4, 6, 0.9); // screen light catching the base's top edge
      quad([[-7, 0.4], [9, 0.6], [12.5, -14.6], [-3.5, -15]], '#2b2e35', '#14161a'); // back of the lid
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ellipse(ctx, 3, -7.2, 2, 2); // plain logo
      quad([[-3.5, -15], [12.5, -14.6], [12.2, -13.4], [-3.8, -13.8]], 'rgba(255,255,255,0.1)'); // top-edge sheen
      // the screen's glow spilling round the edge that faces him
      ctx.strokeStyle = 'rgba(150,210,255,0.9)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-7.5, -0.4);
      ctx.lineTo(-3.9, -14.4);
      ctx.stroke();
      ctx.restore();

      if (this.phoneT > 0) this.drawPhone(ctx, w, h);

      // notifications popping out of the laptop and floating up
      for (const n of this.notifs) {
        const k = n.age / NOTIF_LIFE;
        const pop = Math.min(1, n.age / 0.15); // quick pop-in
        ctx.save();
        ctx.globalAlpha = Math.min(pop, (1 - k) * 2.5);
        ctx.translate(lx + 4 + n.dx, top - 3 - k * 26);
        ctx.scale(0.6 + 0.4 * pop, 0.6 + 0.4 * pop);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = 'rgba(40,40,60,0.35)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        if (n.mood) {
          ctx.strokeStyle = { angry: '#ff3b30', praise: '#ffb020', party: '#c56cf0' }[n.mood];
          ctx.lineWidth = 1;
        }
        ctx.roundRect(-11, -4.5, 22, 9, 2.5);
        ctx.fill();
        ctx.stroke();
        if (n.mood === 'praise') {
          // golden smiley
          ctx.fillStyle = '#ffd23a';
          ellipse(ctx, -7, 0, 3.1, 3.1);
          ctx.fillStyle = '#7a4a00';
          ellipse(ctx, -8.1, -0.8, 0.45, 0.6);
          ellipse(ctx, -5.9, -0.8, 0.45, 0.6);
          ctx.strokeStyle = '#7a4a00';
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.arc(-7, 0.2, 1.6, 0.15 * Math.PI, 0.85 * Math.PI);
          ctx.stroke();
        } else if (n.mood === 'party') {
          // party popper: a cone bursting with confetti
          ctx.fillStyle = '#ff9f43';
          ctx.beginPath();
          ctx.moveTo(-9.5, 2.8);
          ctx.lineTo(-7.8, -1.6);
          ctx.lineTo(-5.4, 0.8);
          ctx.closePath();
          ctx.fill();
          for (const [cx2, cy2, c] of [[-5.2, -2.4, '#ff5a8a'], [-4, -0.6, '#4fbf86'], [-6.4, -3.4, '#5b8def'], [-3.6, -2.8, '#ffd23a']]) {
            ctx.fillStyle = c;
            ctx.fillRect(cx2, cy2, 0.9, 0.9);
          }
        } else if (n.mood === 'angry') {
          // little angry face: furious brows and a frown
          ctx.fillStyle = '#ff6a3a';
          ellipse(ctx, -7, 0, 3.1, 3.1);
          ctx.strokeStyle = '#5a1a0a';
          ctx.lineWidth = 0.7;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(-9, -1.6); ctx.lineTo(-7.6, -0.8);
          ctx.moveTo(-5, -1.6); ctx.lineTo(-6.4, -0.8);
          ctx.moveTo(-8.3, 1.6); ctx.quadraticCurveTo(-7, 0.6, -5.7, 1.6);
          ctx.stroke();
        } else {
          ctx.fillStyle = NOTIF_KINDS[n.kind];
          ellipse(ctx, -7, 0, 2.4, 2.4); // app icon
        }
        ctx.fillStyle = '#c4c7d0';
        ctx.fillRect(-3.5, -2.2, 11, 1.4); // text lines
        ctx.fillRect(-3.5, 0.8, 7, 1.4);
        if (n.badge) {
          ctx.fillStyle = '#ff3b30';
          ellipse(ctx, 10, -4.5, 2.8, 2.8);
          ctx.fillStyle = '#ffffff';
          ctx.font = '700 4px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('1', 10, -4.4);
        }
        ctx.restore();
      }
    }
    if (this.has('bowtie')) {
      // dapper bowtie on its front, under the face
      const tx = fx + 0.5, ty = -h * 0.07;
      ctx.save();
      ctx.translate(tx, ty);
      ctx.fillStyle = '#3a3550';
      ctx.strokeStyle = '#1f1b2e';
      ctx.lineWidth = 1;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(side * 8, -4.5);
        ctx.quadraticCurveTo(side * 9.5, 0, side * 8, 4.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ellipse(ctx, -5, -1.5, 2, 1);
      ellipse(ctx, 5, -1.5, 2, 1);
      ctx.fillStyle = '#4a4466';
      ctx.beginPath();
      ctx.roundRect(-2.2, -2.6, 4.4, 5.2, 1.2); // knot
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  // A red headband for the final push, tails fluttering behind.
  drawHeadband(ctx, w, h) {
    const a = this.won || this.dead ? 0 : (this.grit - 0.7) / 0.3;
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, a);
    const by = -h * 0.74;
    ctx.save();
    bodyPath(ctx, w, h);
    ctx.clip();
    ctx.fillStyle = '#e8403a';
    ctx.fillRect(-w / 2, by - h * 0.07, w, h * 0.14);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(-w / 2, by - h * 0.07, w, h * 0.035);
    ctx.restore();
    // knot and tails at the back
    const kx = -w * 0.42, flap = Math.sin(this.t * 22);
    ctx.fillStyle = '#e8403a';
    ctx.strokeStyle = '#b8282a';
    ctx.lineWidth = 1;
    for (const [len, lift, phase] of [[17, -3, 0], [14, 4, 1.3]]) {
      const f = Math.sin(this.t * 22 + phase);
      ctx.beginPath();
      ctx.moveTo(kx, by - 2);
      ctx.quadraticCurveTo(kx - len * 0.5, by + lift + f * 4, kx - len, by + lift + flap * 3);
      ctx.lineTo(kx - len + 1, by + lift + 4 + flap * 3);
      ctx.quadraticCurveTo(kx - len * 0.5, by + lift + 5 + f * 4, kx, by + 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(kx, by, 3, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

function bodyPath(ctx, w, h) {
  ctx.beginPath();
  ctx.moveTo(-w / 2, 0);
  ctx.bezierCurveTo(-w / 2, -h * 0.65, -w * 0.32, -h, 0, -h);
  ctx.bezierCurveTo(w * 0.32, -h, w / 2, -h * 0.65, w / 2, 0);
  ctx.quadraticCurveTo(0, 5, -w / 2, 0);
  ctx.closePath();
}
