// Loads the office sprite sources (scripts/sprites/src/office/*.txt) and the monster sources used for scale.
// Source format: '#' comment lines (one may be '# meta feet=N ax=N'), '@ <char> #RRGGBB[AA]' legend lines,
// a '---' line, then one character per pixel ('.' is transparent).
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { makeImage } from './png.mjs'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const OFFICE_SRC = join(ROOT, 'scripts/sprites/src/office')
export const MONSTER_SRC = join(ROOT, 'scripts/sprites/src')
export const MAX_COLOURS = 79

export function parseSprite(file, name) {
  const lines = readFileSync(file, 'utf8').split('\n')
  const legend = new Map()
  const meta = {}
  let i = 0
  for (; i < lines.length && lines[i] !== '---'; i++) {
    const m = /^@ (\S) #([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/.exec(lines[i])
    if (m) legend.set(m[1], [0, 2, 4].map((o) => parseInt(m[2].slice(o, o + 2), 16)).concat(m[3] ? parseInt(m[3], 16) : 255))
    const mm = /^# meta (.*)$/.exec(lines[i])
    if (mm) for (const kv of mm[1].split(' ')) { const [k, v] = kv.split('='); meta[k] = Number(v) }
  }
  if (i === lines.length) throw new Error(`${name}: missing '---' separator`)
  if (legend.size > MAX_COLOURS) throw new Error(`${name}: ${legend.size} colours (max ${MAX_COLOURS})`)
  const rows = lines.slice(i + 1).filter((l) => l.length > 0)
  const w = rows[0].length
  const img = makeImage(w, rows.length)
  rows.forEach((row, y) => {
    if (row.length !== w) throw new Error(`${name}: row ${y} has width ${row.length}, expected ${w}`)
    for (let x = 0; x < w; x++) {
      const ch = row[x]
      if (ch === '.') continue
      const c = legend.get(ch)
      if (!c) throw new Error(`${name}: row ${y} col ${x}: '${ch}' not in legend`)
      img.d.set(c, (y * w + x) * 4)
    }
  })
  return { name, w, h: rows.length, d: img.d, feet: meta.feet ?? rows.length, ax: meta.ax ?? 0 }
}

export function loadOffice() {
  const out = {}
  for (const f of readdirSync(OFFICE_SRC).filter((n) => n.endsWith('.txt')).sort()) {
    const name = f.slice(0, -4)
    out[name] = parseSprite(join(OFFICE_SRC, f), name)
  }
  return out
}
export const loadMonster = (name) => parseSprite(join(MONSTER_SRC, `${name}.txt`), name)
