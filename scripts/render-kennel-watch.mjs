// Renders the kennel watch for the sign-in and sign-up pages: a K9 stands guard beside its kennel,
// scanning the compound. A bush by the gate rustles, the dog braces and barks twice, a bird flies off,
// and the dog settles back to its watch with a wag. Output: looping GIFs + still PNGs.
// Usage: npm run render:kennel             -> writes app/assets/patrol/kennel-watch-{day,night}.{gif,png}
//        node scripts/render-kennel-watch.mjs <outDir> --sheet [--t=0,3.3] [--day|--night]   (check frames)
// Fonts: uses macOS Arial Black for the lettering.
import fs from 'node:fs'
import path from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import gifenc from 'gifenc'
import { T, mix, n, lerp, clamp, smooth01, easeOut, seg, TAU, blob, STAND, BRACE, blendLegs, dog, resetClips } from './k9-art.mjs'

const { GIFEncoder, quantize, applyPalette } = gifenc

// ---------- scene constants ----------
const W = 400, H = 300
const GROUND = 236
const WALL_TOP = 146
const FPS = +(process.env.FPS ?? 15)
const COLORS = +(process.env.COLORS ?? 64)
const LOOP = 7.2 // seconds; everything that moves repeats a whole number of times per loop
const OUT_W = 600
const SC = 1.4
const DOG_X = 212
const BUSH_X = 334
const KENNEL_X = 74

const PALETTES = {
  day: {
    sky: T.marigold, sun: T.surface, sunRing: T.marigoldSoft,
    farHouse: T.night, farRoof: T.ink, farWindow: T.marigold, tree: T.ink, farEdge: T.ink,
    wall: T.ashSoft, wallLine: T.ash, wallCap: T.night, pillar: T.ash, wire: T.night,
    ground: T.canvas, groundEdge: T.night, hazA: T.marigold, hazB: T.night,
    out: T.ink, shadow: T.night, shadowOp: 0.16, sign: T.night, signText: T.marigold,
    kennel: T.surface, kennelLine: T.ash, roof: T.night, door: T.ink, plate: T.marigold,
    bush: T.night, bushHi: mix(T.night, T.marigold, 0.25), gate: T.night, bird: T.night, beam: null, night: false,
  },
  night: {
    sky: T.dCanvas, sun: T.marigold, sunRing: mix(T.dCanvas, T.marigold, 0.18),
    farHouse: T.dAshSoft, farRoof: T.dAsh, farWindow: T.marigold, tree: T.dSunk, farEdge: T.dAsh,
    wall: T.dAshSoft, wallLine: T.dAsh, wallCap: T.dAsh, pillar: T.dAsh, wire: T.dLine,
    ground: T.dSurface, groundEdge: T.dAsh, hazA: T.marigold, hazB: T.ink,
    out: T.ink, shadow: '#000000', shadowOp: 0.35, sign: T.marigold, signText: T.ink,
    kennel: T.dAsh, kennelLine: T.dAshSoft, roof: T.marigold, door: T.ink, plate: T.marigold,
    bush: T.dSunk, bushHi: T.dAsh, gate: T.dLine, bird: T.dLine, beam: T.marigold, night: true,
  },
}
let PAL = PALETTES.day

const wave = (t, cycles, phase = 0) => Math.sin(TAU * (t * cycles / LOOP + phase))
const STARS = Array.from({ length: 30 }, (_, i) => [((i * 89) % 400) + ((i * 11) % 9), 10 + ((i * 47) % 96), (i % 3) * 0.35 + 0.6, (i * 0.37) % 1])

// ---------- timeline ----------
const tRustle = 2.6, tAlert = 2.8, tBark1 = 3.25, tBark2 = 3.7, tBird = 4.05, tRelax = 4.5, tCalm = 5.6

