import { useState } from 'react'
import { motion } from 'framer-motion'

// ─── Hindu ceremony-specific icons ───────────────────────────────────────────
// Each is a carefully crafted SVG — no rotated ellipses.

// Mehendi — geometric henna mandala (concentric rings, petal fills)
function IconMehendi({ color }) {
  return (
    <svg viewBox="0 0 60 60" className="w-full h-full" fill="none">
      {/* Outer ring: 16 petals */}
      {Array.from({ length: 16 }, (_, i) => (
        <path
          key={i}
          d="M 30,30 C 27,22 27,16 30,12 C 33,16 33,22 30,30 Z"
          fill={color} opacity="0.45"
          transform={`rotate(${i * 22.5} 30 30)`}
        />
      ))}
      <circle cx="30" cy="30" r="18" fill="none" stroke={color} strokeWidth="0.7" opacity="0.55" />

      {/* Dots on outer ring */}
      {Array.from({ length: 8 }, (_, i) => (
        <circle
          key={i}
          cx={30 + Math.cos((i * 45 + 22.5) * Math.PI / 180) * 18}
          cy={30 + Math.sin((i * 45 + 22.5) * Math.PI / 180) * 18}
          r="1.4" fill={color} opacity="0.55"
        />
      ))}

      {/* Middle ring: 8 petals */}
      {Array.from({ length: 8 }, (_, i) => (
        <path
          key={i}
          d="M 30,30 C 27.5,24.5 27.5,20 30,17 C 32.5,20 32.5,24.5 30,30 Z"
          fill={color} opacity="0.68"
          transform={`rotate(${i * 45} 30 30)`}
        />
      ))}
      <circle cx="30" cy="30" r="11" fill="none" stroke={color} strokeWidth="0.6" opacity="0.45" />

      {/* Inner ring: 6 petals */}
      {Array.from({ length: 6 }, (_, i) => (
        <path
          key={i}
          d="M 30,30 C 28.5,27 28.5,24 30,22 C 31.5,24 31.5,27 30,30 Z"
          fill={color} opacity="0.82"
          transform={`rotate(${i * 60} 30 30)`}
        />
      ))}

      {/* Centre */}
      <circle cx="30" cy="30" r="5" fill={color} opacity="0.90" />
      <circle cx="30" cy="30" r="2.5" fill="white" opacity="0.80" />
    </svg>
  )
}

// Haldi — kalash (sacred ceremonial vessel with mango leaves and coconut)
function IconHaldi({ color }) {
  return (
    <svg viewBox="0 0 60 60" className="w-full h-full" fill="none">
      {/* Mango leaves fanning from neck (5) */}
      {[-36, -18, 0, 18, 36].map((deg, i) => (
        <path
          key={i}
          d="M 30,16 C 27,10 26,5 30,2 C 34,5 33,10 30,16 Z"
          fill={i === 2 ? '#5C7A4E' : '#84A472'}
          opacity="0.82"
          transform={`rotate(${deg} 30 16)`}
        />
      ))}
      {/* Coconut on top */}
      <path d="M 26,4 C 26,1 34,1 34,4 C 34,7 26,7 26,4 Z" fill={color} opacity="0.72" />

      {/* Neck */}
      <path d="M 23,16 L 37,16 L 36,22 L 24,22 Z" fill={color} opacity="0.88" />

      {/* Pot body — round vessel shape, proper bezier, no ellipse */}
      <path
        d="M 24,22
           C 14,24 10,32 12,40
           C 14,47 22,52 30,52
           C 38,52 46,47 48,40
           C 50,32 46,24 36,22 Z"
        fill={color} opacity="0.82"
      />

      {/* Decorative bands on pot */}
      <path d="M 13,34 Q 30,31 47,34" stroke="white" strokeWidth="0.8" fill="none" opacity="0.40" />
      <path d="M 12,40 Q 30,37 48,40" stroke="white" strokeWidth="0.7" fill="none" opacity="0.30" />

      {/* Small dot pattern on body */}
      {[[-6, -4], [0, -5], [6, -4], [-4, 4], [4, 4]].map(([dx, dy], i) => (
        <circle key={i} cx={30 + dx} cy={38 + dy} r="1.2" fill="white" opacity="0.35" />
      ))}

      {/* Base rim */}
      <path d="M 18,52 Q 30,56 42,52 Q 40,58 20,58 Z" fill={color} opacity="0.65" />
    </svg>
  )
}

