// Docs: docs/ui/audio.md
// Music, ambience and sound effects, all synthesised with Web Audio (no audio files).
//
//   audio.unlock()            from a user gesture: creates / resumes the AudioContext (safe to repeat)
//   audio.setScene(room, zone) room id 0..30 or a house (100+), zone = a zone name in a stage room (else null); only acts on change
//   audio.sfx(name, {pan, vol}) one-shot effects (unknown names are ignored)
//   audio.setMusic(on) / audio.musicOn   music + ambience on/off (sfx stay on), remembered in localStorage
//   audio.setMuted(on)        everything off (e.g. while logged out)
//
// Each scene is a small "song": a step sequencer (song.play is called once per step) plus optional noise
// beds and random ambience (birds, drips, crickets). A lookahead scheduler (setTimeout ~25 ms) books
// notes ~0.15 s ahead on the AudioContext clock. Scene changes crossfade over FADE seconds. The synth
// graph lives in `Engine`, which works on a live AudioContext or an OfflineAudioContext (for tests:
// `createEngine(offlineCtx)`, `eng.start(key, 0)`, `eng.schedule(seconds)`, then `startRendering()`).

const FADE = 1.5; // crossfade between scenes, seconds
const LOOKAHEAD = 0.15; // how far ahead notes are booked, seconds
const TICK_MS = 25;
const SFX_GAP = 0.04; // at most one of each sfx per 40 ms
const MASTER = 0.85;
const MUSIC = 0.3; // music + ambience bus (each song has its own gain on top)
const SFX = 0.6;

const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
const rand = (a, b) => a + Math.random() * (b - a);
const chance = (p) => Math.random() < p;

// ——— the synth graph ———
export class Engine {
  constructor(ac) {
    this.ac = ac;
    this.master = ac.createGain();
    this.master.gain.value = MASTER;
    const comp = ac.createDynamicsCompressor(); // keeps bursts of sfx from clipping
    comp.threshold.value = -12;
    comp.knee.value = 6;
    comp.ratio.value = 12;
    comp.attack.value = 0.003;
    comp.release.value = 0.25;
    this.master.connect(comp).connect(ac.destination);

    this.music = ac.createGain();
    this.music.gain.value = MUSIC;
    this.music.connect(this.master);
    this.sfxBus = ac.createGain();
    this.sfxBus.gain.value = SFX;
    this.sfxBus.connect(this.master);

    this.reverb = ac.createConvolver();
    this.reverb.buffer = this.impulse(2.2, 0.45);
    const wet = ac.createGain();
    wet.gain.value = 0.8;
    this.reverb.connect(wet).connect(this.master);
    const sfxSend = ac.createGain();
    sfxSend.gain.value = 0.12;
    this.sfxBus.connect(sfxSend).connect(this.reverb);
    this.musicSend = this.gain(MUSIC, this.reverb); // music reverb follows the music level

    const n = Math.floor(ac.sampleRate * 2);
    this.noise = ac.createBuffer(1, n, ac.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;

    this.players = [];
    this.intensity = 0; // 0..1: boss tracks add layers when it's high (an enraged boss)
    this.last = new Map(); // sfx name → last play time
  }

  // A soft stereo reverb tail: decaying, slightly low-passed noise
  impulse(seconds, decay) {
    const ac = this.ac, sr = ac.sampleRate, n = Math.floor(sr * seconds);
    const buf = ac.createBuffer(2, n, sr);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      let lp = 0;
      for (let i = 0; i < n; i++) {
        lp += 0.35 * (Math.random() * 2 - 1 - lp);
        d[i] = lp * Math.exp(-i / (sr * decay)) * (i < sr * 0.01 ? i / (sr * 0.01) : 1);
      }
    }
    return buf;
  }

  gain(v, dest) {
    const g = this.ac.createGain();
    g.gain.value = v;
    if (dest) g.connect(dest);
    return g;
  }

  pan(v, dest) {
    const p = this.ac.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, v));
    p.connect(dest);
    return p;
  }

  // One tonal note. f in Hz. o: type, vol, a (attack), tau (percussive decay) or hold + rel (sustained),
  // cutoff/q (lowpass), detune, unison (cents, adds a 2nd detuned osc), glide (start at f·glide),
  // glideT, partials [[mult, vol]] (extra sines), vib (vibrato depth in cents).
  voice(dest, t, f, o = {}) {
    const ac = this.ac, vol = o.vol ?? 0.2, a = o.a ?? 0.005;
    const g = ac.createGain();
    g.gain.value = 0;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + a);
    let end;
    if (o.hold != null) {
      const rel = o.rel ?? 0.3;
      g.gain.setValueAtTime(vol, t + a + o.hold);
      g.gain.setTargetAtTime(0, t + a + o.hold, rel / 3);
      end = t + a + o.hold + rel * 2;
    } else {
      const tau = o.tau ?? 0.15;
      g.gain.setTargetAtTime(0, t + a, tau);
      end = t + a + tau * 7;
    }
    let input = g;
    if (o.cutoff) {
      const flt = ac.createBiquadFilter();
      flt.type = 'lowpass';
      flt.frequency.value = o.cutoff;
      flt.Q.value = o.q ?? 0.7;
      flt.connect(g);
      input = flt;
    }
    g.connect(dest);
    const oscs = [];
    const add = (type, mult, detune, gainV) => {
      const osc = ac.createOscillator();
      osc.type = type;
      const fr = f * mult;
      if (o.glide) {
        osc.frequency.setValueAtTime(fr * o.glide, t);
        osc.frequency.exponentialRampToValueAtTime(fr, t + (o.glideT ?? 0.04));
      } else osc.frequency.value = fr;
      osc.detune.value = detune;
      if (gainV === 1) osc.connect(input);
      else osc.connect(this.gain(gainV, input));
      oscs.push(osc);
    };
    const type = o.type ?? 'triangle';
    if (o.unison) {
      add(type, 1, (o.detune ?? 0) - o.unison, 0.6);
      add(type, 1, (o.detune ?? 0) + o.unison, 0.6);
    } else add(type, 1, o.detune ?? 0, 1);
    for (const [mult, pv] of o.partials ?? []) add('sine', mult, 0, pv);
    if (o.vib) {
      const lfo = ac.createOscillator(), depth = ac.createGain();
      lfo.frequency.value = o.vibRate ?? 5;
      depth.gain.value = o.vib;
      lfo.connect(depth);
      for (const osc of oscs) depth.connect(osc.detune);
      oscs.push(lfo);
    }
    for (const osc of oscs) {
      osc.start(t);
      osc.stop(end);
    }
    return end;
  }

  // A filtered noise burst. o: type (biquad type), f, q, vol, a, tau, sweep (end freq), sweepT
  noiseHit(dest, t, o = {}) {
    const ac = this.ac, vol = o.vol ?? 0.1, a = o.a ?? 0.002, tau = o.tau ?? 0.05;
    const src = ac.createBufferSource();
    src.buffer = this.noise;
    const flt = ac.createBiquadFilter();
    flt.type = o.type ?? 'bandpass';
    flt.frequency.setValueAtTime(o.f ?? 2000, t);
    if (o.sweep) flt.frequency.exponentialRampToValueAtTime(o.sweep, t + (o.sweepT ?? 0.2));
    flt.Q.value = o.q ?? 1;
    const g = ac.createGain();
    g.gain.value = 0;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + a);
    if (o.hold) g.gain.setValueAtTime(vol, t + a + o.hold);
    g.gain.setTargetAtTime(0, t + a + (o.hold ?? 0), tau);
    src.connect(flt).connect(g).connect(dest);
    const end = t + a + (o.hold ?? 0) + tau * 7;
    if (end - t > 0.45) src.loop = true; // long sounds would run off the end of the 2 s buffer
    src.start(t, Math.random() * 1.5);
    src.stop(end);
  }

  // A soft kick / tom: a sine that drops in pitch
  kick(dest, t, vol = 0.3, f0 = 140, f1 = 48, tau = 0.09) {
    const ac = this.ac, osc = ac.createOscillator(), g = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(f1, t + 0.1);
    g.gain.value = 0;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.004);
    g.gain.setTargetAtTime(0, t + 0.004, tau);
    osc.connect(g).connect(dest);
    osc.start(t);
    osc.stop(t + tau * 7);
  }

  // A looping filtered-noise bed (room tone, air, wind) for a player; stopped when the player ends
  bed(p, type, f, vol, q = 0.7) {
    const ac = this.ac, src = ac.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const flt = ac.createBiquadFilter();
    flt.type = type;
    flt.frequency.value = f;
    flt.Q.value = q;
    src.connect(flt).connect(this.gain(vol, p.c));
    src.start(p.t0);
    p.beds.push(src);
    return flt;
  }

  // A little bird: 2-4 quick chirps
  bird(dest, t, vol = 0.03) {
    const base = rand(2400, 3600), n = 2 + Math.floor(Math.random() * 3), out = this.pan(rand(-0.8, 0.8), dest);
    const up = chance(0.5);
    for (let i = 0; i < n; i++) {
      const tt = t + i * rand(0.08, 0.12), ac = this.ac;
      const osc = ac.createOscillator(), g = ac.createGain();
      osc.type = 'sine';
      const f = base * (1 + (up ? i : -i) * 0.04);
      osc.frequency.setValueAtTime(f * (up ? 0.8 : 1.15), tt);
      osc.frequency.exponentialRampToValueAtTime(f, tt + 0.05);
      g.gain.value = 0;
      g.gain.setValueAtTime(0, tt);
      g.gain.linearRampToValueAtTime(vol, tt + 0.01);
      g.gain.setTargetAtTime(0, tt + 0.03, 0.015);
      osc.connect(g).connect(out);
      osc.start(tt);
      osc.stop(tt + 0.15);
    }
  }

  start(key, t) {
    const song = SONGS[key];
    if (!song) return null;
    const p = new Player(this, key, song, t);
    this.players.push(p);
    return p;
  }

  // Book every note that starts before `until` (AudioContext seconds); drop finished players
  schedule(until) {
    for (const p of this.players) p.schedule(until);
    const now = this.ac.currentTime;
    this.players = this.players.filter((p) => {
      if (p.end != null && now > p.end + 4) {
        p.fade.disconnect();
        return false;
      }
      return true;
    });
  }

  sfx(name, opts = {}, t = this.ac.currentTime) {
    const fn = EFFECTS[name];
    if (!fn) return;
    const key = opts.kind ? `${name}:${opts.kind}` : name; // creature voices are rate-limited per kind
    const last = this.last.get(key);
    if (last !== undefined && t - last < SFX_GAP) return;
    this.last.set(key, t);
    const vol = Math.max(0, Math.min(1, opts.vol ?? 1));
    if (vol < 0.002) return;
    const out = this.gain(vol, this.pan(opts.pan ?? 0, this.sfxBus));
    fn(this, out, t + 0.005, opts);
  }
}

export const createEngine = (ac) => new Engine(ac);

// One scene's music, from t0 until stopped (then it fades out over FADE)
class Player {
  constructor(eng, key, song, t0) {
    this.eng = eng;
    this.key = key;
    this.song = song;
    this.t0 = t0;
    this.t = t0;
    this.n = 0;
    this.end = null;
    this.beds = [];
    this.fade = eng.gain(0, eng.music);
    if (song.send) this.fade.connect(eng.gain(song.send, eng.musicSend));
    this.fade.gain.setValueAtTime(0, t0);
    this.fade.gain.linearRampToValueAtTime(song.gain ?? 1, t0 + FADE);
    this.c = eng.gain(1, this.fade); // centre
    this.l = eng.pan(-0.35, this.fade);
    this.r = eng.pan(0.35, this.fade);
    this.stepDur = (60 * (song.beats ?? 4)) / song.bpm / (song.spb ?? 8);
    song.setup?.(this);
  }

  get spb() {
    return this.song.spb ?? 8;
  }

  // scale degree (1-based, 8 = the octave above) → midi, plus whole octaves
  midi(d, oct = 0) {
    const s = this.song.scale, i = d - 1;
    return this.song.key + s[((i % 7) + 7) % 7] + 12 * (Math.floor(i / 7) + oct);
  }

  f(d, oct = 0) {
    return mtof(this.midi(d, oct));
  }

  chord(bar) {
    const c = this.song.chords;
    return c[bar % c.length];
  }

  // The melody event starting at step s of bar (null if none): {d, len (seconds)}
  mel(bar, s, lines = this.song.mel) {
    const res = this.spb / (this.song.melSteps ?? 8);
    if (s % res) return null;
    const line = lines[bar % lines.length];
    const ev = line?.[s / res];
    return ev ? { d: ev.d, len: ev.len * this.stepDur * res } : null;
  }

  schedule(until) {
    const song = this.song;
    while (this.t < until && (this.end == null || this.t < this.end)) {
      const spb = this.spb, bar = Math.floor(this.n / spb), s = this.n % spb;
      const t = this.t + (s % 2 ? (song.swing ?? 0) * this.stepDur : 0);
      song.play(this, bar, s, t, Math.floor(bar / (song.loop ?? song.chords.length)));
      this.n++;
      this.t += this.stepDur;
    }
  }

  stop(t) {
    if (this.end != null) return;
    this.end = t + FADE;
    const g = this.fade.gain;
    if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(t);
    else {
      g.cancelScheduledValues(t);
      g.setValueAtTime(g.value, t);
    }
    g.linearRampToValueAtTime(0, this.end);
    for (const b of this.beds) b.stop(this.end + 0.05);
  }
}

