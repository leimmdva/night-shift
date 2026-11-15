// Draws every office tile and prop into scripts/sprites/src/office/*.txt.
// Run `npm run draw-office`, or `npm run build-office` to draw, build PNGs, compose and render the previews.
// Optional: pass function names to redraw only those (e.g. `npm run draw-office -- sofa locker`).
import * as tiles from './office-tiles.mjs'
import * as props from './office-props.mjs'
import * as decor from './office-decor.mjs'
import * as props2 from './office-props2.mjs'

const only = process.argv.slice(2)
const isJob = ([, fn]) => typeof fn === 'function' && !/^draw[A-Z]/.test(fn.name) && fn.length === 0
const jobs = Object.fromEntries([tiles, props, props2, decor].flatMap((m) => Object.entries(m).filter(isJob)))
for (const [name, fn] of Object.entries(jobs)) if (!only.length || only.includes(name)) fn()
