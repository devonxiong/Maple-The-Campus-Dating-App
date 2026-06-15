// Regenerate favicons from public/maple-logo.svg (the brand logo)
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const svg = fs.readFileSync(path.join(ROOT, 'public/maple-logo.svg'))

function png(size, bg) {
  return sharp(svg, { density: 512 })
    .resize(size, size, { fit: 'contain', background: bg || { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
}

// Minimal ICO container embedding PNG images
function buildIco(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  const entries = Buffer.alloc(16 * images.length)
  let offset = 6 + 16 * images.length
  const datas = []
  images.forEach((img, i) => {
    const e = entries.subarray(i * 16, i * 16 + 16)
    e.writeUInt8(img.size >= 256 ? 0 : img.size, 0)
    e.writeUInt8(img.size >= 256 ? 0 : img.size, 1)
    e.writeUInt8(0, 2)
    e.writeUInt8(0, 3)
    e.writeUInt16LE(1, 4)
    e.writeUInt16LE(32, 6)
    e.writeUInt32LE(img.buf.length, 8)
    e.writeUInt32LE(offset, 12)
    offset += img.buf.length
    datas.push(img.buf)
  })
  return Buffer.concat([header, entries, ...datas])
}

;(async () => {
  const cream = { r: 248, g: 247, b: 244, alpha: 1 } // #f8f7f4

  // PNG favicons (transparent)
  fs.writeFileSync(path.join(ROOT, 'public/favicon-16x16.png'), await png(16))
  fs.writeFileSync(path.join(ROOT, 'public/favicon-32x32.png'), await png(32))
  // Apple touch icon on brand background (iOS doesn't like transparency)
  fs.writeFileSync(path.join(ROOT, 'public/apple-touch-icon.png'), await png(180, cream))

  // favicon.ico (16/32/48, transparent) → app/favicon.ico is what Next serves at /favicon.ico
  const ico = buildIco([
    { size: 16, buf: await png(16) },
    { size: 32, buf: await png(32) },
    { size: 48, buf: await png(48) },
  ])
  fs.writeFileSync(path.join(ROOT, 'app/favicon.ico'), ico)
  fs.writeFileSync(path.join(ROOT, 'public/favicon.ico'), ico)

  console.log('favicons regenerated from maple-logo.svg ✓')
})().catch(e => { console.error(e); process.exit(1) })