// ——— melodies ———
// One string per bar, 8 tokens (eighth notes): a scale degree (1..7, 8+ above, 0 and below under),
// '.' rest, '-' holds the previous note.
function melody(...bars) {
  return bars.map((bar) => {
    if (!bar) return null;
    const tok = bar.trim().split(/\s+/), out = new Array(tok.length).fill(null);
    let cur = null;
    tok.forEach((k, i) => {
      if (k === '-') {
        if (cur) cur.len++;
      } else if (k === '.') cur = null;
      else out[i] = cur = { d: Number(k), len: 1 };
    });
    return out;
  });
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const DORIAN = [0, 2, 3, 5, 7, 9, 10];
const HARM_MINOR = [0, 2, 3, 5, 7, 8, 11];
const PHRYGIAN = [0, 1, 3, 5, 7, 8, 10];
const PHRYG_DOM = [0, 1, 4, 5, 7, 8, 10]; // the "exotic" desert scale
const DORIAN_4 = [0, 2, 3, 6, 7, 9, 10]; // dorian with a raised 4th: mysterious

// instrument presets (merged into voice() options)
const MARIMBA = { type: 'sine', a: 0.003, tau: 0.13, partials: [[4, 0.22], [10, 0.04]] };
const GLOCK = { type: 'sine', a: 0.002, tau: 0.32, partials: [[2.76, 0.25], [5.4, 0.08]] };
const PLUCK = { type: 'triangle', a: 0.004, tau: 0.16, cutoff: 2600 };
const BLOOP = { type: 'sine', glide: 0.82, glideT: 0.05, a: 0.004, tau: 0.17, partials: [[2, 0.18]] };

// Held chord on soft detuned triangles
function pad(p, chord, t, len, vol, o = {}) {
  for (const d of chord) {
    p.eng.voice(p.c, t, p.f(d, o.oct ?? 0), {
      type: o.type ?? 'triangle', vol, a: o.a ?? 0.35, hold: len - (o.a ?? 0.35), rel: o.rel ?? 0.6,
      cutoff: o.cutoff ?? 1200, unison: o.unison ?? 6,
    });
  }
}

const hat = (p, t, vol = 0.025, dest = p.r) => p.eng.noiseHit(dest, t, { type: 'highpass', f: 7000, vol, tau: 0.018 });
const shaker = (p, t, vol = 0.03, dest = p.l) => p.eng.noiseHit(dest, t, { f: 5500, q: 1.2, vol, a: 0.008, tau: 0.025 });
const snare = (p, t, vol = 0.07) => {
  p.eng.noiseHit(p.c, t, { f: 1900, q: 0.8, vol, tau: 0.05 });
  p.eng.voice(p.c, t, 190, { type: 'triangle', vol: vol * 0.8, tau: 0.03 });
};
const block = (p, t, f = 820, vol = 0.07, dest = p.l) => p.eng.voice(dest, t, f, { type: 'sine', vol, a: 0.001, tau: 0.025, partials: [[2.5, 0.3]] });
// hand drums: a low "dum" and a slappy "tek"
const dum = (p, t, vol = 0.16, dest = p.c) => p.eng.kick(dest, t, vol, 190, 95, 0.08);
const tek = (p, t, vol = 0.04, dest = p.r) => {
  p.eng.noiseHit(dest, t, { f: 3400, q: 1.4, vol, tau: 0.018 });
  p.eng.voice(dest, t, 640, { type: 'sine', vol: vol * 0.7, a: 0.001, tau: 0.018 });
};
// clockwork: a tick (hi) or tock
const clockTick = (p, t, hi, vol = 0.03, dest = hi ? p.r : p.l) => {
  p.eng.voice(dest, t, hi ? 2600 : 1900, { type: 'sine', vol, a: 0.001, tau: 0.01, partials: [[2.3, 0.4]] });
  p.eng.noiseHit(dest, t, { type: 'highpass', f: 6000, vol: vol * 0.6, tau: 0.005 });
};
// metallic strike (anvil / bell), clank (a factory press)
const anvil = (e, dest, t, f = 1180, vol = 0.05, tau = 0.25) => e.voice(dest, t, f, { type: 'sine', vol, a: 0.001, tau, partials: [[2.76, 0.45], [5.4, 0.22], [8.93, 0.08]] });
const clank = (p, t, vol = 0.06, dest = p.c) => {
  p.eng.noiseHit(dest, t, { type: 'lowpass', f: 1100, vol: vol * 1.2, tau: 0.03 });
  p.eng.voice(dest, t, 310, { type: 'square', vol: vol * 0.5, a: 0.001, tau: 0.035, cutoff: 1400, partials: [[2.7, 0.3], [4.4, 0.15]] });
};
// lava: a low bubble that rises and pops, and the crackle of cooling crust
const lavaBubble = (e, dest, t, vol = 0.03) => {
  const f = rand(80, 200);
  e.voice(dest, t, f, { type: 'sine', glide: 0.55, glideT: 0.09, vol, a: 0.01, tau: 0.06 });
  e.voice(dest, t + 0.1, f * 2.4, { type: 'sine', glide: 0.5, glideT: 0.02, vol: vol * 0.5, tau: 0.02 });
};
const lavaAmbience = (p, t, span, amt = 1) => {
  const e = p.eng;
  if (chance(0.5 * amt)) lavaBubble(e, chance(0.5) ? p.l : p.r, t + rand(0, span), 0.028);
  if (chance(0.35 * amt)) {
    const tt = t + rand(0, span), out = chance(0.5) ? p.l : p.r;
    for (let i = 0; i < 3; i++) e.noiseHit(out, tt + i * rand(0.02, 0.06), { f: rand(2500, 5000), q: 2, vol: 0.012, tau: 0.006 });
  }
};

// ——— the scenes ———
const SONGS = {
  // Slimeville: a bouncy, sunny marimba tune with birds
  village: {
    bpm: 108, spb: 8, swing: 0.12, key: 65, scale: MAJOR, gain: 0.9, send: 0.18, loop: 16,
    chords: [[1, 3, 5], [5, 7, 9], [6, 8, 10], [4, 6, 8], [1, 3, 5], [5, 7, 9], [4, 6, 8], [5, 7, 9],
      [6, 8, 10], [4, 6, 8], [1, 3, 5], [5, 7, 9], [6, 8, 10], [4, 6, 8], [2, 4, 6], [5, 7, 9]],
    mel: melody(
      '1 . 3 5 - 3 5 6', '5 - 4 . 2 . 5 .', '6 . 5 6 8 - 6 .', '4 . 6 4 3 - 2 .',
      '1 . 3 5 - 3 5 6', '7 - 5 . 9 . 7 .', '8 . 6 . 4 6 5 4', '2 - 5 - . . . .',
      '3 . 3 . 6 . 5 3', '4 . 4 . 6 . 8 6', '5 - 3 . 1 . 3 5', '7 - . 5 9 - . .',
      '8 . 8 7 6 . 5 6', '4 . 6 8 10 - 8 .', '9 . 8 6 4 . 6 .', '5 - 7 - 9 - 7 .',
    ),
    setup(p) {
      p.eng.bed(p, 'bandpass', 900, 0.006, 0.5); // a breath of breeze
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), part = pass % 3;
      if (s === 0) pad(p, ch, t, p.stepDur * 8, 0.022);
      // bass: root, octave, fifth bounce
      const bass = { 0: [ch[0], -2], 3: [ch[0], -1], 4: [ch[2], -2], 6: [ch[0], -1] }[s];
      if (bass) e.voice(p.c, t, p.f(bass[0], bass[1]), { type: 'triangle', vol: 0.2, tau: 0.13, cutoff: 900 });
      if (s === 0 || s === 4) e.kick(p.c, t, 0.16, 120, 50, 0.07);
      if (s % 2) shaker(p, t, 0.022);
      if (part === 1 && (s === 2 || s === 6)) block(p, t, 900, 0.04, p.r);
      const m = p.mel(bar, s);
      if (part === 0 && m) e.voice(p.c, t, p.f(m.d), { ...MARIMBA, vol: 0.16 });
      if (part === 1 && m) e.voice(p.r, t, p.f(m.d, 1), { ...GLOCK, vol: 0.07 });
      if (part === 1 && m && s % 4 === 0) e.voice(p.l, t, p.f(m.d), { ...MARIMBA, vol: 0.09 });
      if (part === 2 && s % 2 === 0) { // breather: a gentle arpeggio instead of the tune
        const d = ch[[0, 1, 2, 1][s / 2]];
        e.voice(p.r, t, p.f(d, 1), { ...GLOCK, vol: 0.045 });
      }
      if (s === 0 && chance(0.45)) e.bird(p.c, t + rand(0, p.stepDur * 8), 0.022);
    },
  },

  // Greenhollow Harbour: a slow sea waltz on a wheezy squeezebox, waves washing in and gulls overhead
  harbour: {
    bpm: 84, beats: 3, spb: 6, melSteps: 6, key: 62, scale: MAJOR, gain: 0.75, send: 0.3, loop: 8,
    chords: [[1, 3, 5], [4, 6, 8], [1, 3, 5], [5, 7, 9], [6, 8, 10], [4, 6, 8], [2, 4, 6], [5, 7, 9]],
    mel: melody(
      '5 - 3 . 5 6', '8 - - . 6 .', '5 - 3 . 2 1', '2 - - . . .',
      '3 - 5 . 8 7', '6 - 4 . 6 .', '5 - 4 . 3 2', '5 - - . . .',
    ),
    setup(p) {
      p.eng.bed(p, 'lowpass', 420, 0.012); // the sea's hush
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), part = pass % 2;
      if (s === 0) e.voice(p.c, t, p.f(ch[0], -2), { type: 'triangle', vol: 0.16, tau: 0.3, cutoff: 700 }); // oom
      if (s === 2 || s === 4) for (const d of ch) e.voice(s === 2 ? p.l : p.r, t, p.f(d), { type: 'square', vol: 0.012, a: 0.03, hold: p.stepDur * 1.2, rel: 0.12, cutoff: 1300 }); // pah pah
      const m = p.mel(bar, s);
      if (m && part === 0) e.voice(p.c, t, p.f(m.d, 1), { type: 'square', vol: 0.03, a: 0.04, hold: m.len * 0.85, rel: 0.15, cutoff: 1700, unison: 3, vib: 6, vibRate: 5 });
      if (m && part === 1) e.voice(p.r, t, p.f(m.d, 1), { ...GLOCK, vol: 0.05 });
      // a wave rolls in every other bar, and a gull calls now and then
      if (s === 0 && bar % 2 === 0) e.noiseHit(chance(0.5) ? p.l : p.r, t, { type: 'lowpass', f: 300, sweep: 1400, sweepT: 1.2, vol: 0.05, a: 1.1, hold: 0.2, tau: 0.6 });
      if (s === 3 && chance(0.12)) {
        const o = chance(0.5) ? p.l : p.r;
        for (let i = 0; i < 3; i++) e.voice(o, t + i * 0.16, 1700 - i * 120, { type: 'sine', glide: 1.25, glideT: 0.12, vol: 0.018, a: 0.01, tau: 0.08 });
      }
    },
  },

  // Greenhollow's east cliffs: wide, slow and a little wistful, the first look at how far everything is.
  // Wind in the grass, a high flute line, seabirds, and the sea booming far below.
  cliffs: {
    bpm: 66, spb: 8, key: 64, scale: MAJOR, gain: 0.7, send: 0.45, loop: 8,
    chords: [[1, 3, 5], [5, 7, 9], [6, 8, 10], [4, 6, 8], [1, 3, 5], [3, 5, 7], [4, 6, 8], [5, 7, 9]],
    mel: melody(
      '5 - - - 3 - 5 .', '7 - - - - - . .', '8 - - - 6 - 5 .', '4 - - - - - . .',
      '5 - - - 8 - 9 .', '10 - - - 9 - 7 .', '8 - - - 6 - 4 .', '5 - - - - - . .',
    ),
    setup(p) {
      p.eng.bed(p, 'bandpass', 800, 0.014, 0.4); // the wind over the clifftop
      p.eng.bed(p, 'lowpass', 140, 0.01); // the sea, far below
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), part = pass % 2;
      if (s === 0) pad(p, ch, t, p.stepDur * 8, 0.014, { cutoff: 1100, a: 1.2, rel: 1.4 });
      if (s === 0) e.voice(p.c, t, p.f(ch[0], -2), { type: 'triangle', vol: 0.12, a: 0.2, hold: p.stepDur * 5, rel: 0.8, cutoff: 500 });
      if (s % 2 === 0 && part === 1) e.voice(s % 4 ? p.r : p.l, t, p.f(ch[(s / 2) % 3], 1), { ...PLUCK, vol: 0.05 });
      const m = p.mel(bar, s);
      if (m) e.voice(p.c, t, p.f(m.d, 1), { type: 'sine', vol: 0.045, a: 0.12, hold: m.len * 0.8, rel: 0.5, vib: 5, vibRate: 4.5, partials: [[2, 0.12]] });
      // a wave booming against the cliff foot now and then, and birds riding the wind
      if (s === 0 && bar % 4 === 2) e.noiseHit(p.c, t, { type: 'lowpass', f: 180, sweep: 700, sweepT: 1.6, vol: 0.06, a: 1.4, hold: 0.3, tau: 0.9 });
      if (s === 4 && chance(0.35)) e.bird(chance(0.5) ? p.l : p.r, t + rand(0, p.stepDur * 4), 0.014);
      if (s === 6 && chance(0.1)) {
        const o = chance(0.5) ? p.l : p.r;
        for (let i = 0; i < 2; i++) e.voice(o, t + i * 0.2, 1500 - i * 140, { type: 'sine', glide: 1.3, glideT: 0.14, vol: 0.014, a: 0.01, tau: 0.09 });
      }
    },
  },

  // Icefang Hamlet (docs/places/fjord.md): quiet and cold, the first sad place. A slow fiddle-like line
  // over an open-fifth drone in minor, sparse bells, the lamp-fire crackling and the fjord lapping
  fjord: {
    bpm: 64, beats: 3, spb: 6, melSteps: 6, key: 62, scale: MINOR, gain: 0.72, send: 0.42, loop: 8,
    chords: [[1, 3, 5], [6, 8, 10], [1, 3, 5], [7, 9, 11], [4, 6, 8], [1, 3, 5], [6, 8, 10], [5, 7, 9]],
    mel: melody(
      '5 - - 4 3 .', '3 - - . . .', '5 - 6 5 3 .', '2 - - . . .',
      '4 - - 3 4 5', '5 - 3 . . .', '6 - 5 3 2 .', '1 - - . . .',
    ),
    setup(p) {
      p.eng.bed(p, 'lowpass', 260, 0.012); // the fjord, still water lapping
      p.eng.bed(p, 'bandpass', 1300, 0.007, 0.6); // a thin wind off the ice
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), part = pass % 2;
      if (s === 0) { // the drone: an open fifth, held the whole bar
        e.voice(p.c, t, p.f(1, -2), { type: 'triangle', vol: 0.07, a: 0.6, hold: p.stepDur * 5, rel: 1, cutoff: 600 });
        e.voice(p.c, t, p.f(5, -2), { type: 'triangle', vol: 0.05, a: 0.6, hold: p.stepDur * 5, rel: 1, cutoff: 600 });
        pad(p, ch, t, p.stepDur * 6, 0.011, { type: 'sine', a: 0.9, cutoff: 1000, rel: 1.2 });
      }
      const m = p.mel(bar, s);
      if (m && part === 0) e.voice(p.c, t, p.f(m.d, 1), { type: 'sawtooth', vol: 0.022, a: 0.18, hold: m.len * 0.85, rel: 0.4, cutoff: 1500, vib: 7, vibRate: 5.2 });
      if (m && part === 1 && s % 2 === 0) e.voice(chance(0.5) ? p.l : p.r, t, p.f(m.d, 1), { ...GLOCK, vol: 0.045, tau: 0.5 });
      if (s === 3 && bar % 2 === 1) e.voice(p.r, t, p.f(ch[2], 1), { ...GLOCK, vol: 0.02, tau: 0.6 }); // a far bell
      // the lamp-fire: soft crackles
      if (chance(0.3)) e.noiseHit(chance(0.5) ? p.l : p.r, t + rand(0, p.stepDur), { f: rand(1800, 3200), q: 3, vol: 0.01, tau: 0.01 });
    },
  },

  // Aboard the ferry (the crossing rooms, docs/places/crossings.md): a rolling 6/8 sea shanty in dorian on
  // the squeezebox, the paddle wheel churning under it, waves slapping the hull and the ship's bell
  crossing: {
    bpm: 96, beats: 2, spb: 6, melSteps: 6, key: 62, scale: DORIAN, gain: 0.75, send: 0.3, loop: 8,
    chords: [[1, 3, 5], [7, 9, 11], [1, 3, 5], [4, 6, 8], [1, 3, 5], [7, 9, 11], [3, 5, 7], [5, 7, 9]],
    mel: melody(
      '5 . 5 8 . 7', '6 . 5 4 . .', '5 . 5 8 . 9', '10 . . 8 . .',
      '8 . 7 6 . 5', '4 . 5 7 . .', '5 . 3 2 . 1', '1 . . . . .',
    ),
    setup(p) {
      p.eng.bed(p, 'lowpass', 380, 0.014); // the open sea
      p.eng.bed(p, 'bandpass', 900, 0.008, 0.5); // wind in the rigging
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), part = pass % 2;
      if (s === 0 || s === 3) e.voice(p.c, t, p.f(ch[s ? 2 : 0], -2), { type: 'triangle', vol: 0.15, tau: 0.25, cutoff: 700 });
      if (s === 1 || s === 4) for (const d of ch) e.voice(s === 1 ? p.l : p.r, t, p.f(d), { type: 'square', vol: 0.011, a: 0.03, hold: p.stepDur * 1.2, rel: 0.12, cutoff: 1300 });
      e.noiseHit(p.c, t, { type: 'lowpass', f: 260, vol: s % 3 ? 0.012 : 0.022, a: 0.02, tau: 0.08 }); // the paddle wheel
      const m = p.mel(bar, s);
      if (m && part === 0) e.voice(p.c, t, p.f(m.d, 1), { type: 'square', vol: 0.03, a: 0.04, hold: m.len * 0.85, rel: 0.15, cutoff: 1700, unison: 3, vib: 6, vibRate: 5 });
      if (m && part === 1) e.voice(p.r, t, p.f(m.d, 1), { ...GLOCK, vol: 0.05 });
      if (s === 0 && bar % 2 === 1) e.noiseHit(chance(0.5) ? p.l : p.r, t, { type: 'lowpass', f: 300, sweep: 1200, sweepT: 0.9, vol: 0.05, a: 0.8, hold: 0.15, tau: 0.5 }); // a wave on the hull
      if (s === 0 && bar === 0 && pass % 2 === 0) for (let i = 0; i < 2; i++) e.voice(p.l, t + i * 0.45, 880, { type: 'sine', vol: 0.03, a: 0.002, tau: 0.9, partials: [[2.4, 0.3], [4.1, 0.1]] }); // two bells
    },
  },

  // Forgehold (docs/places/forgehold.md): harsh, grieving, proud. A slow D minor dirge in 4/4 on a low reedy
  // horn over a held drone, the great forge's anvil ringing on the beats (two strikes and a rest, like a smith
  // working), the bellows breathing, and the island's deep rumble under it all
  forgehold: {
    bpm: 66, spb: 4, melSteps: 4, key: 50, scale: MINOR, gain: 0.74, send: 0.4, loop: 8,
    chords: [[1, 3, 5], [6, 8, 10], [4, 6, 8], [5, 7, 9], [1, 3, 5], [7, 9, 11], [6, 8, 10], [5, 7, 9]],
    mel: melody(
      '5 - 4 3', '3 - - .', '4 - 3 2', '2 - - .',
      '5 - 6 5', '4 - 3 .', '2 - 3 2', '1 - - .',
    ),
    setup(p) {
      p.eng.bed(p, 'lowpass', 140, 0.016); // the mountain, rumbling
      p.eng.bed(p, 'bandpass', 500, 0.005, 0.5); // the forge's roar
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), part = pass % 2;
      if (s === 0) {
        e.voice(p.c, t, p.f(1, -2), { type: 'sawtooth', vol: 0.05, a: 0.8, hold: p.stepDur * 3, rel: 1, cutoff: 380 });
        pad(p, ch, t, p.stepDur * 4, 0.012, { type: 'triangle', a: 0.7, cutoff: 800, rel: 1 });
      }
      if (s === 0 || s === 1) anvil(e, s ? p.r : p.l, t, 1100 + (bar % 2) * 60, s ? 0.03 : 0.045, 0.3); // ting, ting, ...
      if (s === 2 && chance(0.5)) e.noiseHit(p.c, t, { type: 'lowpass', f: 400, sweep: 900, sweepT: 0.6, vol: 0.03, a: 0.5, hold: 0.1, tau: 0.4 }); // the bellows
      const m = p.mel(bar, s);
      if (m && part === 0) e.voice(p.c, t, p.f(m.d), { type: 'sawtooth', vol: 0.03, a: 0.12, hold: m.len * 0.85, rel: 0.5, cutoff: 900, vib: 5, vibRate: 4.5 });
      if (m && part === 1) e.voice(p.r, t, p.f(m.d, 1), { ...GLOCK, vol: 0.035, tau: 0.6 });
      if (chance(0.25)) e.noiseHit(chance(0.5) ? p.l : p.r, t + rand(0, p.stepDur), { f: rand(2200, 3800), q: 3, vol: 0.008, tau: 0.01 }); // sparks
    },
  },

  // Aboard the Lodestar (the steam route, docs/places/crossings.md): the ferry's shanty slowed and turned minor,
  // a fiddle-ish line over a fjord drone, the hull creaking, waves, and further south the hiss of steam
  straits: {
    bpm: 84, beats: 2, spb: 6, melSteps: 6, key: 62, scale: MINOR, gain: 0.74, send: 0.35, loop: 8,
    chords: [[1, 3, 5], [7, 9, 11], [6, 8, 10], [5, 7, 9], [1, 3, 5], [4, 6, 8], [6, 8, 10], [5, 7, 9]],
    mel: melody(
      '5 . 5 4 . 3', '2 . . 1 . .', '3 . 4 5 . 6', '5 . . . . .',
      '8 . 7 6 . 5', '4 . 5 3 . .', '2 . 3 2 . 1', '1 . . . . .',
    ),
    setup(p) {
      p.eng.bed(p, 'lowpass', 340, 0.014); // the sea
      p.eng.bed(p, 'highpass', 3000, 0.004); // steam hissing off the water
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), part = pass % 2;
      if (s === 0) {
        e.voice(p.c, t, p.f(1, -2), { type: 'triangle', vol: 0.07, a: 0.4, hold: p.stepDur * 5, rel: 0.8, cutoff: 600 });
        e.voice(p.c, t, p.f(5, -2), { type: 'triangle', vol: 0.045, a: 0.4, hold: p.stepDur * 5, rel: 0.8, cutoff: 600 });
      }
      if (s === 0 || s === 3) e.voice(p.c, t, p.f(ch[s ? 2 : 0], -2), { type: 'triangle', vol: 0.12, tau: 0.3, cutoff: 600 });
      const m = p.mel(bar, s);
      if (m && part === 0) e.voice(p.c, t, p.f(m.d, 1), { type: 'sawtooth', vol: 0.024, a: 0.1, hold: m.len * 0.85, rel: 0.3, cutoff: 1500, vib: 7, vibRate: 5.2 });
      if (m && part === 1) e.voice(p.r, t, p.f(m.d, 1), { ...GLOCK, vol: 0.04 });
      if (s === 0 && bar % 2 === 1) e.noiseHit(chance(0.5) ? p.l : p.r, t, { type: 'lowpass', f: 300, sweep: 1100, sweepT: 0.9, vol: 0.045, a: 0.8, hold: 0.15, tau: 0.5 }); // a wave on the hull
      if (s === 4 && chance(0.3)) e.noiseHit(p.l, t, { type: 'bandpass', f: 220, q: 6, vol: 0.02, a: 0.05, hold: 0.2, tau: 0.3 }); // the hull creaking
      if (s === 2 && bar === 6 && pass % 2 === 1) e.noiseHit(p.r, t, { type: 'highpass', f: 2500, vol: 0.03, a: 0.3, hold: 0.6, tau: 0.6 }); // a geyser, far off
    },
  },

  // Lecture hall: soft maj7 pads and a rare bell; the professor talks over it
  hall: {
    bpm: 56, spb: 8, key: 60, scale: MAJOR, gain: 0.6, send: 0.35,
    chords: [[1, 3, 5, 7], [6, 8, 10, 12], [4, 6, 8, 10], [5, 8, 9, 12]],
    setup(p) {
      p.eng.bed(p, 'lowpass', 350, 0.012);
    },
    play(p, bar, s, t) {
      const ch = p.chord(bar);
      if (s === 0) pad(p, ch, t, p.stepDur * 8, 0.014, { a: 1.2, rel: 1.5, cutoff: 800, type: 'sine' });
      if (s === 0) p.eng.voice(p.c, t, p.f(ch[0], -2), { type: 'sine', vol: 0.05, a: 0.5, hold: p.stepDur * 6, rel: 1 });
      if ((s === 2 || s === 6) && chance(0.25)) {
        p.eng.voice(chance(0.5) ? p.l : p.r, t, p.f(ch[Math.floor(Math.random() * ch.length)], 1), { ...GLOCK, vol: 0.022, tau: 0.5 });
      }
    },
  },

  // Music House: the floor is the instrument, so just a whisper of room tone
  piano: {
    bpm: 60, spb: 4, key: 60, scale: MAJOR, gain: 1, send: 0, chords: [[1]],
    setup(p) {
      p.eng.bed(p, 'lowpass', 220, 0.012);
    },
    play() {},
  },

  // Grand Museum: slow strings, harp arpeggios and bells in a big hall
  museum: {
    bpm: 60, spb: 8, key: 62, scale: MINOR, gain: 0.6, send: 0.6, loop: 8,
    chords: [[1, 3, 5], [6, 8, 10], [3, 5, 7], [7, 9, 11], [1, 3, 5], [4, 6, 8], [6, 8, 10], [5, 7, 9]],
    mel: melody(
      '5 - - - 3 - - -', '6 - - - 8 - - -', '7 - - - 5 - 3 -', '4 - - - 2 - - -',
      '5 - - - 8 - 7 -', '6 - - - 4 - - -', '3 - 4 - 5 - - -', '5 - - - - - . .',
    ),
    setup(p) {
      p.eng.bed(p, 'highpass', 4000, 0.004);
      p.eng.bed(p, 'lowpass', 160, 0.015);
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), part = pass % 3;
      if (s === 0) {
        pad(p, ch, t, p.stepDur * 8, 0.016, { type: 'sawtooth', a: 1.2, rel: 1.6, cutoff: 900, unison: 9 });
        e.voice(p.c, t, p.f(ch[0], -2), { type: 'sine', vol: 0.09, a: 0.6, hold: p.stepDur * 7, rel: 1.2 });
      }
      // harp: rising chord tones on beats 1-2 of some bars
      if (s < 4 && (bar % 2 === 0 || part === 2)) {
        const d = [ch[0], ch[1], ch[2], ch[0] + 7][s];
        e.voice(s % 2 ? p.r : p.l, t, p.f(d, part === 2 ? 1 : 0), { ...PLUCK, vol: 0.06, tau: 0.45, cutoff: 2200 });
      }
      const m = p.mel(bar, s);
      if (m && part === 0) e.voice(p.c, t, p.f(m.d, 1), { ...GLOCK, vol: 0.06, tau: 0.8 });
      if (m && part === 1) {
        e.voice(p.c, t, p.f(m.d), { type: 'triangle', vol: 0.05, a: 0.25, hold: m.len * 0.8, rel: 0.8, cutoff: 1600, vib: 8, vibRate: 4.5 });
      }
    },
  },

  // Tutoring room: a quiet music-box arpeggio over soft chords
  tutor: {
    bpm: 84, spb: 8, key: 67, scale: MAJOR, gain: 0.65, send: 0.25,
    chords: [[1, 3, 5, 7], [3, 5, 7, 9], [6, 8, 10, 12], [4, 6, 8, 10], [1, 3, 5, 7], [3, 5, 7, 9], [2, 4, 6, 8], [5, 7, 9, 11]],
    setup(p) {
      p.eng.bed(p, 'lowpass', 400, 0.006);
    },
    play(p, bar, s, t) {
      const e = p.eng, ch = p.chord(bar);
      if (s === 0) pad(p, ch.slice(0, 3), t, p.stepDur * 8, 0.012, { a: 0.8, rel: 1, cutoff: 900, type: 'sine' });
      if (s === 0 || s === 4) e.voice(p.c, t, p.f(ch[0], -2), { type: 'triangle', vol: 0.09, tau: 0.3, cutoff: 600 });
      const d = ch[[0, 1, 2, 3, 2, 1, 2, 3][s]];
      if (!(bar % 4 === 3 && s > 4)) e.voice(s % 2 ? p.r : p.l, t, p.f(d), { ...GLOCK, vol: 0.035, tau: 0.25 });
      if (s % 2 && bar % 8 >= 4) hat(p, t, 0.008);
    },
  },

  // Sprout Meadow: an upbeat, adventurous chip-ish tune
  meadow: {
    bpm: 138, spb: 8, key: 62, scale: MAJOR, gain: 0.8, send: 0.15, loop: 16,
    chords: [[1, 3, 5], [4, 6, 8], [6, 8, 10], [5, 7, 9], [1, 3, 5], [4, 6, 8], [5, 7, 9], [1, 3, 5],
      [4, 6, 8], [5, 7, 9], [3, 5, 7], [6, 8, 10], [2, 4, 6], [5, 7, 9], [1, 3, 5], [1, 3, 5]],
    mel: melody(
      '1 . 1 3 5 . 3 .', '4 . 6 . 8 . 6 4', '3 . 6 . 5 3 1 .', '2 - 5 - 7 - 5 .',
      '1 . 1 3 5 . 8 .', '8 - 6 . 4 . 6 8', '9 . 7 . 5 . 7 9', '8 - - . 5 . 8 .',
      '6 . 6 . 8 . 6 .', '7 . 7 . 9 . 7 .', '7 . 5 . 3 . 5 .', '6 - 8 - 10 - - .',
      '9 . 8 . 6 . 4 .', '5 . 7 . 9 . 11 .', '10 - 8 . 5 . 3 .', '1 - - - . . . .',
    ),
    setup(p) {
      p.eng.bed(p, 'bandpass', 700, 0.006, 0.5);
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), part = pass % 3;
      if (s === 0) pad(p, ch, t, p.stepDur * 8, 0.016, { cutoff: 1500 });
      const bd = [ch[0], ch[0], ch[0] + 7, ch[0], ch[2], ch[0], ch[0] + 7, ch[2]][s];
      e.voice(p.c, t, p.f(bd, -2), { type: 'square', vol: 0.07, tau: 0.07, cutoff: 600 });
      if (s === 0 || s === 4 || (s === 7 && bar % 2)) e.kick(p.c, t, 0.2, 130, 50, 0.07);
      if (s === 2 || s === 6) snare(p, t, 0.05);
      if (s % 2) hat(p, t, 0.02);
      const m = p.mel(bar, s);
      if (m && part !== 2) {
        e.voice(p.c, t, p.f(m.d), { type: 'square', vol: 0.05, a: 0.006, hold: Math.max(0.05, m.len * 0.75), rel: 0.08, cutoff: 2400 });
        if (part === 1) e.voice(p.r, t, p.f(m.d, 1), { ...GLOCK, vol: 0.04 });
      }
      if (part === 2 && s % 2 === 0) e.voice(p.r, t, p.f(ch[[0, 1, 2, 1][s / 2]], 1), { ...MARIMBA, vol: 0.1 });
      if (s === 0 && chance(0.3)) e.bird(p.c, t + rand(0, p.stepDur * 8), 0.018);
    },
  },

  // Mushroom Grove: swung, mysterious, bouncy bloops and woodblocks, with drips
  grove: {
    bpm: 104, spb: 8, swing: 0.2, key: 64, scale: DORIAN, gain: 0.85, send: 0.35, loop: 8,
    chords: [[1, 3, 5], [4, 6, 8], [1, 3, 5], [4, 6, 8], [7, 9, 11], [4, 6, 8], [1, 3, 5], [5, 7, 9]],
    mel: melody(
      '1 . 3 . 5 . 6 5', '6 . . 4 6 . 8 .', '5 . 3 . 2 . 1 .', '4 . 6 . 4 . 3 2',
      '7 . 9 . 11 . 9 .', '8 . 6 . 4 . 6 .', '5 . 6 . 7 . 8 .', '9 - 7 - 5 - . .',
    ),
    setup(p) {
      p.eng.bed(p, 'lowpass', 250, 0.01);
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), part = pass % 4;
      if (s === 0) pad(p, ch, t, p.stepDur * 8, 0.014, { type: 'sine', a: 0.6, cutoff: 1000, rel: 0.8 });
      const bass = { 0: [ch[0], -2], 2: [ch[2], -2], 3: [ch[0], -1], 5: [ch[0], -2], 6: [ch[2], -2] }[s];
      if (bass) e.voice(p.c, t, p.f(bass[0], bass[1]), { ...MARIMBA, vol: 0.2, tau: 0.1 });
      if (s === 0) e.kick(p.c, t, 0.15, 110, 50, 0.06);
      if (s === 2 || s === 6) block(p, t, s === 2 ? 760 : 1020, 0.05);
      if (s % 2) hat(p, t, 0.012);
      const m = p.mel(bar, s);
      if (m && part !== 2) {
        e.voice(part === 1 ? p.r : p.c, t, p.f(m.d, part === 1 ? 1 : 0), part === 1 ? { ...GLOCK, vol: 0.05 } : { ...BLOOP, vol: 0.12 });
      }
      if (part === 2 && s % 2 === 0) e.voice(p.l, t, p.f(ch[[0, 2, 1, 2][s / 2]], 1), { ...BLOOP, vol: 0.06 });
      if (s === 0 && chance(0.35)) { // a drip in the cave-ish quiet
        const tt = t + rand(0, p.stepDur * 8), f = rand(1300, 2000);
        e.voice(chance(0.5) ? p.l : p.r, tt, f, { type: 'sine', glide: 1.6, glideT: 0.03, vol: 0.025, tau: 0.05 });
      }
    },
  },

  // Bramble Woods: harmonic minor, driving sixteenth-note bass, still soft-edged
  bramble: {
    bpm: 132, spb: 16, key: 57, scale: HARM_MINOR, gain: 0.8, send: 0.2, loop: 8,
    chords: [[1, 3, 5], [6, 8, 10], [4, 6, 8], [5, 7, 9], [1, 3, 5], [6, 8, 10], [4, 6, 8], [5, 7, 9]],
    mel: melody(
      '5 . 5 6 5 . 3 .', '6 . 8 . 10 . 8 .', '8 . 6 . 4 . 6 .', '7 - 5 - 7 - 9 .',
      '8 . 7 . 8 . 10 .', '10 . 8 . 6 . 8 .', '11 . 10 . 8 . 6 .', '7 - - - 5 - - .',
    ),
    setup(p) {
      p.eng.bed(p, 'lowpass', 120, 0.02);
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), part = pass % 4;
      if (s === 0) pad(p, ch, t, p.stepDur * 16, 0.013, { type: 'sawtooth', a: 0.5, cutoff: 700, unison: 8 });
      const bd = [ch[0], ch[0], ch[0] + 7, ch[0]][s % 4];
      e.voice(p.c, t, p.f(s % 8 === 6 ? ch[2] : bd, -2), { type: 'square', vol: s % 4 === 0 ? 0.075 : 0.05, tau: 0.045, cutoff: 520 });
      if (s === 0 || s === 6 || s === 8 || (s === 14 && bar % 2)) e.kick(p.c, t, 0.22, 120, 45, 0.08);
      if (s === 4 || s === 12) snare(p, t, 0.06);
      if (s % 4 === 2) hat(p, t, 0.022);
      if (part === 3 && s % 2) shaker(p, t, 0.018);
      if ((s === 10 || s === 11) && bar % 4 === 3) e.kick(p.r, t, 0.12, 220, 140, 0.06); // little tom fill
      const m = p.mel(bar, s);
      if (m && part !== 2) e.voice(p.c, t, p.f(m.d), { ...PLUCK, vol: 0.11, tau: 0.12, cutoff: 2000, partials: [[2, 0.15]] });
      if (m && part === 1) e.voice(p.l, t, p.f(m.d, 1), { ...MARIMBA, vol: 0.05 });
      if (part === 2 && s % 4 === 0) e.voice(p.r, t, p.f(ch[[0, 1, 2, 1][s / 4]], 1), { ...PLUCK, vol: 0.06 });
      if (s % 8 === 0 && chance(0.4)) { // crickets
        const tt = t + rand(0, p.stepDur * 8), out = chance(0.5) ? p.l : p.r;
        for (let i = 0; i < 4; i++) e.voice(out, tt + i * 0.045, 4400, { type: 'sine', vol: 0.006, a: 0.005, tau: 0.008 });
      }
    },
  },
  // ——— boss dens ———
  // Sprout King: bouncy, cheeky mixolydian romp
  king: {
    bpm: 150, spb: 8, key: 67, scale: [0, 2, 4, 5, 7, 9, 10], gain: 0.8, send: 0.15, loop: 8,
    chords: [[1, 3, 5], [7, 9, 11], [4, 6, 8], [1, 3, 5], [1, 3, 5], [7, 9, 11], [5, 7, 9], [5, 7, 9]],
    mel: melody(
      '1 1 . 5 . 4 3 .', '7 . 7 . 9 . 7 6', '4 . 6 . 8 . 6 4', '5 - 3 - 1 . . 5',
      '1 1 . 5 . 4 3 .', '7 . 7 . 9 . 11 9', '5 . 7 . 9 . 7 5', '9 - 9 - 9 . . .',
    ),
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), hot = e.intensity > 0.5;
      if (s === 0) pad(p, ch, t, p.stepDur * 8, 0.014, { type: 'square', a: 0.05, cutoff: 1100, rel: 0.2 });
      const bd = [ch[0], ch[0] + 7, ch[0], ch[0] + 7, ch[2], ch[0] + 7, ch[0], ch[2]][s];
      e.voice(p.c, t, p.f(bd, -2), { type: 'triangle', vol: 0.2, tau: 0.08, cutoff: 900 });
      if (s % 2 === 0) e.kick(p.c, t, 0.18, 140, 50, 0.06);
      if (s === 2 || s === 6) snare(p, t, 0.06);
      if (s % 2 || hot) hat(p, t, s % 2 ? 0.022 : 0.014);
      if (hot && s === 7) snare(p, t, 0.035);
      const m = p.mel(bar, s);
      if (m) {
        e.voice(p.c, t, p.f(m.d), { ...BLOOP, vol: 0.13, tau: 0.12 });
        if (pass % 2 || hot) e.voice(p.r, t, p.f(m.d, 1), { ...GLOCK, vol: hot ? 0.06 : 0.04 });
      } else if (s === 7 && bar % 2) e.voice(p.l, t, p.f(ch[2], 1), { type: 'sine', glide: 0.7, glideT: 0.06, vol: 0.06, tau: 0.05 }); // a cheeky blip
    },
  },

  // Mother Mushroom: an ominous little waltz in C harmonic minor
  mother: {
    bpm: 132, beats: 3, spb: 6, melSteps: 6, key: 60, scale: HARM_MINOR, gain: 0.8, send: 0.35, loop: 8,
    chords: [[1, 3, 5], [4, 6, 8], [5, 7, 9], [1, 3, 5], [6, 8, 10], [4, 6, 8], [5, 7, 9], [5, 7, 9]],
    mel: melody(
      '5 - - 3 4 5', '6 - - 8 - 6', '7 - 9 - 7 5', '8 - - - . .',
      '10 - - 8 - 6', '8 - - 6 - 4', '5 - 7 - 9 -', '7 - - - 5 .',
    ),
    setup(p) {
      p.eng.bed(p, 'lowpass', 140, 0.015);
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), hot = e.intensity > 0.5;
      if (s === 0) {
        pad(p, ch, t, p.stepDur * 6, 0.014, { type: 'sawtooth', a: 0.3, cutoff: 650, unison: 10 });
        e.voice(p.c, t, p.f(ch[0], -2), { type: 'triangle', vol: 0.24, tau: 0.25, cutoff: 700 }); // oom
        e.kick(p.c, t, 0.2, 110, 45, 0.09);
      }
      if (s === 2 || s === 4) for (const d of ch) e.voice(s === 2 ? p.l : p.r, t, p.f(d), { ...MARIMBA, vol: 0.05, tau: 0.08 }); // pah pah
      if (hot && (s === 2 || s === 4)) e.kick(p.r, t, 0.1, 180, 110, 0.05);
      if (hot && s % 2) hat(p, t, 0.015);
      if (bar % 4 === 3 && s >= 3) e.kick(p.l, t, 0.08 + s * 0.015, 150, 95, 0.06); // timpani-ish roll into the next phrase
      const m = p.mel(bar, s);
      if (m) {
        if (pass % 2 === 0) e.voice(p.c, t, p.f(m.d), { ...BLOOP, vol: 0.12, tau: 0.2 });
        else e.voice(p.c, t, p.f(m.d), { type: 'triangle', vol: 0.07, a: 0.04, hold: m.len * 0.7, rel: 0.25, cutoff: 1800, vib: 14, vibRate: 5 });
        if (hot) e.voice(p.r, t, p.f(m.d, 1), { ...GLOCK, vol: 0.045 });
      }
      if (s === 0 && chance(0.25)) {
        const tt = t + rand(0, p.stepDur * 6);
        e.voice(chance(0.5) ? p.l : p.r, tt, rand(1300, 1900), { type: 'sine', glide: 1.6, glideT: 0.03, vol: 0.02, tau: 0.05 });
      }
    },
  },

  // Bramble Behemoth: E harmonic minor, the most driving track (still soft instruments)
  behemoth: {
    bpm: 156, spb: 16, key: 64, scale: HARM_MINOR, gain: 0.8, send: 0.18, loop: 8,
    chords: [[1, 3, 5], [6, 8, 10], [4, 6, 8], [5, 7, 9], [1, 3, 5], [6, 8, 10], [5, 7, 9], [5, 7, 9]],
    mel: melody(
      '1 . 3 . 5 . 6 5', '8 . 6 . 10 - 8 .', '6 . 4 . 8 . 6 4', '7 - 5 - 7 9 7 .',
      '8 . 8 7 8 . 10 .', '10 . 8 . 6 . 3 .', '7 . 9 . 7 . 5 .', '7 - - - 8 - 7 -',
    ),
    setup(p) {
      p.eng.bed(p, 'lowpass', 110, 0.02);
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), hot = e.intensity > 0.5;
      if (s === 0) pad(p, ch, t, p.stepDur * 16, 0.012, { type: 'sawtooth', a: 0.2, cutoff: 800, unison: 9 });
      const bd = s % 8 === 6 ? ch[2] : [ch[0], ch[0], ch[0] + 7, ch[0]][s % 4];
      e.voice(p.c, t, p.f(bd, -2), { type: 'square', vol: s % 4 === 0 ? 0.08 : 0.055, tau: 0.04, cutoff: 560 });
      if (s % 4 === 0 || s === 10 || (hot && s % 2 === 0)) e.kick(p.c, t, 0.22, 125, 45, 0.07);
      if (s === 4 || s === 12) snare(p, t, 0.07);
      if (s % 2 === 0) hat(p, t, s % 4 ? 0.024 : 0.014);
      if (hot && s % 2) shaker(p, t, 0.02);
      if (bar % 2 === 1 && s >= 12) e.kick(s % 2 ? p.l : p.r, t, 0.12, 260 - s * 8, 120, 0.05); // tom run
      const m = p.mel(bar, s);
      if (m && pass % 4 !== 3) {
        e.voice(p.c, t, p.f(m.d), { ...PLUCK, vol: 0.12, tau: 0.11, cutoff: 2200, partials: [[2, 0.15]] });
        if (hot || pass % 2) e.voice(p.l, t, p.f(m.d, 1), { type: 'square', vol: 0.035, a: 0.005, hold: Math.max(0.04, m.len * 0.6), rel: 0.05, cutoff: 2600 });
      }
      if (pass % 4 === 3 && s % 4 === 0) e.voice(p.r, t, p.f(ch[[0, 1, 2, 1][s / 4]], 1), { ...MARIMBA, vol: 0.09 });
    },
  },
  // ——— Greenhollow's branches (island depth G1) ———
  // Willowmere (docs/places/willowmere.md): a lazy riverside tune in G, plucked strings over a soft pad, a
  // breathy flute line, the brook babbling, the mill wheel's slow creak and frogs croaking in the reeds
  willowmere: {
    bpm: 92, spb: 8, swing: 0.1, key: 67, scale: MAJOR, gain: 0.78, send: 0.3, loop: 8,
    chords: [[1, 3, 5], [4, 6, 8], [1, 3, 5], [5, 7, 9], [6, 8, 10], [4, 6, 8], [2, 4, 6], [5, 7, 9]],
    mel: melody(
      '3 - 5 . 6 5 3 .', '4 - 6 . 8 - 6 .', '5 . 3 . 2 3 1 .', '2 - - . 5 - . .',
      '6 - 8 . 10 - 8 .', '6 . 4 . 6 8 6 .', '4 . 6 . 5 4 2 .', '5 - - - . . . .',
    ),
    setup(p) {
      p.eng.bed(p, 'bandpass', 1500, 0.006, 0.8); // the brook babbling
      p.eng.bed(p, 'lowpass', 300, 0.008); // the millpond's hush
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), part = pass % 2;
      if (s === 0) pad(p, ch, t, p.stepDur * 8, 0.016, { a: 0.6, cutoff: 1000 });
      const bass = { 0: [ch[0], -2], 4: [ch[2], -2] }[s];
      if (bass) e.voice(p.c, t, p.f(bass[0], bass[1]), { type: 'triangle', vol: 0.15, tau: 0.25, cutoff: 700 });
      if (s % 2 === 0) e.voice(s % 4 ? p.r : p.l, t, p.f(ch[(s / 2) % 3], 1), { ...PLUCK, vol: 0.05 });
      const m = p.mel(bar, s);
      if (m && part === 0) e.voice(p.c, t, p.f(m.d, 1), { type: 'sine', vol: 0.05, a: 0.06, hold: m.len * 0.8, rel: 0.25, vib: 5, vibRate: 5, partials: [[2, 0.1]] });
      if (m && part === 1) e.voice(p.r, t, p.f(m.d), { ...MARIMBA, vol: 0.12 });
      // the wheel creaks round once every two bars; frogs and birds now and then
      if (s === 0 && bar % 2 === 0) e.voice(p.l, t, 180, { type: 'sawtooth', glide: 1.15, glideT: 0.3, vol: 0.012, a: 0.1, hold: 0.2, rel: 0.2, cutoff: 600 });
      if (s === 5 && chance(0.25)) {
        const o = chance(0.5) ? p.l : p.r;
        for (let i = 0; i < 2; i++) e.voice(o, t + i * 0.12, 220 - i * 20, { type: 'square', glide: 0.8, glideT: 0.06, vol: 0.014, a: 0.005, tau: 0.05, cutoff: 900 });
      }
      if (s === 2 && chance(0.3)) e.bird(chance(0.5) ? p.l : p.r, t + rand(0, p.stepDur * 4), 0.016);
    },
  },

  // Saltspray Coves (docs/places/coves.md): a bright, breezy shore tune in A, a ukulele-ish strum, a tin
  // whistle on top, surf rolling in and gulls crying over the stacks
  coves: {
    bpm: 112, spb: 8, swing: 0.14, key: 69, scale: MAJOR, gain: 0.78, send: 0.25, loop: 8,
    chords: [[1, 3, 5], [5, 7, 9], [6, 8, 10], [4, 6, 8], [1, 3, 5], [2, 4, 6], [4, 6, 8], [5, 7, 9]],
    mel: melody(
      '5 . 5 6 5 . 3 .', '5 . 4 . 2 . . .', '3 . 3 5 6 . 8 .', '6 - 4 . . . . .',
      '5 . 8 . 7 6 5 .', '4 . 6 . 4 2 . .', '6 . 5 4 3 . 2 .', '1 - - - . . . .',
    ),
    setup(p) {
      p.eng.bed(p, 'lowpass', 500, 0.013); // the sea
      p.eng.bed(p, 'bandpass', 2600, 0.005, 0.5); // spray and breeze
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), part = pass % 2;
      if (s === 0) pad(p, ch, t, p.stepDur * 8, 0.012, { cutoff: 1400 });
      if (s === 0 || s === 4) e.voice(p.c, t, p.f(ch[0], -2), { type: 'triangle', vol: 0.16, tau: 0.16, cutoff: 800 });
      if (s === 2 || s === 6 || s === 7) for (const d of ch) e.voice(s === 6 ? p.l : p.r, t, p.f(d, 1), { ...PLUCK, vol: 0.026, tau: 0.09 }); // strum
      if (s % 2) shaker(p, t, 0.016);
      const m = p.mel(bar, s);
      if (m && part === 0) e.voice(p.c, t, p.f(m.d, 1), { type: 'sine', vol: 0.05, a: 0.02, hold: m.len * 0.7, rel: 0.1, vib: 6, vibRate: 6, partials: [[2, 0.2], [3, 0.06]] });
      if (m && part === 1) e.voice(p.r, t, p.f(m.d, 1), { ...GLOCK, vol: 0.05 });
      if (s === 0 && bar % 2 === 0) e.noiseHit(chance(0.5) ? p.l : p.r, t, { type: 'lowpass', f: 300, sweep: 1500, sweepT: 1.1, vol: 0.05, a: 1, hold: 0.2, tau: 0.6 });
      if (s === 3 && chance(0.18)) {
        const o = chance(0.5) ? p.l : p.r;
        for (let i = 0; i < 3; i++) e.voice(o, t + i * 0.15, 1800 - i * 130, { type: 'sine', glide: 1.25, glideT: 0.11, vol: 0.017, a: 0.01, tau: 0.08 });
      }
    },
  },

  // The Tidemother's Hoard: a heaving 6/8 in D dorian, low strings rolling like a swell, a clattering
  // percussion of shells and bottles, and the surge of the tide every few bars
  tidemother: {
    bpm: 138, beats: 2, spb: 12, melSteps: 6, key: 62, scale: DORIAN, gain: 0.8, send: 0.22, loop: 8,
    chords: [[1, 3, 5], [7, 9, 11], [4, 6, 8], [1, 3, 5], [3, 5, 7], [7, 9, 11], [4, 6, 8], [5, 7, 9]],
    mel: melody(
      '5 . 6 8 . 6', '7 . 5 4 . .', '6 . 8 10 . 8', '9 - - 8 . .',
      '8 . 7 6 . 5', '4 . 5 7 . .', '6 . 5 4 . 2', '1 - - . . .',
    ),
    setup(p) {
      p.eng.bed(p, 'lowpass', 160, 0.018); // the swell in the cave
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), hot = e.intensity > 0.5;
      if (s === 0) pad(p, ch, t, p.stepDur * 12, 0.012, { type: 'sawtooth', a: 0.3, cutoff: 700, unison: 8 });
      if (s % 3 === 0) e.voice(p.c, t, p.f(s % 6 ? ch[2] : ch[0], -2), { type: 'square', vol: s % 6 ? 0.05 : 0.08, tau: 0.06, cutoff: 520 });
      if (s === 0 || s === 6 || (hot && s % 3 === 0)) e.kick(p.c, t, 0.22, 120, 45, 0.08);
      if (s === 3 || s === 9) snare(p, t, 0.06);
      if (s % 2 === 1) block(p, t, 1200 + (s % 4) * 200, 0.025, s % 4 === 1 ? p.l : p.r); // shells clattering
      const m = p.mel(bar, s);
      if (m) {
        e.voice(p.c, t, p.f(m.d), { ...PLUCK, vol: 0.11, tau: 0.13, cutoff: 2000, partials: [[2, 0.12]] });
        if (hot || pass % 2) e.voice(p.r, t, p.f(m.d, 1), { type: 'square', vol: 0.03, a: 0.005, hold: Math.max(0.04, m.len * 0.6), rel: 0.05, cutoff: 2400 });
      }
      if (s === 0 && bar % 4 === 3) e.noiseHit(p.c, t, { type: 'lowpass', f: 200, sweep: 1200, sweepT: 1.4, vol: 0.08, a: 1.2, hold: 0.2, tau: 0.8 }); // the tide surging
    },
  },
  // ——— island depth G2 (docs/places/deep.md) ———
  // The Mycelium Deep: a hushed, curious cave tune in D dorian with a raised 4th, a music-box line over a
  // low hum (the threads), soft marimba, water dripping in the dark and now and then a glassy chime
  deep: {
    bpm: 84, spb: 8, swing: 0.08, key: 62, scale: DORIAN_4, gain: 0.8, send: 0.38, loop: 8,
    chords: [[1, 3, 5], [7, 9, 11], [4, 6, 8], [1, 3, 5], [6, 8, 10], [4, 6, 8], [2, 4, 6], [5, 7, 9]],
    mel: melody(
      '5 . 4 . 3 . 5 .', '6 - 5 . . . . .', '4 . 6 . 8 . 6 .', '5 - - . . . . .',
      '3 . 5 . 6 . 8 .', '9 - 8 . 6 . . .', '7 . 6 . 4 . 2 .', '1 - - - . . . .',
    ),
    setup(p) {
      p.eng.bed(p, 'lowpass', 140, 0.016); // the threads' low hum
      p.eng.bed(p, 'bandpass', 900, 0.004, 0.6); // cave air
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), part = pass % 2;
      if (s === 0) pad(p, ch, t, p.stepDur * 8, 0.014, { a: 0.8, cutoff: 800 });
      if (s === 0 || s === 4) e.voice(p.c, t, p.f(ch[0], -2), { type: 'sine', vol: 0.15, a: 0.02, tau: 0.4 });
      if (s % 2 === 1) e.voice(s % 4 === 1 ? p.l : p.r, t, p.f(ch[(s >> 1) % 3], 1), { ...MARIMBA, vol: 0.045 });
      const m = p.mel(bar, s);
      if (m && part === 0) e.voice(p.c, t, p.f(m.d, 1), { ...GLOCK, vol: 0.06 });
      if (m && part === 1) e.voice(p.r, t, p.f(m.d), { type: 'sine', vol: 0.05, a: 0.05, hold: m.len * 0.7, rel: 0.3, vib: 4, vibRate: 5 });
      // drips, and a glassy chime from somewhere down a tunnel
      if (chance(0.22)) {
        const o = chance(0.5) ? p.l : p.r, tt = t + rand(0, p.stepDur);
        e.voice(o, tt, rand(1600, 2600), { type: 'sine', glide: 1.4, glideT: 0.04, vol: 0.016, a: 0.002, tau: 0.05 });
      }
      if (s === 6 && bar % 4 === 1) e.voice(p.l, t, p.f(ch[2], 2), { ...GLOCK, vol: 0.025, tau: 0.8 });
    },
  },

  // The Old Oak Canopy (docs/places/canopy.md): a sunny, swaying 3/4 in F up in the treetops, a recorder-ish
  // tune over a plucked lute and a soft woodblock, birdsong all round, leaves rustling and a woodpecker now
  // and then
  canopy: {
    bpm: 132, beats: 3, spb: 6, melSteps: 6, swing: 0.06, key: 65, scale: MAJOR, gain: 0.78, send: 0.32, loop: 8,
    chords: [[1, 3, 5], [4, 6, 8], [6, 8, 10], [5, 7, 9], [1, 3, 5], [2, 4, 6], [4, 6, 8], [5, 7, 9]],
    mel: melody(
      '5 - 6 5 3 .', '4 - - 6 - .', '8 - 7 6 5 .', '5 - - . . .',
      '3 - 5 8 - 6', '5 - 4 2 - .', '4 - 6 5 4 2', '1 - - . . .',
    ),
    setup(p) {
      p.eng.bed(p, 'bandpass', 3200, 0.006, 0.6); // leaves rustling
      p.eng.bed(p, 'lowpass', 400, 0.006); // the wind in the boughs
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), part = pass % 2;
      if (s === 0) pad(p, ch, t, p.stepDur * 6, 0.013, { a: 0.5, cutoff: 1200 });
      if (s === 0) e.voice(p.c, t, p.f(ch[0], -2), { type: 'triangle', vol: 0.15, tau: 0.3, cutoff: 700 });
      if (s === 2 || s === 4) for (const d of [ch[1], ch[2]]) e.voice(s === 2 ? p.l : p.r, t, p.f(d, 0), { ...PLUCK, vol: 0.03, tau: 0.12 });
      if (s === 3 && chance(0.6)) e.voice(p.r, t, 1400, { type: 'sine', vol: 0.02, a: 0.001, tau: 0.03 }); // woodblock
      const m = p.mel(bar, s);
      if (m && part === 0) e.voice(p.c, t, p.f(m.d, 1), { type: 'sine', vol: 0.05, a: 0.04, hold: m.len * 0.75, rel: 0.15, vib: 5, vibRate: 5.5, partials: [[2, 0.16], [3, 0.05]] });
      if (m && part === 1) e.voice(p.l, t, p.f(m.d, 1), { ...MARIMBA, vol: 0.1 });
      if (s === 1 && chance(0.35)) e.bird(chance(0.5) ? p.l : p.r, t + rand(0, p.stepDur * 3), 0.018);
      if (s === 5 && bar % 4 === 3 && chance(0.4)) for (let i = 0; i < 6; i++) e.voice(p.l, t + i * 0.05, 900, { type: 'square', vol: 0.008, a: 0.001, tau: 0.015, cutoff: 1800 }); // a woodpecker, far off
    },
  },

  // Glowroot Hollow (a hard pocket): brighter and tenser, B minor arpeggios on glockenspiel racing over a
  // pulsing bass, the heart knot's slow beat underneath everything
  glowroot: {
    bpm: 108, spb: 8, key: 59, scale: MINOR, gain: 0.78, send: 0.34, loop: 8,
    chords: [[1, 3, 5], [6, 8, 10], [3, 5, 7], [7, 9, 11], [1, 3, 5], [4, 6, 8], [6, 8, 10], [5, 7, 9]],
    mel: melody(
      '8 . 7 . 5 . 3 .', '6 - 5 . 3 . . .', '5 . 7 . 8 . 10 .', '9 - - . 7 . . .',
      '8 . 10 . 12 . 10 .', '8 - 6 . 4 . . .', '6 . 5 . 3 . 2 .', '5 - - - 4 - . .',
    ),
    setup(p) {
      p.eng.bed(p, 'lowpass', 120, 0.014);
      p.eng.bed(p, 'bandpass', 4200, 0.003, 1.5); // a high shimmer
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar);
      if (s === 0) pad(p, ch, t, p.stepDur * 8, 0.012, { type: 'sawtooth', a: 0.4, cutoff: 900, unison: 7 });
      e.voice(p.c, t, p.f(s % 4 === 2 ? ch[2] : ch[0], -2), { type: 'triangle', vol: s % 2 ? 0.06 : 0.1, tau: 0.08, cutoff: 600 });
      if (s === 0) e.kick(p.c, t, 0.2, 90, 40, 0.12); // the heart knot's beat
      if (s === 1) e.kick(p.c, t, 0.12, 80, 40, 0.1);
      e.voice(s % 2 ? p.l : p.r, t, p.f(ch[s % 3], 2), { ...GLOCK, vol: 0.022, tau: 0.12 });
      const m = p.mel(bar, s);
      if (m && pass % 4 !== 3) e.voice(p.c, t, p.f(m.d, 1), { type: 'sine', vol: 0.05, a: 0.02, hold: m.len * 0.6, rel: 0.15, vib: 5, vibRate: 6, partials: [[2, 0.15]] });
      if (s % 2 === 1) hat(p, t, 0.012);
    },
  },

  // Wreck Cave (a hard pocket): a slow sea shanty in D minor for a ship that will never sail again, 3/4,
  // a squeezebox pad that breathes in and out, a creaking hull, drips in the dark and a far-off bosun's whistle
  wreck: {
    bpm: 96, beats: 3, spb: 6, melSteps: 6, key: 62, scale: DORIAN, gain: 0.8, send: 0.42, loop: 8,
    chords: [[1, 3, 5], [7, 9, 11], [6, 8, 10], [5, 7, 9], [1, 3, 5], [4, 6, 8], [7, 9, 11], [1, 3, 5]],
    mel: melody(
      '5 - 4 3 - 1', '2 - - 7 - .', '3 - 4 5 - 6', '5 - - . . .',
      '8 - 7 5 - 4', '6 - 5 4 - .', '2 - 3 4 - 2', '1 - - . . .',
    ),
    setup(p) {
      p.eng.bed(p, 'lowpass', 160, 0.012); // the sea, breathing at the mouth
      p.eng.bed(p, 'bandpass', 900, 0.003, 2); // the cave's hollow ring
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), part = pass % 2;
      if (s === 0) pad(p, ch, t, p.stepDur * 6, 0.014, { type: 'sawtooth', a: 0.25, cutoff: 1100, unison: 5 }); // the squeezebox
      if (s === 0) e.voice(p.c, t, p.f(ch[0], -2), { type: 'triangle', vol: 0.14, tau: 0.35, cutoff: 600 });
      if (s === 2 || s === 4) e.voice(s === 2 ? p.l : p.r, t, p.f(ch[s === 2 ? 1 : 2], -1), { ...PLUCK, vol: 0.035, tau: 0.14 });
      const m = p.mel(bar, s);
      if (m && part === 0) e.voice(p.c, t, p.f(m.d, 1), { type: 'sine', vol: 0.05, a: 0.05, hold: m.len * 0.75, rel: 0.2, vib: 4, vibRate: 5, partials: [[2, 0.2], [3, 0.08]] });
      if (m && part === 1) e.voice(p.r, t, p.f(m.d, 1), { ...GLOCK, vol: 0.045 });
      if (s === 3 && chance(0.4)) e.voice(chance(0.5) ? p.l : p.r, t + rand(0, p.stepDur), 1700 + rand(-300, 500), { type: 'sine', vol: 0.016, a: 0.001, tau: 0.05, glide: 0.6, glideT: 0.04 }); // a drip
      if (s === 5 && bar % 4 === 1 && chance(0.5)) e.voice(p.l, t, 110, { type: 'sawtooth', vol: 0.012, a: 0.15, hold: 0.4, rel: 0.3, cutoff: 500, vib: 3, vibRate: 2 }); // the hull creaks
      if (s === 0 && bar === 7 && pass % 3 === 2) e.voice(p.r, t, 2400, { type: 'sine', vol: 0.012, a: 0.02, hold: 0.5, rel: 0.2, vib: 25, vibRate: 14 }); // the bosun's whistle, far off
    },
  },

  // The Thornheart (a hard pocket): an old, stern tune in E phrygian, a slow 4/4 heartbeat on low drums,
  // bowed strings that scrape like canes, and harp notes falling like petals near the end of each phrase
  thornheart: {
    bpm: 84, spb: 8, key: 64, scale: PHRYGIAN, gain: 0.8, send: 0.36, loop: 8,
    chords: [[1, 3, 5], [2, 4, 6], [1, 3, 5], [7, 9, 11], [6, 8, 10], [2, 4, 6], [4, 6, 8], [1, 3, 5]],
    mel: melody(
      '5 . . 6 5 . 3 .', '2 - - . 1 . . .', '3 . 5 . 6 . 8 .', '7 - - . 5 . . .',
      '8 . . 7 6 . 5 .', '6 - 5 . 3 . . .', '4 . 3 . 2 . 3 .', '1 - - - . . . .',
    ),
    setup(p) {
      p.eng.bed(p, 'lowpass', 220, 0.01);
      p.eng.bed(p, 'bandpass', 2600, 0.004, 0.8); // canes rustling
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), part = pass % 2;
      if (s === 0) pad(p, ch, t, p.stepDur * 8, 0.013, { type: 'sawtooth', a: 0.6, cutoff: 800, unison: 6 }); // bowed strings
      if (s === 0 || s === 4) e.kick(p.c, t, s ? 0.12 : 0.2, 70, 38, 0.14); // a slow heartbeat
      if (s === 1) e.kick(p.c, t, 0.1, 64, 36, 0.12);
      if (s % 2 === 0) e.voice(p.c, t, p.f(s % 4 === 2 ? ch[2] : ch[0], -2), { type: 'triangle', vol: 0.08, tau: 0.12, cutoff: 500 });
      const m = p.mel(bar, s);
      if (m && part === 0) e.voice(p.c, t, p.f(m.d, 1), { type: 'sawtooth', vol: 0.022, a: 0.08, hold: m.len * 0.8, rel: 0.25, vib: 5, vibRate: 5, cutoff: 1600 });
      if (m && part === 1) e.voice(p.l, t, p.f(m.d, 1), { ...PLUCK, vol: 0.06, tau: 0.3 });
      if (bar % 4 === 3 && s >= 4) e.voice(s % 2 ? p.l : p.r, t, p.f(ch[(s + bar) % 3], 2), { ...GLOCK, vol: 0.02, tau: 0.25 }); // petals falling
      if (s === 6 && chance(0.25)) hat(p, t, 0.008);
    },
  },

  // Keeper's Spine: wide open and windswept, A dorian, a slow 4/4 with a long horn-like melody over open
  // fifths, a wind bed that rises and falls, a far-off bell now and then and a kite's cry
  spine: {
    bpm: 88, spb: 8, key: 57, scale: DORIAN, gain: 0.8, send: 0.42, loop: 8,
    chords: [[1, 5, 8], [7, 11, 14], [4, 8, 11], [1, 5, 8], [6, 10, 13], [4, 8, 11], [7, 11, 14], [1, 5, 8]],
    mel: melody(
      '5 - - 6 5 - 3 -', '4 - - - 2 - . .', '3 - 5 - 6 - 8 -', '7 - - - 5 - . .',
      '8 - - 7 6 - 5 -', '6 - 5 - 4 - . .', '2 - 3 - 4 - 6 -', '5 - - - - - . .',
    ),
    setup(p) {
      p.eng.bed(p, 'bandpass', 700, 0.012, 0.4); // the wind over the ridge
      p.eng.bed(p, 'lowpass', 250, 0.006);
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), part = pass % 2;
      if (s === 0) pad(p, ch, t, p.stepDur * 8, 0.012, { a: 0.9, cutoff: 1000, unison: 6 });
      if (s === 0 || s === 4) e.voice(p.c, t, p.f(ch[s ? 1 : 0], -2), { type: 'triangle', vol: 0.12, tau: 0.5, cutoff: 600 });
      if (s === 6) e.voice(s % 4 ? p.l : p.r, t, p.f(ch[2], 0), { ...PLUCK, vol: 0.03, tau: 0.3 });
      const m = p.mel(bar, s);
      if (m && part === 0) e.voice(p.c, t, p.f(m.d, 1), { type: 'sine', vol: 0.055, a: 0.09, hold: m.len * 0.8, rel: 0.3, vib: 4, vibRate: 4.5, partials: [[2, 0.3], [3, 0.12], [4, 0.05]] }); // the horn
      if (m && part === 1) e.voice(p.r, t, p.f(m.d, 2), { ...GLOCK, vol: 0.035 });
      if (s === 0 && bar % 4 === 2 && chance(0.5)) e.voice(p.l, t, p.f(1, 1), { ...GLOCK, vol: 0.02, tau: 1.2 }); // a bell, far off along the road
      if (s === 3 && bar % 8 === 5 && chance(0.4)) e.voice(p.r, t, 2200, { type: 'sine', vol: 0.012, a: 0.01, hold: 0.25, rel: 0.2, glide: 0.7, glideT: 0.3 }); // a kite's cry
    },
  },

  // The Rimeglass Glacier: cold, bright and slow, B minor, a bowed pad over a low drone, a crystalline
  // glockenspiel climbing like light through ice, the ice groaning deep down now and then, wind off the
  // snowfield and a thin rising shimmer for the aurora
  glacier: {
    bpm: 70, spb: 8, key: 59, scale: MINOR, gain: 0.74, send: 0.5, loop: 8,
    chords: [[1, 3, 5], [6, 8, 10], [4, 6, 8], [5, 7, 9], [1, 3, 5], [3, 5, 7], [6, 8, 10], [5, 7, 9]],
    mel: melody(
      '5 - - - 4 - 3 -', '3 - - - . . . .', '6 - 5 - 4 - 3 -', '2 - - - . . . .',
      '5 - 6 - 8 - 7 -', '6 - - - 5 - . .', '4 - 3 - 2 - 3 -', '1 - - - - - . .',
    ),
    setup(p) {
      p.eng.bed(p, 'bandpass', 1500, 0.008, 0.6); // wind off the snowfield
      p.eng.bed(p, 'lowpass', 180, 0.01);
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), part = pass % 2;
      if (s === 0) {
        pad(p, ch, t, p.stepDur * 8, 0.012, { type: 'sawtooth', a: 1.2, cutoff: 900, unison: 6, rel: 1.4 });
        e.voice(p.c, t, p.f(ch[0], -2), { type: 'triangle', vol: 0.08, a: 0.5, hold: p.stepDur * 7, rel: 1, cutoff: 500 });
      }
      if (s % 2 === 1) e.voice(s % 4 === 1 ? p.l : p.r, t, p.f(ch[(s >> 1) % 3], 2), { ...GLOCK, vol: 0.022, tau: 0.5 }); // light through the ice
      const m = p.mel(bar, s);
      if (m && part === 0) e.voice(p.c, t, p.f(m.d, 1), { type: 'sine', vol: 0.05, a: 0.12, hold: m.len * 0.85, rel: 0.5, vib: 5, vibRate: 4, partials: [[2, 0.25], [3, 0.08]] });
      if (m && part === 1) e.voice(p.r, t, p.f(m.d, 2), { ...GLOCK, vol: 0.035, tau: 0.7 });
      if (s === 2 && bar % 4 === 3 && chance(0.6)) e.voice(p.c, t, p.f(1, -3), { type: 'sawtooth', vol: 0.02, a: 0.3, hold: 0.6, rel: 0.8, cutoff: 220, glide: 0.85, glideT: 1 }); // the ice groaning far down
      if (s === 4 && bar % 8 === 6 && chance(0.5)) e.voice(p.l, t, p.f(5, 2), { type: 'sine', vol: 0.012, a: 0.6, hold: 0.8, rel: 1, glide: 1.5, glideT: 1.6 }); // the aurora
    },
  },

  // ——— Frostpeak's depth pass F2 (docs/places/skerries.md, docs/places/grotto.md) ———
  // The Whale Skerries: grey and quiet, A dorian, a slow lilting 3/4 like a fjord song, a low drone, a
  // plucked line (Hakon's bone flute on the second pass, a bit wobbly), waves dragging the shingle and
  // now and then a far whale call gliding down
  skerries: {
    bpm: 76, beats: 3, spb: 6, melSteps: 6, key: 57, scale: DORIAN, gain: 0.76, send: 0.45, loop: 8,
    chords: [[1, 3, 5], [7, 9, 11], [4, 6, 8], [1, 3, 5], [3, 5, 7], [4, 6, 8], [7, 9, 11], [5, 7, 9]],
    mel: melody(
      '5 - 4 3 - 2', '1 - - . . .', '4 - 5 6 - 5', '3 - - . . .',
      '5 - 6 8 - 7', '6 - 5 4 - .', '3 - 2 1 - 2', '1 - - . . .',
    ),
    setup(p) {
      p.eng.bed(p, 'lowpass', 300, 0.012); // the sea
      p.eng.bed(p, 'bandpass', 1200, 0.004, 0.5); // wind over the rocks
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), part = pass % 2;
      if (s === 0) {
        pad(p, ch, t, p.stepDur * 6, 0.01, { type: 'sawtooth', a: 0.8, cutoff: 700, unison: 4, rel: 1.2 });
        e.voice(p.c, t, p.f(ch[0], -2), { type: 'triangle', vol: 0.08, a: 0.3, hold: p.stepDur * 5, rel: 0.8, cutoff: 400 });
      }
      if (s === 2 || s === 4) e.voice(s === 2 ? p.l : p.r, t, p.f(ch[s === 2 ? 1 : 2], 0), { ...PLUCK, vol: 0.04, tau: 0.2, cutoff: 1400 });
      const m = p.mel(bar, s);
      if (m && part === 0) e.voice(p.c, t, p.f(m.d, 1), { ...PLUCK, vol: 0.09, tau: 0.28, cutoff: 1800, partials: [[2, 0.15]] });
      if (m && part === 1) e.voice(p.r, t, p.f(m.d, 1), { type: 'sine', vol: 0.05, a: 0.05, hold: m.len * 0.8, rel: 0.2, vib: 7, vibRate: 5.5, partials: [[2, 0.3], [3, 0.1]] }); // the bone flute
      if (s === 0 && bar % 2 === 1) e.noiseHit(p.c, t, { type: 'lowpass', f: 300, sweep: 900, sweepT: 1.6, vol: 0.06, a: 0.9, hold: 0.3, tau: 1 }); // a wave up the shingle
      if (s === 3 && bar % 8 === 5 && chance(0.6)) e.voice(p.l, t, p.f(5, -1), { type: 'sine', vol: 0.025, a: 0.4, hold: 0.9, rel: 1, glide: 0.6, glideT: 1.5 }); // a whale, far out
    },
  },
  // The Narwhal Grotto: hushed and glassy, E minor, slow, high crystalline notes ringing in the ice over a
  // hollow drone, drips, and the pod's old call echoing back from deep in the cliff
  grotto: {
    bpm: 66, spb: 8, key: 52, scale: MINOR, gain: 0.74, send: 0.6, loop: 8,
    chords: [[1, 3, 5], [6, 8, 10], [4, 6, 8], [5, 7, 9], [1, 3, 5], [7, 9, 11], [6, 8, 10], [5, 7, 9]],
    mel: melody(
      '8 - - - 7 - 5 -', '. . . . . . . .', '6 - - - 5 - 3 -', '. . . . . . . .',
      '8 - 10 - 9 - 8 -', '7 - - - . . . .', '6 - 5 - 4 - 2 -', '1 - - - - - . .',
    ),
    setup(p) {
      p.eng.bed(p, 'lowpass', 140, 0.014);
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar);
      if (s === 0) pad(p, ch, t, p.stepDur * 8, 0.01, { type: 'triangle', a: 1.4, cutoff: 900, unison: 4, rel: 1.6 });
      if (s % 4 === 2) e.voice(s % 8 === 2 ? p.l : p.r, t, p.f(ch[(bar + s) % 3], 2), { ...GLOCK, vol: 0.02, tau: 0.9 }); // the ice ringing
      const m = p.mel(bar, s);
      if (m) e.voice(p.c, t, p.f(m.d, 1), { ...GLOCK, vol: 0.04, tau: 1.1 });
      if (s === 5 && chance(0.4)) e.voice(p.r, t, p.f(8, 2), { type: 'sine', vol: 0.02, tau: 0.08 }); // a drip
      if (s === 1 && bar % 8 === 3 && chance(0.7)) e.voice(p.l, t, p.f(3, -1), { type: 'sine', vol: 0.022, a: 0.5, hold: 1.2, rel: 1.2, glide: 1.25, glideT: 1.4, vib: 3, vibRate: 2 }); // the pod's call
    },
  },
  // The Breathing Hole: the Old Narwhal's den. D minor, heavy and sad rather than angry: a slow pounding pulse
  // under the ice, low strings, and her song (a long gliding call) over the top at every phrase
  narwhal: {
    bpm: 112, spb: 8, key: 50, scale: MINOR, gain: 0.8, send: 0.35, loop: 8,
    chords: [[1, 3, 5], [6, 8, 10], [7, 9, 11], [5, 7, 9], [1, 3, 5], [4, 6, 8], [6, 8, 10], [5, 7, 9]],
    mel: melody(
      '5 - - 6 5 - 3 -', '4 - - - 3 - 2 -', '5 - - 6 8 - 7 -', '6 - - - 5 - . .',
      '8 - - 7 6 - 5 -', '4 - - 5 6 - 5 -', '3 - 2 - 1 - 2 -', '1 - - - . . . .',
    ),
    setup(p) {
      p.eng.bed(p, 'lowpass', 120, 0.02); // the water under the ice
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), hot = e.intensity > 0.5;
      if (s === 0) pad(p, ch, t, p.stepDur * 8, 0.014, { type: 'sawtooth', a: 0.4, cutoff: 800, unison: 8, rel: 0.6 });
      if (s % 2 === 0) e.voice(p.c, t, p.f(ch[0], -2), { type: 'sawtooth', vol: s % 4 ? 0.05 : 0.08, tau: 0.12, cutoff: 420 });
      if (s === 0 || s === 4 || (hot && s % 2 === 0)) e.kick(p.c, t, 0.24, 110, 40, 0.1);
      if (s === 4) snare(p, t, 0.05);
      const m = p.mel(bar, s);
      if (m) e.voice(p.r, t, p.f(m.d, 1), { type: 'triangle', vol: 0.07, a: 0.03, hold: m.len * 0.8, rel: 0.2, cutoff: 1800 });
      if (s === 0 && bar % 4 === 0) e.voice(p.l, t, p.f(5, 0), { type: 'sine', vol: 0.04, a: 0.4, hold: 1, rel: 1, glide: 0.75, glideT: 1.4, vib: 4, vibRate: 3, partials: [[2, 0.2]] }); // her song
    },
  },

  // ——— Frostpeak's depth pass F3 (docs/places/heights.md, docs/places/bluehalls.md) ———
  // The Aurora Heights: high, still and wide open, E lydian-ish (dorian with a raised 4th), very slow: long
  // shimmering pads that swell and fade like the curtains, a glassy bell line, a soft sine melody that rises,
  // and now and then the aurora itself, a high gliding whistle
  heights: {
    bpm: 60, spb: 8, key: 52, scale: DORIAN_4, gain: 0.72, send: 0.7, loop: 8,
    chords: [[1, 3, 5], [4, 6, 8], [1, 3, 5], [7, 9, 11], [6, 8, 10], [4, 6, 8], [5, 7, 9], [1, 3, 5]],
    mel: melody(
      '5 - - - 6 - 8 -', '9 - - - - - . .', '8 - 6 - 5 - 4 -', '5 - - - - - . .',
      '3 - 5 - 6 - 8 -', '10 - - - 9 - 8 -', '6 - 5 - 4 - 2 -', '1 - - - - - . .',
    ),
    setup(p) {
      p.eng.bed(p, 'bandpass', 2200, 0.004, 0.5); // thin high wind
      p.eng.bed(p, 'lowpass', 160, 0.008);
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), part = pass % 2;
      if (s === 0) {
        pad(p, ch, t, p.stepDur * 8, 0.012, { type: 'triangle', a: 1.8, cutoff: 1400, unison: 6, rel: 2 });
        e.voice(p.c, t, p.f(ch[0], -2), { type: 'sine', vol: 0.07, a: 0.8, hold: p.stepDur * 7, rel: 1.4 });
      }
      if (s % 2 === 0) e.voice(s % 4 === 0 ? p.l : p.r, t, p.f(ch[(s >> 1) % 3], 2), { ...GLOCK, vol: 0.018, tau: 0.9 }); // the stars
      const m = p.mel(bar, s);
      if (m && part === 0) e.voice(p.c, t, p.f(m.d, 1), { type: 'sine', vol: 0.05, a: 0.2, hold: m.len * 0.85, rel: 0.8, vib: 4, vibRate: 3.5, partials: [[2, 0.2]] });
      if (m && part === 1) e.voice(p.r, t, p.f(m.d, 2), { ...GLOCK, vol: 0.03, tau: 1.2 });
      if (s === 4 && bar % 4 === 1 && chance(0.7)) e.voice(p.l, t, p.f(5, 2), { type: 'sine', vol: 0.014, a: 0.8, hold: 1, rel: 1.4, glide: 1.5, glideT: 2 }); // the aurora
    },
  },
  // The Blue Halls: deep and close, F# minor, slow: a low hollow drone, a heavy creaking pulse (the glacier
  // moving), cold glassy notes ringing in the ice, and far off the troll's chisel, tapping
  bluehalls: {
    bpm: 64, spb: 8, key: 54, scale: MINOR, gain: 0.76, send: 0.65, loop: 8,
    chords: [[1, 3, 5], [6, 8, 10], [4, 6, 8], [5, 7, 9], [1, 3, 5], [3, 5, 7], [4, 6, 8], [5, 7, 9]],
    mel: melody(
      '5 - - - . . 4 -', '3 - - - . . . .', '6 - - - 5 - 3 -', '2 - - - . . . .',
      '5 - - - 6 - 5 -', '8 - - - 7 - . .', '6 - 5 - 3 - 2 -', '1 - - - - - . .',
    ),
    setup(p) {
      p.eng.bed(p, 'lowpass', 110, 0.016);
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar);
      if (s === 0) {
        pad(p, ch, t, p.stepDur * 8, 0.011, { type: 'sawtooth', a: 1.6, cutoff: 600, unison: 4, rel: 1.6 });
        e.voice(p.c, t, p.f(ch[0], -2), { type: 'triangle', vol: 0.09, a: 0.6, hold: p.stepDur * 7, rel: 1.2, cutoff: 300 });
      }
      if (s % 4 === 3) e.voice(s % 8 === 3 ? p.l : p.r, t, p.f(ch[(bar + s) % 3], 2), { ...GLOCK, vol: 0.02, tau: 1 }); // ice ringing
      const m = p.mel(bar, s);
      if (m) e.voice(p.c, t, p.f(m.d, 0), { type: 'sine', vol: 0.05, a: 0.1, hold: m.len * 0.8, rel: 0.6, partials: [[2, 0.2], [3, 0.06]] });
      if (s === 0 && bar % 2 === 0) e.noiseHit(p.c, t, { type: 'lowpass', f: 140, sweep: 260, sweepT: 1.2, vol: 0.05, a: 0.4, hold: 0.4, tau: 0.8 }); // the glacier creaking
      if ((s === 2 || s === 3) && bar % 8 === 6 && chance(0.6)) e.voice(p.r, t, p.f(5, 3), { type: 'square', vol: 0.008, tau: 0.03, cutoff: 3000 }); // the troll's chisel
    },
  },

  // ——— Frostpeak's depth pass F4 (docs/places/queensbridge.md) ———
  // The Queen's Bridge: wide, windy and grave, B minor, slow 3/4: a low drone like wind in the arches, a
  // processional bass that walks and never arrives, a horn call at the start of every phrase (the guard), and
  // a high cold bell that rings as if from the far side
  qbridge: {
    bpm: 66, beats: 3, spb: 6, melSteps: 6, key: 47, scale: MINOR, gain: 0.74, send: 0.6, loop: 8,
    chords: [[1, 3, 5], [6, 8, 10], [4, 6, 8], [5, 7, 9], [1, 3, 5], [3, 5, 7], [6, 8, 10], [5, 7, 9]],
    mel: melody(
      '5 - - 4 3 -', '2 - - - . .', '3 - 4 5 6 -', '5 - - - . .',
      '8 - - 7 6 -', '5 - 4 - 3 -', '2 - 3 - 4 -', '1 - - - . .',
    ),
    setup(p) {
      p.eng.bed(p, 'bandpass', 700, 0.008, 0.6); // wind through the arches
      p.eng.bed(p, 'lowpass', 130, 0.01);
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar);
      if (s === 0) pad(p, ch, t, p.stepDur * 6, 0.012, { type: 'triangle', a: 1.2, cutoff: 1000, unison: 6, rel: 1.4 });
      if (s % 2 === 0) e.voice(p.c, t, p.f(ch[(s >> 1) % 3], -2), { type: 'triangle', vol: 0.06, a: 0.05, hold: p.stepDur * 1.6, rel: 0.3, cutoff: 500 }); // the walking bass
      if (s === 0 && bar % 4 === 0) e.voice(p.l, t, p.f(5, -1), { type: 'sawtooth', vol: 0.02, a: 0.2, hold: 1.2, rel: 0.8, cutoff: 900, unison: 4 }); // the guard's horn
      const m = p.mel(bar, s);
      if (m) e.voice(p.c, t, p.f(m.d, 1), { type: 'sine', vol: 0.05, a: 0.08, hold: m.len * 0.85, rel: 0.5, vib: 3, vibRate: 4, partials: [[2, 0.2]] });
      if (s === 3 && bar % 2 === 1) e.voice(p.r, t, p.f(ch[2], 3), { ...GLOCK, vol: 0.016, tau: 1.6 }); // the far bell
    },
  },
  // The Seam: Sigrun's den. Stubborn and sad, B harmonic minor: a heavy march in 4 (her footfalls, her spear on
  // the ice), low strings that keep rising and falling back, a horn line that repeats one phrase as if it were
  // an oath, and in the hot part, ice cracking
  sigrun: {
    bpm: 104, spb: 8, key: 47, scale: HARM_MINOR, gain: 0.8, send: 0.3, loop: 8,
    chords: [[1, 3, 5], [1, 3, 5], [6, 8, 10], [5, 7, 9], [1, 3, 5], [4, 6, 8], [6, 8, 10], [5, 7, 9]],
    mel: melody(
      '5 - - 5 6 - 5 -', '3 - - - . . . .', '5 - - 5 6 - 8 -', '7 - - - . . . .',
      '8 - 7 - 6 - 5 -', '4 - 5 - 6 - 5 -', '3 - 2 - 1 - 2 -', '1 - - - . . . .',
    ),
    setup(p) {
      p.eng.bed(p, 'bandpass', 900, 0.005, 0.5);
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), hot = e.intensity > 0.5;
      if (s === 0) pad(p, ch, t, p.stepDur * 8, 0.013, { type: 'sawtooth', a: 0.5, cutoff: 750, unison: 8, rel: 0.6 });
      if (s % 2 === 0) e.voice(p.c, t, p.f(ch[0], -2), { type: 'sawtooth', vol: s % 4 ? 0.045 : 0.075, tau: 0.12, cutoff: 420 });
      if (s === 0 || s === 4 || (hot && s % 2 === 0)) e.kick(p.c, t, 0.24, 96, 38, 0.12); // her footfalls
      if (s === 6) e.noiseHit(p.r, t, { type: 'highpass', f: 2400, vol: 0.03, tau: 0.08 }); // the spear on the ice
      if (hot && s === 3 && chance(0.5)) e.noiseHit(p.l, t, { type: 'bandpass', f: 1800, vol: 0.03, tau: 0.2 }); // ice cracking
      const m = p.mel(bar, s);
      if (m) e.voice(p.c, t, p.f(m.d), { type: 'sawtooth', vol: 0.032, a: 0.04, hold: Math.max(0.05, m.len * 0.8), rel: 0.18, cutoff: 1400, unison: 5 }); // the oath, on a horn
    },
  },

  // The Warden's Court: heavy and stubborn, D harmonic minor, stone drums like footfalls, low brass, a bell
  // tolling at every bar (the gate), and an ostinato that refuses to move on
  warden: {
    bpm: 100, spb: 16, key: 50, scale: HARM_MINOR, gain: 0.8, send: 0.26, loop: 8,
    chords: [[1, 3, 5], [1, 3, 5], [6, 8, 10], [5, 7, 9], [1, 3, 5], [4, 6, 8], [2, 4, 6], [5, 7, 9]],
    mel: melody(
      '8 - - - 7 - 8 -', '5 - - - - - . .', '6 - 5 - 6 - 8 -', '7 - - - 5 - . .',
      '8 - - - 10 - 8 -', '7 - 6 - 5 - 4 -', '3 - 4 - 5 - 6 -', '7 - - - - - . .',
    ),
    setup(p) {
      p.eng.bed(p, 'lowpass', 140, 0.016);
      p.eng.bed(p, 'bandpass', 900, 0.004, 0.5); // wind across the court
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), hot = e.intensity > 0.5;
      if (s === 0) pad(p, ch, t, p.stepDur * 16, 0.01, { type: 'sawtooth', a: 0.4, cutoff: 700, unison: 8 });
      if (s === 0) e.voice(p.c, t, p.f(1, 0), { ...GLOCK, vol: 0.05, tau: 1.6, partials: [[2.76, 0.3], [5.4, 0.12], [0.5, 0.2]] }); // the bell
      if (s % 4 === 0) e.voice(p.c, t, p.f(s % 8 ? ch[2] : ch[0], -2), { type: 'square', vol: 0.06, tau: 0.08, cutoff: 420 }); // the ostinato
      if (s === 0 || s === 6 || (hot && (s === 8 || s === 12))) e.kick(p.c, t, 0.24, 90, 36, 0.14); // stone footfalls
      if (s === 4 || s === 12) clank(p, t, 0.04, s === 4 ? p.l : p.r);
      if (hot && s % 2 === 1) hat(p, t, 0.01);
      if (s === 8 || (hot && s === 0)) for (const d of ch) e.voice(p.c, t, p.f(d, -1), { type: 'sawtooth', vol: 0.018, a: 0.03, hold: 0.3, rel: 0.25, cutoff: 1100, unison: 6 }); // low brass
      const m = p.mel(bar, s);
      if (m && pass % 4 !== 3) e.voice(p.c, t, p.f(m.d), { type: 'sawtooth', vol: 0.035, a: 0.04, hold: Math.max(0.05, m.len * 0.8), rel: 0.15, cutoff: 1500, unison: 5 });
    },
  },

  // The Knotted Burrow: a stubborn 6/8 in C minor, low plucked strings, the thump of digging paws, and a
  // tangle of a melody that keeps looping back on itself
  knotmole: {
    bpm: 132, beats: 2, spb: 12, melSteps: 6, key: 60, scale: HARM_MINOR, gain: 0.8, send: 0.2, loop: 8,
    chords: [[1, 3, 5], [4, 6, 8], [5, 7, 9], [1, 3, 5], [6, 8, 10], [4, 6, 8], [2, 4, 6], [5, 7, 9]],
    mel: melody(
      '5 . 4 3 . 4', '5 . 6 5 . .', '7 . 6 5 . 4', '5 - - . . .',
      '8 . 7 6 . 7', '8 . 6 4 . .', '6 . 5 4 . 2', '3 - - 2 - .',
    ),
    setup(p) {
      p.eng.bed(p, 'lowpass', 150, 0.016);
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), hot = e.intensity > 0.5;
      if (s === 0) pad(p, ch, t, p.stepDur * 12, 0.012, { type: 'sawtooth', a: 0.3, cutoff: 650, unison: 8 });
      if (s % 3 === 0) e.voice(p.c, t, p.f(s % 6 ? ch[2] : ch[0], -2), { type: 'square', vol: s % 6 ? 0.05 : 0.08, tau: 0.07, cutoff: 480 });
      if (s === 0 || s === 6 || (hot && s % 3 === 0)) dum(p, t, 0.18); // digging paws
      if (s === 3 || s === 9) tek(p, t, 0.04);
      if (s % 2 === 1) block(p, t, 700 + (s % 4) * 120, 0.02, s % 4 === 1 ? p.l : p.r);
      const m = p.mel(bar, s);
      if (m) {
        e.voice(p.c, t, p.f(m.d), { ...PLUCK, vol: 0.11, tau: 0.13, cutoff: 1800, partials: [[2, 0.12]] });
        if (hot || pass % 2) e.voice(p.r, t, p.f(m.d, 1), { type: 'square', vol: 0.028, a: 0.005, hold: Math.max(0.04, m.len * 0.6), rel: 0.05, cutoff: 2200 });
      }
    },
  },
  // ——— Frostpeak (the stage: Frostpine Ridge, Starfall Summit) ———
  // Frostpine Ridge: crisp snowy adventure in E minor, bells and sleigh shakers, a touch wistful
  ridge: {
    bpm: 112, spb: 8, key: 64, scale: MINOR, gain: 0.8, send: 0.3, loop: 8,
    chords: [[1, 3, 5], [6, 8, 10], [3, 5, 7], [7, 9, 11], [1, 3, 5], [6, 8, 10], [4, 6, 8], [7, 9, 11]],
    mel: melody(
      '5 . 3 . 5 6 5 3', '3 - 1 . 3 . 6 .', '5 - 3 . 7 . 5 .', '4 - 2 . 4 5 7 .',
      '8 . 7 . 5 . 3 .', '6 . 8 . 10 - 8 .', '8 . 6 . 4 . 6 .', '7 - 5 - 2 - . .',
    ),
    setup(p) {
      p.eng.bed(p, 'bandpass', 1100, 0.012, 0.6); // wind over the snow
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), part = pass % 3;
      if (s === 0) pad(p, ch, t, p.stepDur * 8, 0.015, { type: 'sine', a: 0.5, cutoff: 1400, rel: 0.8 });
      const bass = { 0: [ch[0], -2], 3: [ch[2], -2], 4: [ch[0], -1], 6: [ch[2], -2] }[s];
      if (bass) e.voice(p.c, t, p.f(bass[0], bass[1]), { type: 'triangle', vol: 0.17, tau: 0.16, cutoff: 800 });
      if (s === 0 || s === 4) e.kick(p.c, t, 0.13, 120, 50, 0.06);
      if (s === 2 || s === 6) e.noiseHit(p.r, t, { f: 7000, q: 1, vol: 0.03, a: 0.01, tau: 0.06 }); // sleigh bells
      if (s % 2) shaker(p, t, 0.018);
      const m = p.mel(bar, s);
      if (m && part === 0) e.voice(p.c, t, p.f(m.d, 1), { ...GLOCK, vol: 0.08, tau: 0.35 });
      if (m && part === 1) {
        e.voice(p.c, t, p.f(m.d), { type: 'triangle', vol: 0.06, a: 0.03, hold: m.len * 0.7, rel: 0.3, cutoff: 1800, vib: 10, vibRate: 5 });
        e.voice(p.r, t, p.f(m.d, 1), { ...GLOCK, vol: 0.04, tau: 0.3 });
      }
      if (part === 2 && s % 2 === 0) e.voice(s % 4 ? p.r : p.l, t, p.f(ch[[0, 1, 2, 1][s / 2]], 1), { ...GLOCK, vol: 0.045, tau: 0.3 });
      if (s === 0 && chance(0.3)) { // a glint of falling snow
        const tt = t + rand(0, p.stepDur * 8);
        e.voice(chance(0.5) ? p.l : p.r, tt, rand(3000, 4200), { ...GLOCK, vol: 0.012, tau: 0.2 });
      }
    },
  },

  // Starfall Summit: cosmic, dreamy-epic D lydian, 16th arpeggio synth over a choir pad
  summit: {
    bpm: 100, spb: 16, key: 62, scale: [0, 2, 4, 6, 7, 9, 11], gain: 0.55, send: 0.45, loop: 8,
    chords: [[1, 3, 5], [2, 4, 6], [6, 8, 10], [5, 7, 9], [1, 3, 5], [2, 4, 6], [3, 5, 7], [5, 7, 9]],
    mel: melody(
      '5 - - - 6 - 7 -', '6 - - - 4 - 2 -', '3 - - - 5 - 8 -', '7 - - - - - 5 -',
      '5 - - - 6 - 7 -', '9 - - - 8 - 6 -', '8 - - - 7 - 5 -', '5 - - - - - . .',
    ),
    setup(p) {
      p.eng.bed(p, 'highpass', 5000, 0.004);
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), part = pass % 3;
      if (s === 0) { // choir: soft sines with a slow vibrato
        for (const d of ch) e.voice(p.c, t, p.f(d), { type: 'triangle', vol: 0.016, a: 0.8, hold: p.stepDur * 15, rel: 1, cutoff: 1300, unison: 8, vib: 9, vibRate: 4.5 });
        e.voice(p.c, t, p.f(ch[0], -2), { type: 'sine', vol: 0.12, a: 0.3, hold: p.stepDur * 14, rel: 0.6 });
      }
      const arp = [0, 1, 2, 3, 4, 3, 2, 1][s % 8], d = ch[arp % 3] + 7 * Math.floor(arp / 3);
      e.voice(s % 2 ? p.r : p.l, t, p.f(d), { type: 'sawtooth', vol: 0.03, tau: 0.08, cutoff: 1800 + 600 * Math.sin(bar + s / 4) });
      if (s === 0 || s === 10) e.kick(p.c, t, 0.16, 110, 45, 0.08);
      if (s === 8) snare(p, t, 0.05);
      if (s % 4 === 2) hat(p, t, 0.012);
      const m = p.mel(bar, s);
      if (m && part !== 2) {
        e.voice(p.c, t, p.f(m.d, 1), { type: 'triangle', vol: 0.06, a: 0.05, hold: m.len * 0.75, rel: 0.5, cutoff: 2200, vib: 12, vibRate: 5 });
        if (part === 1) e.voice(p.r, t, p.f(m.d, 1), { ...GLOCK, vol: 0.05, tau: 0.5 });
      }
    },
  },

  // Frost Queen Glacia: an icy, gothic harpsichord waltz in B harmonic minor
  glacia: {
    bpm: 150, beats: 3, spb: 6, melSteps: 6, key: 59, scale: HARM_MINOR, gain: 0.8, send: 0.35, loop: 8,
    chords: [[1, 3, 5], [4, 6, 8], [5, 7, 9], [1, 3, 5], [6, 8, 10], [4, 6, 8], [5, 7, 9], [5, 7, 9]],
    mel: melody(
      '8 7 8 5 3 5', '6 5 6 8 - 6', '7 - 9 7 5 7', '8 - - 5 - .',
      '10 9 10 8 6 8', '8 6 4 6 8 -', '7 9 11 9 7 5', '7 - - - - .',
    ),
    setup(p) {
      p.eng.bed(p, 'highpass', 6000, 0.005);
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), hot = e.intensity > 0.5;
      const harpsi = { type: 'sawtooth', a: 0.002, tau: 0.12, cutoff: 3200, partials: [[2, 0.1]] };
      if (s === 0) {
        e.voice(p.c, t, p.f(ch[0], -2), { type: 'triangle', vol: 0.22, tau: 0.3, cutoff: 700 });
        e.kick(p.c, t, 0.18, 110, 45, 0.08);
        pad(p, ch, t, p.stepDur * 6, 0.012, { type: 'sawtooth', a: 0.25, cutoff: 900, unison: 10 });
      }
      if (s === 2 || s === 4) for (const d of ch) e.voice(s === 2 ? p.l : p.r, t, p.f(d), { ...harpsi, vol: 0.022 });
      if (hot && (s === 2 || s === 4)) e.kick(p.c, t, 0.12, 140, 60, 0.05);
      if (hot && s % 2) hat(p, t, 0.016);
      if (bar % 4 === 3 && s >= 3) e.kick(p.l, t, 0.08 + s * 0.015, 150, 95, 0.06);
      const m = p.mel(bar, s);
      if (m && pass % 3 !== 2) {
        e.voice(p.c, t, p.f(m.d), { ...harpsi, vol: 0.06, tau: 0.16 });
        if (hot || pass % 3 === 1) e.voice(p.r, t, p.f(m.d, 1), { ...GLOCK, vol: 0.045, tau: 0.3 });
      }
      if (pass % 3 === 2 && s % 2 === 0) e.voice(p.r, t, p.f(ch[s / 2], 1), { ...GLOCK, vol: 0.05, tau: 0.35 });
    },
  },

  // Astral Wyrm: the final boss, D harmonic minor, the biggest track (choir, arps, toms, heroic lead)
  wyrm: {
    bpm: 160, spb: 16, key: 62, scale: HARM_MINOR, gain: 0.8, send: 0.3, loop: 16,
    chords: [[1, 3, 5], [6, 8, 10], [4, 6, 8], [5, 7, 9], [1, 3, 5], [6, 8, 10], [5, 7, 9], [5, 7, 9],
      [6, 8, 10], [3, 5, 7], [4, 6, 8], [5, 7, 9], [1, 3, 5], [6, 8, 10], [5, 7, 9], [1, 3, 5]],
    mel: melody(
      '1 - 5 - 8 - 7 -', '6 - - 5 6 - 8 -', '6 - 4 - 8 - 6 -', '7 - - - 5 - 7 -',
      '8 - 10 - 12 - 10 -', '10 - - 8 6 - 8 -', '9 - 7 - 5 - 7 -', '7 - - - - - . .',
      '8 . 8 . 10 - 8 .', '7 . 7 . 9 - 7 .', '6 . 6 . 8 - 6 .', '5 - 7 - 9 - 11 -',
      '12 - - - 10 - 8 -', '10 - - - 8 - 6 -', '9 - 11 - 9 - 7 -', '8 - - - - - . .',
    ),
    setup(p) {
      p.eng.bed(p, 'lowpass', 100, 0.018);
      p.eng.bed(p, 'highpass', 6000, 0.003);
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), hot = e.intensity > 0.5;
      if (s === 0) for (const d of ch) e.voice(p.c, t, p.f(d), { type: 'triangle', vol: 0.014, a: 0.3, hold: p.stepDur * 15, rel: 0.6, cutoff: 1400, unison: 9, vib: 8, vibRate: 4.5 });
      const bd = s % 8 === 6 ? ch[2] : [ch[0], ch[0], ch[0] + 7, ch[0]][s % 4];
      e.voice(p.c, t, p.f(bd, -2), { type: 'square', vol: s % 4 === 0 ? 0.075 : 0.05, tau: 0.04, cutoff: 560 });
      const arp = [0, 1, 2, 3][s % 4], ad = ch[arp % 3] + 7 * Math.floor(arp / 3);
      if (s % 2 === 0) e.voice(s % 4 < 2 ? p.l : p.r, t, p.f(ad, 1), { type: 'sawtooth', vol: 0.018, tau: 0.06, cutoff: 2200 });
      if (s % 4 === 0 || s === 10 || (hot && s % 2 === 0)) e.kick(p.c, t, 0.22, 125, 42, 0.08);
      if (s === 4 || s === 12) snare(p, t, 0.07);
      if (s % 2 === 0) hat(p, t, s % 4 ? 0.022 : 0.012);
      if (hot && s % 2) shaker(p, t, 0.018);
      if (bar % 4 === 3 && s >= 8 && s % 2 === 0) e.kick(s % 4 ? p.l : p.r, t, 0.14, 240 - s * 7, 110, 0.06); // tom run
      const m = p.mel(bar, s);
      if (m && pass % 3 !== 2) {
        e.voice(p.c, t, p.f(m.d), { type: 'square', vol: 0.045, a: 0.01, hold: Math.max(0.05, m.len * 0.8), rel: 0.12, cutoff: 2400, vib: 10, vibRate: 5.5 });
        e.voice(p.c, t, p.f(m.d, -1), { type: 'triangle', vol: 0.06, a: 0.01, hold: Math.max(0.05, m.len * 0.8), rel: 0.12, cutoff: 1500 });
        if (hot || pass % 3 === 1) e.voice(p.r, t, p.f(m.d, 1), { ...GLOCK, vol: 0.045, tau: 0.3 });
      }
      if (pass % 3 === 2 && s % 4 === 0) e.voice(p.r, t, p.f(ch[[0, 1, 2, 1][s / 4]], 1), { ...GLOCK, vol: 0.06, tau: 0.4 });
    },
  },

  // ——— Emberdeep (the legacy stage) ———
  // Cinder Flats: a warm desert-ish adventure in D phrygian dominant, hand drums and marimba, lava bubbles
  cinder: {
    bpm: 112, spb: 8, swing: 0.1, key: 62, scale: PHRYG_DOM, gain: 0.8, send: 0.25, loop: 8,
    chords: [[1, 3, 5], [1, 3, 5], [2, 4, 6], [1, 3, 5], [7, 9, 11], [6, 8, 10], [2, 4, 6], [1, 3, 5]],
    mel: melody(
      '1 . 2 . 3 - 2 1', '5 . 4 3 2 . 1 .', '2 . 3 4 5 - 4 .', '3 - 2 - 1 - . .',
      '8 . 7 . 6 . 5 .', '6 - 5 4 3 . 4 5', '4 . 3 . 2 . 3 2', '1 - - - . . . .',
    ),
    setup(p) {
      p.eng.bed(p, 'lowpass', 150, 0.014); // the deep rumble under the crust
      p.eng.bed(p, 'bandpass', 650, 0.004, 0.5); // hot dry wind
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), part = pass % 3;
      if (s === 0) pad(p, ch, t, p.stepDur * 8, 0.014, { type: 'sine', a: 0.5, cutoff: 1200, rel: 0.8 });
      const bass = { 0: [ch[0], -2], 3: [ch[0], -1], 4: [ch[2], -2], 6: [ch[0], -1] }[s];
      if (bass) e.voice(p.c, t, p.f(bass[0], bass[1]), { ...MARIMBA, vol: 0.2, tau: 0.12 });
      // maqsum-ish: DUM tek . tek DUM . tek .
      if (s === 0 || s === 4) dum(p, t, s ? 0.13 : 0.17);
      if (s === 1 || s === 3 || s === 6) tek(p, t, s === 6 ? 0.045 : 0.035, s === 3 ? p.l : p.r);
      if (s === 7 && bar % 2) tek(p, t, 0.025, p.l);
      if (s % 2) shaker(p, t, 0.014);
      const m = p.mel(bar, s);
      if (m && part === 0) e.voice(p.c, t, p.f(m.d, 1), { ...MARIMBA, vol: 0.14 });
      if (m && part === 1) { // a plucked oud-ish lead with a wobble
        e.voice(p.c, t, p.f(m.d), { ...PLUCK, vol: 0.09, tau: 0.22, cutoff: 1800, vib: 12, vibRate: 6, partials: [[2, 0.12]] });
        e.voice(p.r, t, p.f(m.d, 1), { ...MARIMBA, vol: 0.06 });
      }
      if (part === 2 && s % 2 === 0) e.voice(s % 4 ? p.r : p.l, t, p.f(ch[[0, 1, 2, 1][s / 2]], 1), { ...MARIMBA, vol: 0.09 });
      if (s === 0) lavaAmbience(p, t, p.stepDur * 8, 1);
    },
  },

  // Magma Heart: heavy and driving A phrygian, a deep rumbling bass, toms and lots of bubbling lava
  magma: {
    bpm: 132, spb: 16, key: 57, scale: PHRYGIAN, gain: 0.68, send: 0.2, loop: 8,
    chords: [[1, 3, 5], [2, 4, 6], [1, 3, 5], [7, 9, 11], [6, 8, 10], [7, 9, 11], [2, 4, 6], [1, 3, 5]],
    mel: melody(
      '1 . . 3 2 . 1 .', '2 - 3 - 5 - 3 .', '1 . . 3 2 . 1 0', '6 - 7 - 8 - . .',
      '8 . 7 . 6 . 7 .', '9 - 8 - 7 - 6 .', '5 . 6 . 7 . 9 .', '8 - - - . . . .',
    ),
    setup(p) {
      p.eng.bed(p, 'lowpass', 80, 0.026);
      p.eng.bed(p, 'lowpass', 320, 0.004);
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), part = pass % 3;
      if (s === 0) {
        pad(p, ch, t, p.stepDur * 16, 0.012, { type: 'sawtooth', a: 0.4, cutoff: 650, unison: 9 });
        e.voice(p.c, t, p.f(ch[0], -2), { type: 'sine', vol: 0.11, a: 0.05, hold: p.stepDur * 14, rel: 0.3 }); // sub
      }
      const bd = s % 8 === 7 ? ch[1] : ch[0];
      e.voice(p.c, t, p.f(bd, s % 4 === 0 ? -2 : -1), { type: 'sawtooth', vol: s % 4 === 0 ? 0.07 : 0.045, tau: 0.05, cutoff: 420, q: 2 });
      if (s === 0 || s === 6 || s === 8 || s === 11) e.kick(p.c, t, 0.24, 115, 40, 0.09);
      if (s === 8) snare(p, t, 0.065);
      if (s === 4 || s === 12) e.kick(s === 4 ? p.l : p.r, t, 0.12, 170, 90, 0.07); // low toms
      if (s % 4 === 2) hat(p, t, 0.016);
      if (bar % 2 === 1 && s >= 13) e.kick(s % 2 ? p.l : p.r, t, 0.12, 200 - s * 6, 90, 0.05);
      const m = p.mel(bar, s);
      if (m && part !== 2) {
        e.voice(p.c, t, p.f(m.d), { type: 'sawtooth', vol: 0.035, a: 0.01, hold: Math.max(0.05, m.len * 0.7), rel: 0.1, cutoff: 1500, unison: 6 });
        e.voice(p.c, t, p.f(m.d, -1), { ...MARIMBA, vol: 0.08 });
        if (part === 1) e.voice(p.r, t, p.f(m.d, 1), { ...GLOCK, vol: 0.035 });
      }
      if (part === 2 && s % 4 === 0) e.voice(p.l, t, p.f(ch[[0, 1, 2, 1][s / 4]]), { ...MARIMBA, vol: 0.1 });
      if (s === 0) lavaAmbience(p, t, p.stepDur * 16, 1.6);
      if (s === 8 && chance(0.3)) e.voice(chance(0.5) ? p.l : p.r, t + rand(0, 0.3), rand(45, 70), { type: 'sine', glide: 0.6, glideT: 0.15, vol: 0.07, a: 0.02, tau: 0.12 }); // a deep glorp
    },
  },

  // ——— the Aether Citadel ———
  // Cogwork Bastion: bright F major clockwork, tick-tock percussion, music box and brass stabs, steam puffs
  cogwork: {
    bpm: 124, spb: 8, key: 65, scale: MAJOR, gain: 0.9, send: 0.2, loop: 8,
    chords: [[1, 3, 5], [5, 7, 9], [6, 8, 10], [4, 6, 8], [1, 3, 5], [2, 4, 6], [4, 6, 8], [5, 7, 9]],
    mel: melody(
      '1 3 5 8 - 5 3 .', '2 . 5 . 7 - 5 .', '3 5 8 10 - 8 6 .', '4 - 6 - 8 - . .',
      '5 . 3 . 1 . 3 5', '6 . 4 . 2 . 4 6', '4 . 6 . 8 . 9 .', '8 - 7 - 5 - . .',
    ),
    setup(p) {
      p.eng.bed(p, 'highpass', 7000, 0.003);
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), part = pass % 3;
      if (s === 0) pad(p, ch, t, p.stepDur * 8, 0.011, { cutoff: 1300 });
      clockTick(p, t, s % 2 === 0, s % 2 ? 0.018 : 0.026); // tick-tock on every step
      if (s === 7 && bar % 2) for (let i = 1; i < 3; i++) clockTick(p, t + i * p.stepDur / 3, true, 0.015); // a ratchet
      const bass = { 0: [ch[0], -2], 2: [ch[2], -2], 4: [ch[0], -1], 6: [ch[2], -2] }[s];
      if (bass) e.voice(p.c, t, p.f(bass[0], bass[1]), { type: 'triangle', vol: 0.17, tau: 0.09, cutoff: 900 });
      if (s === 0 || s === 4) e.kick(p.c, t, 0.15, 120, 50, 0.06);
      if (s === 2 || s === 6) clank(p, t, 0.035, s === 2 ? p.l : p.r);
      if ((s === 0 && bar % 2 === 0) || (s === 5 && bar % 4 === 3)) { // brass stab
        for (const d of ch) e.voice(p.c, t, p.f(d), { type: 'sawtooth', vol: 0.02, a: 0.015, hold: 0.1, rel: 0.12, cutoff: 1700, unison: 7 });
      }
      const m = p.mel(bar, s);
      if (m && part !== 2) {
        e.voice(p.r, t, p.f(m.d, 1), { ...GLOCK, vol: 0.07, tau: 0.3 }); // music box
        if (part === 1) e.voice(p.c, t, p.f(m.d), { type: 'sawtooth', vol: 0.03, a: 0.02, hold: Math.max(0.05, m.len * 0.7), rel: 0.1, cutoff: 1800, unison: 6 });
      }
      if (part === 2) e.voice(s % 2 ? p.r : p.l, t, p.f(ch[[0, 1, 2, 1, 0, 2, 1, 2][s]], 1), { ...GLOCK, vol: 0.04, tau: 0.25 });
      if (s === 0 && chance(0.4)) { // a puff of steam from a pipe
        e.noiseHit(chance(0.5) ? p.l : p.r, t + rand(0, p.stepDur * 8), { type: 'highpass', f: 3500, sweep: 1500, sweepT: 0.3, vol: 0.014, a: 0.03, hold: 0.1, tau: 0.1 });
      }
    },
  },

  // Chrono Spire: slow, airy and mysterious (D dorian #4), drifting harp-bell arpeggios and a faint ticking
  spire: {
    bpm: 72, spb: 8, key: 62, scale: DORIAN_4, gain: 0.6, send: 0.55, loop: 8,
    chords: [[1, 3, 5, 7], [4, 6, 8, 10], [2, 4, 6, 8], [1, 3, 5, 7], [6, 8, 10, 12], [4, 6, 8, 10], [7, 9, 11, 13], [5, 7, 9, 11]],
    mel: melody(
      '5 - - - 4 - 3 -', '4 - - - 6 - - -', '8 - - - 7 - 6 -', '5 - - - - - . .',
      '3 - - - 4 - 5 -', '6 - - - 8 - - -', '7 - - - 9 - 7 -', '5 - - - - - . .',
    ),
    setup(p) {
      p.eng.bed(p, 'highpass', 4500, 0.004);
      p.eng.bed(p, 'bandpass', 1500, 0.004, 3); // a thin airy whistle
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), part = pass % 3;
      if (s === 0) {
        for (const d of ch.slice(0, 3)) e.voice(p.c, t, p.f(d), { type: 'triangle', vol: 0.014, a: 1.2, hold: p.stepDur * 7, rel: 1.2, cutoff: 1100, unison: 8, vib: 9, vibRate: 4 });
        e.voice(p.c, t, p.f(ch[0], -2), { type: 'sine', vol: 0.09, a: 0.6, hold: p.stepDur * 7, rel: 1.2 });
      }
      const arp = [0, 1, 2, 3, 4, 3, 2, 1][s], d = ch[arp % 4] + 7 * Math.floor(arp / 4);
      e.voice(s % 2 ? p.r : p.l, t, p.f(d), { ...GLOCK, vol: 0.032, tau: 0.55 });
      if (s % 2 === 0) clockTick(p, t, s % 4 === 0, 0.008);
      const m = p.mel(bar, s);
      if (m && part === 0) e.voice(p.c, t, p.f(m.d, 1), { type: 'triangle', vol: 0.045, a: 0.2, hold: m.len * 0.8, rel: 0.8, cutoff: 2000, vib: 12, vibRate: 4.5 });
      if (m && part === 1) e.voice(p.c, t, p.f(m.d, 1), { ...GLOCK, vol: 0.055, tau: 0.9 });
      if (s === 0 && chance(0.4)) e.voice(chance(0.5) ? p.l : p.r, t + rand(0, p.stepDur * 8), rand(2800, 4000), { ...GLOCK, vol: 0.012, tau: 0.4 });
    },
  },

  // ——— Caldera / Citadel dens ———
  // Ignis the Magma Tyrant: a thunderous forge in E phrygian dominant, anvils on the backbeat
  ignis: {
    bpm: 138, spb: 16, key: 52, scale: PHRYG_DOM, gain: 0.8, send: 0.2, loop: 8,
    chords: [[1, 3, 5], [2, 4, 6], [1, 3, 5], [7, 9, 11], [6, 8, 10], [2, 4, 6], [5, 7, 9], [1, 3, 5]],
    mel: melody(
      '1 . 1 . 2 . 3 .', '2 . 1 . 0 . 1 .', '5 . 4 . 3 . 2 .', '2 - - - 1 - . .',
      '8 . 8 . 9 . 10 .', '9 . 8 . 7 . 6 .', '5 . 6 . 7 . 9 .', '8 - - - . . . .',
    ),
    setup(p) {
      p.eng.bed(p, 'lowpass', 90, 0.022);
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), hot = e.intensity > 0.5;
      if (s === 0) pad(p, ch, t, p.stepDur * 16, 0.012, { type: 'sawtooth', a: 0.2, cutoff: 700, unison: 9 });
      const bd = s % 8 === 6 ? ch[2] : [ch[0], ch[0], ch[0] + 7, ch[0]][s % 4];
      e.voice(p.c, t, p.f(bd, -1), { type: 'square', vol: s % 4 === 0 ? 0.075 : 0.05, tau: 0.045, cutoff: 480 });
      if (s === 0 || s === 3 || s === 8 || s === 10 || (hot && s % 4 === 0)) e.kick(p.c, t, 0.24, 120, 38, 0.1); // thunder
      if (s === 4 || s === 12) { // hammer on the anvil
        anvil(e, p.r, t, 1180, 0.045, 0.2);
        e.noiseHit(p.c, t, { f: 2200, q: 0.8, vol: 0.05, tau: 0.04 });
      }
      if (hot && (s === 14 || s === 7)) anvil(e, p.l, t, 1320, 0.035, 0.15);
      if (s % 2 === 0) hat(p, t, s % 4 ? 0.02 : 0.012);
      if (hot && s % 2) shaker(p, t, 0.018);
      if (bar % 2 === 1 && s >= 12) e.kick(s % 2 ? p.l : p.r, t, 0.13, 220 - s * 7, 90, 0.06);
      const m = p.mel(bar, s);
      if (m && pass % 4 !== 3) {
        e.voice(p.c, t, p.f(m.d), { ...PLUCK, type: 'sawtooth', vol: 0.06, tau: 0.13, cutoff: 1900, partials: [[2, 0.12]] });
        if (hot || pass % 2) e.voice(p.l, t, p.f(m.d, 1), { type: 'square', vol: 0.03, a: 0.005, hold: Math.max(0.04, m.len * 0.6), rel: 0.05, cutoff: 2400 });
      }
      if (pass % 4 === 3 && s % 4 === 0) e.voice(p.r, t, p.f(ch[[0, 1, 2, 1][s / 4]], 1), { ...MARIMBA, vol: 0.09 });
      if (s === 0) lavaAmbience(p, t, p.stepDur * 16, 1);
    },
  },

  // Pyra the Ember Phoenix: soaring and fiery D minor, a long vibrato lead flying over quick glock arps
  pyra: {
    bpm: 152, spb: 8, key: 62, scale: MINOR, gain: 0.8, send: 0.3, loop: 8,
    chords: [[1, 3, 5], [6, 8, 10], [7, 9, 11], [5, 7, 9], [1, 3, 5], [6, 8, 10], [4, 6, 8], [5, 7, 9]],
    mel: melody(
      '5 - - - 8 - - -', '10 - 9 - 8 - 6 -', '7 - - - 9 - 11 -', '12 - - - - - 10 -',
      '8 - - - 10 - 12 -', '13 - 12 - 10 - 8 -', '11 - 10 - 8 - 6 -', '8 - - - - - . .',
    ),
    setup(p) {
      p.eng.bed(p, 'bandpass', 800, 0.006, 0.6); // the roar of the fire below
      p.eng.bed(p, 'lowpass', 120, 0.01);
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), hot = e.intensity > 0.5;
      if (s === 0) for (const d of ch) e.voice(p.c, t, p.f(d), { type: 'triangle', vol: 0.014, a: 0.3, hold: p.stepDur * 7, rel: 0.5, cutoff: 1400, unison: 9, vib: 8, vibRate: 4.5 });
      e.voice(p.c, t, p.f(s % 4 === 3 ? ch[2] : ch[0], -2), { type: 'square', vol: s % 2 ? 0.05 : 0.07, tau: 0.05, cutoff: 560 });
      const arp = [0, 1, 2, 3, 2, 1, 2, 3][s], ad = ch[arp % 3] + 7 * Math.floor(arp / 3);
      e.voice(s % 2 ? p.r : p.l, t, p.f(ad, 1), { ...GLOCK, vol: 0.035, tau: 0.18 });
      if (s === 0 || s === 4 || (hot && (s === 3 || s === 7))) e.kick(p.c, t, 0.22, 125, 45, 0.08);
      if (s === 2 || s === 6) snare(p, t, 0.065);
      if (s % 2) hat(p, t, 0.022);
      if (hot) shaker(p, t, 0.014);
      if (bar % 4 === 3 && s >= 4) e.kick(s % 2 ? p.l : p.r, t, 0.13, 240 - s * 12, 110, 0.06);
      const m = p.mel(bar, s);
      if (m && pass % 3 !== 2) {
        const hold = Math.max(0.06, m.len * 0.85);
        e.voice(p.c, t, p.f(m.d), { type: 'triangle', vol: 0.07, a: 0.03, hold, rel: 0.2, cutoff: 2600, vib: 16, vibRate: 5.5 });
        e.voice(p.c, t, p.f(m.d), { type: 'square', vol: 0.025, a: 0.03, hold, rel: 0.2, cutoff: 2000, vib: 16, vibRate: 5.5 });
        if (hot || pass % 3 === 1) e.voice(p.r, t, p.f(m.d, 1), { ...GLOCK, vol: 0.045, tau: 0.35 });
      }
      if (pass % 3 === 2 && s % 2 === 0) e.voice(p.l, t, p.f(ch[[0, 1, 2, 1][s / 2]]), { ...PLUCK, vol: 0.08, tau: 0.2 });
      if (s === 0 && chance(0.5)) crackle(e, chance(0.5) ? p.l : p.r, t + rand(0, p.stepDur * 8), 3, 0.012);
    },
  },

  // The Clockwork Colossus: an industrial march in G harmonic minor, chugging bass, presses and steam
  colossus: {
    bpm: 108, spb: 16, key: 55, scale: HARM_MINOR, gain: 0.8, send: 0.2, loop: 8,
    chords: [[1, 3, 5], [1, 3, 5], [6, 8, 10], [5, 7, 9], [1, 3, 5], [4, 6, 8], [5, 7, 9], [5, 7, 9]],
    mel: melody(
      '1 - . 1 3 - 5 -', '5 - 4 - 3 - 2 -', '3 - . 3 5 - 8 -', '7 - - - 5 - . .',
      '8 - . 8 7 - 6 -', '6 - 5 - 4 - 3 -', '2 - 3 - 4 - 5 -', '5 - - - 7 - - -',
    ),
    setup(p) {
      p.eng.bed(p, 'lowpass', 120, 0.016);
      p.eng.bed(p, 'highpass', 3500, 0.002);
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), hot = e.intensity > 0.5;
      if (s === 0 || (hot && s === 8)) { // brass stab
        for (const d of ch) e.voice(p.c, t, p.f(d), { type: 'sawtooth', vol: 0.022, a: 0.02, hold: 0.18, rel: 0.2, cutoff: 1500, unison: 8 });
      }
      if (s === 0) pad(p, ch, t, p.stepDur * 16, 0.009, { type: 'sawtooth', a: 0.3, cutoff: 600, unison: 9 });
      if (s % 2 === 0 || hot) e.voice(p.c, t, p.f(ch[0], -2), { type: 'square', vol: s % 4 === 0 ? 0.075 : 0.045, tau: 0.04, cutoff: 500 }); // the chug
      if (s === 0 || s === 8 || (hot && (s === 6 || s === 14))) e.kick(p.c, t, 0.24, 115, 40, 0.1);
      if (s === 4 || s === 12) snare(p, t, 0.07);
      if (s === 14 || s === 15 || (hot && s % 2)) snare(p, t, s >= 14 ? 0.035 : 0.016); // side-drum roll / ghosts
      if (s === 2 || s === 10) clank(p, t, 0.05, s === 2 ? p.l : p.r); // the press
      if (s === 6 && bar % 2) e.noiseHit(p.r, t, { type: 'highpass', f: 3000, sweep: 1500, sweepT: 0.2, vol: 0.03, a: 0.01, tau: 0.06 }); // piston hiss
      if (s % 4 === 2) hat(p, t, 0.014);
      if (hot && s % 4 === 0) clockTick(p, t, s % 8 === 0, 0.022);
      const m = p.mel(bar, s);
      if (m && pass % 4 !== 3) {
        const hold = Math.max(0.05, m.len * 0.75);
        e.voice(p.c, t, p.f(m.d), { type: 'sawtooth', vol: 0.04, a: 0.02, hold, rel: 0.1, cutoff: 1800, unison: 6 });
        e.voice(p.c, t, p.f(m.d, -1), { type: 'triangle', vol: 0.06, a: 0.01, hold, rel: 0.1, cutoff: 1200 });
        if (hot || pass % 2) e.voice(p.r, t, p.f(m.d, 1), { ...GLOCK, vol: 0.04, tau: 0.25 });
      }
      if (pass % 4 === 3 && s % 4 === 0) e.voice(p.r, t, p.f(ch[[0, 1, 2, 1][s / 4]], 1), { ...GLOCK, vol: 0.06, tau: 0.3 });
    },
  },

  // Chronos, Keeper of Hours: the hardest fight, C# harmonic minor at full tilt, driven by ticking clocks,
  // a tolling bell every phrase, choir, arps and a doubled heroic lead
  chronos: {
    bpm: 168, spb: 16, key: 61, scale: HARM_MINOR, gain: 0.8, send: 0.3, loop: 16,
    chords: [[1, 3, 5], [6, 8, 10], [4, 6, 8], [5, 7, 9], [1, 3, 5], [6, 8, 10], [2, 4, 6], [5, 7, 9],
      [6, 8, 10], [4, 6, 8], [1, 3, 5], [5, 7, 9], [6, 8, 10], [7, 9, 11], [5, 7, 9], [1, 3, 5]],
    mel: melody(
      '5 - 8 - 7 - 5 -', '6 - - 8 10 - 8 -', '6 - 4 - 8 - 6 -', '7 - - - 9 - 7 -',
      '8 - 7 - 8 - 12 -', '10 - - 8 6 - 8 -', '9 - 8 - 6 - 4 -', '7 - - - - - . .',
      '10 . 10 . 12 - 10 .', '8 . 8 . 10 - 8 .', '8 . 10 . 12 - 13 .', '14 - - - 12 - 11 -',
      '12 - - - 13 - 12 -', '11 - - - 9 - 7 -', '9 - 11 - 12 - 14 -', '15 - - - - - . .',
    ),
    setup(p) {
      p.eng.bed(p, 'lowpass', 100, 0.018);
      p.eng.bed(p, 'highpass', 6500, 0.003);
    },
    play(p, bar, s, t, pass) {
      const e = p.eng, ch = p.chord(bar), hot = e.intensity > 0.5;
      if (s === 0) for (const d of ch) e.voice(p.c, t, p.f(d), { type: 'triangle', vol: 0.014, a: 0.3, hold: p.stepDur * 15, rel: 0.6, cutoff: 1400, unison: 9, vib: 8, vibRate: 4.5 });
      if (s === 0 && bar % 4 === 0) anvil(e, p.c, t, p.f(1, -1), 0.06, 0.6); // the bell tolls
      if (s % 4 === 0 || (hot && s % 2 === 0)) clockTick(p, t, s % 8 === 0, 0.028);
      if (hot && s % 2) clockTick(p, t, false, 0.012);
      const bd = s % 8 === 6 ? ch[2] : [ch[0], ch[0], ch[0] + 7, ch[0]][s % 4];
      e.voice(p.c, t, p.f(bd, -2), { type: 'square', vol: s % 4 === 0 ? 0.075 : 0.05, tau: 0.04, cutoff: 560 });
      const arp = [0, 1, 2, 3][s % 4], ad = ch[arp % 3] + 7 * Math.floor(arp / 3);
      if (s % 2 === 0 || hot) e.voice(s % 4 < 2 ? p.l : p.r, t, p.f(ad, 1), { type: 'sawtooth', vol: hot ? 0.016 : 0.018, tau: 0.06, cutoff: 2200 });
      if (s % 4 === 0 || s === 10 || (hot && s % 2 === 0)) e.kick(p.c, t, 0.22, 125, 42, 0.08);
      if (s === 4 || s === 12) snare(p, t, 0.07);
      if (hot && s === 15) snare(p, t, 0.035);
      if (s % 2 === 0) hat(p, t, s % 4 ? 0.022 : 0.012);
      if (hot && s % 2) shaker(p, t, 0.016);
      if (bar % 4 === 3 && s >= 8 && s % 2 === 0) e.kick(s % 4 ? p.l : p.r, t, 0.14, 240 - s * 7, 110, 0.06);
      if (bar % 8 === 7 && s === 0) e.noiseHit(p.c, t, { f: 400, sweep: 5000, sweepT: p.stepDur * 16, q: 1.5, vol: 0.03, a: p.stepDur * 15, tau: 0.03 }); // riser
      const m = p.mel(bar, s);
      if (m && pass % 3 !== 2) {
        const hold = Math.max(0.05, m.len * 0.8);
        e.voice(p.c, t, p.f(m.d), { type: 'square', vol: 0.04, a: 0.01, hold, rel: 0.12, cutoff: 2400, vib: 10, vibRate: 5.5 });
        e.voice(p.c, t, p.f(m.d, -1), { type: 'triangle', vol: 0.06, a: 0.01, hold, rel: 0.12, cutoff: 1500 });
        if (hot || pass % 3 === 1) e.voice(p.r, t, p.f(m.d, 1), { ...GLOCK, vol: 0.045, tau: 0.3 });
      }
      if (pass % 3 === 2 && s % 4 === 0) e.voice(p.r, t, p.f(ch[[0, 1, 2, 1][s / 4]], 1), { ...GLOCK, vol: 0.06, tau: 0.4 });
    },
  },
};

