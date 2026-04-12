import { useEffect, useRef } from 'react'

// Mirrors the petal geometry from createDetailedRoseTexture in botanicalTextures.js
// petalCount layers, radiusSteps, same offset-angle alternation
const LAYERS = [
  { n: 8, r: 90, color: 'rgba(196,126,133,0.88)', offset: 0 },
  { n: 6, r: 68, color: 'rgba(232,180,184,0.92)', offset: Math.PI / 8 },
  { n: 5, r: 48, color: 'rgba(248,210,214,0.96)', offset: 0 },
  { n: 4, r: 30, color: 'rgba(255,228,230,1)',     offset: Math.PI / 4 },
]
const SOURCE_SIZE = 256 // matches canvas size in createDetailedRoseTexture

function LotusPetals({ size, opacity = 1 }) {
  const scale = size / SOURCE_SIZE
  const cx = size / 2
  const cy = size / 2

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', opacity }}
      aria-hidden="true"
    >
      {LAYERS.map(({ n, r, color, offset }, li) => {
        const sr     = r * scale
        const pOff   = sr * 0.45
        const rx     = sr * 0.28
        const ry     = sr * 0.52
        return Array.from({ length: n }, (_, i) => {
          const angle = (i / n) * Math.PI * 2 + offset
          const px    = cx + Math.cos(angle) * pOff
          const py    = cy + Math.sin(angle) * pOff
          const deg   = (angle + Math.PI / 2) * (180 / Math.PI)
          return (
            <ellipse
              key={`${li}-${i}`}
              cx={px}
              cy={py}
              rx={rx}
              ry={ry}
              fill={color}
              transform={`rotate(${deg} ${px} ${py})`}
            />
          )
        })
      })}
      {/* Center boss */}
      <circle cx={cx} cy={cy} r={18 * scale} fill="rgba(248,220,224,1)" />
      <circle cx={cx} cy={cy} r={7  * scale} fill="rgba(196,126,133,0.85)" />
    </svg>
  )
}

export default function BotanicalCursor() {
  const lotusRef  = useRef(null)
  const trailRef  = useRef(null)
  const mouse     = useRef({ x: -300, y: -300 })
  const trailPos  = useRef({ x: -300, y: -300 })
  const rotation  = useRef(0)
  const rafRef    = useRef(null)
  const pressed   = useRef(false)

  const isTouchRef = useRef(
    typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches
  )

  useEffect(() => {
    if (isTouchRef.current) return

    const onMove  = (e) => { mouse.current.x = e.clientX; mouse.current.y = e.clientY }
    const onDown  = () => { pressed.current = true }
    const onUp    = () => { pressed.current = false }

    function loop() {
      rotation.current += 0.006
      const deg  = rotation.current * (180 / Math.PI)
      const scale = pressed.current ? 0.75 : 1

      if (lotusRef.current) {
        lotusRef.current.style.left      = mouse.current.x + 'px'
        lotusRef.current.style.top       = mouse.current.y + 'px'
        lotusRef.current.style.transform = `translate(-50%,-50%) rotate(${deg}deg) scale(${scale})`
      }

      trailPos.current.x += (mouse.current.x - trailPos.current.x) * 0.09
      trailPos.current.y += (mouse.current.y - trailPos.current.y) * 0.09
      if (trailRef.current) {
        trailRef.current.style.left      = trailPos.current.x + 'px'
        trailRef.current.style.top       = trailPos.current.y + 'px'
        trailRef.current.style.transform = `translate(-50%,-50%) rotate(${-deg * 0.5}deg)`
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup',   onUp)
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup',   onUp)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  if (isTouchRef.current) return null

  return (
    <>
      {/* Main lotus — follows cursor exactly, slow clockwise rotation */}
      <div
        ref={lotusRef}
        aria-hidden="true"
        className="fixed z-[9999] pointer-events-none"
        style={{ top: -300, left: -300, transition: 'transform 0.08s ease' }}
      >
        <LotusPetals size={60} />
      </div>

      {/* Trailing lotus — lags behind, counter-rotates, faded */}
      {/* <div
        ref={trailRef}
        aria-hidden="true"
        className="fixed z-[9998] pointer-events-none"
        style={{ top: -300, left: -300 }}
      >
        <LotusPetals size={52} opacity={0.28} />
      </div> */}
    </>
  )
}
