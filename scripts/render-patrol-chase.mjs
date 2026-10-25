// Renders the patrol chase: a K9 chases a burglar along the compound wall, catches him,
// then turns and chases the next one the other way. Output: animated GIFs + still PNGs.
// Usage: npm run render:patrol            -> writes app/assets/patrol/patrol-chase-{day,night}.{gif,png}
//        node scripts/render-patrol-chase.mjs <outDir> --sheet [--t=0,1.5] [--day|--night] [--poses]   (check frames)
// Fonts: uses macOS Arial Black for the lettering.
import fs from 'node:fs'
import path from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import gifenc from 'gifenc'

const { GIFEncoder, quantize, applyPalette } = gifenc

// ---------- scene constants ----------
const W = 400, H = 300
const GROUND = 238 // screen y of the walkway the characters stand on
const WALL_TOP = 148
const FPS = +(process.env.FPS ?? 15)
const COLORS = +(process.env.COLORS ?? 64)
const PHASE = 5.4 // seconds per chase; two chases (right, then left) make one loop
const OUT_W = 600
const SC = 1.3 // character scale: local units -> screen px

// Dogeash tokens (app/assets/css/tokens.css)
const T = {
  marigold: '#ffc21a', marigoldInk: '#8a6000', marigoldSoft: '#f8edcc',
  night: '#1c1c1e', ink: '#141414', ash: '#d3d3cf', ashSoft: '#e4e3de',
  canvas: '#f2f1ed', surface: '#f9f8f5', danger: '#b0302a', verified: '#1f56d6',
  dCanvas: '#0f0f10', dSurface: '#1a1a1c', dSunk: '#232326', dNight: '#26262a',
  dAshSoft: '#2a2a2d', dAsh: '#3b3b40', dLine: '#6c6c72',
}
const mix = (a, b, t) => {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
  const [x, y] = [p(a), p(b)]
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')
}

const PALETTES = {
  day: {
    sky: T.marigold, sun: T.surface, sunRing: T.marigoldSoft,
    farHouse: T.night, farRoof: T.ink, farWindow: T.marigold, tank: T.ash, tree: T.ink, farEdge: T.ink,
    wall: T.ashSoft, wallLine: T.ash, wallCap: T.night, pillar: T.ash, wire: T.night,
    ground: T.canvas, groundEdge: T.night, route: T.night, hazA: T.marigold, hazB: T.night,
    out: T.ink, shadow: T.night, shadowOp: 0.16, sign: T.night, signText: T.marigold,
    speed: T.night, dust: T.ash, night: false,
  },
  night: {
    sky: T.dCanvas, sun: T.marigold, sunRing: mix(T.dCanvas, T.marigold, 0.18),
    farHouse: T.dAshSoft, farRoof: T.dAsh, farWindow: T.marigold, tank: T.dAsh, tree: T.dSunk, farEdge: T.dAsh,
    wall: T.dAshSoft, wallLine: T.dAsh, wallCap: T.dAsh, pillar: T.dAsh, wire: T.dLine,
    ground: T.dSurface, groundEdge: T.dAsh, route: T.marigold, hazA: T.marigold, hazB: T.ink,
    out: T.ink, shadow: '#000000', shadowOp: 0.35, sign: T.marigold, signText: T.ink,
    speed: T.marigold, dust: T.dLine, night: true,
  },
}

// Character colours, shared by both variants
const C = {
  tan: mix(T.marigold, T.marigoldInk, 0.42), tanFar: mix(T.marigold, T.marigoldInk, 0.75),
  saddle: T.night, mask: T.ink, vest: T.marigold, tongue: T.danger,
  stripeA: T.ashSoft, stripeB: T.night, pants: T.ink, pantsFar: '#2b2b2e', glove: T.night,
  hood: T.night, skin: T.marigoldSoft, shoe: T.ash, sole: T.ink, sack: T.ash, sackDark: mix(T.ash, T.ink, 0.25),
  coin: T.marigold, eye: T.surface, sweat: T.verified, star: T.marigold,
}

// ---------- math ----------
const rad = d => d * Math.PI / 180
const n = v => Math.round(v * 100) / 100
const lerp = (a, b, t) => a + (b - a) * t
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const smooth01 = t => t * t * (3 - 2 * t)
const easeOut = t => 1 - (1 - t) ** 3
const seg = (t, a, b) => clamp((t - a) / (b - a))
const TAU = Math.PI * 2
// Limb step: angle in degrees from straight down, positive = toward the facing direction (+x)
const step = (p, len, ang) => [p[0] + len * Math.sin(rad(ang)), p[1] + len * Math.cos(rad(ang))]
const rot = (p, c, deg) => {
  const a = rad(deg), s = Math.sin(a), co = Math.cos(a), x = p[0] - c[0], y = p[1] - c[1]
  return [c[0] + x * co - y * s, c[1] + x * s + y * co]
}
const add = (p, q) => [p[0] + q[0], p[1] + q[1]]

// ---------- path primitives ----------
function circle([x, y], r) {
  return `M${n(x - r)} ${n(y)}a${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0Z`
}
// Hull of two circles: the basic tapered limb segment
function capsule(a, r1, b, r2) {
  const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy)
  if (d <= Math.abs(r1 - r2) + 0.01) return r1 > r2 ? circle(a, r1) : circle(b, r2)
  const ang = Math.atan2(dy, dx), beta = Math.acos((r1 - r2) / d)
  const pt = (c, r, t) => [c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)]
  const p1 = pt(a, r1, ang + beta), p2 = pt(b, r2, ang + beta), q2 = pt(b, r2, ang - beta), q1 = pt(a, r1, ang - beta)
  const big2 = 2 * beta > Math.PI ? 1 : 0, big1 = 2 * beta < Math.PI ? 1 : 0
  return `M${n(p1[0])} ${n(p1[1])}L${n(p2[0])} ${n(p2[1])}A${n(r2)} ${n(r2)} 0 ${big2} 0 ${n(q2[0])} ${n(q2[1])}L${n(q1[0])} ${n(q1[1])}A${n(r1)} ${n(r1)} 0 ${big1} 0 ${n(p1[0])} ${n(p1[1])}Z`
}
// Closed Catmull-Rom spline through points
function blob(pts, k = 1 / 6) {
  const N = pts.length, P = i => pts[(i + N) % N]
  let d = `M${n(pts[0][0])} ${n(pts[0][1])}`
  for (let i = 0; i < N; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2)
    const c1 = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k]
    const c2 = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k]
    d += `C${n(c1[0])} ${n(c1[1])} ${n(c2[0])} ${n(c2[1])} ${n(p2[0])} ${n(p2[1])}`
  }
  return d + 'Z'
}
const poly = pts => 'M' + pts.map(p => `${n(p[0])} ${n(p[1])}`).join('L') + 'Z'