// ——— sound effects: (eng, out, t) ———
const EFFECTS = {
  slap(e, o, t) {
    e.noiseHit(o, t, { f: 1300, q: 0.9, vol: 0.5, tau: 0.035 });
    e.kick(o, t, 0.35, 260, 110, 0.04);
  },
  swing(e, o, t) {
    e.noiseHit(o, t, { f: 500, sweep: 3200, sweepT: 0.16, q: 1.4, vol: 0.8, a: 0.06, tau: 0.05 });
  },
  // a staff's little bolt: a bright chirp and a puff of air (lighter than the Magic Bolt skill)
  staffBolt(e, o, t) {
    e.voice(o, t, 900, { type: 'sine', glide: 1.8, glideT: 0.08, vol: 0.14, tau: 0.06 });
    e.voice(o, t + 0.01, 1800, { type: 'triangle', glide: 1.4, glideT: 0.06, vol: 0.06, tau: 0.05 });
    e.noiseHit(o, t, { type: 'highpass', f: 3000, vol: 0.12, a: 0.01, tau: 0.04 });
  },
  hit(e, o, t) {
    e.kick(o, t, 0.5, 200, 70, 0.06);
    e.noiseHit(o, t, { type: 'lowpass', f: 900, vol: 0.3, tau: 0.03 });
    e.voice(o, t, 420, { type: 'triangle', glide: 1.4, glideT: 0.06, vol: 0.12, tau: 0.04 });
  },
  crit(e, o, t) {
    e.kick(o, t, 0.6, 240, 60, 0.08);
    e.noiseHit(o, t, { type: 'lowpass', f: 1400, vol: 0.4, tau: 0.04 });
    [1568, 2093, 2637, 3136].forEach((f, i) => e.voice(o, t + 0.03 + i * 0.035, f, { ...GLOCK, vol: 0.12, tau: 0.12 }));
  },
  mobDie(e, o, t) {
    e.voice(o, t, 1100, { type: 'sine', glide: 0.35, glideT: 0.05, vol: 0.3, tau: 0.04 });
    e.noiseHit(o, t + 0.04, { type: 'lowpass', f: 2500, sweep: 250, sweepT: 0.3, vol: 0.25, a: 0.02, tau: 0.09 });
    e.voice(o, t + 0.1, 1760, { ...GLOCK, vol: 0.06, tau: 0.15 });
  },
  hurt(e, o, t) {
    e.voice(o, t, 190, { type: 'triangle', glide: 1.8, glideT: 0.14, vol: 0.35, a: 0.01, tau: 0.08, cutoff: 1200 });
    e.voice(o, t, 620, { type: 'sine', glide: 1.2, glideT: 0.05, vol: 0.15, tau: 0.04 });
  },
  faint(e, o, t) {
    [76, 72, 69, 65].forEach((m, i) => {
      const last = i === 3;
      e.voice(o, t + i * 0.2, mtof(m), {
        type: 'triangle', vol: 0.2, a: 0.01, hold: last ? 0.4 : 0.12, rel: last ? 0.6 : 0.12,
        cutoff: 2000, vib: last ? 25 : 0, vibRate: 6,
      });
    });
  },
  pickup(e, o, t) {
    e.voice(o, t, 880, { type: 'square', vol: 0.14, tau: 0.03, cutoff: 3000 });
    e.voice(o, t + 0.05, 1320, { type: 'square', vol: 0.14, tau: 0.05, cutoff: 3000 });
  },
  coin(e, o, t) {
    e.voice(o, t, 988, { type: 'sine', vol: 0.18, tau: 0.04, partials: [[2.7, 0.2]] });
    e.voice(o, t + 0.06, 1319, { type: 'sine', vol: 0.2, tau: 0.16, partials: [[2.7, 0.2], [5.1, 0.05]] });
  },
  levelup(e, o, t) {
    [72, 76, 79, 84].forEach((m, i) => e.voice(o, t + i * 0.08, mtof(m), { type: 'triangle', vol: 0.18, tau: 0.12, partials: [[2, 0.2]] }));
    for (const m of [84, 88, 91]) e.voice(o, t + 0.34, mtof(m), { type: 'triangle', vol: 0.09, a: 0.02, hold: 0.3, rel: 0.5, partials: [[2, 0.15]], vib: 10 });
    [96, 100, 103].forEach((m, i) => e.voice(o, t + 0.42 + i * 0.07, mtof(m), { ...GLOCK, vol: 0.05, tau: 0.2 }));
  },
  equip(e, o, t) {
    e.noiseHit(o, t, { type: 'highpass', f: 3000, vol: 0.25, tau: 0.012 });
    e.noiseHit(o, t + 0.07, { type: 'highpass', f: 2200, vol: 0.2, tau: 0.015 });
    e.voice(o, t + 0.07, 1850, { type: 'sine', vol: 0.08, tau: 0.08, partials: [[2.4, 0.4], [3.9, 0.2]] });
  },
  potion(e, o, t) {
    for (let i = 0; i < 3; i++) e.voice(o, t + i * 0.08, 220 + i * 60, { type: 'sine', glide: 0.6, glideT: 0.05, vol: 0.25, tau: 0.04 });
    [1319, 1760, 2349].forEach((f, i) => e.voice(o, t + 0.28 + i * 0.06, f, { ...GLOCK, vol: 0.07, tau: 0.18 }));
  },
  door(e, o, t) {
    e.noiseHit(o, t, { type: 'lowpass', f: 350, sweep: 1600, sweepT: 0.2, vol: 0.2, a: 0.12, tau: 0.1 });
    e.voice(o, t + 0.08, 1319, { ...GLOCK, vol: 0.06, tau: 0.3 });
    e.voice(o, t + 0.18, 988, { ...GLOCK, vol: 0.05, tau: 0.4 });
  },
  jump(e, o, t) {
    e.voice(o, t, 520, { type: 'sine', glide: 0.55, glideT: 0.07, vol: 0.06, tau: 0.04 });
  },
  error(e, o, t) {
    e.voice(o, t, 330, { type: 'square', vol: 0.07, a: 0.005, hold: 0.07, rel: 0.05, cutoff: 1200 });
    e.voice(o, t + 0.13, 247, { type: 'square', vol: 0.07, a: 0.005, hold: 0.12, rel: 0.08, cutoff: 1000 });
  },
  // ——— skills ———
  powerStrike(e, o, t) {
    e.noiseHit(o, t, { f: 300, sweep: 2600, sweepT: 0.2, q: 1.2, vol: 0.5, a: 0.08, tau: 0.06 });
    e.kick(o, t + 0.1, 0.4, 160, 45, 0.1);
    e.noiseHit(o, t + 0.1, { type: 'lowpass', f: 700, vol: 0.3, tau: 0.05 });
  },
  whirlwind(e, o, t) {
    [500, 700, 950, 1300].forEach((f, i) => {
      e.noiseHit(o, t + i * 0.11, { f, sweep: f * 2.6, sweepT: 0.1, q: 1.6, vol: 0.55, a: 0.05, tau: 0.04 });
    });
  },
  bolt(e, o, t) {
    e.voice(o, t, 600, { type: 'sawtooth', glide: 0.4, glideT: 0.12, vol: 0.14, tau: 0.07, cutoff: 3500, vib: 60, vibRate: 30 });
    e.voice(o, t, 1200, { type: 'sine', glide: 0.5, glideT: 0.1, vol: 0.2, tau: 0.08 });
    e.noiseHit(o, t, { type: 'highpass', f: 4000, vol: 0.12, a: 0.01, tau: 0.05 });
  },
  boltHit(e, o, t) {
    e.kick(o, t, 0.35, 260, 90, 0.05);
    e.noiseHit(o, t, { f: 3000, sweep: 800, sweepT: 0.15, q: 0.8, vol: 0.3, tau: 0.05 });
    [2093, 2794, 3520].forEach((f, i) => e.voice(o, t + 0.02 + i * 0.03, f, { ...GLOCK, vol: 0.09, tau: 0.1 }));
  },
  heal(e, o, t) {
    [67, 71, 74, 79].forEach((m, i) => e.voice(o, t + i * 0.09, mtof(m), { type: 'triangle', vol: 0.12, a: 0.02, tau: 0.3, partials: [[2, 0.25]] }));
    e.voice(o, t + 0.3, mtof(86), { ...GLOCK, vol: 0.06, tau: 0.4 });
  },
  nova(e, o, t) {
    e.noiseHit(o, t, { type: 'highpass', f: 2500, sweep: 7000, sweepT: 0.3, vol: 0.25, a: 0.02, tau: 0.12 });
    e.kick(o, t, 0.3, 200, 70, 0.07);
    [88, 95, 91, 98, 100].forEach((m, i) => e.voice(o, t + 0.03 + i * 0.045, mtof(m), { ...GLOCK, vol: 0.06, tau: 0.25, vib: 15, vibRate: 9 }));
  },
  buff(e, o, t) {
    e.voice(o, t, 110, { type: 'sawtooth', glide: 0.5, glideT: 0.35, vol: 0.12, a: 0.05, hold: 0.25, rel: 0.12, cutoff: 900, unison: 12 });
    e.noiseHit(o, t, { f: 400, sweep: 2000, sweepT: 0.35, q: 1.5, vol: 0.3, a: 0.25, tau: 0.06 });
    e.voice(o, t + 0.32, 440, { type: 'square', vol: 0.06, tau: 0.1, cutoff: 2500 });
    e.voice(o, t + 0.32, 660, { type: 'square', vol: 0.05, tau: 0.12, cutoff: 2500 });
  },
  skillUp(e, o, t) {
    e.voice(o, t, mtof(88), { ...GLOCK, vol: 0.14, tau: 0.25 });
    e.voice(o, t + 0.07, mtof(95), { ...GLOCK, vol: 0.11, tau: 0.35 });
  },
  noMana(e, o, t) {
    e.voice(o, t, 700, { type: 'sine', glide: 1.5, glideT: 0.2, vol: 0.1, a: 0.01, tau: 0.08, vib: 40, vibRate: 18 });
    e.noiseHit(o, t + 0.05, { f: 2500, sweep: 600, sweepT: 0.2, q: 2, vol: 0.12, a: 0.02, tau: 0.06 });
  },
  reset(e, o, t) {
    [3136, 2637, 2093, 1568, 1319].forEach((f, i) => e.voice(o, t + i * 0.05, f, { ...GLOCK, vol: 0.06, tau: 0.12 }));
    e.noiseHit(o, t, { f: 3000, sweep: 400, sweepT: 0.3, q: 1.2, vol: 0.35, a: 0.08, tau: 0.08 });
  },
  mpPotion(e, o, t) {
    for (let i = 0; i < 3; i++) e.voice(o, t + i * 0.08, 330 + i * 90, { type: 'sine', glide: 0.6, glideT: 0.05, vol: 0.22, tau: 0.04 });
    [1760, 2349, 2794, 3520].forEach((f, i) => e.voice(o, t + 0.26 + i * 0.05, f, { ...GLOCK, vol: 0.06, tau: 0.2, vib: 12, vibRate: 7 }));
  },
  // ——— bosses ———
  bossRoar(e, o, t) {
    e.voice(o, t, 140, { type: 'sawtooth', glide: 1.5, glideT: 0.15, vol: 0.22, a: 0.06, hold: 0.45, rel: 0.25, cutoff: 1100, unison: 14, vib: 45, vibRate: 9 });
    e.voice(o, t, 280, { type: 'sine', glide: 1.3, glideT: 0.15, vol: 0.12, a: 0.06, hold: 0.4, rel: 0.2, vib: 45, vibRate: 9 });
    e.noiseHit(o, t, { f: 700, sweep: 350, sweepT: 0.6, q: 1.2, vol: 0.25, a: 0.08, hold: 0.35, tau: 0.1 });
  },
  bossSlam(e, o, t) {
    e.kick(o, t, 0.6, 120, 32, 0.2);
    e.noiseHit(o, t, { type: 'lowpass', f: 500, sweep: 120, sweepT: 0.4, vol: 0.35, tau: 0.14 });
    e.noiseHit(o, t + 0.04, { type: 'highpass', f: 2500, vol: 0.12, tau: 0.04 });
  },
  bossWarn(e, o, t) {
    e.voice(o, t, 880, { type: 'square', glide: 0.5, glideT: 0.25, vol: 0.08, a: 0.01, hold: 0.22, rel: 0.06, cutoff: 2500 });
    e.voice(o, t, 1760, { type: 'sine', glide: 0.5, glideT: 0.25, vol: 0.05, a: 0.01, hold: 0.22, rel: 0.06 });
  },
  fieldBoss(e, o, t) { // a field boss turned up: a little two-note horn call, twice
    [[0, 62, 0.16], [0.2, 69, 0.3], [0.62, 62, 0.16], [0.82, 69, 0.42]].forEach(([dt, m, hold]) => {
      e.voice(o, t + dt, mtof(m), { type: 'sawtooth', vol: 0.07, a: 0.03, hold, rel: 0.12, cutoff: 1500 });
      e.voice(o, t + dt, mtof(m - 12), { type: 'sine', vol: 0.1, a: 0.03, hold, rel: 0.12 });
    });
  },
  bossCharge(e, o, t) {
    e.noiseHit(o, t, { type: 'lowpass', f: 180, sweep: 700, sweepT: 0.5, vol: 0.5, a: 0.1, hold: 0.35, tau: 0.08 });
    e.voice(o, t, 55, { type: 'sawtooth', glide: 0.8, glideT: 0.4, vol: 0.14, a: 0.08, hold: 0.4, rel: 0.12, cutoff: 400, vib: 60, vibRate: 12 });
    for (let i = 0; i < 4; i++) e.kick(o, t + i * 0.13, 0.3, 90, 40, 0.06);
  },
  thornRain(e, o, t) {
    for (let i = 0; i < 6; i++) {
      const tt = t + i * 0.09 + rand(0, 0.04), f = rand(1800, 2600);
      e.voice(o, tt, f, { type: 'sine', glide: 1.3, glideT: 0.02, vol: 0.035, a: 0.01, tau: 0.04 }); // whistle down
      e.voice(o, tt + 0.03, f * 0.5, { type: 'sine', glide: 1.6, glideT: 0.1, vol: 0.03, tau: 0.04 });
      e.kick(o, tt + 0.16, 0.14, 300, 140, 0.03); // soft thunk
      e.noiseHit(o, tt + 0.16, { f: 3000, vol: 0.06, tau: 0.015 });
    }
  },
  summon(e, o, t) {
    e.noiseHit(o, t, { f: 300, sweep: 3000, sweepT: 0.25, q: 2, vol: 0.4, a: 0.15, tau: 0.05 });
    e.voice(o, t + 0.22, 500, { type: 'sine', glide: 0.4, glideT: 0.05, vol: 0.25, tau: 0.05 });
    [1568, 2349].forEach((f, i) => e.voice(o, t + 0.27 + i * 0.05, f, { ...GLOCK, vol: 0.06, tau: 0.15 }));
  },
  bossDie(e, o, t) {
    e.kick(o, t, 0.45, 150, 40, 0.15);
    e.noiseHit(o, t, { type: 'lowpass', f: 3000, sweep: 200, sweepT: 0.6, vol: 0.25, a: 0.02, tau: 0.15 });
    // da-da-da daaa, then a held major chord with a sparkle run
    [[67, 0.3], [67, 0.42], [67, 0.54], [72, 0.7]].forEach(([m, dt], i) => {
      e.voice(o, t + dt, mtof(m), { type: 'square', vol: 0.07, a: 0.005, hold: i === 3 ? 0.18 : 0.06, rel: 0.06, cutoff: 2800 });
      e.voice(o, t + dt, mtof(m - 12), { type: 'triangle', vol: 0.12, tau: 0.1 });
    });
    [[70, 0.95], [74, 1.07], [72, 1.25]].forEach(([m, dt], i) => {
      const last = i === 2;
      e.voice(o, t + dt, mtof(m), { type: 'square', vol: 0.07, a: 0.005, hold: last ? 0.5 : 0.08, rel: last ? 0.4 : 0.06, cutoff: 2800, vib: last ? 12 : 0 });
    });
    for (const m of [60, 64, 67, 72]) e.voice(o, t + 1.25, mtof(m), { type: 'triangle', vol: 0.05, a: 0.02, hold: 0.45, rel: 0.5, partials: [[2, 0.15]] });
    e.kick(o, t + 1.25, 0.28, 130, 45, 0.1);
    [84, 88, 91, 96, 100].forEach((m, i) => e.voice(o, t + 1.3 + i * 0.06, mtof(m), { ...GLOCK, vol: 0.05, tau: 0.25 }));
  },

  // ——— mob voices: opts.kind picks the creature (played alongside 'hit'/'crit', so no thump here) ———
  mobHurt(e, o, t, opts = {}) {
    (MOB_HURT[opts.kind] ?? MOB_HURT.generic)(e, o, t);
  },
  mobDeath(e, o, t, opts = {}) {
    (MOB_DEATH[opts.kind] ?? EFFECTS.mobDie)(e, o, t);
  },
  // ——— shop ———
  coinBuy(e, o, t) {
    e.noiseHit(o, t, { type: 'highpass', f: 2500, vol: 0.2, tau: 0.01 }); // ka-
    e.noiseHit(o, t + 0.05, { type: 'highpass', f: 1800, vol: 0.15, tau: 0.012 });
    e.voice(o, t + 0.1, 2093, { type: 'sine', vol: 0.15, tau: 0.35, partials: [[2.4, 0.25], [4.1, 0.08]] }); // -ching
    [1568, 1865, 1661].forEach((f, i) => e.voice(o, t + 0.2 + i * 0.06, f, { type: 'sine', vol: 0.07, tau: 0.04, partials: [[2.7, 0.3]] }));
  },
  coinSell(e, o, t) {
    let tt = t;
    for (let i = 0; i < 6; i++) {
      e.voice(o, tt, rand(1300, 1900), { type: 'sine', vol: 0.09 - i * 0.008, tau: 0.035, partials: [[2.7, 0.3]] });
      tt += 0.09 - i * 0.012;
    }
    e.noiseHit(o, tt + 0.02, { type: 'lowpass', f: 500, vol: 0.25, a: 0.01, tau: 0.05 }); // into the pouch
    e.voice(o, tt + 0.02, 140, { type: 'sine', glide: 1.5, glideT: 0.05, vol: 0.12, tau: 0.05 });
  },
  // ——— boss attacks ———
  ultWarn(e, o, t) { // ~3 s rising build with an accelerating alarm: DANGER
    e.voice(o, t, 220, { type: 'sawtooth', glide: 0.4, glideT: 2.9, vol: 0.09, a: 0.4, hold: 2.5, rel: 0.15, cutoff: 1400, unison: 14 });
    e.voice(o, t, 55, { type: 'sine', glide: 0.7, glideT: 2.9, vol: 0.2, a: 0.5, hold: 2.4, rel: 0.2 });
    e.noiseHit(o, t, { f: 300, sweep: 5000, sweepT: 2.9, q: 1.5, vol: 0.2, a: 2.6, hold: 0.25, tau: 0.05 });
    let tt = t, gap = 0.4, i = 0;
    while (tt < t + 2.95) {
      e.voice(o, tt, i % 2 ? 660 : 880, { type: 'square', vol: 0.05, a: 0.005, hold: Math.min(0.12, gap * 0.45), rel: 0.03, cutoff: 2600 });
      tt += gap;
      gap = Math.max(0.08, gap * 0.86);
      i++;
    }
  },
  ultHit(e, o, t) { // a massive impact
    e.kick(o, t, 0.55, 110, 26, 0.3);
    e.voice(o, t, 40, { type: 'sine', vol: 0.22, a: 0.005, hold: 0.25, rel: 0.6 });
    e.noiseHit(o, t, { type: 'lowpass', f: 4000, sweep: 90, sweepT: 1.2, vol: 0.28, a: 0.005, hold: 0.1, tau: 0.3 });
    crackle(e, o, t + 0.05, 10, 0.08);
  },
  phase(e, o, t) { // phase change: a dramatic minor stab and a short roar
    e.kick(o, t, 0.5, 120, 35, 0.15);
    for (const m of [50, 57, 62, 65]) e.voice(o, t, mtof(m), { type: 'sawtooth', vol: 0.05, a: 0.01, hold: 0.45, rel: 0.5, cutoff: 1600, unison: 10 });
    e.voice(o, t + 0.08, 130, { type: 'sawtooth', glide: 1.4, glideT: 0.15, vol: 0.12, a: 0.05, hold: 0.4, rel: 0.2, cutoff: 1000, unison: 12, vib: 45, vibRate: 9 });
    e.noiseHit(o, t, { type: 'highpass', f: 5000, vol: 0.1, a: 0.005, tau: 0.35 }); // cymbal
  },
  leap(e, o, t) { // a big jump whoosh
    e.noiseHit(o, t, { f: 250, sweep: 2500, sweepT: 0.3, q: 1.3, vol: 0.55, a: 0.12, tau: 0.08 });
    e.voice(o, t, 260, { type: 'sine', glide: 0.4, glideT: 0.2, vol: 0.18, tau: 0.1 });
  },
  // ——— warrior / mage / support skills ———
  cleave(e, o, t) { // a wide heavy slash
    e.noiseHit(o, t, { f: 3000, sweep: 350, sweepT: 0.22, q: 1.2, vol: 0.6, a: 0.04, tau: 0.08 });
    e.voice(o, t + 0.05, 1900, { type: 'sine', vol: 0.05, tau: 0.15, partials: [[2.4, 0.4]] });
    e.kick(o, t + 0.08, 0.3, 140, 50, 0.07);
  },
  bladeStorm(e, o, t) { // a flurry of metallic whooshes
    for (let i = 0; i < 6; i++) {
      const f = 700 + i * 150;
      e.noiseHit(o, t + i * 0.08, { f, sweep: f * 2.5, sweepT: 0.07, q: 1.8, vol: 0.4, a: 0.03, tau: 0.03 });
      e.voice(o, t + i * 0.08 + 0.03, rand(1800, 2600), { type: 'sine', vol: 0.03, tau: 0.06, partials: [[2.4, 0.4]] });
    }
  },
  skySplitter(e, o, t) { // a rising whoosh and a thunder crack
    e.noiseHit(o, t, { f: 400, sweep: 6000, sweepT: 0.25, q: 1.2, vol: 0.4, a: 0.2, tau: 0.04 });
    e.noiseHit(o, t + 0.26, { f: 1500, q: 0.6, vol: 0.28, tau: 0.08 });
    crackle(e, o, t + 0.26, 8, 0.1);
    e.kick(o, t + 0.26, 0.3, 120, 35, 0.15);
    e.noiseHit(o, t + 0.3, { type: 'lowpass', f: 300, vol: 0.3, a: 0.05, hold: 0.2, tau: 0.25 });
  },
  chain(e, o, t) { // electric crackle
    e.voice(o, t, 110, { type: 'sawtooth', vol: 0.12, a: 0.005, hold: 0.28, rel: 0.05, cutoff: 3000, vib: 300, vibRate: 40 });
    for (let i = 0; i < 12; i++) e.noiseHit(o, t + i * rand(0.02, 0.03), { f: rand(2000, 6000), q: 3, vol: 0.24, tau: 0.006 });
  },
  meteor(e, o, t) { // incoming whistle
    e.voice(o, t, 500, { type: 'sine', glide: 6, glideT: 0.8, vol: 0.09, a: 0.1, hold: 0.7, rel: 0.05, vib: 15, vibRate: 7 });
    e.noiseHit(o, t, { type: 'lowpass', f: 300, sweep: 2500, sweepT: 0.8, vol: 0.25, a: 0.7, hold: 0.05, tau: 0.05 });
  },
  meteorHit(e, o, t) { // boom
    e.kick(o, t, 0.5, 100, 30, 0.2);
    e.noiseHit(o, t, { type: 'lowpass', f: 2500, sweep: 120, sweepT: 0.7, vol: 0.28, tau: 0.18 });
    crackle(e, o, t + 0.04, 6, 0.08);
  },
  starfall(e, o, t) { // a shower of falling twinkles
    for (let i = 0; i < 10; i++) {
      const tt = t + i * 0.07 + rand(0, 0.03);
      e.voice(o, tt, mtof(100 - i * 2 + Math.floor(rand(0, 2))), { ...GLOCK, vol: 0.05, tau: 0.18 });
    }
    e.noiseHit(o, t, { type: 'highpass', f: 6000, sweep: 2000, sweepT: 0.8, vol: 0.08, a: 0.2, hold: 0.3, tau: 0.15 });
  },
  bubble(e, o, t) { // a blobby bubble forming
    e.voice(o, t, 600, { type: 'sine', glide: 0.4, glideT: 0.25, vol: 0.18, a: 0.02, hold: 0.15, rel: 0.1, partials: [[2, 0.15]] });
    e.voice(o, t + 0.2, 2349, { ...GLOCK, vol: 0.04, tau: 0.25, vib: 20, vibRate: 8 });
  },
  bubblePop(e, o, t) {
    e.voice(o, t, 900, { type: 'sine', glide: 0.4, glideT: 0.03, vol: 0.25, tau: 0.03 });
    e.noiseHit(o, t + 0.01, { type: 'highpass', f: 4000, vol: 0.12, tau: 0.03 });
  },
  block(e, o, t) { // a hit absorbed by a shield
    e.noiseHit(o, t, { type: 'lowpass', f: 600, vol: 0.3, tau: 0.03 });
    e.voice(o, t, 1400, { type: 'sine', vol: 0.12, tau: 0.12, partials: [[2.6, 0.4], [4.3, 0.15]] });
  },
  rally(e, o, t) { // a heroic horn call
    [[67, 0, 0.1], [72, 0.15, 0.1], [76, 0.3, 0.1], [79, 0.45, 0.5]].forEach(([m, dt, hold]) => {
      e.voice(o, t + dt, mtof(m), { type: 'sawtooth', vol: 0.07, a: 0.03, hold, rel: 0.2, cutoff: 1500, unison: 6, vib: hold > 0.2 ? 10 : 0 });
    });
    e.kick(o, t + 0.45, 0.25, 120, 45, 0.1);
  },
  sanctuary(e, o, t) { // a holy chime with a soft choir
    [84, 88, 91, 96].forEach((m, i) => e.voice(o, t + i * 0.06, mtof(m), { ...GLOCK, vol: 0.06, tau: 0.6 }));
    for (const m of [72, 76, 79]) e.voice(o, t, mtof(m), { type: 'sine', vol: 0.05, a: 0.2, hold: 0.5, rel: 0.6, vib: 10, vibRate: 5 });
  },
  aegis(e, o, t) { // a shimmering dome
    for (const f of [880, 1320, 1760, 2640]) e.voice(o, t, f, { type: 'sine', vol: 0.035, a: 0.15, hold: 0.35, rel: 0.4, vib: 25, vibRate: 7 });
    e.noiseHit(o, t, { type: 'highpass', f: 3000, sweep: 8000, sweepT: 0.4, vol: 0.08, a: 0.15, hold: 0.2, tau: 0.12 });
  },
  secondWind(e, o, t) { // a dramatic gasp, then a bright chime
    e.noiseHit(o, t, { f: 700, sweep: 2500, sweepT: 0.3, q: 2.5, vol: 0.35, a: 0.25, tau: 0.04 });
    [79, 84, 88, 91].forEach((m, i) => e.voice(o, t + 0.32 + i * 0.07, mtof(m), { type: 'triangle', vol: 0.1, tau: 0.25, partials: [[2, 0.2]] }));
  },
  // ——— mobility skills ———
  dash(e, o, t) { // a fast airy whoosh
    e.noiseHit(o, t, { f: 400, sweep: 3200, sweepT: 0.1, q: 1.3, vol: 0.6, a: 0.025, tau: 0.04 });
    e.noiseHit(o, t + 0.09, { f: 2400, sweep: 700, sweepT: 0.15, q: 1, vol: 0.25, a: 0.01, tau: 0.06 });
    e.voice(o, t, 240, { type: 'sine', glide: 0.6, glideT: 0.08, vol: 0.1, tau: 0.05 });
  },
  flashJump(e, o, t) { // a springy mid-air burst with a sparkle
    e.noiseHit(o, t, { type: 'highpass', f: 1500, sweep: 5000, sweepT: 0.12, vol: 0.3, a: 0.01, tau: 0.05 });
    e.voice(o, t, 1300, { type: 'sine', glide: 0.35, glideT: 0.09, vol: 0.14, tau: 0.06, partials: [[2, 0.2]] });
    e.kick(o, t, 0.18, 200, 90, 0.04);
    [2637, 3520].forEach((f, i) => e.voice(o, t + 0.06 + i * 0.04, f, { ...GLOCK, vol: 0.05, tau: 0.12 }));
  },
  blink(e, o, t) { // a crisp magical pop: a quick upward fwip, a pop, two twinkles
    e.voice(o, t, 2400, { type: 'sine', glide: 0.25, glideT: 0.05, vol: 0.1, tau: 0.02 });
    e.voice(o, t + 0.05, 1200, { type: 'sine', glide: 0.35, glideT: 0.025, vol: 0.3, tau: 0.025 });
    e.noiseHit(o, t + 0.05, { type: 'highpass', f: 5000, vol: 0.14, tau: 0.02 });
    e.voice(o, t + 0.08, mtof(96), { ...GLOCK, vol: 0.07, tau: 0.14 });
    e.voice(o, t + 0.12, mtof(103), { ...GLOCK, vol: 0.05, tau: 0.18 });
  },
  // ——— upgrade scrolls ———
  scrollUse(e, o, t) { // parchment unrolling, then a rising shimmer
    for (let i = 0; i < 5; i++) e.noiseHit(o, t + i * 0.035, { f: rand(2000, 3500), q: 0.9, vol: 0.12, a: 0.005, tau: 0.02 });
    e.noiseHit(o, t + 0.15, { type: 'highpass', f: 2500, sweep: 7000, sweepT: 0.4, vol: 0.06, a: 0.2, hold: 0.1, tau: 0.08 });
    [72, 76, 79, 83].forEach((m, i) => e.voice(o, t + 0.18 + i * 0.07, mtof(m + 12), { type: 'sine', vol: 0.04, a: 0.03, tau: 0.25, vib: 12, vibRate: 7 }));
  },
  scrollOk(e, o, t) { // a triumphant fanfare-chime with a sparkle run
    [72, 76, 79].forEach((m, i) => e.voice(o, t + i * 0.07, mtof(m), { type: 'triangle', vol: 0.16, tau: 0.12, partials: [[2, 0.2]] }));
    for (const m of [72, 76, 79, 84]) e.voice(o, t + 0.22, mtof(m), { type: 'triangle', vol: 0.07, a: 0.02, hold: 0.35, rel: 0.5, partials: [[2, 0.15]], vib: 10 });
    e.kick(o, t + 0.22, 0.2, 140, 60, 0.08);
    [91, 96, 100, 103, 108].forEach((m, i) => e.voice(o, t + 0.26 + i * 0.05, mtof(m), { ...GLOCK, vol: 0.06, tau: 0.25 }));
    e.noiseHit(o, t + 0.22, { type: 'highpass', f: 6000, vol: 0.06, a: 0.02, hold: 0.2, tau: 0.15 });
  },
  scrollFail(e, o, t) { // a sad "wah-wahh" and a fizzle
    e.voice(o, t, mtof(67), { type: 'square', vol: 0.06, a: 0.01, hold: 0.16, rel: 0.06, cutoff: 1000, vib: 14, vibRate: 6 });
    e.voice(o, t + 0.24, mtof(62), { type: 'square', glide: 1.0, vol: 0.06, a: 0.01, hold: 0.35, rel: 0.2, cutoff: 900, vib: 22, vibRate: 5 });
    e.voice(o, t + 0.24, mtof(62) * 0.5, { type: 'sine', glide: 1.06, glideT: 0.4, vol: 0.1, a: 0.01, hold: 0.3, rel: 0.2 });
    e.noiseHit(o, t + 0.3, { type: 'highpass', f: 5000, sweep: 1200, sweepT: 0.6, vol: 0.12, a: 0.02, hold: 0.2, tau: 0.15 });
    crackle(e, o, t + 0.32, 5, 0.03);
  },
  scrollBoom(e, o, t) { // the item is destroyed: a thud and a glassy shatter
    e.kick(o, t, 0.45, 160, 40, 0.12);
    e.noiseHit(o, t, { type: 'highpass', f: 3000, sweep: 9000, sweepT: 0.25, vol: 0.3, tau: 0.08 });
    e.noiseHit(o, t, { type: 'lowpass', f: 1200, sweep: 200, sweepT: 0.3, vol: 0.2, tau: 0.08 });
    for (let i = 0; i < 16; i++) e.voice(o, t + 0.01 + i * rand(0.012, 0.035), rand(2200, 6500), { ...GLOCK, vol: 0.05, tau: rand(0.05, 0.14) });
    e.voice(o, t + 0.05, mtof(50), { type: 'sawtooth', glide: 1.2, glideT: 0.5, vol: 0.05, a: 0.02, hold: 0.25, rel: 0.4, cutoff: 900, unison: 10 });
  },
  // ——— Caldera hazards ———
  squirt(e, o, t) { // a snapshrimp's snap and a squirt of water
    e.noiseHit(o, t, { type: 'highpass', f: 2500, vol: 0.3, tau: 0.01 });
    e.noiseHit(o, t + 0.02, { f: 1200, sweep: 3000, sweepT: 0.12, q: 1, vol: 0.18, a: 0.01, tau: 0.08 });
  },
  warp(e, o, t) { // a waystone's hum swelling and a shimmer of bells
    e.voice(o, t, 220, { type: 'sine', glide: 2, glideT: 0.5, vol: 0.12, a: 0.15, hold: 0.25, rel: 0.3, vib: 6, vibRate: 5 });
    [1319, 1568, 1976, 2637].forEach((f, i) => e.voice(o, t + 0.2 + i * 0.07, f, { ...GLOCK, vol: 0.05, tau: 0.3 }));
  },
  fireball(e, o, t) { // a fwoom
    e.noiseHit(o, t, { type: 'lowpass', f: 300, sweep: 2200, sweepT: 0.18, vol: 0.45, a: 0.04, hold: 0.06, tau: 0.1 });
    e.voice(o, t, 140, { type: 'sine', glide: 0.6, glideT: 0.12, vol: 0.15, a: 0.02, tau: 0.08 });
    crackle(e, o, t + 0.05, 4, 0.05);
  },
  emberHit(e, o, t) { // a hot fizzing impact
    e.kick(o, t, 0.3, 220, 70, 0.05);
    e.noiseHit(o, t, { type: 'highpass', f: 4000, sweep: 1500, sweepT: 0.3, vol: 0.22, a: 0.005, hold: 0.05, tau: 0.1 });
    crackle(e, o, t + 0.02, 6, 0.06);
  },
  geyserWarn(e, o, t) { // the ground gurgles and bubbles, faster and higher
    e.noiseHit(o, t, { type: 'lowpass', f: 120, sweep: 400, sweepT: 0.8, vol: 0.4, a: 0.3, hold: 0.4, tau: 0.08 });
    for (let i = 0; i < 7; i++) lavaBubble(e, o, t + i * (0.13 - i * 0.008), 0.12 + i * 0.015);
  },
  geyser(e, o, t) { // an eruption: boom, roaring column, spatter
    e.kick(o, t, 0.5, 110, 35, 0.15);
    e.noiseHit(o, t, { f: 500, sweep: 1400, sweepT: 0.3, q: 0.7, vol: 0.45, a: 0.02, hold: 0.35, tau: 0.15 });
    e.noiseHit(o, t, { type: 'highpass', f: 3500, vol: 0.12, a: 0.05, hold: 0.3, tau: 0.12 });
    crackle(e, o, t + 0.05, 12, 0.06);
  },
  flamewall(e, o, t) { // a rolling wall of fire roaring past
    e.noiseHit(o, t, { f: 350, sweep: 900, sweepT: 0.5, q: 0.7, vol: 0.45, a: 0.12, hold: 0.5, tau: 0.2 });
    e.voice(o, t, 70, { type: 'sawtooth', vol: 0.08, a: 0.1, hold: 0.5, rel: 0.3, cutoff: 300, unison: 14, vib: 40, vibRate: 11 });
    for (let i = 0; i < 4; i++) crackle(e, o, t + 0.1 + i * 0.18, 3, 0.05);
  },
  magmaRise(e, o, t) { // lava rising: a deep swelling rumble full of bubbles
    e.noiseHit(o, t, { type: 'lowpass', f: 80, sweep: 450, sweepT: 1.1, vol: 0.55, a: 0.8, hold: 0.3, tau: 0.15 });
    e.voice(o, t, 38, { type: 'sine', glide: 0.75, glideT: 1.1, vol: 0.2, a: 0.6, hold: 0.5, rel: 0.3 });
    for (let i = 0; i < 10; i++) lavaBubble(e, o, t + i * 0.11 + rand(0, 0.05), 0.08 + i * 0.01);
  },
  ringFire(e, o, t) { // a ring of flame bursting outward
    e.kick(o, t, 0.3, 150, 50, 0.08);
    e.noiseHit(o, t, { f: 300, sweep: 2200, sweepT: 0.25, q: 0.9, vol: 0.5, a: 0.05, hold: 0.1, tau: 0.12 });
    crackle(e, o, t + 0.06, 8, 0.05);
  },
  dive(e, o, t) { // a screeching dive: a falling whistle in a rush of air
    e.voice(o, t, 600, { type: 'triangle', glide: 3.5, glideT: 0.45, vol: 0.12, a: 0.03, hold: 0.4, rel: 0.08, cutoff: 3500, vib: 30, vibRate: 14 });
    e.noiseHit(o, t, { f: 3000, sweep: 500, sweepT: 0.5, q: 1.2, vol: 0.4, a: 0.25, hold: 0.15, tau: 0.08 });
  },
  eggCrack(e, o, t) { // a sharp eggshell crack
    e.noiseHit(o, t, { type: 'highpass', f: 2500, vol: 0.6, tau: 0.01 });
    crackle(e, o, t + 0.01, 5, 0.09);
    e.voice(o, t, 330, { type: 'triangle', glide: 1.3, glideT: 0.08, vol: 0.1, tau: 0.04, cutoff: 1500 });
  },
  eggBreak(e, o, t) { // the egg bursts: crunch, a shower of shell and a fiery whoosh
    e.kick(o, t, 0.4, 180, 50, 0.1);
    e.noiseHit(o, t, { f: 1800, q: 0.7, vol: 0.4, tau: 0.04 });
    crackle(e, o, t, 14, 0.07);
    for (let i = 0; i < 8; i++) e.voice(o, t + 0.02 + i * rand(0.02, 0.05), rand(1500, 3500), { ...GLOCK, vol: 0.035, tau: 0.08 });
    e.noiseHit(o, t + 0.05, { f: 300, sweep: 2000, sweepT: 0.4, q: 0.8, vol: 0.4, a: 0.08, hold: 0.2, tau: 0.15 });
  },
  rebirth(e, o, t) { // a rising phoenix cry, a swell of fire, a bright chord
    e.noiseHit(o, t, { f: 250, sweep: 2500, sweepT: 0.9, q: 0.8, vol: 0.4, a: 0.7, hold: 0.2, tau: 0.2 });
    e.voice(o, t + 0.2, 700, { type: 'triangle', glide: 0.55, glideT: 0.5, vol: 0.12, a: 0.05, hold: 0.55, rel: 0.25, cutoff: 3500, vib: 35, vibRate: 7, partials: [[2, 0.2]] });
    e.voice(o, t + 0.2, 1400, { type: 'sine', glide: 0.55, glideT: 0.5, vol: 0.05, a: 0.05, hold: 0.5, rel: 0.2, vib: 35, vibRate: 7 });
    for (const m of [74, 78, 81, 86]) e.voice(o, t + 0.85, mtof(m), { type: 'triangle', vol: 0.05, a: 0.02, hold: 0.4, rel: 0.5, partials: [[2, 0.15]] });
    [93, 98, 102].forEach((m, i) => e.voice(o, t + 0.9 + i * 0.06, mtof(m), { ...GLOCK, vol: 0.05, tau: 0.25 }));
    e.kick(o, t + 0.85, 0.3, 130, 45, 0.1);
  },
  shellBlock(e, o, t) { // an armoured shell shrugs a hit off: a hard glassy clonk
    e.noiseHit(o, t, { type: 'lowpass', f: 900, vol: 0.3, tau: 0.025 });
    e.voice(o, t, 760, { type: 'sine', vol: 0.12, a: 0.001, tau: 0.09, partials: [[2.7, 0.45], [5.1, 0.2]] });
    e.voice(o, t + 0.005, 2900, { type: 'sine', vol: 0.05, a: 0.001, tau: 0.12, partials: [[1.5, 0.3]] });
  },
  // ——— Citadel hazards ———
  laserCharge(e, o, t) { // a whine climbing as the lens charges
    e.voice(o, t, 2400, { type: 'sawtooth', glide: 0.12, glideT: 0.8, vol: 0.05, a: 0.1, hold: 0.7, rel: 0.05, cutoff: 3500, vib: 30, vibRate: 25 });
    e.voice(o, t, 1200, { type: 'sine', glide: 0.12, glideT: 0.8, vol: 0.08, a: 0.1, hold: 0.7, rel: 0.05 });
    e.noiseHit(o, t, { type: 'highpass', f: 2000, sweep: 8000, sweepT: 0.8, vol: 0.08, a: 0.7, hold: 0.05, tau: 0.03 });
  },
  laser(e, o, t) { // a zappy beam
    e.voice(o, t, 1800, { type: 'square', glide: 3, glideT: 0.05, vol: 0.07, tau: 0.03, cutoff: 4000 });
    e.voice(o, t, 440, { type: 'sawtooth', vol: 0.07, a: 0.01, hold: 0.45, rel: 0.12, cutoff: 2500, vib: 40, vibRate: 55 });
    e.voice(o, t, 880, { type: 'square', vol: 0.03, a: 0.01, hold: 0.45, rel: 0.12, cutoff: 3000, unison: 15 });
    e.noiseHit(o, t, { type: 'highpass', f: 5000, vol: 0.06, a: 0.01, hold: 0.4, tau: 0.08 });
  },
  gearRoll(e, o, t) { // a ratcheting gear rolling by
    e.noiseHit(o, t, { type: 'lowpass', f: 220, vol: 0.35, a: 0.08, hold: 0.45, tau: 0.12 });
    for (let i = 0; i < 12; i++) e.voice(o, t + i * 0.05, i % 2 ? 1300 : 1650, { type: 'sine', vol: 0.06, a: 0.001, tau: 0.01, partials: [[2.3, 0.4]] });
    e.voice(o, t, 90, { type: 'square', vol: 0.05, a: 0.05, hold: 0.45, rel: 0.1, cutoff: 350, vib: 50, vibRate: 20 });
  },
  gridWarn(e, o, t) { // a buzzing build of current under the floor
    e.voice(o, t, 120, { type: 'square', vol: 0.06, a: 0.25, hold: 0.35, rel: 0.05, cutoff: 1600, vib: 40, vibRate: 30 });
    e.voice(o, t, 60, { type: 'sawtooth', vol: 0.06, a: 0.2, hold: 0.4, rel: 0.05, cutoff: 600 });
    for (let i = 0; i < 6; i++) e.noiseHit(o, t + 0.1 + i * rand(0.06, 0.1), { f: rand(2500, 6000), q: 3, vol: 0.12, tau: 0.006 });
  },
  zap(e, o, t) { // an electric crack
    e.voice(o, t, 70, { type: 'sawtooth', vol: 0.12, a: 0.003, hold: 0.12, rel: 0.05, cutoff: 2500, vib: 400, vibRate: 50 });
    e.voice(o, t, 3000, { type: 'sine', glide: 1, vol: 0.06, tau: 0.03 });
    e.noiseHit(o, t, { f: 3500, q: 0.8, vol: 0.3, tau: 0.02 });
    for (let i = 0; i < 8; i++) e.noiseHit(o, t + i * rand(0.015, 0.03), { f: rand(2000, 7000), q: 3, vol: 0.22, tau: 0.006 });
  },
  bombTick(e, o, t) { // a clock tick
    e.noiseHit(o, t, { type: 'highpass', f: 4500, vol: 0.5, tau: 0.004 });
    e.voice(o, t, 2200, { type: 'sine', vol: 0.18, a: 0.001, tau: 0.012, partials: [[2.4, 0.3]] });
    e.voice(o, t, 950, { type: 'sine', vol: 0.1, a: 0.001, tau: 0.02 });
  },
  bombBoom(e, o, t) { // a clock bomb goes off: boom, flash, a ring of jangling bells
    e.kick(o, t, 0.5, 120, 32, 0.15);
    e.noiseHit(o, t, { type: 'lowpass', f: 3000, sweep: 150, sweepT: 0.5, vol: 0.3, tau: 0.14 });
    for (const f of [1568, 1661, 2349, 3136]) anvil(e, o, t + rand(0, 0.03), f, 0.03, 0.3);
    crackle(e, o, t + 0.04, 6, 0.06);
  },
  slashWarn(e, o, t) { // a crystal blade raised: a ringing rising scrape
    e.noiseHit(o, t, { f: 1800, sweep: 6000, sweepT: 0.35, q: 6, vol: 0.25, a: 0.25, hold: 0.05, tau: 0.06 });
    e.voice(o, t, 1760, { type: 'sine', glide: 0.7, glideT: 0.3, vol: 0.06, a: 0.2, hold: 0.15, rel: 0.2, vib: 20, vibRate: 9, partials: [[2.4, 0.3]] });
  },
  slash(e, o, t) { // a crystalline slash
    e.noiseHit(o, t, { f: 5000, sweep: 600, sweepT: 0.15, q: 1.3, vol: 0.55, a: 0.02, tau: 0.06 });
    e.voice(o, t + 0.03, mtof(98), { ...GLOCK, vol: 0.07, tau: 0.2 });
    e.voice(o, t + 0.05, mtof(105), { ...GLOCK, vol: 0.05, tau: 0.25 });
  },
  pulse(e, o, t) { // a time pulse: a deep wub and a warped chime
    e.voice(o, t, 70, { type: 'sine', glide: 2.5, glideT: 0.25, vol: 0.3, a: 0.01, tau: 0.12 });
    e.noiseHit(o, t, { f: 800, sweep: 200, sweepT: 0.3, q: 2, vol: 0.25, a: 0.02, tau: 0.08 });
    e.voice(o, t + 0.02, 1320, { type: 'sine', glide: 1.3, glideT: 0.3, vol: 0.06, tau: 0.2, vib: 50, vibRate: 12 });
  },
  phaseOut(e, o, t) { // a ghostly, sinking shimmer
    e.voice(o, t, 600, { type: 'sine', glide: 2, glideT: 0.4, vol: 0.06, a: 0.05, hold: 0.2, rel: 0.25, vib: 40, vibRate: 8, unison: 12 });
    e.noiseHit(o, t, { f: 2500, sweep: 600, sweepT: 0.5, q: 2, vol: 0.12, a: 0.1, hold: 0.15, tau: 0.1 });
  },
  bossBlink(e, o, t) { // a bigger, deeper teleport pop
    e.voice(o, t, 1600, { type: 'sine', glide: 0.25, glideT: 0.08, vol: 0.08, a: 0.04, tau: 0.02 });
    e.kick(o, t + 0.08, 0.3, 300, 70, 0.06);
    e.voice(o, t + 0.08, 600, { type: 'sine', glide: 0.35, glideT: 0.03, vol: 0.25, tau: 0.04 });
    e.noiseHit(o, t + 0.08, { f: 4000, sweep: 800, sweepT: 0.2, q: 1, vol: 0.2, tau: 0.05 });
    [mtof(84), mtof(91)].forEach((f, i) => e.voice(o, t + 0.12 + i * 0.05, f, { ...GLOCK, vol: 0.05, tau: 0.25 }));
  },
  // ——— Citadel boss ultimates ———
  timeStop(e, o, t) { // a deep reverse swell that cuts dead, then a frozen hush and one held chime
    const sw = 1.3;
    e.noiseHit(o, t, { f: 150, sweep: 3500, sweepT: sw, q: 1.2, vol: 0.3, a: sw, tau: 0.012 });
    e.voice(o, t, 49, { type: 'sawtooth', glide: 0.5, glideT: sw, vol: 0.12, a: sw, hold: 0.005, rel: 0.03, cutoff: 900, unison: 14 });
    e.voice(o, t, 98, { type: 'sine', glide: 0.5, glideT: sw, vol: 0.12, a: sw, hold: 0.005, rel: 0.03 });
    e.kick(o, t + sw, 0.5, 90, 28, 0.2);
    e.noiseHit(o, t + sw + 0.05, { type: 'highpass', f: 7000, vol: 0.02, a: 0.2, hold: 1.0, tau: 0.3 }); // the hush
    e.voice(o, t + sw + 0.05, mtof(85), { type: 'sine', vol: 0.05, a: 0.01, hold: 1.1, rel: 0.6, partials: [[2.76, 0.15]] });
  },
  timeResume(e, o, t) { // a forward rush, then the clocks start ticking again
    e.noiseHit(o, t, { f: 3000, sweep: 300, sweepT: 0.35, q: 1, vol: 0.35, a: 0.01, tau: 0.08 });
    e.voice(o, t, 600, { type: 'sine', glide: 0.4, glideT: 0.3, vol: 0.1, tau: 0.1 });
    for (const dt of [0.22, 0.45, 0.61, 0.74, 0.84]) EFFECTS.bombTick(e, o, t + dt);
    e.voice(o, t + 1.0, mtof(84), { ...GLOCK, vol: 0.06, tau: 0.3 });
  },
  collapse(e, o, t) { // the walls of the void close in: rumble and a sucking sweep
    e.noiseHit(o, t, { type: 'lowpass', f: 140, vol: 0.5, a: 0.2, hold: 0.8, tau: 0.25 });
    e.voice(o, t, 41, { type: 'sawtooth', vol: 0.1, a: 0.2, hold: 0.7, rel: 0.4, cutoff: 350, unison: 14, vib: 50, vibRate: 7 });
    e.noiseHit(o, t, { f: 2500, sweep: 200, sweepT: 1.0, q: 2, vol: 0.25, a: 0.4, hold: 0.4, tau: 0.15 });
    e.kick(o, t, 0.35, 100, 30, 0.2);
  },
  overclock(e, o, t) { // a motor revving into the red with sparks and an alarm blip
    e.voice(o, t, 1600, { type: 'square', glide: 0.12, glideT: 0.9, vol: 0.05, a: 0.05, hold: 0.85, rel: 0.1, cutoff: 2200, vib: 30, vibRate: 35 });
    e.voice(o, t, 800, { type: 'sawtooth', glide: 0.12, glideT: 0.9, vol: 0.05, a: 0.05, hold: 0.85, rel: 0.1, cutoff: 1500 });
    for (let i = 0; i < 14; i++) e.voice(o, t + i * (0.08 - i * 0.003), 1500, { type: 'sine', vol: 0.05, a: 0.001, tau: 0.01, partials: [[2.3, 0.4]] });
    crackle(e, o, t + 0.5, 8, 0.07);
    e.kick(o, t + 0.95, 0.35, 160, 45, 0.1);
  },
};

