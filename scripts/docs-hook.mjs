// Docs: Agent.md (Keeping the docs current)
// Claude Code Stop hook (.claude/settings.json). When the agent is about to end its turn:
//   - runs the docs check (scripts/docs-check.mjs) and sends the agent back to fix any problem;
//   - if this turn edited game code (src/, server/, index.html; also in a dev copy of the repo) but no
//     docs (docs/ or Agent.md), sends it back once to update the docs or say none were needed.
// It blocks at most once per stop (stop_hook_active), so it can't loop. Any failure here lets the stop through.
import { readFileSync } from 'node:fs';
import { checkDocs } from './docs-check.mjs';

const CODE = /\/(src|server)\/[\w./-]+\.(js|css)$|\/index\.html$/;
const DOCS = /\/docs\/[\w./-]+\.md$|\/Agent\.md$/;
// shell commands that write files: an install / sed -i / redirect / python or node script touching a path
const WRITES = /\b(install|sed\s+-i|tee|python3?|node\s+-e)\b|>\s*\S/;

function editsThisTurn(transcriptPath) {
  const lines = readFileSync(transcriptPath, 'utf8').trim().split('\n');
  const tools = [];
  for (const line of lines) {
    let o;
    try {
      o = JSON.parse(line);
    } catch {
      continue;
    }
    const content = o.message?.content;
    // a real prompt from the user starts a new turn (tool results also arrive as "user" lines)
    if (o.type === 'user' && !o.isMeta && (typeof content === 'string' || content?.some?.((c) => c.type === 'text'))) tools.length = 0;
    if (o.type === 'assistant' && Array.isArray(content)) for (const c of content) if (c.type === 'tool_use') tools.push(c);
  }
  let code = false, docs = false;
  for (const t of tools) {
    const path = t.input?.file_path ?? '';
    if (['Edit', 'Write', 'NotebookEdit'].includes(t.name)) {
      code ||= CODE.test(path);
      docs ||= DOCS.test(path);
    } else if (t.name === 'Bash' && WRITES.test(t.input?.command ?? '')) {
      const cmd = t.input.command;
      code ||= /\b(src|server)\/[\w./-]+\.(js|css)\b/.test(cmd);
      docs ||= /\bdocs\/[\w./-]+\.md\b|\bAgent\.md\b/.test(cmd);
    }
  }
  return { code, docs };
}

let input = {};
try {
  input = JSON.parse(readFileSync(0, 'utf8') || '{}');
} catch {}
if (input.stop_hook_active) process.exit(0);

const reasons = [];
try {
  const problems = checkDocs();
  if (problems.length) reasons.push(`npm run docs:check found problems; fix the docs (or the Docs: lines):\n- ${problems.join('\n- ')}`);
} catch (e) {
  process.exit(0);
}
try {
  if (input.transcript_path) {
    const { code, docs } = editsThisTurn(input.transcript_path);
    if (code && !docs) reasons.push('This turn changed game code but no docs. Update the doc(s) that cover what you changed (the "// Docs:" line at the top of each file you edited names them; see the index in Agent.md), or tell the user in one line that no doc needed changing.');
  }
} catch {}
if (reasons.length) console.log(JSON.stringify({ decision: 'block', reason: reasons.join('\n\n') }));