// A layer is drawn twice: a fat outline pass, then the fills, so overlapping parts read as one body
let clipSeq = 0
function layer(shapes, out, w = 1.7) {
  const solid = shapes.filter(s => !s.detail && !s.raw)
  const o = solid.map(s => `<path d="${s.d}"/>`).join('')
  const f = shapes.map(s => {
    if (s.raw) return s.raw
    const attrs = [`d="${s.d}"`, `fill="${s.fill}"`]
    if (s.clip) attrs.push(`clip-path="url(#${s.clip})"`)
    if (s.op != null) attrs.push(`opacity="${s.op}"`)
    if (s.stroke) attrs.push(`stroke="${s.stroke}" stroke-width="${s.sw ?? 1}" stroke-linecap="round" stroke-linejoin="round"`)
    return `<path ${attrs.join(' ')}/>`
  }).join('')
  return `<g fill="${out}" stroke="${out}" stroke-width="${w * 2}" stroke-linejoin="round">${o}</g>${f}`
}

// ---------- the dog (German Shepherd/Malinois build, faces +x, origin on the ground under the body) ----------
function gallop(p) {
  const front = q => {
    const s = Math.sin(TAU * q), f = Math.max(0, Math.cos(TAU * q)), a = 42 * s
    const up = a - 35 + 18 * f, fa = a + 8 + 22 * f, pa = fa + 12 - 125 * f
    return [up, fa, pa]
  }
  const hind = q => {
    const s = Math.sin(TAU * q), f = Math.max(0, Math.cos(TAU * q)), a = 36 * s + 4
    const e = Math.max(0, -s) * (1 - f)
    return [a + 30 - 22 * e + 18 * f, a - 45 + 28 * e - 22 * f, a + 5 - 6 * e + 34 * f]
  }
  return {
    fn: front(p), ff: front(p + 0.09), hn: hind(p + 0.5), hf: hind(p + 0.6),
    flex: Math.sin(TAU * p), pitch: -3.5 * Math.cos(TAU * p), lift: 2.5 * Math.max(0, Math.sin(TAU * p)),
  }
}
const STAND = { fn: [-32, 4, 12], ff: [-30, 6, 14], hn: [36, -42, 8], hf: [32, -40, 6], flex: 0, pitch: 0, lift: 0 }
// Braced tug: front legs planted forward, hindquarters dropped and pulling back
const BRACE = { fn: [-8, 26, 34], ff: [-12, 22, 30], hn: [62, -22, 30], hf: [58, -26, 26], flex: -0.6, pitch: 9, lift: 0 }
const LEAP = { fn: [38, 82, 90], ff: [32, 76, 84], hn: [-18, -70, -60], hf: [-24, -76, -66], flex: 1.2, pitch: -10, lift: 0 }
const blendLegs = (a, b, t) => {
  const o = {}
  for (const k of ['fn', 'ff', 'hn', 'hf']) o[k] = a[k].map((v, i) => lerp(v, b[k][i], t))
  for (const k of ['flex', 'pitch', 'lift']) o[k] = lerp(a[k], b[k], t)
  return o
}

