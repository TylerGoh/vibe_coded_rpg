// Docs: docs/social/voice.md
// TURN relay credentials for voice chat, from Cloudflare Realtime TURN.
// When two players' networks won't connect directly, WebRTC sends the audio through the relay instead.
//
// Configure with TURN_KEY_ID and TURN_KEY_API_TOKEN in the environment (rpg.service reads them from
// ~/.config/rpg/turn.env). Without them, getIceServers() returns null and clients use STUN only.
// Credentials are short-lived and only handed to logged-in players (in the welcome message).

const TTL = 24 * 3600; // seconds each set of credentials stays valid
const REFRESH = TTL / 2; // fetch fresh ones once the cached set is half used up
const FALLBACK_STUN = [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] }];

let cached = null; // { iceServers, at }
let inflight = null;
let warned = false;

export const turnConfigured = () => Boolean(process.env.TURN_KEY_ID && process.env.TURN_KEY_API_TOKEN);

async function fetchIce() {
  const url = `https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(process.env.TURN_KEY_ID)}/credentials/generate-ice-servers`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.TURN_KEY_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ttl: TTL }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Cloudflare TURN: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  const body = await res.json();
  const list = Array.isArray(body.iceServers) ? body.iceServers : [body.iceServers];
  // Browsers refuse port 53, and trying it just stalls the connection: drop those URLs.
  const iceServers = list
    .map((s) => ({ ...s, urls: [].concat(s.urls).filter((u) => !/:53(\?|$)/.test(u)) }))
    .filter((s) => s.urls.length);
  if (!iceServers.length) throw new Error('Cloudflare TURN: no usable ICE servers in response');
  return iceServers;
}

// → the iceServers list for RTCPeerConnection, or null to use the client's default STUN servers.
export async function getIceServers() {
  if (!turnConfigured()) return null;
  if (cached && Date.now() - cached.at < REFRESH * 1000) return cached.iceServers;
  inflight ??= fetchIce()
    .then((iceServers) => {
      cached = { iceServers, at: Date.now() };
      if (warned) console.log('TURN credentials working again');
      warned = false;
      return iceServers;
    })
    .catch((e) => {
      if (!warned) console.error(String(e)); // log once per outage, not once per login
      warned = true;
      return cached?.iceServers ?? FALLBACK_STUN; // an older set may still be valid
    })
    .finally(() => (inflight = null));
  return inflight;
}
