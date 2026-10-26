// Shared drawing kit for Dogeash animations: brand tokens, shape primitives and the K9.
// Used by render-patrol-chase.mjs and render-kennel-watch.mjs.

// Dogeash tokens (app/assets/css/tokens.css)
export const T = {
  marigold: '#ffc21a', marigoldInk: '#8a6000', marigoldSoft: '#f8edcc',
  night: '#1c1c1e', ink: '#141414', ash: '#d3d3cf', ashSoft: '#e4e3de',
  canvas: '#f2f1ed', surface: '#f9f8f5', danger: '#b0302a', verified: '#1f56d6',
  dCanvas: '#0f0f10', dSurface: '#1a1a1c', dSunk: '#232326', dNight: '#26262a',
  dAshSoft: '#2a2a2d', dAsh: '#3b3b40', dLine: '#6c6c72',
}
export const mix = (a, b, t) => {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
  const [x, y] = [p(a), p(b)]
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')
}

// Character colours, shared by both variants
export const C = {
  tan: mix(T.marigold, T.marigoldInk, 0.42), tanFar: mix(T.marigold, T.marigoldInk, 0.75),
  saddle: T.night, mask: T.ink, vest: T.marigold, tongue: T.danger,
  stripeA: T.ashSoft, stripeB: T.night, pants: T.ink, pantsFar: '#2b2b2e', glove: T.night,
  hood: T.night, skin: T.marigoldSoft, shoe: T.ash, sole: T.ink, sack: T.ash, sackDark: mix(T.ash, T.ink, 0.25),
  coin: T.marigold, eye: T.surface, sweat: T.verified, star: T.marigold,
}

// ---------- math ----------
export const rad = d => d * Math.PI / 180
export const n = v => Math.round(v * 100) / 100
export const lerp = (a, b, t) => a + (b - a) * t
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
export const smooth01 = t => t * t * (3 - 2 * t)
export const easeOut = t => 1 - (1 - t) ** 3
export const seg = (t, a, b) => clamp((t - a) / (b - a))
export const TAU = Math.PI * 2
// Limb step: angle in degrees from straight down, positive = toward the facing direction (+x)
export const step = (p, len, ang) => [p[0] + len * Math.sin(rad(ang)), p[1] + len * Math.cos(rad(ang))]
export const rot = (p, c, deg) => {
  const a = rad(deg), s = Math.sin(a), co = Math.cos(a), x = p[0] - c[0], y = p[1] - c[1]
  return [c[0] + x * co - y * s, c[1] + x * s + y * co]
}
export const add = (p, q) => [p[0] + q[0], p[1] + q[1]]

// ---------- path primitives ----------
export function circle([x, y], r) {
  return `M${n(x - r)} ${n(y)}a${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0Z`
}
// Hull of two circles: the basic tapered limb segment
export function capsule(a, r1, b, r2) {
  const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy)
  if (d <= Math.abs(r1 - r2) + 0.01) return r1 > r2 ? circle(a, r1) : circle(b, r2)
  const ang = Math.atan2(dy, dx), beta = Math.acos((r1 - r2) / d)
  const pt = (c, r, t) => [c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)]
  const p1 = pt(a, r1, ang + beta), p2 = pt(b, r2, ang + beta), q2 = pt(b, r2, ang - beta), q1 = pt(a, r1, ang - beta)
  const big2 = 2 * beta > Math.PI ? 1 : 0, big1 = 2 * beta < Math.PI ? 1 : 0
  return `M${n(p1[0])} ${n(p1[1])}L${n(p2[0])} ${n(p2[1])}A${n(r2)} ${n(r2)} 0 ${big2} 0 ${n(q2[0])} ${n(q2[1])}L${n(q1[0])} ${n(q1[1])}A${n(r1)} ${n(r1)} 0 ${big1} 0 ${n(p1[0])} ${n(p1[1])}Z`
}
// Closed Catmull-Rom spline through points
export function blob(pts, k = 1 / 6) {
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
export const poly = pts => 'M' + pts.map(p => `${n(p[0])} ${n(p[1])}`).join('L') + 'Z'

// A layer is drawn twice: a fat outline pass, then the fills, so overlapping parts read as one body
let clipSeq = 0
export const nextClip = () => `c${clipSeq++}`
export const resetClips = () => { clipSeq = 0 }
export function layer(shapes, out, w = 1.7) {
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
export function gallop(p) {
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
export const STAND = { fn: [-32, 4, 12], ff: [-30, 6, 14], hn: [36, -42, 8], hf: [32, -40, 6], flex: 0, pitch: 0, lift: 0 }
// Braced tug: front legs planted forward, hindquarters dropped and pulling back
export const BRACE = { fn: [-8, 26, 34], ff: [-12, 22, 30], hn: [62, -22, 30], hf: [58, -26, 26], flex: -0.6, pitch: 9, lift: 0 }
export const LEAP = { fn: [38, 82, 90], ff: [32, 76, 84], hn: [-18, -70, -60], hf: [-24, -76, -66], flex: 1.2, pitch: -10, lift: 0 }
export const blendLegs = (a, b, t) => {
  const o = {}
  for (const k of ['fn', 'ff', 'hn', 'hf']) o[k] = a[k].map((v, i) => lerp(v, b[k][i], t))
  for (const k of ['flex', 'pitch', 'lift']) o[k] = lerp(a[k], b[k], t)
  return o
}

export function dog(pose) {
  const OUT = pose.out ?? T.ink
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
  const clip = nextClip()
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
    svg: layer(shapes.far, OUT) + layer(shapes.body, OUT) + layer(shapes.near, OUT) + layer(shapes.head, OUT),
    mouth, head: HX([33, -56]),
  }
}