function dog(pose) {
  const g = pose.legs
  const fl = g.flex
  const fx = ([x, y]) => {
    x += x > 0 ? 1.6 * fl : -1.6 * fl
    if (fl < 0 && y < -27) y += 2.4 * fl * (1 - Math.min(1, Math.abs(x + 3) / 26))
    return [x, y]
  }
  const S = fx([17, -25]), Hp = fx([-17, -25])
  const frontLeg = ([up, fa, pa]) => {
    const e = step(S, 11, up), w = step(e, 11, fa), pw = step(w, 5, pa), toe = step(pw, 3.6, pa + 82)
    return { e, w, pw, toe }
  }
  const hindLeg = ([th, ga, mt]) => {
    const st = step(Hp, 12.5, th), hk = step(st, 12.5, ga), hp = step(hk, 6.5, mt), toe = step(hp, 3.6, mt + 85)
    return { st, hk, hp, toe }
  }
  const FN = frontLeg(g.fn), FF = frontLeg(g.ff), HN = hindLeg(g.hn), HF = hindLeg(g.hf)

  // Body transform: pitch about the centre of mass, then drop until the lowest paw meets the ground
  const pivot = [0, -24]
  const pre = p => rot(p, pivot, g.pitch)
  const lowest = Math.max(...[FN.toe, FN.pw, FF.toe, FF.pw, HN.toe, HN.hp, HF.toe, HF.hp].map(p => pre(p)[1] + 2.4))
  const dy = -lowest - g.lift - (pose.y ?? 0)
  const X = p => { const q = pre(p); return [q[0], q[1] + dy] }
  const N = fx([19, -30])
  const HX = p => X(rot(add(p, [1, 3.5]), N, pose.headRot ?? 0))

  const torso = [[26, -24], [24, -31], [15, -36], [3, -35], [-10, -33.5], [-20, -32.5], [-26, -28], [-25, -21],
    [-17, -17.5], [-6, -18.5], [5, -15.5], [14, -13.5], [22, -17]].map(p => X(fx(p)))
  const torsoD = blob(torso)
  const clip = `c${clipSeq++}`
  const saddle = [[16, -38], [3, -37.5], [-10, -36], [-21, -35], [-28, -29], [-22, -24.5], [-12, -26.5], [0, -27.5], [11, -30.5], [18, -33]].map(p => X(fx(p)))
  const vest = [[21, -42], [5, -42], [3, -10], [19, -10]].map(p => X(fx(p)))
  const vestCenter = X(fx([11.5, -24.5]))

  // tail: dark, bushy, hangs low at rest and streams out when running
  const ta = pose.tail ?? 35
  let tp = X(fx([-24.5, -29])), tail = []
  const tr = [3.2, 4.3, 4.2, 3.1, 1.8], tl = [6.5, 7, 6.5, 5]
  let ang = ta
  for (let i = 0; i < 4; i++) {
    const dir = ang + g.pitch
    const np = [tp[0] - tl[i] * Math.cos(rad(dir)), tp[1] + tl[i] * Math.sin(rad(dir))]
    tail.push({ d: capsule(tp, tr[i], np, tr[i + 1]), fill: C.saddle })
    tp = np
    ang += 12 + (pose.tailWave ?? 0) * (i - 1)
  }

  const legShapes = (L, front, near) => {
    const col = near ? C.tan : C.tanFar, k = near ? 1 : 0.9
    // mass = shoulder or thigh muscle, which belongs to the body silhouette; lower = the leg below it
    if (front) {
      return {
        mass: [{ d: capsule(X(fx([14, -29])), 7.2 * k, X(L.e), 4 * k), fill: col }],
        lower: [
          { d: capsule(X(L.e), 3.5 * k, X(L.w), 2.5 * k), fill: col },
          { d: capsule(X(L.w), 2.5 * k, X(L.pw), 2.2 * k), fill: col },
          { d: capsule(X(L.pw), 2.3 * k, X(L.toe), 2.1 * k), fill: col },
        ],
      }
    }
    return {
      mass: [{ d: capsule(X(add(Hp, [0, -1])), 9 * k, X(L.st), 5 * k), fill: col }],
      lower: [
        { d: capsule(X(L.st), 4.2 * k, X(L.hk), 2.5 * k), fill: col },
        { d: capsule(X(L.hk), 2.4 * k, X(L.hp), 2.2 * k), fill: col },
        { d: capsule(X(L.hp), 2.3 * k, X(L.toe), 2.1 * k), fill: col },
      ],
    }
  }

  // head (positions for a neutral head; the whole head turns about the neck base)
  const jaw = pose.jaw ?? 0
  const earBack = pose.earBack ?? 0
  const J = [30, -42]
  const earN = [[29, -49.5], [27 - earBack * 0.3, -60.5], [35, -52]].map(p => HX(rot(p, [31, -50], -earBack * 1.6)))
  const earF = [[33, -51], [35.5 - earBack * 0.3, -61], [39, -50.5]].map(p => HX(rot(p, [35, -51], -earBack * 1.6)))
  const muzzle = [[36, -51], [44, -47.8], [49.6, -45.4], [50.2, -42.6], [46, -41.2], [37, -39.6]].map(HX)
  const mask = [[41, -49.4], [44.6, -47.8], [49.6, -45.4], [50.2, -42.6], [46, -41.2], [41, -40.6]].map(HX)
  const jawPivot = [37.5, -41]
  const jawPts = [[37, -41.6], [47.4, -41.6], [46.6, -39.4], [38.5, -37.4]].map(p => HX(rot(p, jawPivot, -jaw)))
  const mouthIn = [[38, -41.4], [47.6, -41.6], ...[[46.6, -39.6], [38.5, -38]].map(p => rot(p, jawPivot, -jaw))].map(HX)
  const tongueTip = HX(rot([44, -34.5 + (pose.tongue ?? 0) * 0.3], jawPivot, -jaw))
  const shapes = { far: [], body: [], near: [], head: [] }

  const hf = legShapes(HF, false, false), ff = legShapes(FF, true, false)
  const hn = legShapes(HN, false, true), fnn = legShapes(FN, true, true)
  shapes.far.push(...tail, ...hf.mass, ...hf.lower, ...ff.mass, ...ff.lower, { d: blob(earF, 1 / 8), fill: C.saddle })
  shapes.body.push(
    { d: capsule(X(N), 9, HX(J), 6.6), fill: C.tan },
    { d: torsoD, fill: C.tan },
    ...hn.mass, ...fnn.mass,
    { raw: `<clipPath id="${clip}"><path d="${torsoD}"/></clipPath>` },
    { d: blob(saddle), fill: C.saddle, clip, detail: true },
    { d: poly(vest), fill: C.vest, clip, detail: true },
    { d: `M${n(vest[0][0])} ${n(vest[0][1])}L${n(vest[3][0])} ${n(vest[3][1])}`, fill: 'none', stroke: C.mask, sw: 0.9, clip, detail: true },
    { d: `M${n(vest[1][0])} ${n(vest[1][1])}L${n(vest[2][0])} ${n(vest[2][1])}`, fill: 'none', stroke: C.mask, sw: 0.9, clip, detail: true },
    { raw: `<text x="${n(vestCenter[0])}" y="${n(vestCenter[1] + 2.3)}" transform="rotate(${n(g.pitch)} ${n(vestCenter[0])} ${n(vestCenter[1])}) translate(${n(vestCenter[0])} 0) scale(${pose.mirror ? -1 : 1} 1) translate(${n(-vestCenter[0])} 0)" font-family="Arial Black" font-size="6.4" text-anchor="middle" fill="${C.mask}">K9</text>`, detail: true },
  )
  shapes.near.push(...hn.lower, ...fnn.lower)
  shapes.head.push(
    { d: blob(earN, 1 / 8), fill: C.saddle },
    { d: circle(HX([32, -45]), 7.4), fill: C.tan },
    { d: blob(muzzle), fill: C.tan },
    ...(jaw > 2 ? [{ d: blob(mouthIn, 1 / 10), fill: C.mask }] : []),
    ...(pose.tongue != null && jaw > 4 ? [{ d: capsule(HX(rot([40, -39], jawPivot, -jaw)), 1.6, tongueTip, 2.1), fill: C.tongue }] : []),
    { d: blob(jawPts, 1 / 8), fill: C.tan },
    { d: blob(mask), fill: C.mask, detail: true },
    { d: blob([[47, -46.2], [50.6, -45], [50.8, -43], [48, -43.4]].map(HX)), fill: C.mask },
    { d: blob([[35.2, -48.2], [37.4, -49.4], [39.4, -48], [37.2, -46.8]].map(HX)), fill: C.mask, detail: true },
    { d: circle(HX([37.6, -48.5]), 0.55), fill: C.eye, detail: true },
  )
  const mouth = HX(rot([46.5, -40.5], jawPivot, -jaw * 0.5))
  return {
    svg: layer(shapes.far, PAL.out) + layer(shapes.body, PAL.out) + layer(shapes.near, PAL.out) + layer(shapes.head, PAL.out),
    mouth, head: HX([33, -56]),
  }
}

// ---------- the burglar (striped jumper, balaclava, loot sack; faces +x, origin on the ground) ----------
function runCycle(p) {
  const leg = w => {
    const s = Math.sin(w), f = Math.max(0, Math.cos(w))
    const th = 8 + 42 * s
    return [th, th - 22 - 78 * f * (0.6 + 0.4 * Math.max(0, -s + 0.6))]
  }
  const w = TAU * p
  return {
    hipY: -38.5 - 2.6 * Math.abs(Math.cos(w)), lean: 20,
    legN: leg(w), legF: leg(w + Math.PI),
    armN: [-46 * Math.sin(w + Math.PI) - 8, -46 * Math.sin(w + Math.PI) + 82],
    armF: [168, 236],
  }
}
const PRONE = { hipY: -8.5, lean: 92, legN: [-86, -146], legF: [-92, -88], armN: [100, 112], armF: [96, 104] }
const blendThief = (a, b, t) => ({
  hipY: lerp(a.hipY, b.hipY, t), lean: lerp(a.lean, b.lean, t),
  legN: a.legN.map((v, i) => lerp(v, b.legN[i], t)), legF: a.legF.map((v, i) => lerp(v, b.legF[i], t)),
  armN: a.armN.map((v, i) => lerp(v, b.armN[i], t)), armF: a.armF.map((v, i) => lerp(v, b.armF[i], t)),
})