// Sangeet — diya (traditional clay oil lamp) with animated flame suggestion
function IconSangeet({ color }) {
  return (
    <svg viewBox="0 0 60 60" className="w-full h-full" fill="none">
      {/* Flame — organic bezier, outer */}
      <path
        d="M 38,26
           C 36,20 34,14 38,8
           C 40,4 44,6 44,10
           C 46,6 50,6 50,12
           C 52,18 48,24 44,26 Z"
        fill={color} opacity="0.82"
      />
      {/* Flame inner core */}
      <path
        d="M 41,26
           C 40,22 39,16 42,11
           C 44,8 46,10 44,14
           C 47,12 49,14 48,18
           C 47,22 45,25 41,26 Z"
        fill="white" opacity="0.55"
      />
      {/* Glow at flame base */}
      <path
        d="M 36,28 Q 44,24 52,28 Q 50,32 38,32 Z"
        fill={color} opacity="0.28"
      />

      {/* Diya body — traditional teardrop side profile */}
      <path
        d="M 8,42
           C 8,36 11,32 16,30
           L 46,30
           C 52,32 54,36 52,42
           C 50,46 42,48 30,48
           C 18,48 10,46 8,42 Z"
        fill={color} opacity="0.84"
      />
      {/* Pointed spout (the wick end) pointing right */}
      <path
        d="M 46,32 C 50,30 56,31 58,35 C 56,38 50,36 46,34 Z"
        fill={color} opacity="0.90"
      />
      {/* Oil surface line */}
      <path d="M 14,38 Q 30,36 46,38" stroke="white" strokeWidth="0.9" fill="none" opacity="0.38" />
      {/* Wick dot */}
      <circle cx="56" cy="35" r="1.5" fill="white" opacity="0.60" />

      {/* Decorative dots on diya side */}
      {[-10, 0, 10].map((dx, i) => (
        <circle key={i} cx={30 + dx} cy={44} r="1.3" fill="white" opacity="0.35" />
      ))}
    </svg>
  )
}

// Wedding Ceremony — havan kund (sacred fire pit) with flames rising
function IconCeremony({ color }) {
  return (
    <svg viewBox="0 0 60 60" className="w-full h-full" fill="none">
      {/* Flames rising from kund — 3 flames, organic bezier shapes */}
      {/* Left flame */}
      <path
        d="M 22,28 C 20,22 18,16 22,10 C 24,6 26,9 25,13 C 27,9 30,7 30,12 C 28,18 26,24 22,28 Z"
        fill={color} opacity="0.65"
      />
      {/* Centre flame (tallest) */}
      <path
        d="M 30,28 C 27,20 25,12 30,5 C 35,12 33,20 30,28 Z"
        fill={color} opacity="0.88"
      />
      {/* Centre flame highlight */}
      <path
        d="M 30,28 C 28.5,22 28,16 30,10 C 32,16 31.5,22 30,28 Z"
        fill="white" opacity="0.45"
      />
      {/* Right flame */}
      <path
        d="M 38,28 C 34,24 32,18 35,13 C 35,9 38,6 38,10 C 40,7 42,9 40,14 C 42,18 42,24 38,28 Z"
        fill={color} opacity="0.65"
      />

      {/* Havan kund — 3-tiered stepped base (top view squished to side view) */}
      {/* Tier 1 (top, smallest opening) */}
      <path d="M 18,28 L 42,28 L 44,34 L 16,34 Z" fill={color} opacity="0.78" />
      {/* Tier 2 (middle) */}
      <path d="M 14,34 L 46,34 L 48,40 L 12,40 Z" fill={color} opacity="0.85" />
      {/* Tier 3 (base, widest) */}
      <path d="M 10,40 L 50,40 L 52,48 L 8,48 Z" fill={color} opacity="0.90" />

      {/* Decorative lines on each tier */}
      <line x1="18" y1="31" x2="42" y2="31" stroke="white" strokeWidth="0.6" opacity="0.35" />
      <line x1="14" y1="37" x2="46" y2="37" stroke="white" strokeWidth="0.6" opacity="0.30" />

      {/* Small marigold offerings on either side of kund top */}
      <circle cx="14" cy="28" r="3" fill="#C9A87C" opacity="0.70" />
      <circle cx="46" cy="28" r="3" fill="#C9A87C" opacity="0.70" />
    </svg>
  )
}

