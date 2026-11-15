// Draws every monster into scripts/sprites/src/*.txt. Run `npm run draw-sprites`, then `npm run build-sprites`.
// Optional: pass function names to redraw only those (e.g. `npm run draw-sprites -- nullGhost`).
import * as m1 from './m1.mjs'
import * as m2 from './m2.mjs'
import * as m3 from './m3.mjs'
import * as m4 from './m4.mjs'

const only = process.argv.slice(2)
const jobs = { ...m1, ...m2, ...m3, ...m4 }
for (const [name, fn] of Object.entries(jobs)) if (!only.length || only.includes(name)) fn()
