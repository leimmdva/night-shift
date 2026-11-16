// End-to-end check of the vertical slice with Playwright (see .kiro/specs/game-flow/tasks.md, milestone 1).
// Usage: node scripts/e2e-slice.mjs [url] [screenshot-dir]
//   url defaults to http://localhost:5173/ (start `npm run dev` first); pass the live URL to test the deploy.
// Needs Google Chrome (uses channel "chrome") or run `npx playwright install chromium` and set PW_CHANNEL=chromium.
// On the dev server the script uses window.__ns.spawnNow() to skip the 20-40 s wait; elsewhere it waits for the ghost.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const url = process.argv[2] ?? 'http://localhost:5173/'
const shots = process.argv[3] ?? 'docs/art/slice'
mkdirSync(shots, { recursive: true })

const channel = process.env.PW_CHANNEL === 'chromium' ? undefined : (process.env.PW_CHANNEL ?? 'chrome')
const browser = await chromium.launch({ channel })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const problems = []
page.on('console', (m) => {
  if (['error', 'warning'].includes(m.type())) problems.push(`console ${m.type()}: ${m.text()}`)
})
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`))
page.on('response', (r) => { if (r.status() >= 400) problems.push(`HTTP ${r.status()} ${r.url()}`) })

const state = () => page.evaluate(() => window.__ns.state())
const until = async (what, fn, ms = 10_000) => {
  const t0 = Date.now()
  for (;;) {
    const v = await fn()
    if (v) return v
    if (Date.now() - t0 > ms) throw new Error(`timeout waiting for ${what}`)
    await page.waitForTimeout(100)
  }
}
const shot = (name) => page.screenshot({ path: `${shots}/${name}.png` })
const check = (cond, msg) => { if (!cond) { console.error('FAIL:', msg); problems.push(`check failed: ${msg}`) } else console.log('ok  :', msg) }

await page.goto(url)
await until('game ready', () => page.evaluate(() => !!window.__ns))
await page.waitForTimeout(800)
await shot('01-office')

// laptop key while walking does nothing
await page.keyboard.press('l')
check((await state()).laptopOpen === false, 'laptop key while walking does nothing')

const dev = await page.evaluate(() => !!window.__ns.spawnNow)
const walkToWardrobe = async () => {
  await page.keyboard.down('ArrowUp')
  await until('hide prompt', async () => (await state()).prompt === 'E — hide', 6000)
  await page.keyboard.up('ArrowUp')
}

// walk up from the entrance to the wardrobe hide spot
await walkToWardrobe()
await shot('02-hide-prompt')
check((await state()).hideSpot === null, 'the hide prompt shows next to a hide spot')

if (dev) {
  // ghost spawns (dev: skip the 20-40 s wait), then catches the walking player
  await page.evaluate(() => window.__ns.spawnNow())
  const sp = await until('ghost spawn', async () => (await state()).monster ? await state() : null, 5000)
  check(sp.spawnInfo.deskDistance >= 6, `ghost spawned ${sp.spawnInfo.deskDistance.toFixed(1)} tiles from the desk (>= 6)`)
  await page.evaluate(() => window.__ns.monsterTo(6, 10))
  const seen = new Set()
  const t0 = Date.now()
  while ((await state()).deaths === 0 && Date.now() - t0 < 10_000) {
    seen.add((await state()).monster?.state)
    await page.waitForTimeout(50)
  }
  console.log('ghost states seen before the catch:', [...seen].join(', '))
  await shot('02b-caught')
  await page.waitForTimeout(1500)
  const c = await state()
  check(c.deaths === 1, 'the ghost caught the walking player (deaths = 1)')
  check(seen.has('PATROL') || seen.has('ALERT') || seen.has('CHASE'), 'ghost used MonsterAI states')
  check(c.monster !== null, 'the monster is still alive after the catch')
  check(c.hintLevels['null-ghost'] === 1, 'the catch gave one hint level')
  check(c.player.ty >= 11, 'the player woke up at the start (no hide spot used yet)')
  await until('control back', async () => !(await state()).catching, 5000)
  await page.waitForTimeout(2800) // grace period after waking
  await walkToWardrobe()
}
await page.keyboard.press('e')
await until('hidden', async () => (await state()).mode === 'hidden')
await page.waitForTimeout(500)
await shot('03-hidden')
check((await state()).mode === 'hidden', 'E at a hide spot hides the player')

// the ghost spawns 20-40 s after start
const s0 = await until('ghost spawn', async () => (await state()).monster ? await state() : null, 60_000)
console.log('spawn', JSON.stringify(s0.spawnInfo))
check(s0.spawnInfo.deskDistance >= 6, `ghost spawned ${s0.spawnInfo.deskDistance.toFixed(1)} tiles from the desk (>= 6)`)
check(s0.spawnInfo.atMs <= 40_000 || dev, `ghost spawned at ${s0.spawnInfo.atMs} ms (<= 40 s)`)

// dev only: put the ghost right next to the hiding player; a hidden player must not be caught
if (dev) {
  await page.evaluate(() => window.__ns.monsterTo(2, 10))
  await page.waitForTimeout(600)
  await shot('03b-ghost-at-the-hide-spot')
  await page.waitForTimeout(1500)
  const near = await state()
  check(near.deaths === 1 && near.mode === 'hidden', `ghost at the hide spot (${near.monster?.state}, ${Math.round(near.monster?.dist)} px away) does not catch the hidden player`)
}

// laptop opens only while hidden
await page.keyboard.press('l')
await until('laptop open', async () => (await state()).laptopOpen)
await page.waitForSelector('#monaco-container .monaco-editor', { timeout: 20_000 })
await page.waitForTimeout(500)
const m1 = (await state()).monster
await page.waitForTimeout(1500)
const m2 = (await state()).monster
check(m1 && m2 && (Math.abs(m1.x - m2.x) + Math.abs(m1.y - m2.y) > 1), `ghost keeps moving while the laptop is open (${m1?.state} -> ${m2?.state})`)

// run the broken code: tests fail
const box = await page.evaluate(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return { x: r.left, y: r.top, k: r.width / 960 } })
const click = (gx, gy) => page.mouse.click(box.x + gx * box.k, box.y + gy * box.k)
await click(168, 444)
await page.waitForFunction(() => document.querySelector('#test-output')?.textContent?.includes('✗'), null, { timeout: 8000 })
await shot('04-laptop')
check(true, 'unchanged code shows failing tests')

// hint
await click(338, 444)
await page.waitForTimeout(300)
check((await page.textContent('#test-output')).includes('Sudo:'), 'HINT shows a Sudo message')

// fix the code
await page.click('#monaco-container .monaco-editor .view-lines')
// dev only: bring the ghost into the camera view so the dissolve can be seen
if (dev) await page.evaluate(() => window.__ns.monsterTo(3, 9))
// line 4 of profile.js is `  return user.address.city`; replace it with the fix
await page.keyboard.press(process.platform === 'darwin' ? 'Meta+ArrowUp' : 'Control+Home')
for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowDown')
await page.keyboard.press('Home')
await page.keyboard.press('Shift+End')
await page.keyboard.insertText('return user.address?.city ?? null')
await page.waitForTimeout(300)
await click(168, 444)
await page.waitForFunction(() => document.querySelector('#test-output')?.textContent?.includes('All tests pass'), null, { timeout: 8000 }).catch(async (e) => { await shot('debug-fail'); console.log(await page.textContent('#test-output')); console.log(await page.innerText('#monaco-container .view-lines')); throw e })
await shot('05a-tests-pass')
check(true, 'fixed code passes all tests')

// ghost dissolves, autopsy card appears
await until('laptop closed', async () => !(await state()).laptopOpen, 5000)
await until('dissolve started', async () => (await state()).monster?.dissolving, 3000).catch(() => {})
await page.waitForTimeout(600)
await shot('05-dissolve')
await until('autopsy card', async () => (await state()).autopsyOpen, 6000)
await page.waitForTimeout(500)
await shot('06-autopsy')
const end = await state()
check(end.monster === null, 'ghost is gone after the dissolve')
check(end.solved.includes('null-ghost'), 'run state lists null-ghost as solved')
const saved = await page.evaluate(() => localStorage.getItem('night-shift-save'))
check(saved && JSON.parse(saved).solved.includes('null-ghost'), "localStorage['night-shift-save'] lists null-ghost")

await browser.close()
const bad = problems.filter((p) => !p.includes('favicon'))
if (bad.length) { console.error('\nProblems:\n' + bad.join('\n')); process.exit(1) }
console.log('\nslice E2E passed, no console warnings or 404s')