// Reception — blooming lotus (sacred in Hindu tradition)
function IconReception({ color }) {
  return (
    <svg viewBox="0 0 60 60" className="w-full h-full" fill="none">
      {/* Outer petals (8) — long pointed bezier petals */}
      {Array.from({ length: 8 }, (_, i) => (
        <path
          key={i}
          d="M 30,30 C 26,22 26,14 30,10 C 34,14 34,22 30,30 Z"
          fill={color} opacity="0.50"
          transform={`rotate(${i * 45} 30 30)`}
        />
      ))}
      {/* Inner petals (6) — slightly shorter, offset 22.5° */}
      {Array.from({ length: 6 }, (_, i) => (
        <path
          key={i}
          d="M 30,30 C 27,24 27,19 30,16 C 33,19 33,24 30,30 Z"
          fill={color} opacity="0.80"
          transform={`rotate(${i * 60 + 22.5} 30 30)`}
        />
      ))}
      {/* Centre boss */}
      <circle cx="30" cy="30" r="6.5" fill={color} opacity="0.95" />
      <circle cx="30" cy="30" r="3.5" fill="white" opacity="0.80" />
      {/* Stamen dots on centre */}
      {Array.from({ length: 6 }, (_, i) => (
        <circle
          key={i}
          cx={30 + Math.cos(i * 60 * Math.PI / 180) * 2.5}
          cy={30 + Math.sin(i * 60 * Math.PI / 180) * 2.5}
          r="0.8" fill={color} opacity="0.60"
        />
      ))}
      {/* Water reflection — short curved line below */}
      <path d="M 20,50 Q 30,47 40,50" stroke={color} strokeWidth="0.8" fill="none" opacity="0.30" />
      {/* Stem */}
      <line x1="30" y1="48" x2="30" y2="52" stroke="#5C7A4E" strokeWidth="1.2" opacity="0.55" />
    </svg>
  )
}

// Baraat — dhol (double-headed ceremonial drum), the sound of the procession
function IconBaraat({ color }) {
  return (
    <svg viewBox="0 0 60 60" className="w-full h-full" fill="none">
      {/* Drum body — horizontal cylinder */}
      <path
        d="M 12,24 C 12,18 20,14 30,14 C 40,14 48,18 48,24 L 48,38 C 48,44 40,48 30,48 C 20,48 12,44 12,38 Z"
        fill={color} opacity="0.82"
      />
      {/* Left drum head */}
      <ellipse cx="12" cy="31" rx="5" ry="8" fill={color} opacity="0.90" />
      <ellipse cx="12" cy="31" rx="3" ry="6" fill="white" opacity="0.22" />
      {/* Right drum head */}
      <ellipse cx="48" cy="31" rx="5" ry="8" fill={color} opacity="0.90" />
      <ellipse cx="48" cy="31" rx="3" ry="6" fill="white" opacity="0.22" />
      {/* Decorative bands on body */}
      <line x1="12" y1="25" x2="48" y2="25" stroke="white" strokeWidth="0.8" opacity="0.30" />
      <line x1="12" y1="38" x2="48" y2="38" stroke="white" strokeWidth="0.8" opacity="0.30" />
      {/* Lacing ropes */}
      {[18,24,30,36,42].map((x, i) => (
        <line key={i} x1={x} y1="14" x2={x} y2="48" stroke="white" strokeWidth="0.6" opacity="0.18" />
      ))}
      {/* Dot motifs */}
      {[-8,0,8].map((dx, i) => (
        <circle key={i} cx={30 + dx} cy={31} r="1.4" fill="white" opacity="0.35" />
      ))}
      {/* Drumstick top-right */}
      <line x1="46" y1="14" x2="56" y2="6" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.70" />
      <circle cx="56" cy="6" r="3" fill={color} opacity="0.80" />
    </svg>
  )
}

