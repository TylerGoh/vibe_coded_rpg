// Docs: docs/ui/updates.md
// "A new patch is out" banner. Every welcome carries `build`, the hashed asset files the server's
// index.html loads; this tab's own build is the same list read from its page at load time. When they
// differ (a deploy happened while this tab stayed open and it reconnected), offer Install, which
// reloads (index.html is served no-cache, so that picks up the new assets) and logs straight back in.

// Read at import time, before anything could add more <script>/<link> tags.
const MINE = buildOf(
  [...document.querySelectorAll('script[src], link[href]')].map((el) => el.getAttribute('src') || el.getAttribute('href')).join(' '),
);

// Same rule as buildId() in server/index.js: every distinct assets/…js|css name, sorted.
function buildOf(text) {
  return [...new Set(text.match(/assets\/[\w.-]+\.(?:js|css)/g) ?? [])].sort().join(',');
}

const box = document.getElementById('update');
let later = null; // the build the player said "Later" to: don't nag again until a newer one

const RESUME = 'slimeville-resume';
let creds = () => null;
// main.js hands over who's logged in, so the reload can log straight back in.
export function onInstall(fn) {
  creds = fn;
}
// The login Install stashed (once: it's deleted as it's read). sessionStorage is per tab and gone when it closes.
export function takeResume() {
  try {
    const v = JSON.parse(sessionStorage.getItem(RESUME) || 'null');
    sessionStorage.removeItem(RESUME);
    return v?.user && v.pass ? v : null;
  } catch {
    return null;
  }
}

document.getElementById('update-go').addEventListener('click', () => {
  try {
    const c = creds();
    if (c) sessionStorage.setItem(RESUME, JSON.stringify(c));
  } catch {}
  location.reload();
});
document.getElementById('update-later').addEventListener('click', (e) => {
  e.currentTarget.blur(); // (so the game's keys go back to the game)
  box.hidden = true;
  later = box.dataset.build;
});

// Called with the welcome's `build`. Dev mode (vite's /src/ scripts) and old servers have no build: skip.
export function checkBuild(build) {
  if (!build || !MINE || build === MINE || build === later) return;
  box.dataset.build = build;
  box.hidden = false;
}