const crackle = (e, o, t, n = 3, vol = 0.07) => {
  for (let i = 0; i < n; i++) e.noiseHit(o, t + i * rand(0.02, 0.045), { f: rand(2500, 4500), q: 2, vol, tau: 0.008 });
};

const MOB_HURT = {
  generic(e, o, t) {
    e.voice(o, t, 520, { type: 'triangle', glide: 1.4, glideT: 0.06, vol: 0.2, tau: 0.06, cutoff: 2500 });
  },
  pond_frog(e, o, t) { // a startled "ribbit"
    for (let i = 0; i < 2; i++) e.voice(o, t + i * 0.07, 300 - i * 40, { type: 'square', glide: 0.75, glideT: 0.05, vol: 0.08, a: 0.004, tau: 0.04, cutoff: 1400 });
  },
  tide_jelly(e, o, t) { // a wobbly "bloop"
    e.voice(o, t, 600, { type: 'sine', glide: 0.6, glideT: 0.08, vol: 0.2, a: 0.01, tau: 0.08, vib: 20, vibRate: 18 });
  },
  sprout(e, o, t) { // a tiny squeaky "eep" with a leafy rustle
    e.voice(o, t, 1900, { type: 'sine', glide: 0.7, glideT: 0.04, vol: 0.2, tau: 0.05, partials: [[2, 0.1]] });
    e.noiseHit(o, t, { type: 'highpass', f: 5000, vol: 0.07, a: 0.005, tau: 0.03 });
  },
  mushling(e, o, t) { // soft puffy "pwomp" with a spore hiss
    e.voice(o, t, 300, { type: 'sine', glide: 0.6, glideT: 0.07, vol: 0.28, a: 0.01, tau: 0.08, partials: [[2, 0.15]] });
    e.noiseHit(o, t + 0.03, { type: 'highpass', f: 3500, vol: 0.06, a: 0.03, tau: 0.08 });
  },
  bramble(e, o, t) { // gruff little grunt/snort with a twig crackle
    e.voice(o, t, 150, { type: 'sawtooth', glide: 1.35, glideT: 0.06, vol: 0.2, a: 0.008, hold: 0.06, rel: 0.06, cutoff: 750, vib: 35, vibRate: 30 });
    e.noiseHit(o, t, { f: 900, q: 1.5, vol: 0.17, tau: 0.035 });
    crackle(e, o, t + 0.04);
  },
  sprout_king(e, o, t) { // a regal squeak-groan
    e.voice(o, t, 620, { type: 'triangle', glide: 1.5, glideT: 0.12, vol: 0.16, a: 0.01, hold: 0.12, rel: 0.08, cutoff: 2400, vib: 20, vibRate: 8 });
    e.voice(o, t, 310, { type: 'sine', glide: 1.3, glideT: 0.15, vol: 0.12, a: 0.02, hold: 0.12, rel: 0.1 });
    e.noiseHit(o, t, { type: 'highpass', f: 4500, vol: 0.06, tau: 0.04 });
  },
  mother_mushroom(e, o, t) { // a deep motherly "hmph" and a big spore puff
    e.voice(o, t, 140, { type: 'sine', glide: 0.75, glideT: 0.06, vol: 0.2, a: 0.01, hold: 0.08, rel: 0.1, partials: [[2, 0.3], [3, 0.1]] });
    e.noiseHit(o, t + 0.02, { type: 'lowpass', f: 2200, sweep: 500, sweepT: 0.3, vol: 0.2, a: 0.04, tau: 0.12 });
    e.noiseHit(o, t + 0.05, { type: 'highpass', f: 3000, vol: 0.07, a: 0.05, tau: 0.15 });
  },
  bramble_behemoth(e, o, t) { // a heavy growl
    e.voice(o, t, 72, { type: 'sawtooth', glide: 1.25, glideT: 0.1, vol: 0.2, a: 0.02, hold: 0.22, rel: 0.12, cutoff: 520, unison: 12, vib: 50, vibRate: 24 });
    e.noiseHit(o, t, { f: 320, q: 1.2, vol: 0.18, a: 0.02, hold: 0.15, tau: 0.06 });
    crackle(e, o, t + 0.05, 2, 0.06);
  },
  frostling(e, o, t) { // a small icy chirp
    e.voice(o, t, 2400, { type: 'sine', glide: 0.8, glideT: 0.04, vol: 0.22, tau: 0.05, partials: [[2.76, 0.2]] });
    e.noiseHit(o, t, { type: 'highpass', f: 7000, vol: 0.06, tau: 0.03 });
  },
  yeti(e, o, t) { // a fluffy "hrrumf"
    e.voice(o, t, 170, { type: 'triangle', glide: 1.3, glideT: 0.08, vol: 0.25, a: 0.01, hold: 0.07, rel: 0.08, cutoff: 900, vib: 30, vibRate: 22 });
    e.noiseHit(o, t, { type: 'lowpass', f: 800, vol: 0.14, a: 0.01, tau: 0.05 });
  },
  wisp(e, o, t) { // an ethereal "wooo"
    e.voice(o, t, 900, { type: 'sine', glide: 1.25, glideT: 0.12, vol: 0.12, a: 0.02, hold: 0.1, rel: 0.1, vib: 30, vibRate: 7 });
    e.noiseHit(o, t, { f: 2200, q: 2, vol: 0.05, a: 0.03, tau: 0.06 });
  },
  golem(e, o, t) { // a rocky "grnk"
    e.voice(o, t, 85, { type: 'square', glide: 1.3, glideT: 0.06, vol: 0.14, a: 0.005, hold: 0.06, rel: 0.05, cutoff: 420 });
    e.noiseHit(o, t, { type: 'lowpass', f: 1500, vol: 0.18, tau: 0.03 });
    crackle(e, o, t + 0.02, 3, 0.06);
  },
  frost_queen(e, o, t) { // a haughty "hah!" with an ice tinkle
    e.voice(o, t, 700, { type: 'triangle', glide: 1.2, glideT: 0.08, vol: 0.15, a: 0.01, hold: 0.1, rel: 0.1, cutoff: 2600, vib: 18, vibRate: 7, partials: [[2, 0.12]] });
    e.voice(o, t + 0.05, 3520, { ...GLOCK, vol: 0.04, tau: 0.15 });
  },
  astral_wyrm(e, o, t) { // a deep cosmic growl
    e.voice(o, t, 62, { type: 'sawtooth', glide: 1.25, glideT: 0.1, vol: 0.18, a: 0.02, hold: 0.22, rel: 0.15, cutoff: 600, unison: 14, vib: 45, vibRate: 20 });
    e.voice(o, t, 93, { type: 'sine', vol: 0.1, a: 0.02, hold: 0.2, rel: 0.15, vib: 30, vibRate: 6 });
    e.voice(o, t + 0.04, 1865, { ...GLOCK, vol: 0.03, tau: 0.2 });
  },
  // ——— the Caldera ———
  ember_imp(e, o, t) { // an impish "yip!" and a fizz
    e.voice(o, t, 1500, { type: 'triangle', glide: 0.7, glideT: 0.03, vol: 0.18, a: 0.004, hold: 0.03, rel: 0.04, cutoff: 3500 });
    e.noiseHit(o, t + 0.02, { type: 'highpass', f: 4000, vol: 0.08, tau: 0.04 });
  },
  magma_slug(e, o, t) { // a gloopy "blorp"
    e.voice(o, t, 160, { type: 'sine', glide: 1.8, glideT: 0.06, vol: 0.28, a: 0.01, tau: 0.08, partials: [[2, 0.2]] });
    lavaBubble(e, o, t + 0.05, 0.12);
  },
  obsidian_crab(e, o, t) { // a clicky snap and a glassy tink
    for (let i = 0; i < 3; i++) e.noiseHit(o, t + i * 0.03, { f: 3000, q: 2, vol: 0.3, tau: 0.008 });
    e.voice(o, t + 0.02, 2100, { type: 'sine', vol: 0.06, tau: 0.08, partials: [[2.7, 0.3]] });
  },
  cinder_bat(e, o, t) { // a tiny screech and a flap
    e.voice(o, t, 2800, { type: 'square', glide: 0.8, glideT: 0.05, vol: 0.1, a: 0.004, hold: 0.04, rel: 0.03, cutoff: 5000, vib: 60, vibRate: 40 });
    e.noiseHit(o, t, { type: 'lowpass', f: 900, vol: 0.22, a: 0.005, tau: 0.03 });
  },
  ignis(e, o, t) { // a deep magma growl with a bubbling roar
    e.voice(o, t, 58, { type: 'sawtooth', glide: 1.3, glideT: 0.1, vol: 0.2, a: 0.02, hold: 0.22, rel: 0.15, cutoff: 500, unison: 14, vib: 50, vibRate: 22 });
    e.noiseHit(o, t, { type: 'lowpass', f: 600, vol: 0.2, a: 0.02, hold: 0.15, tau: 0.08 });
    lavaBubble(e, o, t + 0.1, 0.1);
  },
  pyra(e, o, t) { // a sharp bird cry "kyaa!" with a flick of fire
    e.voice(o, t, 1300, { type: 'triangle', glide: 0.75, glideT: 0.06, vol: 0.14, a: 0.01, hold: 0.1, rel: 0.08, cutoff: 3800, vib: 30, vibRate: 9, partials: [[2, 0.2]] });
    e.noiseHit(o, t, { f: 600, sweep: 1600, sweepT: 0.15, q: 0.8, vol: 0.15, a: 0.02, tau: 0.06 });
  },
  // ——— the Citadel ———
  cogling(e, o, t) { // a metal clunk and a spinning click
    e.noiseHit(o, t, { type: 'lowpass', f: 1200, vol: 0.35, tau: 0.02 });
    e.voice(o, t, 520, { type: 'square', vol: 0.11, tau: 0.04, cutoff: 1800, partials: [[2.7, 0.3]] });
    for (let i = 0; i < 3; i++) e.voice(o, t + 0.03 + i * 0.03, 1700, { type: 'sine', vol: 0.09, a: 0.001, tau: 0.008 });
  },
  cogbit(e, o, t) { // a tiny "tink!" squeak
    e.voice(o, t, 2600, { type: 'sine', glide: 0.8, glideT: 0.03, vol: 0.26, tau: 0.03, partials: [[2.4, 0.3]] });
  },
  sentry(e, o, t) { // an electronic glitch-blip and static
    e.voice(o, t, 1400, { type: 'square', glide: 1.5, glideT: 0.05, vol: 0.09, a: 0.003, hold: 0.04, rel: 0.02, cutoff: 3500 });
    e.voice(o, t + 0.05, 900, { type: 'square', vol: 0.08, a: 0.003, hold: 0.03, rel: 0.02, cutoff: 3000 });
    e.noiseHit(o, t, { f: 4500, q: 1.5, vol: 0.1, a: 0.003, hold: 0.04, tau: 0.02 });
  },
  aether_knight(e, o, t) { // an armoured clank with a crystal ring
    e.noiseHit(o, t, { type: 'lowpass', f: 1500, vol: 0.3, tau: 0.025 });
    e.voice(o, t, 210, { type: 'triangle', glide: 1.2, glideT: 0.05, vol: 0.22, tau: 0.06, cutoff: 1000 });
    e.voice(o, t + 0.01, 2349, { ...GLOCK, vol: 0.05, tau: 0.2 });
  },
  chrono_wraith(e, o, t) { // a ghostly "oooh" with a ticking clock inside
    e.voice(o, t, 520, { type: 'sine', glide: 1.3, glideT: 0.12, vol: 0.1, a: 0.02, hold: 0.12, rel: 0.12, vib: 40, vibRate: 6, unison: 10 });
    e.voice(o, t + 0.04, 2400, { type: 'sine', vol: 0.06, a: 0.001, tau: 0.01 });
    e.voice(o, t + 0.12, 1800, { type: 'sine', vol: 0.05, a: 0.001, tau: 0.01 });
  },
  colossus(e, o, t) { // a huge clang, a motor groan and a burst of steam
    anvil(e, o, t, 420, 0.08, 0.2);
    e.noiseHit(o, t, { type: 'lowpass', f: 900, vol: 0.2, tau: 0.04 });
    e.voice(o, t, 75, { type: 'square', glide: 1.3, glideT: 0.12, vol: 0.08, a: 0.01, hold: 0.15, rel: 0.1, cutoff: 500, vib: 40, vibRate: 25 });
    e.noiseHit(o, t + 0.08, { type: 'highpass', f: 3500, vol: 0.08, a: 0.02, hold: 0.1, tau: 0.08 });
  },
  chronos(e, o, t) { // an echoing deep voice and a struck bell
    e.voice(o, t, 98, { type: 'sawtooth', glide: 1.2, glideT: 0.12, vol: 0.12, a: 0.02, hold: 0.2, rel: 0.2, cutoff: 900, unison: 12, vib: 25, vibRate: 5 });
    e.voice(o, t, 196, { type: 'sine', vol: 0.08, a: 0.02, hold: 0.18, rel: 0.2, vib: 25, vibRate: 5 });
    anvil(e, o, t + 0.03, 1109, 0.04, 0.35);
  },
};

