import * as THREE from 'three'

// Rose petal — ellipse tilted at -36°, soft radial gradient
export function createRosePetalTexture(colorRgba) {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const cx = size / 2
  const cy = size / 2

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(-Math.PI / 5)

  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size / 2.2)
  grad.addColorStop(0,   colorRgba)
  grad.addColorStop(0.5, colorRgba)
  grad.addColorStop(1,   'rgba(0,0,0,0)')

  ctx.beginPath()
  ctx.ellipse(0, 0, size / 2.2, size / 3.4, 0, 0, Math.PI * 2)
  ctx.fillStyle = grad
  ctx.fill()
  ctx.restore()

  return new THREE.CanvasTexture(canvas)
}

// Pollen / bokeh — soft radial glow in warm gold
export function createPollenTexture() {
  const size = 32
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const cx = size / 2

  const grad = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx)
  grad.addColorStop(0,    'rgba(201,168,124,1)')
  grad.addColorStop(0.25, 'rgba(201,168,124,0.85)')
  grad.addColorStop(0.6,  'rgba(219,191,150,0.4)')
  grad.addColorStop(1,    'rgba(0,0,0,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  return new THREE.CanvasTexture(canvas)
}

// Wisteria teardrop petal — lavender-blush, slightly elongated
export function createWisteriaPetalTexture() {
  const size = 48
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const cx = size / 2
  const cy = size / 2

  ctx.save()
  ctx.translate(cx, cy)

  const grad = ctx.createRadialGradient(0, -4, 0, 0, 0, size / 2)
  grad.addColorStop(0,   'rgba(180,160,210,0.9)')
  grad.addColorStop(0.5, 'rgba(196,160,200,0.7)')
  grad.addColorStop(1,   'rgba(0,0,0,0)')

  // Teardrop: narrow top, wider bottom
  ctx.beginPath()
  ctx.moveTo(0, -size / 2.2)
  ctx.bezierCurveTo( size / 4, -size / 6,  size / 3.5,  size / 5, 0,  size / 2.2)
  ctx.bezierCurveTo(-size / 3.5,  size / 5, -size / 4, -size / 6, 0, -size / 2.2)
  ctx.fillStyle = grad
  ctx.fill()
  ctx.restore()

  return new THREE.CanvasTexture(canvas)
}

// Detailed rose for the foreground sprite
export function createDetailedRoseTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const cx = size / 2
  const cy = size / 2

  // Draw layered petals from outside in
  const petalCount = [8, 6, 5, 4]
  const petalColors = [
    ['rgba(196,126,133,0.85)', 'rgba(232,180,184,0.6)'],
    ['rgba(232,180,184,0.9)',  'rgba(248,210,214,0.7)'],
    ['rgba(217,168,172,0.95)', 'rgba(248,224,226,0.8)'],
    ['rgba(248,210,214,1)',    'rgba(255,235,237,0.9)'],
  ]
  const radiusSteps = [90, 68, 48, 30]

  petalCount.forEach((n, layer) => {
    const r = radiusSteps[layer]
    const [innerColor, outerColor] = petalColors[layer]
    const offsetAngle = (layer % 2 === 0 ? 0 : Math.PI / n)

    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 + offsetAngle
      const px = cx + Math.cos(angle) * r * 0.45
      const py = cy + Math.sin(angle) * r * 0.45

      ctx.save()
      ctx.translate(px, py)
      ctx.rotate(angle + Math.PI / 2)

      const grad = ctx.createRadialGradient(0, 0, 0, 0, r * 0.2, r * 0.55)
      grad.addColorStop(0, innerColor)
      grad.addColorStop(1, outerColor)

      ctx.beginPath()
      ctx.ellipse(0, 0, r * 0.28, r * 0.52, 0, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()
      ctx.restore()
    }
  })

  // Center
  const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18)
  centerGrad.addColorStop(0, 'rgba(248,220,224,1)')
  centerGrad.addColorStop(1, 'rgba(196,126,133,0.8)')
  ctx.beginPath()
  ctx.arc(cx, cy, 18, 0, Math.PI * 2)
  ctx.fillStyle = centerGrad
  ctx.fill()

  return new THREE.CanvasTexture(canvas)
}