// Dispatch to the correct icon by event id
function HinduCeremonyIcon({ id, color }) {
  if (id === 'mehendi')  return <IconMehendi  color={color} />
  if (id === 'haldi')    return <IconHaldi    color={color} />
  if (id === 'sangeet')  return <IconSangeet  color={color} />
  if (id === 'baraat')   return <IconBaraat   color={color} />
  if (id === 'ceremony') return <IconCeremony color={color} />
  return                        <IconReception color={color} />
}

// ─── Paisley corner ornament ──────────────────────────────────────────────────
// The boteh/paisley is the iconic Indian teardrop-with-curl motif.
function PaisleyCorner({ color, flip = false }) {
  return (
    <svg
      aria-hidden="true"
      className="absolute top-3 right-3 w-9 h-9 opacity-30"
      viewBox="0 0 36 40"
      fill={color}
      style={{ transform: flip ? 'scaleX(-1)' : 'none' }}
    >
      {/* Main paisley body — teardrop with curling tip */}
      <path
        d="M 18,36
           C 10,32  6,22  8,14
           C 10, 6 16, 2 22, 4
           C 28, 6 30,14 26,20
           C 24,24 20,26 18,36 Z"
        opacity="0.85"
      />
      {/* Inner paisley detail — lighter fill */}
      <path
        d="M 18,30
           C 13,26 11,18 13,12
           C 15, 8 19, 6 22, 8
           C 25,10 25,16 22,20
           C 20,23 18,26 18,30 Z"
        fill="white" opacity="0.28"
      />
      {/* Curl at the tip */}
      <path
        d="M 22,4 C 28,2 32,4 30,8 C 28,10 24,8 22,4 Z"
        opacity="0.65"
      />
      {/* Small interior dot */}
      <circle cx="20" cy="14" r="2.5" fill="white" opacity="0.38" />
      {/* Tiny petal marks */}
      <path d="M 16,20 Q 18,17 20,20" stroke="white" strokeWidth="0.7" fill="none" opacity="0.35" />
    </svg>
  )
}

// ─── Event card ───────────────────────────────────────────────────────────────