const MOB_DEATH = {
  sprout(e, o, t) { // squeak-pop and scattering leaves
    e.voice(o, t, 2300, { type: 'sine', glide: 0.55, glideT: 0.08, vol: 0.12, a: 0.005, hold: 0.06, rel: 0.03 });
    e.voice(o, t + 0.11, 1100, { type: 'sine', glide: 0.35, glideT: 0.04, vol: 0.25, tau: 0.035 });
    e.noiseHit(o, t + 0.12, { type: 'highpass', f: 6000, sweep: 2500, sweepT: 0.25, vol: 0.09, a: 0.01, tau: 0.08 });
  },
  mushling(e, o, t) { // a deflating puff
    e.voice(o, t, 110, { type: 'sine', glide: 3.4, glideT: 0.4, vol: 0.15, a: 0.01, hold: 0.32, rel: 0.1, partials: [[2, 0.2]] });
    e.noiseHit(o, t + 0.02, { type: 'lowpass', f: 1600, sweep: 280, sweepT: 0.45, vol: 0.13, a: 0.03, hold: 0.25, tau: 0.1 });
    e.noiseHit(o, t + 0.1, { type: 'highpass', f: 3500, vol: 0.05, a: 0.1, tau: 0.15 });
  },
  bramble(e, o, t) { // grunt + crunch
    e.voice(o, t, 115, { type: 'sawtooth', glide: 1.6, glideT: 0.15, vol: 0.14, a: 0.01, hold: 0.12, rel: 0.08, cutoff: 700, vib: 35, vibRate: 30 });
    e.noiseHit(o, t + 0.15, { type: 'lowpass', f: 1800, vol: 0.2, tau: 0.04 });
    crackle(e, o, t + 0.16, 6, 0.09);
  },
  sprout_king(e, o, t) { // a long falling regal squeak, a pop, and a royal sparkle
    [880, 740, 620].forEach((f, i) => e.voice(o, t + i * 0.22, f, { type: 'triangle', glide: 1.3, glideT: 0.15, vol: 0.15, a: 0.01, hold: 0.14, rel: 0.08, cutoff: 2400, vib: 25, vibRate: 7 }));
    e.voice(o, t + 0.75, 900, { type: 'sine', glide: 0.35, glideT: 0.05, vol: 0.28, tau: 0.05 });
    e.noiseHit(o, t + 0.77, { type: 'highpass', f: 6000, sweep: 2000, sweepT: 0.4, vol: 0.1, a: 0.01, tau: 0.12 });
    [2093, 2637, 3136].forEach((f, i) => e.voice(o, t + 0.85 + i * 0.07, f, { ...GLOCK, vol: 0.06, tau: 0.2 }));
  },
  mother_mushroom(e, o, t) { // a long sinking groan and a huge spore cloud
    e.voice(o, t, 55, { type: 'sine', glide: 3, glideT: 1.0, vol: 0.18, a: 0.03, hold: 0.9, rel: 0.25, partials: [[2, 0.3], [3, 0.1]] });
    e.noiseHit(o, t + 0.1, { type: 'lowpass', f: 2500, sweep: 220, sweepT: 1.1, vol: 0.14, a: 0.1, hold: 0.7, tau: 0.2 });
    e.noiseHit(o, t + 0.3, { type: 'highpass', f: 3500, vol: 0.06, a: 0.2, hold: 0.4, tau: 0.25 });
  },
  bramble_behemoth(e, o, t) { // a falling heavy growl, a big crunch and a rumble
    e.voice(o, t, 50, { type: 'sawtooth', glide: 1.8, glideT: 0.9, vol: 0.2, a: 0.03, hold: 0.8, rel: 0.2, cutoff: 500, unison: 14, vib: 50, vibRate: 20 });
    e.noiseHit(o, t, { f: 300, q: 1.2, vol: 0.15, a: 0.05, hold: 0.6, tau: 0.1 });
    e.noiseHit(o, t + 0.85, { type: 'lowpass', f: 2200, vol: 0.25, tau: 0.06 });
    crackle(e, o, t + 0.86, 10, 0.08);
    e.noiseHit(o, t + 0.9, { type: 'lowpass', f: 160, vol: 0.35, a: 0.05, hold: 0.3, tau: 0.2 });
  },
  frostling(e, o, t) { // shatters into tinkles
    for (let i = 0; i < 7; i++) e.voice(o, t + i * rand(0.02, 0.05), rand(2800, 5200), { ...GLOCK, vol: 0.05, tau: 0.08 });
    e.noiseHit(o, t, { type: 'highpass', f: 5000, sweep: 9000, sweepT: 0.2, vol: 0.12, tau: 0.06 });
  },
  yeti(e, o, t) { // a long yawny groan and a snow poof
    e.voice(o, t, 95, { type: 'triangle', glide: 2.1, glideT: 0.6, vol: 0.24, a: 0.02, hold: 0.55, rel: 0.15, cutoff: 900, vib: 25, vibRate: 6 });
    e.noiseHit(o, t + 0.45, { type: 'lowpass', f: 1800, sweep: 300, sweepT: 0.4, vol: 0.18, a: 0.03, tau: 0.12 });
  },
  wisp(e, o, t) { // fades upward in a shimmer
    [1200, 1600, 2000, 2700, 3600].forEach((f, i) => e.voice(o, t + i * 0.06, f, { type: 'sine', vol: 0.06, a: 0.02, tau: 0.12, vib: 30, vibRate: 9 }));
    e.noiseHit(o, t, { f: 1500, sweep: 6000, sweepT: 0.4, q: 1.5, vol: 0.08, a: 0.1, tau: 0.1 });
  },
  golem(e, o, t) { // crumbles into rocks
    for (let i = 0; i < 5; i++) e.kick(o, t + i * 0.09 + rand(0, 0.03), 0.22 - i * 0.03, 160, 60, 0.04);
    e.noiseHit(o, t, { type: 'lowpass', f: 1400, vol: 0.18, a: 0.01, hold: 0.25, tau: 0.08 });
    crackle(e, o, t + 0.05, 10, 0.07);
  },
  frost_queen(e, o, t) { // a long descending glassy wail and a big shatter
    e.voice(o, t, 440, { type: 'triangle', glide: 2.2, glideT: 1.0, vol: 0.14, a: 0.03, hold: 0.9, rel: 0.3, cutoff: 2600, vib: 30, vibRate: 6, partials: [[2, 0.12]] });
    for (let i = 0; i < 12; i++) e.voice(o, t + 1.0 + i * rand(0.02, 0.05), rand(2500, 5500), { ...GLOCK, vol: 0.05, tau: 0.12 });
    e.noiseHit(o, t + 1.0, { type: 'highpass', f: 4000, sweep: 9000, sweepT: 0.3, vol: 0.18, tau: 0.1 });
  },
  astral_wyrm(e, o, t) { // a huge falling growl, a cascade of stars and a boom
    e.voice(o, t, 48, { type: 'sawtooth', glide: 2, glideT: 1.2, vol: 0.18, a: 0.03, hold: 1.1, rel: 0.25, cutoff: 600, unison: 14, vib: 50, vibRate: 18 });
    e.voice(o, t, 72, { type: 'sine', glide: 2, glideT: 1.2, vol: 0.1, a: 0.03, hold: 1.0, rel: 0.25 });
    e.kick(o, t + 1.15, 0.35, 100, 28, 0.25);
    e.noiseHit(o, t + 1.15, { type: 'lowpass', f: 3000, sweep: 100, sweepT: 0.9, vol: 0.2, tau: 0.2 });
    for (let i = 0; i < 12; i++) e.voice(o, t + 1.2 + i * 0.06, mtof(103 - i * 2), { ...GLOCK, vol: 0.04, tau: 0.25 });
  },
  // ——— the Caldera ———
  ember_imp(e, o, t) { // a falling squeak that fizzles out in a puff
    e.voice(o, t, 1800, { type: 'triangle', glide: 0.4, glideT: 0.2, vol: 0.12, a: 0.005, hold: 0.15, rel: 0.05, cutoff: 3500 });
    e.noiseHit(o, t + 0.12, { type: 'highpass', f: 6000, sweep: 1500, sweepT: 0.4, vol: 0.12, a: 0.01, hold: 0.1, tau: 0.1 });
    e.voice(o, t + 0.2, 500, { type: 'sine', glide: 0.4, glideT: 0.04, vol: 0.18, tau: 0.04 });
  },
  magma_slug(e, o, t) { // a long sinking glorp, a sizzle and a few last bubbles
    e.voice(o, t, 80, { type: 'sine', glide: 3, glideT: 0.5, vol: 0.18, a: 0.01, hold: 0.4, rel: 0.1, partials: [[2, 0.2]] });
    e.noiseHit(o, t + 0.1, { type: 'highpass', f: 3500, sweep: 1500, sweepT: 0.5, vol: 0.1, a: 0.05, hold: 0.3, tau: 0.12 });
    for (let i = 0; i < 4; i++) lavaBubble(e, o, t + 0.3 + i * 0.12, 0.1);
  },
  obsidian_crab(e, o, t) { // the shell cracks apart: glassy clatter and a little groan
    e.voice(o, t, 260, { type: 'triangle', glide: 1.5, glideT: 0.25, vol: 0.12, a: 0.01, hold: 0.15, rel: 0.08, cutoff: 1200 });
    e.noiseHit(o, t + 0.18, { type: 'highpass', f: 2500, vol: 0.25, tau: 0.03 });
    for (let i = 0; i < 10; i++) e.voice(o, t + 0.18 + i * rand(0.025, 0.05), rand(1800, 4200), { type: 'sine', vol: 0.05, a: 0.001, tau: 0.05, partials: [[2.7, 0.3]] });
  },
  cinder_bat(e, o, t) { // a falling screech and a fizzling ember
    e.voice(o, t, 1400, { type: 'square', glide: 2.2, glideT: 0.35, vol: 0.05, a: 0.005, hold: 0.3, rel: 0.05, cutoff: 4500, vib: 70, vibRate: 35 });
    e.noiseHit(o, t + 0.25, { type: 'highpass', f: 5000, sweep: 1500, sweepT: 0.3, vol: 0.1, a: 0.01, tau: 0.08 });
    crackle(e, o, t + 0.25, 4, 0.05);
  },
  ignis(e, o, t) { // a huge falling roar, an eruption and the crust crumbling
    e.voice(o, t, 44, { type: 'sawtooth', glide: 2, glideT: 1.0, vol: 0.2, a: 0.03, hold: 0.9, rel: 0.25, cutoff: 500, unison: 14, vib: 50, vibRate: 18 });
    e.noiseHit(o, t, { type: 'lowpass', f: 500, vol: 0.18, a: 0.05, hold: 0.8, tau: 0.1 });
    e.kick(o, t + 1.0, 0.4, 100, 28, 0.25);
    e.noiseHit(o, t + 1.0, { f: 500, sweep: 1500, sweepT: 0.3, q: 0.7, vol: 0.3, a: 0.02, hold: 0.3, tau: 0.2 });
    for (let i = 0; i < 6; i++) e.kick(o, t + 1.1 + i * 0.1 + rand(0, 0.03), 0.18 - i * 0.02, 160, 60, 0.04);
    crackle(e, o, t + 1.05, 14, 0.07);
  },
  pyra(e, o, t) { // a long falling cry, the flames fading, a few embers sparkling away
    e.voice(o, t, 1400, { type: 'triangle', glide: 1.6, glideT: 0.9, vol: 0.12, a: 0.02, hold: 0.8, rel: 0.3, cutoff: 3800, vib: 30, vibRate: 7, partials: [[2, 0.15]] });
    e.noiseHit(o, t, { f: 1200, sweep: 250, sweepT: 1.2, q: 0.7, vol: 0.25, a: 0.05, hold: 0.8, tau: 0.25 });
    for (let i = 0; i < 8; i++) e.voice(o, t + 1.0 + i * 0.07, mtof(98 - i * 2), { ...GLOCK, vol: 0.045, tau: 0.25 });
  },
  // ——— the Citadel ———
  cogling(e, o, t) { // a spring snaps "boing" and the gear falls apart (it splits in two)
    e.voice(o, t, 300, { type: 'triangle', glide: 2.5, glideT: 0.2, vol: 0.16, a: 0.005, hold: 0.15, rel: 0.05, cutoff: 2500, vib: 60, vibRate: 22 });
    for (let i = 0; i < 6; i++) e.noiseHit(o, t + 0.15 + i * rand(0.03, 0.06), { type: 'lowpass', f: rand(1200, 2500), vol: 0.14, tau: 0.015 });
    e.voice(o, t + 0.2, 1500, { type: 'sine', vol: 0.05, tau: 0.1, partials: [[2.7, 0.3]] });
  },
  cogbit(e, o, t) { // a tiny pop and a last tick
    e.voice(o, t, 1800, { type: 'sine', glide: 0.4, glideT: 0.03, vol: 0.35, tau: 0.03 });
    e.voice(o, t + 0.08, 2600, { type: 'sine', vol: 0.06, a: 0.001, tau: 0.01 });
  },
  sentry(e, o, t) { // powers down with a whir, sparks and a pop
    e.voice(o, t, 220, { type: 'square', glide: 5, glideT: 0.6, vol: 0.05, a: 0.01, hold: 0.55, rel: 0.05, cutoff: 2000 });
    crackle(e, o, t + 0.1, 7, 0.07);
    e.voice(o, t + 0.62, 700, { type: 'sine', glide: 0.4, glideT: 0.04, vol: 0.22, tau: 0.04 });
    e.noiseHit(o, t + 0.62, { type: 'lowpass', f: 1500, vol: 0.15, tau: 0.05 });
  },
  aether_knight(e, o, t) { // the crystal shatters and the armour clatters down
    e.noiseHit(o, t, { type: 'highpass', f: 3500, sweep: 8000, sweepT: 0.2, vol: 0.2, tau: 0.06 });
    for (let i = 0; i < 9; i++) e.voice(o, t + i * rand(0.02, 0.04), rand(2500, 5500), { ...GLOCK, vol: 0.045, tau: 0.1 });
    for (let i = 0; i < 4; i++) e.noiseHit(o, t + 0.25 + i * 0.09, { type: 'lowpass', f: 1400 - i * 200, vol: 0.18 - i * 0.03, tau: 0.03 });
  },
  chrono_wraith(e, o, t) { // a fading wail while its clock slows to a stop
    e.voice(o, t, 700, { type: 'sine', glide: 1.6, glideT: 0.6, vol: 0.08, a: 0.03, hold: 0.5, rel: 0.3, vib: 40, vibRate: 6, unison: 12 });
    [0, 0.15, 0.33, 0.55, 0.82].forEach((dt, i) => e.voice(o, t + dt, i % 2 ? 1800 : 2400, { type: 'sine', vol: 0.06 - i * 0.008, a: 0.001, tau: 0.01 }));
    e.voice(o, t + 0.9, mtof(93), { ...GLOCK, vol: 0.04, tau: 0.4 });
  },
  colossus(e, o, t) { // winding down, clanks, a huge crash and a last sigh of steam
    e.voice(o, t, 160, { type: 'sawtooth', glide: 2.5, glideT: 1.0, vol: 0.08, a: 0.02, hold: 0.9, rel: 0.1, cutoff: 900, vib: 30, vibRate: 15 });
    for (let i = 0; i < 4; i++) anvil(e, o, t + 0.2 + i * 0.2, 500 - i * 60, 0.05, 0.15);
    e.kick(o, t + 1.05, 0.4, 100, 26, 0.25);
    e.noiseHit(o, t + 1.05, { type: 'lowpass', f: 2500, sweep: 120, sweepT: 0.8, vol: 0.28, tau: 0.2 });
    crackle(e, o, t + 1.08, 10, 0.07);
    e.noiseHit(o, t + 1.3, { type: 'highpass', f: 3000, sweep: 1200, sweepT: 0.8, vol: 0.08, a: 0.1, hold: 0.5, tau: 0.2 });
  },
  chronos(e, o, t) { // the hours run out: descending chimes, a reverse swell, a boom and a fall of stars
    [88, 85, 81, 76, 73, 69].forEach((m, i) => anvil(e, o, t + i * 0.16, mtof(m), 0.035, 0.4));
    e.noiseHit(o, t + 0.4, { f: 200, sweep: 4000, sweepT: 0.9, q: 1.2, vol: 0.3, a: 0.9, tau: 0.015 });
    e.voice(o, t + 0.4, 49, { type: 'sawtooth', glide: 0.5, glideT: 0.9, vol: 0.1, a: 0.9, hold: 0.005, rel: 0.03, cutoff: 900, unison: 14 });
    e.kick(o, t + 1.3, 0.45, 100, 28, 0.25);
    e.noiseHit(o, t + 1.3, { type: 'lowpass', f: 3000, sweep: 100, sweepT: 0.9, vol: 0.22, tau: 0.2 });
    for (let i = 0; i < 12; i++) e.voice(o, t + 1.35 + i * 0.06, mtof(104 - i * 2), { ...GLOCK, vol: 0.04, tau: 0.25 });
  },
};
EFFECTS.victory = EFFECTS.bossDie;

