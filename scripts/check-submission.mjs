// Offline checklist for the Kiroween submission rules (see .kiro/steering/kiroween-rules.md).
// Usage: npm run check-submission. Exits 1 if any check fails; warnings do not fail.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const results = []
const add = (status, name, detail = '') => results.push({ status, name, detail })
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8')
const exists = rel => fs.existsSync(path.join(root, rel))
const git = (...args) => {
  try {
    return { ok: true, out: execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }) }
  } catch (e) {
    return { ok: false, out: '', code: e.status }
  }
}
const section = (md, titlePattern) => {
  const lines = md.split('\n')
  const start = lines.findIndex(l => /^#{1,6}\s/.test(l) && titlePattern.test(l))
  if (start < 0) return null
  const level = lines[start].match(/^#+/)[0].length
  let end = lines.length
  for (let i = start + 1; i < lines.length; i++) {
    const m = lines[i].match(/^(#+)\s/)
    if (m && m[1].length <= level) { end = i; break }
  }
  return lines.slice(start + 1, end).join('\n')
}
const walk = (dir, out = []) => {
  if (!fs.existsSync(dir)) return out
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

// 1. LICENSE is MIT
if (!exists('LICENSE')) add('FAIL', 'LICENSE exists and is MIT', 'LICENSE not found')
else if (/^\s*MIT License/i.test(read('LICENSE')) && /Permission is hereby granted, free of charge/.test(read('LICENSE'))) add('PASS', 'LICENSE exists and is MIT')
else add('FAIL', 'LICENSE exists and is MIT', 'LICENSE does not look like the MIT text')

// 2. .kiro not ignored, tracked by git
{
  const files = walk(path.join(root, '.kiro')).map(f => path.relative(root, f))
  const ignored = files.filter(f => git('check-ignore', '-q', f).ok)
  const tracked = git('ls-files', '.kiro').out.split('\n').filter(Boolean)
  const untracked = files.filter(f => !tracked.includes(f))
  if (!files.length) add('FAIL', '.kiro is committed and not ignored', '.kiro is missing or empty')
  else if (ignored.length) add('FAIL', '.kiro is committed and not ignored', `ignored by git: ${ignored.slice(0, 3).join(', ')}`)
  else if (!tracked.length) add('FAIL', '.kiro is committed and not ignored', 'no .kiro file is tracked by git')
  else if (untracked.length) add('WARN', '.kiro is committed and not ignored', `${untracked.length} file(s) not committed yet, e.g. ${untracked[0]}`)
  else add('PASS', '.kiro is committed and not ignored', `${tracked.length} tracked files`)
}

// 3. README sections
const readme = exists('README.md') ? read('README.md') : ''
add(section(readme, /How Kiro was used/i) ? 'PASS' : 'FAIL', 'README has "How Kiro was used" section')
const credits = section(readme, /^#+\s+Credits\b/i)
add(credits !== null ? 'PASS' : 'FAIL', 'README has "Credits" section')

// 4. KIRO_LOG and sessions
add(exists('docs/KIRO_LOG.md') ? 'PASS' : 'FAIL', 'docs/KIRO_LOG.md exists')
const sessionDir = path.join(root, 'docs/kiro-sessions')
const sessionFiles = fs.existsSync(sessionDir) ? fs.readdirSync(sessionDir).filter(f => f.endsWith('.md')) : []
add(sessionFiles.length ? 'PASS' : 'FAIL', 'docs/kiro-sessions/ exists with session files', `${sessionFiles.length} file(s)`)
{
  const bad = sessionFiles.filter(f => !/^\d{4}-\d{2}-\d{2}-\d{2}-[a-z0-9-]+\.md$/.test(f) && !f.startsWith('before-'))
  const noFeedback = sessionFiles.filter(f => /^\d{4}-/.test(f) && !/^## Owner feedback/m.test(fs.readFileSync(path.join(sessionDir, f), 'utf8')))
  const paths = sessionFiles.filter(f => /\/private\/tmp\/\S|\/Users\/\w+/.test(fs.readFileSync(path.join(sessionDir, f), 'utf8')))
  if (bad.length) add('FAIL', 'Session file names are YYYY-MM-DD-NN-slug.md', bad.join(', '))
  else add('PASS', 'Session file names are YYYY-MM-DD-NN-slug.md')
  if (noFeedback.length) add('FAIL', 'Every session file has an "Owner feedback" section', noFeedback.join(', '))
  else add('PASS', 'Every session file has an "Owner feedback" section')
  if (paths.length) add('FAIL', 'No local machine paths in session files', paths.join(', '))
  else add('PASS', 'No local machine paths in session files')
}

// 5. Timeline commit hashes exist in git
if (exists('docs/KIRO_LOG.md')) {
  const timeline = section(read('docs/KIRO_LOG.md'), /^#+\s+Timeline\b/i) ?? ''
  const hashes = new Set()
  let pending = 0
  for (const line of timeline.split('\n').filter(l => /^- Commit:/.test(l))) {
    if (/pending/i.test(line)) pending++
    for (const m of line.matchAll(/\b[0-9a-f]{7,40}\b/g)) hashes.add(m[0])
  }
  const missing = [...hashes].filter(h => !git('cat-file', '-e', `${h}^{commit}`).ok)
  if (!hashes.size) add('FAIL', 'Timeline commit hashes exist in git', 'no hashes found')
  else if (missing.length) add('FAIL', 'Timeline commit hashes exist in git', `not in git: ${missing.join(', ')}`)
  else add('PASS', 'Timeline commit hashes exist in git', `${hashes.size} hashes${pending ? `, ${pending} entry marked pending` : ''}`)
  if (pending > 1) add('WARN', 'At most one Timeline commit is "pending"', `${pending} entries are pending`)
}

// 6. Fonts and audio are listed in Credits
{
  const assets = [...walk(path.join(root, 'public/fonts')), ...walk(path.join(root, 'public/audio'))]
  const unlisted = assets.map(f => path.basename(f)).filter(n => !(credits ?? '').includes(n))
  if (!assets.length) add('PASS', 'public/fonts and public/audio files are listed in Credits', 'no files')
  else if (unlisted.length) add('FAIL', 'public/fonts and public/audio files are listed in Credits', `not listed: ${unlisted.join(', ')}`)
  else add('PASS', 'public/fonts and public/audio files are listed in Credits', `${assets.length} files`)
}

// 7. Non-English text in src/ (warn only)
{
  const nonEnglish = /[\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF\u0590-\u06FF\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/
  const hits = []
  for (const f of walk(path.join(root, 'src')).filter(f => /\.(ts|js|json|html|css)$/.test(f))) {
    fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
      if (nonEnglish.test(line)) hits.push(`${path.relative(root, f)}:${i + 1}`)
    })
  }
  if (hits.length) add('WARN', 'No non-English text in src/', `${hits.length} line(s), e.g. ${hits.slice(0, 3).join(', ')}`)
  else add('PASS', 'No non-English text in src/')
}

const mark = { PASS: '[PASS]', FAIL: '[FAIL]', WARN: '[WARN]' }
console.log('Kiroween submission check\n')
for (const r of results) console.log(`${mark[r.status]} ${r.name}${r.detail ? ` (${r.detail})` : ''}`)
const fails = results.filter(r => r.status === 'FAIL').length
const warns = results.filter(r => r.status === 'WARN').length
console.log(`\n${results.length - fails - warns} passed, ${warns} warning(s), ${fails} failed`)
console.log('Not checked offline: public repo and About licence, live demo, YouTube video, submission form.')
process.exit(fails ? 1 : 0)