function thief(pose) {
  const hip = [0, pose.hipY]
  const up = 180 - pose.lean, fwd = up - 90
  // torso frame: u along the spine from the hip, v toward the front
  const TF = ([u, v]) => step(step(hip, u, up), v, fwd)
  const shoulder = TF([22, -1]), neck = TF([27, 1])
  const head = step(neck, 9.5, 180 - pose.lean * 0.7)
  const leg = ([th, sh]) => {
    const k = step(hip, 18.5, th), a = step(k, 18, sh), toe = step(a, 8.4, sh + 94)
    return { k, a, toe, sh }
  }
  const arm = ([u, f]) => { const e = step(shoulder, 12.5, u), h = step(e, 11.5, f); return { e, h } }
  const LN = leg(pose.legN), LF = leg(pose.legF), AN = arm(pose.armN), AF = arm(pose.armF)

  const legShapes = (L, col) => [
    { d: capsule(hip, 6.6, L.k, 4.5), fill: col },
    { d: capsule(L.k, 4.3, L.a, 3.2), fill: col },
    { d: blob([step(L.a, 3.6, L.sh - 90), step(L.a, 3.8, L.sh + 160), step(L.toe, 3.4, L.sh + 150), step(L.toe, 3.6, L.sh + 94), step(L.toe, 2.4, L.sh - 70), step(L.a, 2.4, L.sh - 20)], 1 / 7), fill: C.shoe },
    { d: `M${n(step(L.a, 3.9, L.sh + 170)[0])} ${n(step(L.a, 3.9, L.sh + 170)[1])}L${n(step(L.toe, 3.5, L.sh + 140)[0])} ${n(step(L.toe, 3.5, L.sh + 140)[1])}`, fill: 'none', stroke: C.sole, sw: 2.2, detail: true },
  ]
  const armShapes = (A, col) => [
    { d: capsule(shoulder, 4.4, A.e, 3.4), fill: col },
    { d: capsule(A.e, 3.3, A.h, 2.7), fill: col },
    { d: circle(A.h, 3.6), fill: C.glove },
  ]

  // torso: broad shoulders, slimmer waist, striped jumper; pelvis in trousers with a belt
  const torsoPts = [[-1, -7.4], [8, -8.4], [17, -9.8], [24, -8.6], [28, -4], [28.4, 3], [24, 8.6], [16, 8.8], [8, 7.6], [-1, 7.2]].map(TF)
  const torsoD = blob(torsoPts)
  const pelvisD = blob([[-6, -7.6], [3, -8.6], [5, 0], [3, 8.2], [-6, 7.4], [-9, 0]].map(TF))
  const clip = `c${clipSeq++}`
  const stripes = []
  for (let i = 0; i < 7; i++) {
    const u = 4 + i * 4.4
    stripes.push({ d: poly([TF([u, -16]), TF([u, 16]), TF([u + 2.2, 16]), TF([u + 2.2, -16])]), fill: C.stripeB, clip, detail: true })
  }
  const belt = { d: poly([TF([0.5, -9]), TF([0.5, 9]), TF([3.2, 9]), TF([3.2, -9])]), fill: C.stripeB, detail: true }
  const buckle = { d: poly([TF([0, 6]), TF([0, 9.4]), TF([3.8, 9.4]), TF([3.8, 6])]), fill: T.marigold, detail: true }

  // sack over the far shoulder, or none if dropped
  const sackShapes = []
  if (pose.sack !== false) sackShapes.push(...sack(TF([20, -15]), pose.lean - 25, pose.mirror))

  // head: balaclava with an eye slot, a nose bump and a worried mouth hole
  const ht = pose.lean * 0.7 - 12
  const HP = p => rot(add(head, p), head, ht)
  const eyes = pose.dizzy
    ? [[3.4, -1.6], [7.6, -1.8]].map(e => ({ d: dizzyX(HP(e), 1.5), fill: 'none', stroke: C.mask, sw: 1, detail: true }))
    : [[3.3, -1.6], [7.6, -1.8]].flatMap(e => [
      { d: circle(HP(e), 1.9), fill: C.eye, detail: true },
      { d: circle(HP(add(e, [pose.look ?? -0.7, 0.2])), 0.95), fill: C.mask, detail: true },
    ])
  const headShapes = [
    { d: capsule(TF([24, 0]), 4.6, head, 4.2), fill: C.hood },
    { d: blob([[-9.6, 1], [-8.4, -6], [-2, -10.6], [5.5, -10.4], [10.2, -5.2], [10.6, 2], [8.4, 7.8], [2, 9.6], [-5, 8.2]].map(HP)), fill: C.hood },
    { d: blob([[-8.8, -4.4], [-3.6, -10.8], [4.5, -11.4], [9.8, -6.4], [7.2, -6.6], [-4.2, -6.8]].map(HP)), fill: T.dAsh, detail: true },
    { d: blob([[-0.6, -4.2], [5, -4.8], [10.8, -4], [10.8, 0.8], [5, 1.4], [-0.6, 1]].map(HP), 1 / 8), fill: C.skin, detail: true },
    ...eyes,
    { d: blob([[10.4, 1.2], [12.2, 2.6], [10.6, 3.6]].map(HP)), fill: C.hood },
    { d: circle(HP([8.6, 5.6]), 1.4), fill: C.skin, detail: true },
    { d: circle(HP([8.6, 5.7]), 0.75), fill: C.mask, detail: true },
  ]
  const sweat = pose.sweat ? [{ d: blob([[-2, -12], [-0.4, -15.6], [1.2, -12], [-0.4, -10.6]].map(p => add(head, add(p, [-8, 2 + pose.sweat])))), fill: C.sweat, detail: true }] : []

  return {
    svg: layer([...armShapes(AF, C.stripeA), ...sackShapes], PAL.out)
      + layer(legShapes(LF, C.pantsFar), PAL.out)
      + layer([...headShapes.slice(0, 1), { d: torsoD, fill: C.stripeA }, { raw: `<clipPath id="${clip}"><path d="${torsoD}"/></clipPath>` }, ...stripes, { d: pelvisD, fill: C.pants }, belt, buckle], PAL.out)
      + layer(legShapes(LN, C.pants), PAL.out)
      + layer(headShapes.slice(1), PAL.out)
      + layer(armShapes(AN, C.stripeA), PAL.out)
      + (sweat.length ? layer(sweat, PAL.out, 0.8) : ''),
    ankleN: LN.a, head, shoulder,
  }
}
const dizzyX = ([x, y], r) => `M${n(x - r)} ${n(y - r)}L${n(x + r)} ${n(y + r)}M${n(x + r)} ${n(y - r)}L${n(x - r)} ${n(y + r)}`

function sack(c, tilt, mirror = false) {
  const P = p => rot(add(c, p), c, tilt)
  return [
    { d: blob([[-11, -2], [-8, -11], [0, -13], [8, -10], [11, -1], [8, 9], [-2, 11], [-10, 7]].map(P)), fill: C.sack },
    { d: blob([[6, -12], [10, -16], [13, -13], [9, -9]].map(P)), fill: C.sackDark },
    { raw: `<text x="${n(c[0])}" y="${n(c[1] + 4)}" transform="rotate(${n(tilt)} ${n(c[0])} ${n(c[1])}) translate(${n(c[0])} 0) scale(${mirror ? -1 : 1} 1) translate(${n(-c[0])} 0)" font-family="Arial Black" font-size="10" text-anchor="middle" fill="${C.mask}">$</text>`, detail: true },
    { d: blob([[-5, 6], [0, 3], [6, 5], [0, 8.5]].map(P)), fill: C.sackDark, detail: true, op: 0.6 },
  ]
}

