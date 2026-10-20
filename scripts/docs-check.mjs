// Docs: Agent.md (Keeping the docs current)
// Checks that the agent docs still match the code (npm run docs:check; also run by the Stop hook,
// scripts/docs-hook.mjs). It fails when:
//   1. a doc under docs/ is missing from the index in Agent.md (or the index links a missing doc);
//   2. a doc names a repo path in backticks that doesn't exist;
//   3. a doc names an identifier in backticks that appears nowhere in the code;
//   4. a .js file under src/ or server/ has no "Docs:" line near its top, or names a doc that doesn't exist.
// Identifiers shorter than 4 characters, and backticked text with spaces or punctuation (commands,
// message shapes, CSS), are not checked. Names from outside this codebase go in EXTERNAL below.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// Backticked names that are real but live outside the code (browser / CDP APIs, tools, tables' columns…)
const EXTERNAL = new Set([
  'Input', 'dispatchKeyEvent', 'dispatchTouchEvent', 'Runtime', 'evaluate', 'Page', 'captureScreenshot',
  'Emulation', 'setDeviceMetricsOverride', 'setTouchEmulationEnabled', 'setEmulatedMedia', 'Restart',
]);

const walk = (dir, ok) => {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p, ok));
    else if (ok(p)) out.push(p);
  }
  return out;
};

export function checkDocs() {
  const problems = [];
  const rel = (p) => relative(ROOT, p);
  const agent = join(ROOT, 'Agent.md');
  const docs = walk(join(ROOT, 'docs'), (p) => p.endsWith('.md'));
  const sources = [...walk(join(ROOT, 'src'), (p) => p.endsWith('.js')), ...walk(join(ROOT, 'server'), (p) => p.endsWith('.js'))];
  const corpusFiles = [...sources, ...walk(join(ROOT, 'scripts'), (p) => /\.m?js$/.test(p)), join(ROOT, 'index.html'), join(ROOT, 'src/style.css'), join(ROOT, 'package.json'), ...walk(join(ROOT, 'deploy'), () => true)];
  const corpus = corpusFiles.filter(existsSync).map((p) => readFileSync(p, 'utf8')).join('\n');
  const known = new Set(corpus.match(/[A-Za-z_$][\w$]*/g));
  const skip = new Set(['node_modules', 'data', 'dist', '.git']);
  const basenames = new Set(walk(ROOT, (p) => !relative(ROOT, p).split('/').some((d) => skip.has(d))).map((p) => p.split('/').pop()));

  // 1. the index
  const index = readFileSync(agent, 'utf8');
  for (const d of docs) if (!index.includes(rel(d))) problems.push(`${rel(d)} is not in the docs index in Agent.md`);
  for (const [, link] of index.matchAll(/\]\((docs\/[^)]+\.md)\)/g)) if (!existsSync(join(ROOT, link))) problems.push(`Agent.md links ${link}, which doesn't exist`);

  // 2 + 3. what the docs name
  for (const file of [agent, ...docs]) {
    const text = readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, ''); // skip code blocks
    const missing = new Set();
    for (const [, span] of text.matchAll(/`([^`\n]+)`/g)) {
      if (/^[\w./-]+\.(js|mjs|md|css|html|json|service|sh|sqlite)$|^[\w.-]+\/$|^[\w.-]+\/[\w./-]*\/$/.test(span)) {
        // a bare file name ("sim.js") may sit anywhere in the repo; a path must exist as written
        if (span.includes('/') ? !existsSync(join(ROOT, span)) : !basenames.has(span)) missing.add(`path ${span}`);
        continue;
      }
      const m = /^([A-Za-z_$][\w$.]*)(\(.*\))?$/.exec(span);
      if (!m) continue;
      for (const part of m[1].split('.')) if (part.length >= 4 && !known.has(part) && !EXTERNAL.has(part)) missing.add(`name ${part}`);
    }
    for (const x of missing) problems.push(`${rel(file)} mentions ${x}, which isn't in the code`);
  }

  // 4. every source file says which doc covers it
  for (const s of sources) {
    const head = readFileSync(s, 'utf8').split('\n').slice(0, 12).join('\n');
    const line = /Docs:\s*(.+)/.exec(head);
    if (!line) {
      problems.push(`${rel(s)} has no "// Docs:" line in its first lines`);
      continue;
    }
    for (const [ref] of line[1].matchAll(/(docs\/[\w./-]+\.md|Agent\.md)/g)) if (!existsSync(join(ROOT, ref))) problems.push(`${rel(s)} points to ${ref}, which doesn't exist`);
  }
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = checkDocs();
  if (problems.length) {
    console.error(`docs:check found ${problems.length} problem(s):\n- ${problems.join('\n- ')}`);
    process.exit(1);
  }
  console.log('docs:check ok');
}