function dogPose(t) {
  // 0 at rest, 1 fully on alert
  const on = smooth01(seg(t, tAlert, tAlert + 0.3)) * (1 - smooth01(seg(t, tRelax, tRelax + 0.9)))
  const scan = 5 * wave(t, 2) - 2 // slow look around, slightly up
  const bark = Math.max(
    Math.sin(Math.PI * clamp((t - tBark1) / 0.28)),
    Math.sin(Math.PI * clamp((t - tBark2) / 0.28)),
  )
  const wag = seg(t, tRelax + 0.3, tCalm) > 0 && t < tCalm + 0.4
    ? Math.sin(TAU * (t - tRelax) * 3.2) * (1 - seg(t, tCalm - 0.3, tCalm + 0.4))
    : 0
  const breathe = 0.7 * (1 + wave(t, 5)) / 2
  return {
    legs: { ...blendLegs(STAND, BRACE, 0.35 * on), lift: breathe * (1 - on) },
    headRot: lerp(scan, 9, on) - 4 * bark,
    jaw: 16 * bark,
    tongue: bark > 0.3 ? 1 : undefined,
    earBack: lerp(2 + 2 * Math.max(0, wave(t, 3, 0.2)), -2, on),
    tail: lerp(36 + 4 * wave(t, 2, 0.3), 14, on) + 16 * wag,
    tailWave: on * 2,
  }
}