// ---------- effects ----------
function star([x, y], r, rotDeg) {
  const pts = []
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r
    pts.push(rot([x, y - rr], [x, y], rotDeg + i * 36))
  }
  return poly(pts)
}
function stamp(cx, cy, t) {
  const s = t < 1 ? 1.6 - 0.6 * easeOut(t) : 1
  const op = clamp(t * 3)
  return `<g transform="translate(${n(cx)} ${n(cy)}) rotate(-8) scale(${n(s)})" opacity="${n(op)}">
    <rect x="-46" y="-15" width="92" height="30" rx="5" fill="${T.marigold}" stroke="${T.ink}" stroke-width="3"/>
    <rect x="-41" y="-10.5" width="82" height="21" rx="3" fill="none" stroke="${T.ink}" stroke-width="1.2"/>
    <text x="0" y="6" font-family="Arial Black" font-size="16" text-anchor="middle" fill="${T.ink}" letter-spacing="1">CAUGHT</text>
  </g>`
}
function alert([x, y], t) {
  if (t <= 0 || t >= 1) return ''
  const s = t < 0.2 ? easeOut(t / 0.2) * 1.2 : 1.2 - 0.2 * seg(t, 0.2, 0.35)
  const op = 1 - seg(t, 0.8, 1)
  return `<g transform="translate(${n(x)} ${n(y)}) scale(${n(s)})" opacity="${n(op)}">
    <path d="M-3.4 -18 L3.4 -18 L1.8 -4 L-1.8 -4 Z" fill="${T.marigold}" stroke="${T.ink}" stroke-width="1.6" stroke-linejoin="round"/>
    <circle cx="0" cy="1.5" r="2.6" fill="${T.marigold}" stroke="${T.ink}" stroke-width="1.6"/>
  </g>`
}
function puffs(cx, cy, t, dir = 1, count = 5, spread = 22) {
  if (t <= 0 || t >= 1) return ''
  let s = ''
  for (let i = 0; i < count; i++) {
    const a = (i / (count - 1) - 0.5)
    const x = cx + dir * (a * spread * (0.6 + t)) - dir * t * 6
    const y = cy - 3 - t * 8 * (1 - Math.abs(a))
    const r = (3 + 3 * Math.sin(i * 2.1 + 1) ** 2) * (0.6 + t * 0.8)
    s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${PAL.dust}" opacity="${n((1 - t) * 0.9)}"/>`
  }
  return s
}

// ---------- the chase timeline (local coordinates: running toward +x, dog starts at x=0) ----------
const DOG_V = 118, THIEF_V = 84
const t0 = { appear: 0.12, onWall: 0.4, jump: 0.55, land: 0.95, turn: 0.7, turnEnd: 1.0, dogGo: 1.0 }
const THIEF_X0 = 96
const thiefRunX = t => THIEF_X0 + THIEF_V * Math.max(0, t - t0.land)
const dogRunX = t => {
  const u = Math.max(0, t - t0.dogGo), tau = 0.22
  return DOG_V * (u - tau * (1 - Math.exp(-u / tau)))
}
// Leap once the dog is close enough
let tLeap = t0.dogGo
while (thiefRunX(tLeap) - dogRunX(tLeap) > 60) tLeap += 0.001
const LEAP_T = 0.38
const tGrab = tLeap + LEAP_T
const FALL_T = 0.38
const tDown = tGrab + FALL_T
const SLIDE = 8
const thiefFinalX = thiefRunX(tGrab) + SLIDE
const RUN_HZ_T = 2.3, RUN_HZ_D = 2.75

// where the dog ends up: mouth on the prone burglar's raised ankle
let PAL = PALETTES.day
const proneProbe = thief({ ...PRONE, sack: false, dizzy: true })
const braceProbe = dog({ legs: BRACE, headRot: 26, jaw: 16 })
const DOG_END = thiefFinalX + proneProbe.ankleN[0] - braceProbe.mouth[0]
const BITE_DY = proneProbe.ankleN[1] - braceProbe.mouth[1]

function dogState(t, gt) {
  const tug = Math.sin(gt * TAU * 3.2)
  if (t < t0.turnEnd) {
    // finishing the previous catch, then alert and turn
    const release = seg(t, 0.18, 0.4)
    const legs = blendLegs(BRACE, STAND, smooth01(seg(t, 0.25, 0.55)))
    const facing = t < t0.turn ? -1 : Math.cos(Math.PI * smooth01(seg(t, t0.turn, t0.turnEnd))) * -1
    const tugAmt = 1 - release
    return {
      x: (1 - release) * tug * 0.8, facing, legs,
      headRot: lerp(26 + tug * 4, -6, smooth01(release)), jaw: lerp(16, 8, release), earBack: 0, tail: lerp(25, 40, release), y: lerp(BITE_DY, 0, release) * tugAmt * 0 + 0,
      alert: seg(t, 0.2, 0.95),
    }
  }
  if (t < tLeap) {
    const u = t - t0.dogGo
    const ramp = smooth01(seg(t, t0.turnEnd, t0.turnEnd + 0.3))
    const legs = blendLegs(STAND, gallop(u * RUN_HZ_D), ramp)
    return { x: dogRunX(t), facing: 1, legs, headRot: 16 * ramp + 3 * Math.sin(u * TAU * RUN_HZ_D), jaw: 10, tongue: 1, earBack: 7 * ramp, tail: 18 + 4 * Math.sin(u * TAU * RUN_HZ_D), tailWave: 3, speed: ramp }
  }
  if (t < tGrab) {
    const k = seg(t, tLeap, tGrab)
    const u = tLeap - t0.dogGo
    const legs = blendLegs(gallop(u * RUN_HZ_D), LEAP, smooth01(seg(k, 0, 0.35)))
    const x = lerp(dogRunX(tLeap), DOG_END - 4, easeOut(k))
    return { x, facing: 1, legs, headRot: lerp(16, 12, k), jaw: lerp(10, 24, k), earBack: 9, tail: 10, y: -Math.sin(Math.PI * k) * 16, speed: 1 - k }
  }
  // biting the ankle, braced and tugging
  const k = seg(t, tGrab, tDown + 0.15)
  const legs = blendLegs(LEAP, BRACE, smooth01(k))
  const tugAmt = smooth01(seg(t, tDown, tDown + 0.3))
  return {
    x: lerp(DOG_END - 4, DOG_END, easeOut(k)) + tug * 0.8 * tugAmt, facing: 1, legs,
    headRot: lerp(12, 26 + tug * 4 * tugAmt, smooth01(k)), jaw: lerp(24, 16, smooth01(k)), earBack: lerp(9, 0, k), tail: lerp(10, 25, k),
  }
}