// ——— the live controller ———
const ZONE_KEYS = {
  'Sprout Meadow': 'meadow', 'Mushroom Grove': 'grove', 'Bramble Woods': 'bramble',
  'The Mill': 'willowmere', 'Reedy Banks': 'willowmere', 'The Millpond': 'willowmere',
  'Frostpine Ridge': 'ridge', 'Starfall Summit': 'summit',
  'Cinder Flats': 'cinder', 'Magma Heart': 'magma', 'Cogwork Bastion': 'cogwork', 'Chrono Spire': 'spire',
};
const ROOM_KEYS = ['village', 'hall', 'piano', 'museum', 'tutor', null, 'king', 'mother', 'behemoth', null, 'glacia', 'wyrm',
  null, null, 'ignis', 'pyra', 'colossus', 'chronos', 'tutor', 'harbour', 'cliffs', 'crossing', 'crossing', 'fjord', 'willowmere', 'coves', 'tidemother', null, 'deep', 'glowroot', 'knotmole', 'canopy', 'wreck', 'thornheart', 'spine', 'warden', 'glacier', 'skerries', 'narwhal', 'grotto', 'heights', 'bluehalls', 'qbridge', 'sigrun', 'forgehold', 'straits', 'straits']; // (18: the furniture store, the cozy music box too; 19: the harbour; 20: the east cliffs; 21-22: the ferry's deck; 23: Icefang Hamlet; 24: Willowmere; 25: Saltspray Coves; 26: the Tidemother's den; 27: the Pet Shop; 28: the Mycelium Deep; 29: Glowroot Hollow; 30: the Knotmole's burrow; 31: the Old Oak Canopy; 32: Wreck Cave; 33: the Thornheart; 34: Keeper's Spine; 35: the Root Warden's court; 36: the Rimeglass Glacier; 37: the Whale Skerries; 38: the Old Narwhal's breathing hole; 39: the Narwhal Grotto; 40: the Aurora Heights; 41: the Blue Halls; 42: the Queen's Bridge; 43: Sigrun's seam; 44: Forgehold; 45-46: the Lodestar's deck)