// ---------- scenery ----------
function sky(t) {
  const P = PAL
  let s = `<rect width="${W}" height="${H}" fill="${P.sky}"/>`
  if (P.night) {
    s += STARS.map(([x, y, r, ph]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${T.dLine}" opacity="${n(0.55 + 0.45 * wave(t, 3, ph))}"/>`).join('')
    s += `<circle cx="318" cy="44" r="18" fill="${P.sun}"/><circle cx="326" cy="38" r="16" fill="${P.sky}"/>`
  }
  else {
    s += `<circle cx="318" cy="48" r="${n(31 + 1.5 * wave(t, 2))}" fill="${P.sunRing}"/><circle cx="318" cy="48" r="20" fill="${P.sun}"/>`
  }
  // far houses and trees beyond the wall
  for (const x of [-10, 250]) {
    s += `<path d="M${x - 48} ${WALL_TOP + 2} V${WALL_TOP - 34} H${x + 48} V${WALL_TOP + 2} Z" fill="${P.farHouse}" stroke="${P.farEdge}" stroke-width="2"/>`
    s += `<path d="M${x - 58} ${WALL_TOP - 32} L${x - 26} ${WALL_TOP - 60} H${x + 26} L${x + 58} ${WALL_TOP - 32} Z" fill="${P.farRoof}" stroke="${P.farEdge}" stroke-width="2" stroke-linejoin="round"/>`
    for (const wx of [-32, -8, 16]) s += `<rect x="${x + wx}" y="${WALL_TOP - 25}" width="16" height="14" rx="2" fill="${P.farWindow}"/>`
  }
  for (const x of [120, 384]) {
    s += `<path d="M${x} ${WALL_TOP} V${WALL_TOP - 28}" stroke="${P.farEdge}" stroke-width="5"/>`
    s += `<path d="${blob([[x - 28, WALL_TOP - 28], [x - 22, WALL_TOP - 54], [x - 3, WALL_TOP - 70], [x + 18, WALL_TOP - 62], [x + 28, WALL_TOP - 38], [x + 11, WALL_TOP - 22], [x - 13, WALL_TOP - 20]])}" fill="${P.tree}" stroke="${P.farEdge}" stroke-width="2"/>`
  }
  return s
}

function wall() {
  const P = PAL
  let s = `<rect x="0" y="${WALL_TOP}" width="${W}" height="${GROUND - WALL_TOP}" fill="${P.wall}"/>`
  const bh = 14
  for (let r = 0; r * bh < GROUND - WALL_TOP - 8; r++) {
    const y = WALL_TOP + 8 + r * bh
    s += `<path d="M0 ${y} H${W}" stroke="${P.wallLine}" stroke-width="1.5"/>`
    for (let x = r % 2 ? 18 : 0; x < W; x += 36) s += `<path d="M${x} ${y} v${bh}" stroke="${P.wallLine}" stroke-width="1.5"/>`
  }
  for (const X of [140, 262]) {
    s += `<rect x="${X - 9}" y="${WALL_TOP - 4}" width="18" height="${GROUND - WALL_TOP + 4}" fill="${P.pillar}"/>`
    s += `<rect x="${X - 12}" y="${WALL_TOP - 10}" width="24" height="8" rx="2" fill="${P.wallCap}"/>`
  }
  s += `<rect x="0" y="${WALL_TOP}" width="${W}" height="7" fill="${P.wallCap}"/>`
  let wire = ''
  for (let x = 0; x < W; x += 16) wire += `M${x + 7} ${WALL_TOP - 7}m-7 0a7 5 0 1 0 14 0a7 5 0 1 0 -14 0`
  s += `<path d="${wire}" fill="none" stroke="${P.wire}" stroke-width="1.2"/><path d="M0 ${WALL_TOP - 7} H${W}" stroke="${P.wire}" stroke-width="1"/>`
  // gate on the right: vertical bars
  s += `<rect x="360" y="${WALL_TOP - 18}" width="40" height="${GROUND - WALL_TOP + 18}" fill="${P.sky}"/>`
  for (let x = 362; x < W; x += 8) s += `<rect x="${x}" y="${WALL_TOP - 16}" width="3.5" height="${GROUND - WALL_TOP + 16}" rx="1.5" fill="${P.gate}"/>`
  s += `<rect x="358" y="${WALL_TOP - 4}" width="44" height="5" fill="${P.gate}"/><rect x="358" y="${GROUND - 34}" width="44" height="5" fill="${P.gate}"/>`
  // sign
  s += `<rect x="286" y="${WALL_TOP + 16}" width="52" height="24" rx="3" fill="${P.sign}" stroke="${P.out}" stroke-width="1.5"/>`
  s += `<text x="312" y="${WALL_TOP + 26}" font-family="Arial Black" font-size="6.5" text-anchor="middle" fill="${P.signText}">BEWARE</text>`
  s += `<text x="312" y="${WALL_TOP + 35}" font-family="Arial Black" font-size="6.5" text-anchor="middle" fill="${P.signText}">OF DOG</text>`
  // security lamp on the left pillar
  s += `<path d="M140 ${WALL_TOP - 10} v-8 h10" stroke="${P.out}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
  s += `<path d="M148 ${WALL_TOP - 23} h12 l3 7 h-18 Z" fill="${P.night ? T.marigold : P.wallCap}" stroke="${P.out}" stroke-width="1.6" stroke-linejoin="round"/>`
  return s
}

// The lamp's beam sweeps the yard at night
function beam(t) {
  if (!PAL.beam) return ''
  const ang = 22 * wave(t, 2, 0.1)
  return `<g transform="rotate(${n(ang)} 154 ${WALL_TOP - 15})" opacity="0.2"><path d="M146 ${WALL_TOP - 15} L118 ${GROUND + 10} L224 ${GROUND + 10} L162 ${WALL_TOP - 15} Z" fill="${PAL.beam}"/></g>`
}

function kennel() {
  const P = PAL, x = KENNEL_X, w = 92, h = 58, top = GROUND - h
  let s = `<ellipse cx="${x}" cy="${GROUND + 2}" rx="58" ry="6" fill="${P.shadow}" opacity="${P.shadowOp}"/>`
  s += `<rect x="${x - w / 2}" y="${top}" width="${w}" height="${h}" fill="${P.kennel}" stroke="${P.out}" stroke-width="2.5" stroke-linejoin="round"/>`
  for (let y = top + 11; y < GROUND - 4; y += 11) s += `<path d="M${x - w / 2 + 2} ${y} H${x + w / 2 - 2}" stroke="${P.kennelLine}" stroke-width="1.5"/>`
  s += `<path d="M${x - w / 2 - 10} ${top + 3} L${x} ${top - 34} L${x + w / 2 + 10} ${top + 3} Z" fill="${P.roof}" stroke="${P.out}" stroke-width="2.5" stroke-linejoin="round"/>`
  s += `<path d="M${x - w / 2 - 10} ${top + 3} L${x + w / 2 + 10} ${top + 3}" stroke="${P.out}" stroke-width="2.5"/>`
  // arched door
  s += `<path d="M${x - 17} ${GROUND - 1} V${top + 26} a17 17 0 0 1 34 0 V${GROUND - 1} Z" fill="${P.door}" stroke="${P.out}" stroke-width="2.5"/>`
  // name plate
  s += `<rect x="${x - 15}" y="${top - 14}" width="30" height="12" rx="2" fill="${P.plate}" stroke="${P.out}" stroke-width="1.5"/>`
  s += `<text x="${x}" y="${top - 5}" font-family="Arial Black" font-size="8" text-anchor="middle" fill="${T.ink}">K9</text>`
  // hazard stripe along the base
  let haz = ''
  for (let i = 0; i < 11; i++) haz += `M${x - w / 2 + i * 9} ${GROUND - 1}l5 -6h4l-5 6Z`
  s += `<path d="M${x - w / 2} ${GROUND - 7} h${w} v6 h${-w} Z" fill="${T.marigold}"/><path d="${haz}" fill="${T.ink}"/>`
  // water bowl
  s += `<path d="M${x + 58} ${GROUND - 1} l3 -8 h20 l3 8 Z" fill="${T.ash}" stroke="${P.out}" stroke-width="2" stroke-linejoin="round"/>`
  s += `<path d="M${x + 62} ${GROUND - 9} h18" stroke="${T.verified}" stroke-width="2" stroke-linecap="round"/>`
  return s
}

function bush(t) {
  const P = PAL
  const shake = t > tRustle && t < tBird + 0.2 ? Math.sin(t * 60) * 3 * (1 - seg(t, tBird - 0.1, tBird + 0.2)) : 0
  const pts = [[-34, 0], [-36, -18], [-24, -34], [-6, -40], [12, -38], [28, -28], [36, -12], [32, 0]]
  const leaves = pts.map(([x, y], i) => [BUSH_X + x + (y < -10 ? shake * (i % 2 ? 1 : -0.6) : 0), GROUND + y])
  let s = `<path d="${blob(leaves)}" fill="${P.bush}" stroke="${P.out}" stroke-width="2.5" stroke-linejoin="round"/>`
  s += `<path d="${blob([[-14, -24], [-6, -32], [6, -30], [10, -20], [0, -16], [-10, -16]].map(([x, y]) => [BUSH_X + x + shake * 0.7, GROUND + y]))}" fill="${P.bushHi}"/>`
  return s
}

function bird(t) {
  if (t < tBird || t > tBird + 1.4) return ''
  const k = seg(t, tBird, tBird + 1.4)
  const x = BUSH_X + 8 + 70 * k, y = GROUND - 40 - 120 * easeOut(k)
  const flap = Math.sin(t * 40) * 7
  return `<g transform="translate(${n(x)} ${n(y)})" opacity="${n(1 - seg(k, 0.75, 1))}">
    <path d="M-9 ${n(-flap)} Q-4 -2 0 0 Q4 -2 9 ${n(-flap)}" fill="none" stroke="${PAL.night ? T.marigold : T.ink}" stroke-width="2.4" stroke-linecap="round"/>
  </g>`
}

function ground() {
  const P = PAL
  let s = `<rect x="0" y="${GROUND - 2}" width="${W}" height="${H - GROUND + 2}" fill="${P.ground}"/>`
  s += `<path d="M0 ${GROUND - 1} H${W}" stroke="${P.groundEdge}" stroke-width="2.5"/>`
  let dash = ''
  for (let x = 4; x < W; x += 14) dash += `M${x} ${GROUND + 15}h6`
  s += `<path d="${dash}" stroke="${P.night ? T.marigold : T.night}" stroke-width="2.5" stroke-linecap="round"/>`
  const top = GROUND + 32, per = 28
  s += `<rect x="0" y="${top}" width="${W}" height="${H - top}" fill="${P.hazB}"/>`
  let haz = ''
  for (let x = -per; x < W + per * 2; x += per) haz += `M${x} ${H}L${x + 14} ${H}L${x + 14 + (H - top)} ${top}L${x + (H - top)} ${top}Z`
  s += `<path d="${haz}" fill="${P.hazA}"/><path d="M0 ${top} H${W}" stroke="${P.out}" stroke-width="2.5"/>`
  return s
}

// "!" over the dog's head and two WOOFs from its mouth
function alertMark(x, y, t) {
  const k = seg(t, tRustle + 0.1, tRelax)
  if (k <= 0 || k >= 1) return ''
  const s = k < 0.12 ? easeOut(k / 0.12) * 1.2 : 1.2 - 0.2 * seg(k, 0.12, 0.25)
  return `<g transform="translate(${n(x)} ${n(y)}) scale(${n(s)})" opacity="${n(1 - seg(k, 0.85, 1))}">
    <path d="M-3.6 -19 L3.6 -19 L1.9 -4 L-1.9 -4 Z" fill="${T.marigold}" stroke="${T.ink}" stroke-width="1.6" stroke-linejoin="round"/>
    <circle cx="0" cy="1.6" r="2.7" fill="${T.marigold}" stroke="${T.ink}" stroke-width="1.6"/>
  </g>`
}
function woof(x, y, t, t0, dy) {
  const k = seg(t, t0, t0 + 0.55)
  if (k <= 0 || k >= 1) return ''
  const s = 0.6 + 0.6 * easeOut(clamp(k * 3))
  return `<g transform="translate(${n(x + 16 * k)} ${n(y + dy - 10 * k)}) rotate(-8) scale(${n(s)})" opacity="${n(1 - seg(k, 0.6, 1))}">
    <text x="0" y="0" font-family="Arial Black" font-size="15" text-anchor="middle" fill="${T.marigold}" stroke="${T.ink}" stroke-width="3.2" paint-order="stroke" stroke-linejoin="round">WOOF!</text>
  </g>`
}

// ---------- frame ----------
function frame(t) {
  resetClips()
  t = ((t % LOOP) + LOOP) % LOOP
  const d = dog(dogPose(t))
  const at = ([x, y]) => [DOG_X + x * SC, GROUND + y * SC]
  const head = at(d.head), mouth = at(d.mouth)
  // back to front: sky, wall, the lamp's beam, ground, kennel and bush, the dog, then effects
  const s = sky(t) + wall() + beam(t) + ground() + kennel() + bush(t)
    + `<ellipse cx="${DOG_X + 6}" cy="${GROUND + 2}" rx="44" ry="5.5" fill="${PAL.shadow}" opacity="${PAL.shadowOp}"/>`
    + `<g transform="translate(${DOG_X} ${GROUND}) scale(${SC})">${d.svg}</g>`
    + alertMark(head[0] + 6, head[1] - 24, t)
    + woof(mouth[0] + 22, mouth[1], t, tBark1, -18) + woof(mouth[0] + 26, mouth[1], t, tBark2, -40)
    + bird(t)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${s}</svg>`
}

// ---------- render ----------
function rasterize(svg, width = OUT_W) {
  return new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: { fontFiles: ['/System/Library/Fonts/Supplemental/Arial Black.ttf'], loadSystemFonts: false, defaultFontFamily: 'Arial Black' },
  }).render()
}