function thiefState(t, gt) {
  if (t < t0.appear) return null
  if (t < t0.onWall) {
    // rises from behind the wall
    const k = easeOut(seg(t, t0.appear, t0.onWall))
    return { x: THIEF_X0 - 10, y: -(GROUND - WALL_TOP) / SC + lerp(46, 0, k), pose: { ...CROUCH, look: -1 }, behindWall: true }
  }
  if (t < t0.jump) return { x: THIEF_X0 - 10, y: -(GROUND - WALL_TOP) / SC, pose: { ...CROUCH, look: -1.2 }, behindWall: false }
  if (t < t0.land) {
    const k = seg(t, t0.jump, t0.land)
    const y = -(GROUND - WALL_TOP) / SC * (1 - k) - Math.sin(Math.PI * k) * 18
    return { x: lerp(THIEF_X0 - 10, THIEF_X0, k), y, pose: blendThief(CROUCH, JUMP, smooth01(seg(k, 0, 0.4))), landing: false }
  }
  if (t < tGrab) {
    const u = t - t0.land
    const r = runCycle(u * RUN_HZ_T + 0.25)
    const land = seg(t, t0.land, t0.land + 0.18)
    const pose = land < 1 ? blendThief(CROUCH, r, smooth01(land)) : r
    return { x: thiefRunX(t), y: 0, pose: { ...pose, look: -1, sweat: (u * 9) % 3 }, landPuff: seg(t, t0.land, t0.land + 0.5) }
  }
  // tripped by the dog: falls flat, sack flies, sees stars
  const k = seg(t, tGrab, tDown)
  const r = runCycle((tGrab - t0.land) * RUN_HZ_T + 0.25)
  return {
    x: thiefRunX(tGrab) + SLIDE * easeOut(k), y: 0,
    pose: { ...blendThief(r, PRONE, smooth01(k)), sack: false, dizzy: k > 0.6, look: -1 },
    sackK: seg(t, tGrab, tGrab + 0.6), down: seg(t, tDown, tDown + 2), fallPuff: seg(t, tDown - 0.05, tDown + 0.55),
  }
}
const CROUCH = { hipY: -26, lean: 34, legN: [78, -38], legF: [70, -46], armN: [40, 110], armF: [168, 236] }
const JUMP = { hipY: -36, lean: 26, legN: [58, -20], legF: [24, -60], armN: [150, 190], armF: [168, 236] }

// Camera (local x of the screen centre), smoothed toward the action and pinned at both ends
// The next chase starts where this one ends, mirrored, so the end camera is DOG_END - CAM_START
const CAM_START = 0, CAM_END = DOG_END - CAM_START
const camTrack = []
{
  let c = CAM_START
  const dt = 1 / FPS
  for (let i = 0; i < PHASE * FPS; i++) {
    const t = i * dt
    let target = CAM_START
    if (t > 0.55) target = Math.min(CAM_END, 0.5 * (dogRunX(Math.min(t, tLeap)) + thiefRunX(Math.min(t, tGrab))) + 10)
    if (t > tGrab) target = CAM_END
    c += (target - c) * (1 - Math.exp(-dt / 0.42))
    camTrack.push(c)
  }
  const last = camTrack[camTrack.length - 1]
  for (let i = 0; i < camTrack.length; i++) {
    const t = i * dt
    camTrack[i] += (CAM_END - last) * smooth01(seg(t, PHASE - 1.6, PHASE))
  }
}

// ---------- background (world coordinates; the camera moves over it) ----------
const STARS = Array.from({ length: 34 }, (_, i) => [((i * 97) % 400) + ((i * 13) % 7), 12 + ((i * 53) % 92), (i % 3) * 0.3 + 0.6])
function background(camX) {
  const P = PAL
  const sx = x => 200 + (x - camX)
  const far = x => 200 + (x - camX * 0.45)
  let s = `<rect width="${W}" height="${H}" fill="${P.sky}"/>`
  if (P.night) s += STARS.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${T.dLine}"/>`).join('')
  // sun / moon
  s += P.night
    ? `<circle cx="330" cy="46" r="17" fill="${P.sun}"/><circle cx="338" cy="40" r="15" fill="${P.sky}"/>`
    : `<circle cx="330" cy="50" r="30" fill="${P.sunRing}"/><circle cx="330" cy="50" r="19" fill="${P.sun}"/>`

  // far layer: houses, water tank, trees beyond the wall (parallax)
  const farItems = [
    { k: 'tree', x: -260 }, { k: 'house', x: -170 }, { k: 'tank', x: -60 }, { k: 'tree', x: 10 }, { k: 'house', x: 95 },
    { k: 'tree', x: 190 }, { k: 'tank', x: 250 }, { k: 'house', x: 330 }, { k: 'tree', x: 430 }, { k: 'house', x: 520 },
  ]
  for (const it of farItems) {
    const x = far(it.x)
    if (x < -120 || x > 520) continue
    if (it.k === 'house') {
      s += `<path d="M${x - 52} ${WALL_TOP + 2} V${WALL_TOP - 38} H${x + 52} V${WALL_TOP + 2} Z" fill="${P.farHouse}" stroke="${P.farEdge}" stroke-width="2"/>`
      s += `<path d="M${x - 62} ${WALL_TOP - 36} L${x - 28} ${WALL_TOP - 66} H${x + 28} L${x + 62} ${WALL_TOP - 36} Z" fill="${P.farRoof}" stroke="${P.farEdge}" stroke-width="2" stroke-linejoin="round"/>`
      for (const wx of [-36, -10, 16]) s += `<rect x="${x + wx}" y="${WALL_TOP - 28}" width="18" height="15" rx="2" fill="${P.farWindow}"/><path d="M${x + wx + 9} ${WALL_TOP - 28} v15" stroke="${P.farHouse}" stroke-width="2"/>`
    } else if (it.k === 'tank') {
      s += `<path d="M${x - 14} ${WALL_TOP} L${x - 10} ${WALL_TOP - 44} M${x + 14} ${WALL_TOP} L${x + 10} ${WALL_TOP - 44} M${x - 12} ${WALL_TOP - 20} L${x + 12} ${WALL_TOP - 32}" stroke="${P.farEdge}" stroke-width="2.5"/>`
      s += `<rect x="${x - 17}" y="${WALL_TOP - 74}" width="34" height="32" rx="6" fill="${P.tank}" stroke="${P.farEdge}" stroke-width="2.5"/><path d="M${x - 17} ${WALL_TOP - 62} h34" stroke="${P.farEdge}" stroke-width="1.5"/>`
    } else {
      s += `<path d="M${x} ${WALL_TOP} V${WALL_TOP - 30}" stroke="${P.farEdge}" stroke-width="5"/>`
      s += `<path d="${blob([[x - 30, WALL_TOP - 30], [x - 24, WALL_TOP - 58], [x - 4, WALL_TOP - 74], [x + 20, WALL_TOP - 66], [x + 30, WALL_TOP - 40], [x + 12, WALL_TOP - 24], [x - 14, WALL_TOP - 22]])}" fill="${P.tree}" stroke="${P.farEdge}" stroke-width="2"/>`
    }
  }

  // perimeter wall with pillars, coping, razor wire, a sign and a CCTV camera
  s += `<rect x="0" y="${WALL_TOP}" width="${W}" height="${GROUND - WALL_TOP}" fill="${P.wall}"/>`
  const bh = 14
  for (let r = 0; r * bh < GROUND - WALL_TOP - 8; r++) {
    const y = WALL_TOP + 8 + r * bh
    s += `<path d="M0 ${y} H${W}" stroke="${P.wallLine}" stroke-width="1.5"/>`
    const off = r % 2 ? 18 : 0
    const start = Math.floor((camX - 260 - off) / 36) * 36 + off
    for (let x = start; x < camX + 260; x += 36) s += `<path d="M${n(sx(x))} ${y} v${bh}" stroke="${P.wallLine}" stroke-width="1.5"/>`
  }
  const pStart = Math.floor((camX - 260) / 132) * 132
  for (let x = pStart; x < camX + 280; x += 132) {
    const X = sx(x)
    s += `<rect x="${n(X - 9)}" y="${WALL_TOP - 4}" width="18" height="${GROUND - WALL_TOP + 4}" fill="${P.pillar}"/>`
    s += `<rect x="${n(X - 12)}" y="${WALL_TOP - 10}" width="24" height="8" rx="2" fill="${P.wallCap}"/>`
  }
  s += `<rect x="0" y="${WALL_TOP}" width="${W}" height="7" fill="${P.wallCap}"/>`
  // razor wire coils
  const cStart = Math.floor((camX - 260) / 16) * 16
  let wire = ''
  for (let x = cStart; x < camX + 260; x += 16) wire += `M${n(sx(x) + 7)} ${WALL_TOP - 7}m-7 0a7 5 0 1 0 14 0a7 5 0 1 0 -14 0`
  s += `<path d="${wire}" fill="none" stroke="${P.wire}" stroke-width="1.2"/>`
  s += `<path d="M0 ${WALL_TOP - 7} H${W}" stroke="${P.wire}" stroke-width="1"/>`
  // signs every so often
  for (const x of [-210, 66, 330]) {
    const X = sx(x)
    if (X < -60 || X > 460) continue
    s += `<rect x="${n(X - 26)}" y="${WALL_TOP + 26}" width="52" height="24" rx="3" fill="${P.sign}" stroke="${P.out}" stroke-width="1.5"/>`
    s += `<text x="${n(X)}" y="${WALL_TOP + 36}" font-family="Arial Black" font-size="6.5" text-anchor="middle" fill="${P.signText}">BEWARE</text>`
    s += `<text x="${n(X)}" y="${WALL_TOP + 45}" font-family="Arial Black" font-size="6.5" text-anchor="middle" fill="${P.signText}">OF DOG</text>`
  }
  return s
}

