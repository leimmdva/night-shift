// Minimal PNG encoder (node built-ins only) and a few RGBA helpers shared by the office build.
import { deflateSync } from 'node:zlib'

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const out = Buffer.alloc(12 + data.length)
  out.writeUInt32BE(data.length, 0)
  out.write(type, 4, 'ascii')
  data.copy(out, 8)
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length)
  return out
}
export function encodePng(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h)
  for (let y = 0; y < h; y++) Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1)
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ])
}

// An RGBA image: { w, h, d: Uint8Array }
export const makeImage = (w, h, fill = [0, 0, 0, 0]) => {
  const d = new Uint8Array(w * h * 4)
  if (fill[3] || fill[0] || fill[1] || fill[2]) for (let i = 0; i < w * h; i++) d.set(fill, i * 4)
  return { w, h, d }
}
// Alpha-blend src over dst at (ox, oy). Flat alpha, integer maths, no resampling.
export function blend(dst, src, ox, oy) {
  for (let y = 0; y < src.h; y++) {
    const dy = oy + y
    if (dy < 0 || dy >= dst.h) continue
    for (let x = 0; x < src.w; x++) {
      const dx = ox + x
      if (dx < 0 || dx >= dst.w) continue
      const si = (y * src.w + x) * 4, di = (dy * dst.w + dx) * 4
      const a = src.d[si + 3]
      if (a === 0) continue
      if (a === 255) { dst.d[di] = src.d[si]; dst.d[di + 1] = src.d[si + 1]; dst.d[di + 2] = src.d[si + 2]; dst.d[di + 3] = 255; continue }
      const ia = 255 - a
      dst.d[di] = Math.round((src.d[si] * a + dst.d[di] * ia) / 255)
      dst.d[di + 1] = Math.round((src.d[si + 1] * a + dst.d[di + 1] * ia) / 255)
      dst.d[di + 2] = Math.round((src.d[si + 2] * a + dst.d[di + 2] * ia) / 255)
      dst.d[di + 3] = 255
    }
  }
}
export function scale(img, k) {
  const out = makeImage(img.w * k, img.h * k)
  for (let y = 0; y < out.h; y++) for (let x = 0; x < out.w; x++) {
    const si = (Math.floor(y / k) * img.w + Math.floor(x / k)) * 4
    out.d.set(img.d.subarray(si, si + 4), (y * out.w + x) * 4)
  }
  return out
}
