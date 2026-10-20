// Docs: docs/social/voice.md
// Proximity voice chat: peer-to-peer WebRTC audio between slimes that are near each other.
//
// - A call is set up once two slimes come within CONNECT_RANGE and torn down past DISCONNECT_RANGE
//   (the gap stops calls flapping at the edge). Only the lower player id decides when to call or hang
//   up, so the two sides never disagree; the other side just answers.
// - What you hear fades with distance: full volume within FULL_RANGE, silent beyond HEAR_RANGE.
//   Volume is set on a plain <audio> element per peer (not Web Audio) so the browser's echo
//   cancellation keeps working for people on speakers.
// - Every call is two-way from the start; turning the mic on/off swaps the outgoing track with
//   replaceTrack(), so no renegotiation is needed. Listening needs no mic at all.
// - Broadcasting: anyone can go "live" (server message `cast`). A broadcaster is called by every slime in every
//   room and heard at full volume. It's one way: the broadcaster still hears everyone else by proximity
//   only (someone in another room plays at volume 0), so a crowd of listeners never talks back over them.
// - Signalling (offers, answers, ICE candidates, byes) goes over the game WebSocket via the server.

export const FULL_RANGE = 160;
export const HEAR_RANGE = 700;
const CONNECT_RANGE = 900;
const DISCONNECT_RANGE = 1100;
const RETRY_AFTER = 5000; // ms before calling someone again after a call failed

// Used unless the server hands out TURN relay servers at login (server/turn.js)
const DEFAULT_ICE = [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] }];

export const volumeAt = (d) => {
  const t = Math.min(1, Math.max(0, (d - FULL_RANGE) / (HEAR_RANGE - FULL_RANGE)));
  return (1 - t) ** 2; // falls off quickly at first, then trails away
};

export class Voice {
  constructor(signal) {
    this.signal = signal; // (to, data) → sends over the game socket
    this.iceServers = DEFAULT_ICE;
    this.peers = new Map(); // id → { pc, audio, analyser, queue, level, retryAt }
    this.failed = new Map(); // id → time we may call again
    this.casters = new Set(); // ids broadcasting to everyone (ours included), as the server tells us
    this.micStream = null;
    this.micAnalyser = null;
    this.micOn = false;
    this.micLevel = 0;
    this.ctx = null;
  }