const outDir = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'app/assets/patrol'
fs.mkdirSync(outDir, { recursive: true })
const only = process.argv.includes('--day') ? ['day'] : process.argv.includes('--night') ? ['night'] : ['day', 'night']

if (process.argv.includes('--sheet')) {
  const list = (process.argv.find(a => a.startsWith('--t=')) ?? '--t=0,1.5,2.9,3.3,3.75,4.4,5.0,6.5').slice(4).split(',').map(Number)
  for (const v of only) {
    PAL = PALETTES[v]
    for (const tt of list) fs.writeFileSync(path.join(outDir, `kennel-${v}-${tt.toFixed(2)}.png`), rasterize(frame(tt)).asPng())
  }
}
else {
  const total = Math.round(LOOP * FPS)
  for (const v of only) {
    PAL = PALETTES[v]
    const frames = []
    for (let i = 0; i < total; i++) {
      const img = rasterize(frame(i / FPS))
      frames.push({ data: new Uint8Array(img.pixels), w: img.width, h: img.height })
    }
    const sample = frames.filter((_, i) => i % 9 === 0)
    const all = new Uint8Array(sample.reduce((a, f) => a + f.data.length, 0))
    let o = 0
    for (const f of sample) { all.set(f.data, o); o += f.data.length }
    // last palette slot means "unchanged since the previous frame"
    const palette = quantize(all, COLORS - 1)
    const TI = palette.length
    palette.push([255, 0, 255])
    const gif = GIFEncoder()
    let prev = null
    frames.forEach((f, i) => {
      const idx = applyPalette(f.data, palette.slice(0, TI))
      const out = idx.slice()
      if (prev) for (let j = 0; j < idx.length; j++) if (idx[j] === prev[j]) out[j] = TI
      prev = idx
      gif.writeFrame(out, f.w, f.h, {
        ...(i === 0 ? { palette, repeat: 0 } : {}),
        delay: 1000 / FPS, transparent: i > 0, transparentIndex: TI, dispose: 1,
      })
    })
    gif.finish()
    fs.writeFileSync(path.join(outDir, `kennel-watch-${v}.gif`), gif.bytes())
    // still for reduced motion: the dog on watch beside its kennel
    fs.writeFileSync(path.join(outDir, `kennel-watch-${v}.png`), rasterize(frame(1.2)).asPng())
    console.log(v, frames.length, 'frames', (gif.bytes().length / 1024).toFixed(0) + ' KB')
  }
}
