<script setup lang="ts">
import * as THREE from 'three'
import type { DogAppearance } from '~/utils/k9'

// Procedural Malinois in a braced, snarling stance: no model file to load.
// Drag to turn it; it growls (jaw tremor), bristles its hackles and snaps every few seconds.

type Vec = [number, number, number]

const props = defineProps<{ appearance?: Pick<DogAppearance, 'coat' | 'saddle' | 'mask' | 'eyes'> }>()

const host = ref<HTMLDivElement | null>(null)
let cleanup: (() => void) | undefined

// Short directional strokes on grey: used as both colour variation and bump for a fur read
function furTexture() {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#cfcfcf'
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 9000; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const len = 5 + Math.random() * 12
    const a = Math.PI / 2 + (Math.random() - 0.5) * 0.6
    const light = Math.random() > 0.5
    ctx.strokeStyle = light ? `rgba(255,255,255,${0.08 + Math.random() * 0.15})` : `rgba(0,0,0,${0.08 + Math.random() * 0.18})`
    ctx.lineWidth = 0.8 + Math.random() * 1.4
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len)
    ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(3, 3)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

onMounted(() => {
  const el = host.value
  if (!el) return

  const css = getComputedStyle(document.documentElement)
  const token = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  el.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
  camera.position.set(0, 1.25, 6.4)
  camera.lookAt(0, 0.82, 0)

  // Hard key from above-front, warm rim from behind for a menacing silhouette
  scene.add(new THREE.HemisphereLight(0xffffff, 0x2a2622, 0.8))
  const key = new THREE.DirectionalLight(0xffffff, 2.4)
  key.position.set(-3, 5, 4)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.radius = 4
  scene.add(key)
  const rim = new THREE.DirectionalLight(0xffd9a0, 3)
  rim.position.set(3, 2.5, -4)
  scene.add(rim)

  const fur = furTexture()
  const coat = (color: THREE.ColorRepresentation) =>
    new THREE.MeshStandardMaterial({ color, map: fur, bumpMap: fur, bumpScale: 1.5, roughness: 0.92 })
  const look = props.appearance
  const fawn = coat(look?.coat ?? 0xc89048)
  const saddle = coat(look?.saddle ?? 0x5a3a1a)
  const black = coat(look?.mask ?? 0x2a2420)
  const nose = new THREE.MeshStandardMaterial({ color: 0x0c0b0a, roughness: 0.25 })
  const gum = new THREE.MeshStandardMaterial({ color: 0x6e1a1e, roughness: 0.4 })
  const tongueMat = new THREE.MeshStandardMaterial({ color: 0xb8404a, roughness: 0.35 })
  const tooth = new THREE.MeshStandardMaterial({ color: 0xf3ecdc, roughness: 0.3 })
  const iris = new THREE.MeshStandardMaterial({ color: look?.eyes ?? 0xd98a1c, emissive: 0x6a3000, roughness: 0.08 })
  const collarMat = new THREE.MeshStandardMaterial({ color: token('--marigold', '#ffc21a'), roughness: 0.6 })
  const steel = new THREE.MeshStandardMaterial({ color: 0xd8d8d4, metalness: 0.85, roughness: 0.3 })

  const add = (mesh: THREE.Mesh, parent: THREE.Object3D) => {
    mesh.castShadow = true
    parent.add(mesh)
    return mesh
  }
  const ball = (p: Vec, r: number, m: THREE.Material, parent: THREE.Object3D, scale: Vec = [1, 1, 1]) => {
    const mesh = add(new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), m), parent)
    mesh.position.set(...p)
    mesh.scale.set(...scale)
    return mesh
  }
  // Tapered capsule between two points: the building block for limbs, neck and muzzle
  const limb = (a: Vec, b: Vec, ra: number, rb: number, m: THREE.Material, parent: THREE.Object3D) => {
    const A = new THREE.Vector3(...a)
    const B = new THREE.Vector3(...b)
    const dir = B.clone().sub(A)
    const mesh = add(new THREE.Mesh(new THREE.CylinderGeometry(rb, ra, dir.length(), 20, 1, true), m), parent)
    mesh.position.copy(A).add(B).multiplyScalar(0.5)
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
    ball(a, ra, m, parent)
    ball(b, rb, m, parent)
    return mesh
  }
  const chain = (points: Vec[], radii: number[], m: THREE.Material, parent: THREE.Object3D) => {
    for (let i = 0; i < points.length - 1; i++) limb(points[i]!, points[i + 1]!, radii[i]!, radii[i + 1]!, m, parent)
  }
  const fang = (p: Vec, r: number, h: number, up: boolean, parent: THREE.Object3D) => {
    const mesh = add(new THREE.Mesh(new THREE.ConeGeometry(r, h, 8), tooth), parent)
    mesh.position.set(...p)
    if (!up) mesh.rotation.x = Math.PI
    return mesh
  }

  const dog = new THREE.Group()
  dog.position.z = -0.05
  scene.add(dog)

  // Torso: deep chest, tucked waist, muscular hips
  const body = new THREE.Group()
  dog.add(body)
  ball([0, 1.05, 0.55], 0.42, fawn, body, [0.9, 1.05, 1])
  limb([0, 1.05, 0.45], [0, 1.0, -0.35], 0.4, 0.33, fawn, body)
  limb([0, 1.0, -0.35], [0, 1.02, -0.8], 0.31, 0.3, fawn, body)
  ball([0, 1.03, -0.85], 0.34, fawn, body)
  ball([0, 1.2, -0.05], 1, saddle, body, [0.36, 0.25, 0.75])

  // Raised hackles along the spine
  const hackles = new THREE.Group()
  body.add(hackles)
  for (let i = 0; i < 12; i++) {
    const z = 0.55 - i * 0.1
    const h = add(new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.13, 5), saddle), hackles)
    h.position.set((i % 2 ? 1 : -1) * 0.03, 1.42 - (0.55 - z) * 0.06, z)
    h.rotation.x = -0.7
  }

  for (const s of [-1, 1]) {
    // Front legs braced wide and forward
    ball([s * 0.24, 1.1, 0.5], 0.17, fawn, dog, [0.8, 1.2, 1])
    chain([[s * 0.26, 0.95, 0.55], [s * 0.3, 0.58, 0.5], [s * 0.33, 0.16, 0.68]], [0.15, 0.1, 0.07], fawn, dog)
    ball([s * 0.34, 0.06, 0.78], 0.085, black, dog, [1, 0.7, 1.3])
    // Hind legs loaded to spring
    ball([s * 0.24, 0.9, -0.82], 0.28, fawn, dog, [0.7, 1.1, 1.1])
    chain([[s * 0.26, 0.92, -0.8], [s * 0.29, 0.55, -0.62], [s * 0.3, 0.3, -1.02], [s * 0.3, 0.1, -0.94]], [0.2, 0.12, 0.07, 0.065], fawn, dog)
    ball([s * 0.3, 0.06, -0.88], 0.08, black, dog, [1, 0.7, 1.3])
  }

  // Tail held stiff and low
  chain([[0, 1.08, -1.12], [0, 0.9, -1.42], [0, 0.62, -1.55]], [0.09, 0.07, 0.05], fawn, dog)
  limb([0, 0.62, -1.55], [0, 0.42, -1.55], 0.05, 0.035, black, dog)

  // Neck and collar
  limb([0, 1.3, 0.55], [0, 1.38, 0.95], 0.3, 0.21, fawn, dog)
  ball([0, 1.22, 0.68], 0.24, fawn, dog, [1, 1.1, 1])
  add(new THREE.Mesh(new THREE.TorusGeometry(0.255, 0.045, 10, 32), collarMat), dog).position.set(0, 1.34, 0.78)
  const tag = add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 20), steel), dog)
  tag.position.set(0, 1.04, 0.86)
  tag.rotation.x = Math.PI / 2

  // Head: low and thrust forward
  const head = new THREE.Group()
  head.position.set(0, 1.38, 1.1)
  head.rotation.x = 0.15
  dog.add(head)
  ball([0, 0, 0], 0.27, fawn, head, [0.95, 0.85, 1.05])
  for (const s of [-1, 1]) {
    ball([s * 0.15, -0.06, 0.08], 0.12, black, head) // clenched jaw muscles
    // Brows furrowed down toward the centre
    const brow = ball([s * 0.1, 0.1, 0.25], 1, black, head, [0.09, 0.035, 0.06])
    brow.rotation.z = s * 0.45
    // Amber eyes under the brow
    ball([s * 0.105, 0.04, 0.25], 0.035, iris, head)
    ball([s * 0.105, 0.04, 0.282], 0.014, nose, head)
    // Ears pinned up and forward
    const ear = add(new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.34, 3), black), head)
    ear.position.set(s * 0.13, 0.28, -0.02)
    ear.scale.z = 0.45
    ear.rotation.set(0.2, 0, -s * 0.2)
  }

  // Black mask muzzle with snarl wrinkles
  limb([0, -0.04, 0.18], [0, -0.03, 0.58], 0.15, 0.085, black, head)
  ball([0, 0, 0.64], 0.055, nose, head, [1.1, 0.8, 0.8])
  for (const [z, r] of [[0.3, 0.135], [0.37, 0.125], [0.44, 0.113]] as const) {
    const wrinkle = add(new THREE.Mesh(new THREE.TorusGeometry(r, 0.013, 6, 16, Math.PI), black), head)
    wrinkle.position.set(0, -0.035, z)
  }

  // Upper lip curled back: gums and fangs
  ball([0, -0.12, 0.38], 1, gum, head, [0.1, 0.04, 0.2])
  for (const s of [-1, 1]) {
    fang([s * 0.065, -0.18, 0.5], 0.022, 0.1, false, head)
    for (const z of [0.3, 0.36, 0.42]) fang([s * 0.088, -0.15, z], 0.013, 0.04, false, head)
  }
  for (const x of [-0.035, -0.012, 0.012, 0.035]) fang([x, -0.14, 0.56], 0.01, 0.035, false, head)

  // Open lower jaw
  const jaw = new THREE.Group()
  jaw.position.set(0, -0.13, 0.12)
  head.add(jaw)
  limb([0, 0, 0], [0, -0.01, 0.4], 0.09, 0.055, black, jaw)
  ball([0, 0.035, 0.22], 1, tongueMat, jaw, [0.065, 0.02, 0.15])
  for (const s of [-1, 1]) {
    fang([s * 0.05, 0.08, 0.36], 0.018, 0.08, true, jaw)
    for (const z of [0.18, 0.25]) fang([s * 0.065, 0.05, z], 0.011, 0.035, true, jaw)
  }

  // Shadow catcher
  const ground = new THREE.Mesh(new THREE.CircleGeometry(2.6, 48), new THREE.ShadowMaterial({ opacity: 0.22 }))
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  dog.rotation.y = 0.65

  // Drag to rotate with a little momentum
  let dragging = false
  let lastX = 0
  let spin = 0
  const onDown = (e: PointerEvent) => { dragging = true; lastX = e.clientX; el.setPointerCapture(e.pointerId) }
  const onMove = (e: PointerEvent) => {
    if (!dragging) return
    spin = (e.clientX - lastX) * 0.01
    dog.rotation.y += spin
    lastX = e.clientX
  }
  const onUp = () => { dragging = false }
  el.addEventListener('pointerdown', onDown)
  el.addEventListener('pointermove', onMove)
  el.addEventListener('pointerup', onUp)
  el.addEventListener('pointercancel', onUp)

  const resize = () => {
    const { width, height } = el.getBoundingClientRect()
    renderer.setSize(width, height, false)
    camera.aspect = width / Math.max(height, 1)
    camera.updateProjectionMatrix()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(el)
  resize()

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const clock = new THREE.Clock()
  jaw.rotation.x = 0.4
  let frame = 0
  const tick = () => {
    const t = clock.getElapsedTime()
    if (!reduceMotion) {
      // Snap every ~4s: jaw lunges open, head drives forward
      const snap = Math.max(0, Math.sin(t * 1.6)) ** 40
      const growl = Math.sin(t * 38) * 0.015
      jaw.rotation.x = 0.36 + growl + snap * 0.3
      head.position.z = 1.1 + snap * 0.08
      head.position.x = Math.sin(t * 45) * 0.004
      head.rotation.y = Math.sin(t * 0.45) * 0.22
      body.scale.y = 1 + Math.sin(t * 3.2) * 0.015
      hackles.scale.y = 1 + Math.sin(t * 5) * 0.12 + snap * 0.3
      dog.position.z = -0.05 + snap * 0.04
      if (!dragging) {
        spin *= 0.94
        dog.rotation.y += spin
      }
    }
    renderer.render(scene, camera)
    frame = requestAnimationFrame(tick)
  }
  tick()

  cleanup = () => {
    cancelAnimationFrame(frame)
    ro.disconnect()
    el.removeEventListener('pointerdown', onDown)
    el.removeEventListener('pointermove', onMove)
    el.removeEventListener('pointerup', onUp)
    el.removeEventListener('pointercancel', onUp)
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose()
        ;(Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose())
      }
    })
    fur.dispose()
    renderer.dispose()
    renderer.domElement.remove()
  }
})

onBeforeUnmount(() => cleanup?.())
</script>

<template>
  <div
    ref="host"
    class="relative size-full cursor-grab touch-pan-y active:cursor-grabbing [&>canvas]:block [&>canvas]:size-full"
    role="img"
    aria-label="3D guard dog braced and snarling, fangs bared. Drag to turn it."
  />
</template>