const sceneKey = (room, zone) => {
  if (room === 5) return ZONE_KEYS[zone] ?? 'meadow'; // the Wildwood
  if (room === 9) return ZONE_KEYS[zone] ?? 'ridge'; // Frostpeak (the stage)
  if (room === 12) return ZONE_KEYS[zone] ?? 'cinder'; // Emberdeep (the legacy stage)
  if (room === 13) return ZONE_KEYS[zone] ?? 'cogwork'; // the Aether Citadel
  if (room >= 100) return 'tutor'; // personal houses (HOUSE_BASE in sim.js): the cozy music box
  return ROOM_KEYS[room] ?? null;
};

let ac = null, eng = null, current = null, timer = 0;
let scene = null, sceneArgs = null, muted = false, musicOn = true, intensity = 0;
try {
  musicOn = localStorage.getItem('slimeville-music') !== 'off';
} catch {}

const hidden = () => typeof document !== 'undefined' && document.visibilityState === 'hidden';

function tick() {
  timer = 0;
  if (!eng) return;
  eng.schedule(ac.currentTime + LOOKAHEAD);
  if (eng.players.length) timer = setTimeout(tick, TICK_MS);
}

function refresh() {
  if (!eng) return;
  const want = !muted && musicOn && !hidden() ? scene : null;
  if ((current?.key ?? null) === want) return;
  const now = ac.currentTime;
  current?.stop(now);
  current = want ? eng.start(want, now + 0.05) : null;
  if (!timer) tick();
}