function foreground(camX) {
  const P = PAL
  let s = `<rect x="0" y="${GROUND - 2}" width="${W}" height="${H - GROUND + 2}" fill="${P.ground}"/>`
  s += `<path d="M0 ${GROUND - 1} H${W}" stroke="${P.groundEdge}" stroke-width="2.5"/>`
  // the patrol route, dashed, moving with the ground
  const off = ((camX % 14) + 14) % 14
  let dash = ''
  for (let x = -off; x < W + 14; x += 14) dash += `M${n(x)} ${GROUND + 15}h6`
  s += `<path d="${dash}" stroke="${P.route}" stroke-width="2.5" stroke-linecap="round"/>`
  // security-tape band
  const top = GROUND + 30, per = 28
  const o2 = ((camX % per) + per) % per
  s += `<rect x="0" y="${top}" width="${W}" height="${H - top}" fill="${P.hazB}"/>`
  let haz = ''
  for (let x = -o2 - per; x < W + per * 2; x += per) haz += `M${n(x)} ${H}L${n(x + 14)} ${H}L${n(x + 14 + (H - top))} ${top}L${n(x + (H - top))} ${top}Z`
  s += `<path d="${haz}" fill="${P.hazA}"/>`
  s += `<path d="M0 ${top} H${W}" stroke="${P.out}" stroke-width="2.5"/>`
  return s
}

