// The dog mark as Dogeash's icons and share image, drawn from the same paths as the app's logo
// (app/utils/dogMarkPaths.mjs). Writes into public/: favicon.svg, favicon.ico, apple-touch-icon.png,
// icon-192.png, icon-512.png, icon-maskable-512.png and og-image.png. Run with `npm run render:icons`
// after changing the mark. The share image uses Arial Black and Arial from macOS for its text.
import { existsSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import { dogMarkNose, dogMarkStrokes } from '../app/utils/dogMarkPaths.mjs'

const root = resolve(import.meta.dirname, '..')
const out = name => join(root, 'public', name)

// Brand colours (app/assets/css/tokens.css): night canvas, chalk ink, marigold
const NIGHT = '#141414'
const CHALK = '#f5f5f3'
const MARIGOLD = '#ffc21a'

// The mark on a square: `pad` is the share of the side left around the mark, `radius` the corner rounding
// (0 for full bleed: iOS and maskable icons are cut to shape by the device), `weight` the stroke on the 64 grid
function iconSvg({ size, pad, radius, weight }) {
  const inner = size * (1 - pad * 2)
  const scale = inner / 64
  const offset = size * pad
  const strokes = dogMarkStrokes.map(d => `<path d="${d}"/>`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * radius}" fill="${NIGHT}"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">
    <g fill="none" stroke="${CHALK}" stroke-width="${weight}" stroke-linecap="round" stroke-linejoin="round">${strokes}</g>
    <path d="${dogMarkNose}" fill="${MARIGOLD}" stroke="${MARIGOLD}" stroke-width="1.2" stroke-linejoin="round"/>
  </g>
</svg>`
}

const png = (svg, width) => new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng()

// A .ico holding PNG images (every current browser reads PNGs inside .ico)
function ico(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  const dir = Buffer.alloc(16 * images.length)
  let offset = 6 + dir.length
  images.forEach(({ size, data }, i) => {
    const e = i * 16
    dir.writeUInt8(size >= 256 ? 0 : size, e)
    dir.writeUInt8(size >= 256 ? 0 : size, e + 1)
    dir.writeUInt8(0, e + 2)
    dir.writeUInt8(0, e + 3)
    dir.writeUInt16LE(1, e + 4)
    dir.writeUInt16LE(32, e + 6)
    dir.writeUInt32LE(data.length, e + 8)
    dir.writeUInt32LE(offset, e + 12)
    offset += data.length
  })
  return Buffer.concat([header, dir, ...images.map(i => i.data)])
}

// Favicon: a rounded tile, heavier strokes so the face still reads at 16 pixels
const favicon = iconSvg({ size: 64, pad: 0.1, radius: 0.22, weight: 3.6 })
writeFileSync(out('favicon.svg'), favicon)
writeFileSync(out('favicon.ico'), ico([16, 32, 48].map(size => ({
  size,
  data: png(iconSvg({ size: 64, pad: size === 16 ? 0.04 : 0.08, radius: 0.22, weight: size === 16 ? 4.6 : 3.8 }), size),
}))))

// Home-screen icons
writeFileSync(out('apple-touch-icon.png'), png(iconSvg({ size: 180, pad: 0.16, radius: 0, weight: 2.3 }), 180))
writeFileSync(out('icon-192.png'), png(iconSvg({ size: 192, pad: 0.14, radius: 0.22, weight: 2.3 }), 192))
writeFileSync(out('icon-512.png'), png(iconSvg({ size: 512, pad: 0.14, radius: 0.22, weight: 1.8 }), 512))
// Maskable: full bleed, the mark inside the central safe circle (80% of the side)
writeFileSync(out('icon-maskable-512.png'), png(iconSvg({ size: 512, pad: 0.24, radius: 0, weight: 1.9 }), 512))

// Share image (Open Graph, 1200 x 630): the mark, the wordmark and the promise, on night
const fonts = ['/System/Library/Fonts/Supplemental/Arial Black.ttf', '/System/Library/Fonts/Supplemental/Arial.ttf'].filter(existsSync)
const strokes = dogMarkStrokes.map(d => `<path d="${d}"/>`).join('')
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${NIGHT}"/>
  <g transform="translate(96 150) scale(5)">
    <g fill="none" stroke="${CHALK}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${strokes}</g>
    <path d="${dogMarkNose}" fill="${MARIGOLD}" stroke="${MARIGOLD}" stroke-width="1.2" stroke-linejoin="round"/>
  </g>
  <text x="470" y="318" font-family="Arial Black" font-size="104" letter-spacing="-4" fill="${CHALK}">dogeash</text>
  <rect x="934" y="286" width="28" height="28" rx="6" fill="${MARIGOLD}"/>
  <text x="474" y="390" font-family="Arial" font-size="34" fill="#a9a9a6">Trained guard dogs from kennels</text>
  <text x="474" y="436" font-family="Arial" font-size="34" fill="#a9a9a6">we inspect in person.</text>
  <g fill="${MARIGOLD}">${Array.from({ length: 31 }, (_, i) => `<path d="M${i * 40 - 20} 630 l20 -24 h20 l-20 24 z"/>`).join('')}</g>
</svg>`
writeFileSync(out('og-image.png'), new Resvg(og, { font: { fontFiles: fonts, loadSystemFonts: false, defaultFontFamily: 'Arial' } }).render().asPng())

console.log('Wrote public/favicon.svg, favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png, icon-maskable-512.png, og-image.png')