  // Must be called from a user gesture (a click or key press) so audio is allowed to play.
  unlock() {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        return;
      }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    for (const p of this.peers.values()) p.audio.play().catch(() => {});
  }

  meter(stream) {
    if (!this.ctx) return null;
    const a = this.ctx.createAnalyser();
    a.fftSize = 512;
    this.ctx.createMediaStreamSource(stream).connect(a); // measured only, never played through Web Audio
    return a;
  }

  // → true if the mic is now on. Throws if the browser refused the microphone.
  async setMic(on) {
    this.unlock();
    if (on && !this.micStream) {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      this.micAnalyser = this.meter(this.micStream);
    }
    if (!on && this.micStream) {
      for (const t of this.micStream.getTracks()) t.stop(); // really let go of the mic (browser indicator goes off)
      this.micStream = null;
      this.micAnalyser = null;
    }
    this.micOn = on;
    const track = this.micStream?.getAudioTracks()[0] ?? null;
    for (const p of this.peers.values()) p.sender?.replaceTrack(track).catch(() => {});
    return on;
  }

  newPeer(id) {
    const pc = new RTCPeerConnection({ iceServers: this.iceServers });
    const audio = new Audio();
    audio.autoplay = true;
    audio.volume = 0;
    const p = { pc, audio, analyser: null, queue: [], level: 0, sender: null };
    pc.onicecandidate = (e) => e.candidate && this.signal(id, { c: e.candidate.toJSON() });
    pc.ontrack = (e) => {
      const stream = e.streams[0] ?? new MediaStream([e.track]);
      audio.srcObject = stream;
      audio.play().catch(() => {});
      p.analyser = this.meter(stream);
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        this.close(id);
        this.failed.set(id, performance.now() + RETRY_AFTER);
      }
    };
    this.peers.set(id, p);
    return p;
  }

  async call(id) {
    const p = this.newPeer(id);
    const tr = p.pc.addTransceiver('audio', { direction: 'sendrecv' });
    p.sender = tr.sender;
    await tr.sender.replaceTrack(this.micStream?.getAudioTracks()[0] ?? null);
    await p.pc.setLocalDescription(await p.pc.createOffer());
    this.signal(id, { sdp: p.pc.localDescription.toJSON() });
  }

  async receive(from, d) {
    try {
      if (d.bye) {
        this.close(from);
      } else if (d.sdp?.type === 'offer') {
        this.close(from); // a fresh call replaces any old one
        const p = this.newPeer(from);
        await p.pc.setRemoteDescription(d.sdp);
        const tr = p.pc.getTransceivers()[0];
        tr.direction = 'sendrecv';
        p.sender = tr.sender;
        await tr.sender.replaceTrack(this.micStream?.getAudioTracks()[0] ?? null);
        await p.pc.setLocalDescription(await p.pc.createAnswer());
        this.signal(from, { sdp: p.pc.localDescription.toJSON() });
        this.flush(p);
      } else if (d.sdp?.type === 'answer') {
        const p = this.peers.get(from);
        if (!p) return;
        await p.pc.setRemoteDescription(d.sdp);
        this.flush(p);
      } else if (d.c) {
        const p = this.peers.get(from);
        if (!p) return;
        if (p.pc.remoteDescription) await p.pc.addIceCandidate(d.c);
        else p.queue.push(d.c); // arrived before the offer/answer was applied
      }
    } catch (e) {
      console.warn('voice: signalling error with', from, e);
      this.close(from);
    }
  }

  flush(p) {
    for (const c of p.queue) p.pc.addIceCandidate(c).catch(() => {});
    p.queue = [];
  }

  close(id) {
    const p = this.peers.get(id);
    if (!p) return;
    p.pc.close();
    p.audio.srcObject = null;
    this.peers.delete(id);
  }

  // Hang up on everyone and release the mic (logout, kicked, disconnected).
  reset() {
    for (const id of [...this.peers.keys()]) this.close(id);
    this.failed.clear();
    this.casters.clear();
    if (this.micOn || this.micStream) this.setMic(false);
  }

  // Once per frame: place calls / hang up by distance, and set each voice's volume.
  // me: { id, x, y, room }; others: Map(id → { x, y, room }) — everyone online, in any room
  update(me, others) {
    const now = performance.now();
    const meCasting = this.casters.has(me.id);
    for (const [id, o] of others) {
      const sameRoom = o.room === me.room;
      const d = sameRoom ? Math.hypot(o.x - me.x, o.y - me.y) : Infinity;
      const cast = meCasting || this.casters.has(id); // a broadcast links the pair wherever they are
      const p = this.peers.get(id);
      if (me.id < id) {
        // we're the caller for this pair
        if (!p && (cast || d < CONNECT_RANGE) && (this.failed.get(id) ?? 0) < now) {
          this.call(id).catch((e) => {
            console.warn('voice: call failed', e);
            this.close(id);
            this.failed.set(id, now + RETRY_AFTER);
          });
        } else if (p && !cast && d > DISCONNECT_RANGE) {
          this.close(id);
          this.signal(id, { bye: 1 });
        }
      }
      if (p) {
        p.audio.volume = this.casters.has(id) ? 1 : volumeAt(d); // a broadcaster is loud everywhere
        p.level = level(p.analyser) * (p.audio.volume > 0.01 ? 1 : 0); // only "speaking" if you can hear it
      }
    }
    for (const id of this.peers.keys()) if (!others.has(id)) this.close(id); // they left or vanished
    this.micLevel = this.micOn ? level(this.micAnalyser) : 0;
  }

  // Set by the server at login: STUN plus TURN relay servers, or null for the defaults.
  setIceServers(list) {
    this.iceServers = list?.length ? list : DEFAULT_ICE;
  }

  get hasRelay() {
    return this.iceServers.some((s) => [].concat(s.urls).some((u) => u.startsWith('turn')));
  }

  // For the Esc menu: each call's state, and whether audio goes direct or through the relay.
  async status() {
    const out = [];
    for (const [id, p] of this.peers) {
      let route = '';
      if (p.pc.connectionState === 'connected') {
        try {
          const stats = await p.pc.getStats();
          let pair;
          stats.forEach((r) => {
            if (r.type === 'transport' && r.selectedCandidatePairId) pair = stats.get(r.selectedCandidatePairId);
          });
          if (!pair) stats.forEach((r) => r.type === 'candidate-pair' && r.nominated && r.state === 'succeeded' && (pair = r));
          const local = pair && stats.get(pair.localCandidateId), remote = pair && stats.get(pair.remoteCandidateId);
          if (local) route = local.candidateType === 'relay' || remote?.candidateType === 'relay' ? 'relay' : 'direct';
        } catch {}
      }
      out.push({ id, state: p.pc.connectionState, route, volume: p.audio.volume });
    }
    return out;
  }

  setCast(id, on) {
    if (on) this.casters.add(id);
    else this.casters.delete(id);
  }

  levelOf(id) {
    return this.peers.get(id)?.level ?? 0;
  }
}

const buf = new Uint8Array(512);
// Loudness 0..1 of whatever the analyser is hearing
function level(a) {
  if (!a) return 0;
  a.getByteTimeDomainData(buf);
  let sum = 0;
  for (let i = 0; i < a.fftSize; i++) sum += (buf[i] - 128) ** 2;
  return Math.min(1, Math.sqrt(sum / a.fftSize) / 30);
}