export default function EventCard({ id, name, tagline, date, time, venue, dresscode, accent, icon, mapUrl, index }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <motion.div
      className="w-full max-w-[320px] sm:max-w-none mx-auto"
      style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.32)) drop-shadow(0 1px 4px rgba(0,0,0,0.22))' }}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.12, ease: 'easeOut' }}
    >
      <div
        className="relative w-full"
        style={{ perspective: '1200px', height: 340, cursor: 'none' }}
        onPointerEnter={e => { if (e.pointerType === 'mouse') setFlipped(true) }}
        onPointerLeave={e => { if (e.pointerType === 'mouse') setFlipped(false) }}
        onClick={() => setFlipped(f => !f)}
        role="button"
        tabIndex={0}
        aria-label={`${name} — tap to see details`}
        onKeyDown={e => e.key === 'Enter' && setFlipped(f => !f)}
      >
        <div
          className="absolute inset-0 preserve-3d"
          style={{
            transition: 'transform 0.65s cubic-bezier(0.4,0,0.2,1)',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* ── Front ── */}
          <div
            className="absolute inset-0 backface-hidden rounded-sm overflow-hidden flex flex-col items-center justify-center p-6 text-center"
            style={{
              backgroundColor: '#F8F3EC',
              borderTop: `3px solid ${accent}`,
              border: `1px solid ${accent}55`,
            }}
          >
            {/* Paisley corner top-right */}
            <PaisleyCorner color={accent} />
            {/* Paisley corner bottom-left (flipped) */}
            <svg
              aria-hidden="true"
              className="absolute bottom-3 left-3 w-8 h-8 opacity-20"
              viewBox="0 0 36 40"
              fill={accent}
              style={{ transform: 'rotate(180deg)' }}
            >
              <path d="M 18,36 C 10,32 6,22 8,14 C 10,6 16,2 22,4 C 28,6 30,14 26,20 C 24,24 20,26 18,36 Z" />
              <path d="M 22,4 C 28,2 32,4 30,8 C 28,10 24,8 22,4 Z" />
            </svg>

            {/* Event icon */}
            <div className="w-24 h-24 mb-4 flex items-center justify-center">
              {icon
                ? <img src={icon} alt={name} className="w-full h-full object-contain" style={{ mixBlendMode: 'multiply', opacity: 0.62 }} />
                : <HinduCeremonyIcon id={id} color={accent} />
              }
            </div>

            <h3 className="font-serif text-2xl text-bark mb-1" style={{ fontWeight: 400 }}>
              {name}
            </h3>
            <p className="font-script text-base mb-4" style={{ color: accent }}>
              {tagline}
            </p>
            <p className="font-sans text-[10px] tracking-widest uppercase text-bark/30 absolute bottom-4 pointer-events-none select-none">
              <span className="hidden md:inline">Hover</span>
              <span className="inline md:hidden">Tap</span>
              {' '}for details
            </p>
          </div>

          {/* ── Back ── */}
          <div
            className="absolute inset-0 backface-hidden rotate-y-180 rounded-sm overflow-hidden flex flex-col justify-center p-7 bg-ivory"
            style={{ border: `1px solid ${accent}28` }}
          >
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: accent, opacity: 0.55 }} />
            {/* Small Om on back */}
            <span className="absolute top-3 right-4 font-serif text-lg opacity-20" style={{ color: accent }} aria-hidden="true">ॐ</span>

            <h3 className="font-serif text-xl text-bark mb-4" style={{ fontWeight: 400 }}>{name}</h3>
            <div className="space-y-3">
              <DetailRow label="Date"   value={date}      accent={accent} />
              <DetailRow label="Time"   value={time}      accent={accent} />
              <DetailRow label="Venue"  value={venue}     accent={accent} />
              <DetailRow label="Attire" value={dresscode} accent={accent} />
            </div>
            {mapUrl && (
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 mt-5 font-sans text-[10px] tracking-widest uppercase transition-opacity duration-200 hover:opacity-70"
                style={{ color: accent, cursor: 'pointer' }}
              >
                <svg viewBox="0 0 16 16" className="w-3 h-3 flex-shrink-0" fill="currentColor" aria-hidden="true">
                  <path d="M8 1a4.5 4.5 0 0 0-4.5 4.5C3.5 9 8 15 8 15s4.5-6 4.5-9.5A4.5 4.5 0 0 0 8 1zm0 6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
                </svg>
                Get Directions
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function DetailRow({ label, value, accent }) {
  return (
    <div className="flex gap-3 text-sm">
      <span
        className="font-sans text-[10px] tracking-widest uppercase mt-0.5 flex-shrink-0 w-12"
        style={{ color: accent }}
      >
        {label}
      </span>
      <span className="font-serif italic text-bark/70 leading-snug">{value}</span>
    </div>
  )
}
