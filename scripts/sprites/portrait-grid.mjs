// Parser for the portrait text grids: '@ <char> #RRGGBB' legend lines, a '---' line, then one character per pixel ('.' is transparent).
export function parseGrid(text, name = 'grid') {
  const lines = text.split('\n')
  const legend = new Map()
  let i = 0
  for (; lines[i] !== '---'; i++) {
    const m = /^@ (\S) #([0-9a-fA-F]{6})$/.exec(lines[i])
    if (m) legend.set(m[1], [0, 2, 4].map((o) => parseInt(m[2].slice(o, o + 2), 16)))
  }
  const rows = lines.slice(i + 1).filter((l) => l.length > 0)
  const w = rows[0].length
  const px = new Uint8Array(w * rows.length * 4)
  rows.forEach((row, y) => {
    if (row.length !== w) throw new Error(`${name}: row ${y} has ${row.length} cells, expected ${w}`)
    for (let x = 0; x < w; x++) {
      if (row[x] === '.') continue
      const c = legend.get(row[x])
      if (!c) throw new Error(`${name}: '${row[x]}' not in legend`)
      px.set([...c, 255], (y * w + x) * 4)
    }
  })
  return { w, h: rows.length, px }
}