// ---------- frame ----------
function frame(gt) {
  clipSeq = 0
  const phase = Math.floor(gt / PHASE) % 2
  const t = gt - Math.floor(gt / PHASE) * PHASE
  const dir = phase === 0 ? 1 : -1
  const base = phase === 0 ? 0 : DOG_END
  const camLocal = camTrack[Math.min(camTrack.length - 1, Math.round(t * FPS))]
  const shake = t > tDown && t < tDown + 0.25 ? Math.sin(t * 90) * 1.6 * (1 - seg(t, tDown, tDown + 0.25)) : 0
  const camWorld = (base + dir * camLocal) * SC
  // local x -> screen x
  const scr = x => 200 + dir * (x - camLocal) * SC

  let s = background(camWorld)

  // night: a searchlight from the compound picks out the chase
  if (PAL.night) {
    const lx = 200 + dir * 30
    // flat bands rather than a gradient: crisper, and far smaller as a GIF
    s += `<ellipse cx="${n(lx)}" cy="${GROUND - 40}" rx="168" ry="90" fill="${T.marigold}" opacity="0.12"/>`
    s += `<ellipse cx="${n(lx)}" cy="${GROUND - 40}" rx="120" ry="66" fill="${T.marigold}" opacity="0.14"/>`
  }

  // characters in screen space; mirrored for the leftward chase
  const place = (x, y, facing, inner) => `<g transform="translate(${n(scr(x))} ${n(GROUND + y * SC)}) scale(${n(dir * facing * SC)} ${SC})">${inner}</g>`
  const shadow = (x, w, op = 1) => `<ellipse cx="${n(scr(x))}" cy="${GROUND + 1}" rx="${n(w * SC)}" ry="${n(3.2 * SC)}" fill="${PAL.shadow}" opacity="${n(PAL.shadowOp * op)}"/>`

  let chars = ''
  // the previous burglar, still lying where he was caught (behind the dog)
  const prevX = -(thiefFinalX - DOG_END)
  const prevThief = thief({ ...PRONE, sack: false, dizzy: true })
  chars += shadow(prevX - 14, 30) + place(prevX, 0, -1, prevThief.svg)

  const ts = thiefState(t, gt)
  const ds = dogState(t, gt)

  // thief
  if (ts) {
    const th = thief({ ...ts.pose, mirror: dir < 0 })
    let g = place(ts.x, ts.y, 1, th.svg)
    if (ts.behindWall) {
      s += `<defs><clipPath id="overwall"><rect x="0" y="0" width="${W}" height="${WALL_TOP + 1}"/></clipPath></defs>`
      g = `<g clip-path="url(#overwall)">${g}</g>`
    }
    if (!ts.behindWall && ts.y > -30) chars += shadow(ts.x + (ts.down != null ? 12 : 0), ts.down != null ? 30 : 14, 1)
    if (ts.landPuff != null) chars += `<g>${puffs(scr(ts.x), GROUND, ts.landPuff, dir, 5, 26)}</g>`
    if (ts.behindWall || ts.y < -45) s += g
    else chars += g
    // sack flies forward and spills coins
    if (ts.sackK != null) {
      const k = ts.sackK
      const sxL = ts.x + 10 + 30 * easeOut(k), syL = -50 + 30 * k - Math.sin(Math.PI * k) * 26 + 34 * k * k
      const landed = Math.min(-11, syL)
      chars += shadow(sxL, 12, k)
      chars += place(sxL, landed, 1, layer(sack([0, 0], 30 + 160 * easeOut(k), dir < 0), PAL.out))
      if (k > 0.85) {
        const ck = seg(t, tGrab + 0.5, tGrab + 1.1)
        for (let i = 0; i < 5; i++) {
          const cx = sxL + 6 + (i - 1) * 7 * easeOut(ck) + 4
          const cy = -3.2 - Math.sin(Math.PI * clamp(ck * 1.2 - i * 0.05)) * (10 + i * 3)
          chars += place(cx, cy, 1, `<ellipse cx="0" cy="0" rx="3.4" ry="3" fill="${C.coin}" stroke="${PAL.out}" stroke-width="1.3"/>`)
        }
      }
    }
    if (ts.fallPuff != null) chars += puffs(scr(ts.x + 14), GROUND, ts.fallPuff, dir, 7, 60)
  }

  // dog
  const dg = dog({ ...ds, mirror: dir * ds.facing < 0 })
  chars += shadow(ds.x, 26, ds.y ? 1 + ds.y / 40 : 1)
  if (ds.speed > 0.2) {
    const op = ds.speed * 0.8
    for (const [dy, len, k] of [[-30, 22, 0], [-20, 16, 1], [-38, 12, 2]]) {
      const wob = Math.sin(gt * 30 + k) * 3
      chars += `<path d="M${n(scr(ds.x - 36 - wob))} ${n(GROUND + dy * SC)}h${n(-dir * len * SC)}" stroke="${PAL.speed}" stroke-width="2" stroke-linecap="round" opacity="${n(op)}"/>`
    }
  }
  chars += place(ds.x, ds.y ?? 0, ds.facing, dg.svg)
  if (ds.alert) {
    const hx = ds.x + dg.head[0] * ds.facing * 0.8
    chars += alert([scr(hx), GROUND - 74 * SC], ds.alert)
  }

  // stars over the caught burglar's head, and the stamp
  const starsFor = (cx, k) => {
    let o = ''
    for (let i = 0; i < 3; i++) {
      const a = gt * 5 + i * TAU / 3
      o += `<path d="${star([cx + Math.cos(a) * 13, GROUND - 22 * SC + Math.sin(a) * 4], 4.4, gt * 200)}" fill="${C.star}" stroke="${PAL.out}" stroke-width="1.1" stroke-linejoin="round"/>`
    }
    return k > 0 ? `<g opacity="${n(clamp(k * 4))}">${o}</g>` : ''
  }
  if (ts && ts.down != null) chars += starsFor(scr(ts.x + 36), ts.down + 0.01)
  chars += starsFor(scr(prevX - 36), 1)

  s += `<g transform="translate(${n(shake)} 0)">${foreground(camWorld)}${chars}</g>`
  if (t > tDown + 0.1) s += stamp(200 + dir * 44, 62, seg(t, tDown + 0.1, tDown + 0.45))
  else if (t < 0.5) s += `<g opacity="${n(1 - seg(t, 0.1, 0.5))}">${stamp(200 - dir * 44, 62, 1)}</g>`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${s}</svg>`
}

// ---------- render ----------
function rasterize(svg, width = OUT_W) {
  const r = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: { fontFiles: ['/System/Library/Fonts/Supplemental/Arial Black.ttf'], loadSystemFonts: false, defaultFontFamily: 'Arial Black' },
  })
  return r.render()
}

const outDir = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'app/assets/patrol'
fs.mkdirSync(outDir, { recursive: true })
const total = Math.round(PHASE * 2 * FPS)
const only = process.argv.includes('--day') ? ['day'] : process.argv.includes('--night') ? ['night'] : ['day', 'night']

if (process.argv.includes('--sheet')) {
  // a few frames as PNGs for checking poses
  const list = (process.argv.find(a => a.startsWith('--t=')) ?? '--t=0,0.3,0.7,1.2,1.5,2.0,2.5,3.0,3.3,3.6,4.2,5.5').slice(4).split(',').map(Number)
  for (const v of only) {
    PAL = PALETTES[v]
    for (const tt of list) {
      if (process.env.DUMP) fs.writeFileSync(path.join(outDir, `${v}-${tt}.svg`), frame(tt))
      fs.writeFileSync(path.join(outDir, `${v}-${tt.toFixed(2)}.png`), rasterize(frame(tt)).asPng())
    }
  }
  console.log({ tLeap, tGrab, tDown, DOG_END, thiefFinalX, BITE_DY })
} else {
  for (const v of only) {
    PAL = PALETTES[v]
    const frames = []
    for (let i = 0; i < total; i++) {
      const img = rasterize(frame(i / FPS))
      frames.push({ data: new Uint8Array(img.pixels), w: img.width, h: img.height })
    }
    // one shared palette, sampled across the loop
    const sample = frames.filter((_, i) => i % 9 === 0)
    const all = new Uint8Array(sample.reduce((a, f) => a + f.data.length, 0))
    let o = 0
    for (const f of sample) { all.set(f.data, o); o += f.data.length }
    // last palette slot is reserved for "unchanged since the previous frame"
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
    fs.writeFileSync(path.join(outDir, `patrol-chase-${v}.gif`), gif.bytes())
    // still frame for reduced motion: the catch
    fs.writeFileSync(path.join(outDir, `patrol-chase-${v}.png`), rasterize(frame(tDown + 1.2)).asPng())
    console.log(v, frames.length, 'frames', (gif.bytes().length / 1024).toFixed(0) + ' KB')
  }
}

// ---------- debug: pose sheets ----------
function poseSheet(file) {
  PAL = PALETTES.day
  const cells = []
  const poses = [STAND, BRACE, LEAP, ...[0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875].map(gallop)]
  poses.forEach((legs, i) => {
    const x = 60 + (i % 4) * 110, y = 90 + Math.floor(i / 4) * 90
    const d = dog({ legs, headRot: i === 1 ? 26 : 0, jaw: i > 2 ? 10 : 0, tongue: i > 2 ? 1 : undefined, earBack: i > 2 ? 14 : 0, tail: i > 2 ? 18 : 35 })
    cells.push(`<path d="M${x - 50} ${y}h100" stroke="#999"/><g transform="translate(${x} ${y})">${d.svg}</g>`)
  })
  const th = [runCycle(0), runCycle(0.25), runCycle(0.5), runCycle(0.75), CROUCH, JUMP, PRONE]
  th.forEach((p, i) => {
    const x = 40 + i * 62, y = 380
    cells.push(`<path d="M${x - 30} ${y}h60" stroke="#999"/><g transform="translate(${x} ${y})">${thief({ ...p, dizzy: i === 6, sack: i < 6 }).svg}</g>`)
  })
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 400" width="460" height="400"><rect width="460" height="400" fill="#f2f1ed"/>${cells.join('')}</svg>`
  fs.writeFileSync(file, rasterize(svg, 1380).asPng())
}
if (process.argv.includes('--poses')) poseSheet(path.join(outDir, 'poses.png'))