if (typeof document !== 'undefined') document.addEventListener('visibilitychange', refresh);

export const audio = {
  unlock() {
    if (!ac) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        ac = new AC();
        eng = new Engine(ac);
        eng.intensity = intensity;
        if (muted) eng.master.gain.value = 0;
        const b = ac.createBufferSource(); // iOS: playing something inside the gesture unlocks output
        b.buffer = ac.createBuffer(1, 1, ac.sampleRate);
        b.connect(ac.destination);
        b.start();
      } catch {
        ac = eng = null;
        return;
      }
    }
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    refresh();
  },

  setScene(room, zone = null) {
    if (sceneArgs && sceneArgs[0] === room && sceneArgs[1] === zone) return;
    sceneArgs = [room, zone];
    const key = sceneKey(room, zone);
    if (key === scene) return;
    scene = key;
    refresh();
  },

  sfx(name, opts = {}) {
    if (!eng || muted || ac.state !== 'running') return;
    eng.sfx(name, opts);
  },

  setMusic(on) {
    musicOn = !!on;
    try {
      localStorage.setItem('slimeville-music', musicOn ? 'on' : 'off');
    } catch {}
    refresh();
  },

  // 0..1: pushes a boss track harder (extra drums and doubled lead) while the boss is enraged
  setIntensity(v) {
    intensity = Math.max(0, Math.min(1, Number(v) || 0));
    if (eng) eng.intensity = intensity;
  },

  get musicOn() {
    return musicOn;
  },

  setMuted(on) {
    muted = !!on;
    if (eng) {
      const g = eng.master.gain, t = ac.currentTime;
      g.cancelScheduledValues(t);
      g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(muted ? 0 : MASTER, t + 0.3);
    }
    refresh();
  },
};

// Greenhollow's branches' mobs borrow the voices of the legacy mobs they're built on (src/shared/rpg.js)
Object.assign(MOB_HURT, { dragonfly: MOB_HURT.cinder_bat, gloop_snail: MOB_HURT.magma_slug, snapjaw: MOB_HURT.golem, rock_crab: MOB_HURT.obsidian_crab, storm_gull: MOB_HURT.snow_owl ?? MOB_HURT.cinder_bat, snapshrimp: MOB_HURT.obsidian_crab, tidemother: MOB_HURT.obsidian_crab,
  puffcap: MOB_HURT.mushling, cave_bat: MOB_HURT.cinder_bat, puffball: MOB_HURT.mushling, puffling: MOB_HURT.cogbit, root_beetle: MOB_HURT.obsidian_crab, knot_spider: MOB_HURT.aether_knight,
  glowworm: MOB_HURT.magma_slug, glow_moth: MOB_HURT.wisp, thread_weaver: MOB_HURT.sentry, knotmole: MOB_HURT.ignis,
  oak_squirrel: MOB_HURT.mushling, tent_caterpillar: MOB_HURT.magma_slug, flying_squirrel: MOB_HURT.aether_knight, tawny_owl: MOB_HURT.snow_owl ?? MOB_HURT.cinder_bat, wasp_nest: MOB_HURT.mushling, wasp: MOB_HURT.cogbit, hornet: MOB_HURT.cinder_bat, hornet_queen: MOB_HURT.cinder_bat,
  barnacle_crab: MOB_HURT.obsidian_crab, drowned_lamp: MOB_HURT.wisp, moray_eel: MOB_HURT.magma_slug, bilge_rat: MOB_HURT.aether_knight, drowned_bosun: MOB_HURT.golem,
  thornback: MOB_HURT.bramble ?? MOB_HURT.obsidian_crab, thistle_puff: MOB_HURT.mushling, thistledown: MOB_HURT.cogbit, pitcher_plant: MOB_HURT.mushling, thorn_stalker: MOB_HURT.aether_knight, thorn_hart: MOB_HURT.golem,
  moss_turtle: MOB_HURT.obsidian_crab, crag_kite: MOB_HURT.snow_owl ?? MOB_HURT.cinder_bat, stone_sentinel: MOB_HURT.golem, gale_sprite: MOB_HURT.wisp, rootling: MOB_HURT.aether_knight, root_warden: MOB_HURT.colossus ?? MOB_HURT.golem,
  snow_hare: MOB_HURT.frostling, snow_petrel: MOB_HURT.snow_owl ?? MOB_HURT.cinder_bat, glacier_ram: MOB_HURT.obsidian_crab, rime_wolf: MOB_HURT.aether_knight, frost_wraith: MOB_HURT.wisp, great_yeti: MOB_HURT.yeti, rimehorn: MOB_HURT.golem,
  ice_seal: MOB_HURT.frostling, skua: MOB_HURT.snow_owl ?? MOB_HURT.cinder_bat, sea_urchin: MOB_HURT.mushling, whalebone_crab: MOB_HURT.obsidian_crab, sea_smoke: MOB_HURT.wisp, bull_walrus: MOB_HURT.yeti, old_narwhal: MOB_HURT.colossus ?? MOB_HURT.golem,
  lanternfish: MOB_HURT.wisp, ice_eel: MOB_HURT.magma_slug, brine_slug: MOB_HURT.magma_slug, ice_skate: MOB_HURT.aether_knight,
  ptarmigan: MOB_HURT.frostling, snow_fox: MOB_HURT.aether_knight, rime_eagle: MOB_HURT.snow_owl ?? MOB_HURT.cinder_bat, aurora_jelly: MOB_HURT.wisp, musk_ox: MOB_HURT.obsidian_crab, lost_star: MOB_HURT.wisp, pale_wyrm: MOB_HURT.astral_wyrm ?? MOB_HURT.golem,
  icicle_bat: MOB_HURT.cinder_bat, ice_worm: MOB_HURT.magma_slug, glass_beetle: MOB_HURT.obsidian_crab, prism_crawler: MOB_HURT.obsidian_crab, hall_troll: MOB_HURT.golem,
  rime_puffin: MOB_HURT.frostling, sleet_harrier: MOB_HURT.snow_owl ?? MOB_HURT.cinder_bat, rimeguard: MOB_HURT.aether_knight, hoarfrost_shade: MOB_HURT.wisp, leopard_seal: MOB_HURT.yeti, rime_archer: MOB_HURT.aether_knight, sigrun: MOB_HURT.colossus ?? MOB_HURT.golem });
Object.assign(MOB_DEATH, { dragonfly: MOB_DEATH.cinder_bat, gloop_snail: MOB_DEATH.magma_slug, rock_crab: MOB_DEATH.obsidian_crab, snapshrimp: MOB_DEATH.obsidian_crab,
  puffcap: MOB_DEATH.mushling, cave_bat: MOB_DEATH.cinder_bat, puffball: MOB_DEATH.mushling, root_beetle: MOB_DEATH.obsidian_crab, glowworm: MOB_DEATH.magma_slug, glow_moth: MOB_DEATH.wisp,
  oak_squirrel: MOB_DEATH.mushling, tent_caterpillar: MOB_DEATH.magma_slug, tawny_owl: MOB_DEATH.cinder_bat, wasp_nest: MOB_DEATH.mushling, hornet: MOB_DEATH.cinder_bat,
  barnacle_crab: MOB_DEATH.obsidian_crab, drowned_lamp: MOB_DEATH.wisp, moray_eel: MOB_DEATH.magma_slug, thornback: MOB_DEATH.bramble ?? MOB_DEATH.obsidian_crab, thistle_puff: MOB_DEATH.mushling, pitcher_plant: MOB_DEATH.mushling,
  moss_turtle: MOB_DEATH.obsidian_crab, crag_kite: MOB_DEATH.cinder_bat, stone_sentinel: MOB_DEATH.golem, gale_sprite: MOB_DEATH.wisp, root_warden: MOB_DEATH.colossus,
  snow_hare: MOB_DEATH.frostling, snow_petrel: MOB_DEATH.cinder_bat, glacier_ram: MOB_DEATH.obsidian_crab, frost_wraith: MOB_DEATH.wisp, great_yeti: MOB_DEATH.yeti, rimehorn: MOB_DEATH.yeti,
  ice_seal: MOB_DEATH.frostling, skua: MOB_DEATH.cinder_bat, sea_urchin: MOB_DEATH.mushling, whalebone_crab: MOB_DEATH.obsidian_crab, sea_smoke: MOB_DEATH.wisp, bull_walrus: MOB_DEATH.yeti, old_narwhal: MOB_DEATH.colossus,
  lanternfish: MOB_DEATH.wisp, ice_eel: MOB_DEATH.magma_slug, brine_slug: MOB_DEATH.magma_slug,
  ptarmigan: MOB_DEATH.frostling, rime_eagle: MOB_DEATH.cinder_bat, aurora_jelly: MOB_DEATH.wisp, musk_ox: MOB_DEATH.obsidian_crab, lost_star: MOB_DEATH.wisp, pale_wyrm: MOB_DEATH.astral_wyrm ?? MOB_DEATH.colossus,
  icicle_bat: MOB_DEATH.cinder_bat, ice_worm: MOB_DEATH.magma_slug, glass_beetle: MOB_DEATH.obsidian_crab, prism_crawler: MOB_DEATH.obsidian_crab, hall_troll: MOB_DEATH.yeti,
  rime_puffin: MOB_DEATH.frostling, sleet_harrier: MOB_DEATH.cinder_bat, hoarfrost_shade: MOB_DEATH.wisp, leopard_seal: MOB_DEATH.yeti, sigrun: MOB_DEATH.colossus });
