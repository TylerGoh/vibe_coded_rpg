// Docs: docs/testing.md
// Headless-browser test helper (tests only, never against the live server on 3002). Import it from a
// scratch test script:
//   import { launch, page, sleep, wait } from '/home/tylergoh/rpg/scripts/cdp.mjs';
//   const br = await launch({ game: 3010 });        // a throwaway server's port
//   const a = await page(); await a.login('knight1'); // as many pages as players
//   await a.tp(6, 500); await a.key('Digit1'); await wait(3000); console.log(await a.eval('slimeville.net.me'));
//   br.kill();
// `wait(ms)` waits that many GAME ms: with the server on TEST_SPEED=N it waits ms/N real ms (set SPEED=N for
// the script too). `sleep(ms)` is always real time (page loads, logins).
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import WebSocket from '../node_modules/ws/index.js';

const SPEED = Number(process.env.SPEED) || 1;
const OUT = process.env.OUT ?? tmpdir(); // where shot() writes its PNGs: point it at your scratchpad
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const wait = (ms) => sleep(ms / SPEED);
let GAME = 3010, CDP = 9460;

export async function launch({ game = 3010, cdp = 9460 } = {}) {
  GAME = game;
  CDP = cdp;
  const dir = join(OUT, `chrome-${cdp}`);
  mkdirSync(dir, { recursive: true });
  const proc = spawn('/usr/bin/chromium', ['--headless=new', `--remote-debugging-port=${cdp}`, '--no-first-run', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--user-data-dir=${dir}`, '--window-size=960,540', 'about:blank'], { stdio: 'ignore' });
  for (let i = 0; i < 50; i++) {
    try {
      await fetch(`http://127.0.0.1:${cdp}/json/version`);
      break;
    } catch {
      await sleep(200);
    }
  }
  return proc;
}

export async function page() {
  const t = await (await fetch(`http://127.0.0.1:${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r) => ws.on('open', r));
  let id = 0;
  const waits = new Map();
  ws.on('message', (d) => {
    const m = JSON.parse(d);
    if (m.id && waits.has(m.id)) {
      waits.get(m.id)(m);
      waits.delete(m.id);
    }
    if (m.method === 'Runtime.exceptionThrown') console.log('EXC', m.params.exceptionDetails.exception?.description?.slice(0, 300));
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') console.log('CONSOLE', JSON.stringify(m.params.args).slice(0, 400));
  });
  const send = (method, params = {}) => new Promise((r) => {
    const i = ++id;
    waits.set(i, r);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  await send('Runtime.enable');
  await send('Page.enable');
  const p = {
    send,
    async eval(expr) {
      const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.result?.exceptionDetails) console.log('EVAL ERR', expr.slice(0, 80), JSON.stringify(r.result.exceptionDetails).slice(0, 400));
      return r.result?.result?.value;
    },
    // keys go to the focused page only: call front() before typing on one of several pages
    async front() {
      await send('Page.bringToFront');
      await send('Emulation.setFocusEmulationEnabled', { enabled: true });
    },
    // hold is in game ms (TEST_SPEED shortens it like everything else)
    async key(code, type = 'both', hold = 80) {
      const k = (t) => send('Input.dispatchKeyEvent', { type: t, code, key: code, windowsVirtualKeyCode: 0 });
      if (type !== 'up') await k('keyDown');
      if (type === 'both') await wait(hold);
      if (type !== 'down') await k('keyUp');
    },
    async shot(name) {
      const r = await send('Page.captureScreenshot', { format: 'png' });
      const file = join(OUT, `${name}.png`);
      writeFileSync(file, Buffer.from(r.result.data, 'base64'));
      return file;
    },
    async click(x, y) {
      for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
    },
    // needs TEST_TP=1 on the server; room -1 is your own house
    async tp(room, x) {
      await p.eval(`slimeville.net.sendNpc({ t: 'tp', room: ${room}, x: ${x} })`);
      await wait(300);
    },
    // mobile: a phone (844×390, touch, coarse pointer); docs/ui/mobile.md
    async login(user, mobile = false, pass = 'pw') {
      if (mobile) {
        await send('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 2, mobile: true });
        await send('Emulation.setTouchEmulationEnabled', { enabled: true });
        await send('Emulation.setEmulatedMedia', { features: [{ name: 'pointer', value: 'coarse' }] });
      } else await send('Emulation.setDeviceMetricsOverride', { width: 960, height: 540, deviceScaleFactor: 1, mobile: false });
      await send('Page.navigate', { url: `http://127.0.0.1:${GAME}/rpg/#debug` });
      await sleep(1500);
      await p.eval(`document.getElementById('name').value='${user}'; document.getElementById('pass').value='${pass}'; document.getElementById('go').click()`);
      await sleep(1500);
    },
  };
  return p;
}
