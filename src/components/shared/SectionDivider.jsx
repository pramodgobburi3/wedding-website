// Botanical SVG dividers between sections.
// All organic shapes use cubic-bezier path curves — no ellipses.
// variant: "wisteria" | "roses" | "vine"

export default function SectionDivider({ variant = 'roses' }) {
  return (
    <div
      aria-hidden="true"
      className="flex items-center w-full overflow-hidden py-1"
      style={{ minHeight: 8 }}
    >
      {/* Left extending line */}
      <div className="flex-1 h-px bg-gradient-to-l from-gold/35 via-gold/20 to-transparent" />

      {/* Botanical centre piece */}
      {variant === 'wisteria' && <WisteriaGarland />}
      {variant === 'roses'    && <RoseBranch />}
      {variant === 'vine'     && <BotanicalSpray />}

      {/* Right extending line */}
      <div className="flex-1 h-px bg-gradient-to-r from-gold/35 via-gold/20 to-transparent" />
    </div>
  )
}

// ─── Shared building blocks ───────────────────────────────────────────────────

// A single leaf — proper bezier-curve almond shape with midrib + side veins.
// Centered at 0,0 pointing right. Natural size ~44 × 26.
function Leaf({ cx = 0, cy = 0, rotation = 0, scale = 1, dark = false }) {
  const fill = dark ? '#5C7A4E' : '#84A472'
  return (
    <g transform={`translate(${cx},${cy}) rotate(${rotation}) scale(${scale})`}>
      {/* Outline — proper tapered-tip almond, NOT an ellipse */}
      <path
        d="M -22,0
           C -17,-11  0,-14  12,-9
           C  20, -5  22, 0  22, 0
           C  20,  5  12, 9   0, 9
           C   0, 14 -17, 11 -22, 0 Z"
        fill={fill}
        opacity="0.78"
      />
      {/* Midrib */}
      <line x1="-20" y1="0" x2="20" y2="0"
        stroke="#3A5030" strokeWidth="0.65" opacity="0.38" />
      {/* Upper side veins */}
      <path d="M -5,-4 Q 4,-9 13,-8"
        stroke="#3A5030" strokeWidth="0.5" fill="none" opacity="0.30" />
      <path d="M  5,-3 Q 13,-6.5 18,-5"
        stroke="#3A5030" strokeWidth="0.45" fill="none" opacity="0.25" />
      {/* Lower side veins */}
      <path d="M -5, 4 Q 4, 9 13, 8"
        stroke="#3A5030" strokeWidth="0.5" fill="none" opacity="0.30" />
      <path d="M  5, 3 Q 13, 6.5 18, 5"
        stroke="#3A5030" strokeWidth="0.45" fill="none" opacity="0.25" />
    </g>
  )
}

// A rose bloom viewed from above — layered petal paths, NOT rotated ellipses.
// Centered at 0,0. Natural radius ~22.
function Rose({ cx = 0, cy = 0, scale = 1 }) {
  return (
    <g transform={`translate(${cx},${cy}) scale(${scale})`}>
      {/* 5 outer petals — organic cupped petal shape */}
      {[0, 72, 144, 216, 288].map(deg => (
        <path
          key={`o${deg}`}
          d="M 0,6
             C -7, 3 -10,-8  -4,-17
             C -2,-21  0,-22  0,-20
             C  0,-22  2,-21  4,-17
             C 10,-8   7, 3   0, 6 Z"
          fill="#E8B4B8"
          opacity="0.82"
          transform={`rotate(${deg})`}
        />
      ))}
      {/* 5 inner petals — slightly smaller, offset 36° */}
      {[36, 108, 180, 252, 324].map(deg => (
        <path
          key={`i${deg}`}
          d="M 0,4
             C -4, 2  -6,-5  -2,-13
             C -1,-16  0,-17  0,-15
             C  0,-17  1,-16  2,-13
             C  6,-5   4, 2   0, 4 Z"
          fill="#C47E85"
          opacity="0.85"
          transform={`rotate(${deg})`}
        />
      ))}
      {/* Stamen ring */}
      {[0,45,90,135,180,225,270,315].map(deg => (
        <circle
          key={`s${deg}`}
          cx={Math.cos(deg * Math.PI / 180) * 4}
          cy={Math.sin(deg * Math.PI / 180) * 4}
          r="0.7" fill="#C9A87C" opacity="0.72"
        />
      ))}
      {/* Centre boss */}
      <circle cx="0" cy="0" r="5"   fill="#C9A87C" opacity="0.92" />
      <circle cx="0" cy="0" r="2.5" fill="#FFF5E8" opacity="0.88" />
    </g>
  )
}

// A closed rose bud — sepal + furled petals.
function Rosebud({ cx = 0, cy = 0, scale = 1 }) {
  return (
    <g transform={`translate(${cx},${cy}) scale(${scale})`}>
      {/* Sepal (green outer wrap) */}
      <path
        d="M 0,12
           C -5, 6  -8,-2  -4,-10
           C -2,-14  0,-15  0,-13
           C  0,-15  2,-14  4,-10
           C  8,-2   5, 6   0, 12 Z"
        fill="#5C7A4E" opacity="0.70"
      />
      {/* Outer petals barely unfolding */}
      <path
        d="M 0,10
           C -6, 4  -8,-4  -3,-11
           C -1,-14  0,-15  0,-13
           C  0,-15  1,-14  3,-11
           C  8,-4   6, 4   0, 10 Z"
        fill="#E8B4B8"
      />
      {/* Tight inner petal roll */}
      <path
        d="M 0,7 C -3,2 -4,-4 0,-9 C 4,-4 3,2 0,7 Z"
        fill="#C47E85" opacity="0.88"
      />
    </g>
  )
}

// A single wisteria floret — proper banner / wing / keel butterfly structure.
// NOT an ellipse. Centered at 0,0. Natural size ~12 × 14.
function WisteriaFloret({ cx = 0, cy = 0, colorIdx = 0 }) {
  const banners = ['#D9A8AC', '#E8B4B8', '#C47E85', '#C9A87C', '#D9A8AC']
  const c = banners[colorIdx % banners.length]
  return (
    <g transform={`translate(${cx},${cy})`}>
      {/* Banner — broad rounded upper petal */}
      <path
        d="M 0,-6
           C -4,-9.5  -6.5,-5  -5.5,-1.5
           C -5, 1     5, 1     5.5,-1.5
           C  6.5,-5   4,-9.5   0,-6 Z"
        fill={c} opacity="0.90"
      />
      {/* Left wing petal */}
      <path
        d="M -5.5,-1.5
           C -9,-3  -9, 4  -5.5, 7.5
           C -3, 9.5  0, 8.5  0, 5.5 Z"
        fill={c} opacity="0.72"
      />
      {/* Right wing petal */}
      <path
        d="M  5.5,-1.5
           C  9,-3   9, 4   5.5, 7.5
           C  3, 9.5  0, 8.5  0, 5.5 Z"
        fill={c} opacity="0.72"
      />
      {/* Keel — two joined lower petals forming a beak */}
      <path
        d="M -2.5,5.5
           C -2.5, 8.5  -1, 11  0, 12
           C  1,  11    2.5, 8.5  2.5, 5.5
           C  1.5, 7   -1.5, 7   -2.5, 5.5 Z"
        fill="#9A5A60" opacity="0.62"
      />
    </g>
  )
}

// A pendant wisteria raceme — florets arranged in a tapered cone.
function WisteriaRaceme({ cx = 0, cy = 0, scale = 1 }) {
  // Rows taper from widest at top to single floret at bottom
  const rows = [
    { count: 4, spread: 10.5, y: 0  },
    { count: 4, spread: 10.5, y: 13 },
    { count: 3, spread:  7,   y: 26 },
    { count: 2, spread:  3.5, y: 38 },
    { count: 2, spread:  3.5, y: 48 },
  ]

  let ci = 0
  const florets = []
  rows.forEach(row => {
    const xs =
      row.count === 1
        ? [0]
        : Array.from({ length: row.count }, (_, i) =>
            -row.spread + (i * 2 * row.spread) / (row.count - 1)
          )
    xs.forEach(x => florets.push({ x, y: row.y, ci: ci++ }))
  })

  return (
    <g transform={`translate(${cx},${cy}) scale(${scale})`}>
      {/* Peduncle */}
      <line x1="0" y1="-2" x2="0" y2="52"
        stroke="#84A472" strokeWidth="0.8" opacity="0.42" />
      {florets.map((f, i) => (
        <g key={i}>
          {/* Pedicel */}
          <line x1="0" y1={f.y} x2={f.x} y2={f.y + 2}
            stroke="#84A472" strokeWidth="0.4" opacity="0.30" />
          <WisteriaFloret cx={f.x} cy={f.y + 7} colorIdx={i} />
        </g>
      ))}
    </g>
  )
}

// ─── Divider variants ─────────────────────────────────────────────────────────

// Three pendant wisteria clusters with compound leaves.
function WisteriaGarland() {
  return (
    <svg
      viewBox="0 0 300 100"
      className="w-64 sm:w-80 md:w-96 flex-shrink-0"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Horizontal connecting stem — gently arched */}
      <path
        d="M 30,18 C 80,12 120,22 150,18 C 180,14 220,22 270,18"
        stroke="#84A472" strokeWidth="1.3" opacity="0.55"
      />
      {/* Small attachment knots where clusters join the stem */}
      {[85, 150, 215].map(x => (
        <circle key={x} cx={x} cy={18} r="1.8" fill="#5C7A4E" opacity="0.45" />
      ))}
      {/* Wisteria racemes */}
      <WisteriaRaceme cx={85}  cy={20} scale={0.78} />
      <WisteriaRaceme cx={150} cy={18} scale={0.88} />   {/* centre = longest */}
      <WisteriaRaceme cx={215} cy={20} scale={0.78} />
      {/* Leaves flanking the stem — proper bezier leaves */}
      <Leaf cx={44}  cy={17} rotation={-20} scale={0.70} />
      <Leaf cx={256} cy={17} rotation={160} scale={0.70} dark />
      {/* Tendrils at stem ends */}
      <path d="M 30,18 C 20,14 15,10 18,5" stroke="#84A472" strokeWidth="0.8" opacity="0.35" fill="none"/>
      <path d="M 270,18 C 280,14 285,10 282,5" stroke="#84A472" strokeWidth="0.8" opacity="0.35" fill="none"/>
    </svg>
  )
}

// A rose branch — three roses, two buds, and eight proper leaves.
function RoseBranch() {
  return (
    <svg
      viewBox="0 0 400 80"
      className="w-72 sm:w-80 md:w-[400px] flex-shrink-0"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main stem */}
      <path
        d="M 0,56 C 70,50 110,62 155,56 C 200,50 245,62 290,56 C 330,50 370,58 400,54"
        stroke="#5C7A4E" strokeWidth="1.4" opacity="0.55"
      />
      {/* Rose blooms */}
      <Rose cx={200} cy={37} scale={1.00} />   {/* centre, largest */}
      <Rose cx={ 88} cy={42} scale={0.72} />   {/* left */}
      <Rose cx={312} cy={42} scale={0.72} />   {/* right */}
      {/* Buds at ends */}
      <Rosebud cx={ 22} cy={46} scale={0.80} />
      <Rosebud cx={378} cy={46} scale={0.80} />
      {/* Short connection stems from branch to roses */}
      <line x1="200" y1="56" x2="200" y2="59" stroke="#5C7A4E" strokeWidth="1.1" opacity="0.45"/>
      <line x1=" 88" y1="56" x2=" 88" y2="58" stroke="#5C7A4E" strokeWidth="1.0" opacity="0.40"/>
      <line x1="312" y1="56" x2="312" y2="58" stroke="#5C7A4E" strokeWidth="1.0" opacity="0.40"/>
      {/* Leaves — 8 total, alternating along the stem */}
      <Leaf cx={145} cy={50} rotation={-30} scale={0.72} />
      <Leaf cx={160} cy={52} rotation={ 25} scale={0.68} dark />
      <Leaf cx={240} cy={50} rotation={ 28} scale={0.72} />
      <Leaf cx={255} cy={52} rotation={-22} scale={0.68} dark />
      <Leaf cx={ 54} cy={52} rotation={-28} scale={0.62} />
      <Leaf cx={346} cy={52} rotation={ 28} scale={0.62} dark />
      <Leaf cx={115} cy={51} rotation={ 22} scale={0.60} />
      <Leaf cx={285} cy={51} rotation={-22} scale={0.60} dark />
    </svg>
  )
}

// Botanical spray — a sinuous branch with proper leaves and small blossoms.
function BotanicalSpray() {
  // Leaf positions along the undulating branch
  const leafData = [
    { cx:  40, cy: 30, rot: -40, scale: 0.64, dark: false },
    { cx:  80, cy: 38, rot:  38, scale: 0.62, dark: true  },
    { cx: 120, cy: 25, rot: -32, scale: 0.66, dark: false },
    { cx: 160, cy: 36, rot:  35, scale: 0.64, dark: true  },
    { cx: 200, cy: 26, rot: -30, scale: 0.70, dark: false },
    { cx: 240, cy: 36, rot:  32, scale: 0.64, dark: true  },
    { cx: 280, cy: 25, rot: -35, scale: 0.64, dark: false },
    { cx: 320, cy: 36, rot:  38, scale: 0.62, dark: true  },
  ]

  // Small 4-petal blossom centers between the leaves
  const blossomXs = [60, 140, 220, 300]
  const blossomY = (x) => 32 + Math.sin((x / 360) * Math.PI * 4) * 6

  return (
    <svg
      viewBox="0 0 360 68"
      className="w-64 sm:w-80 md:w-[360px] flex-shrink-0"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Sinuous main branch */}
      <path
        d="M 0,32
           C 45,18  90,46 135,32
           C 180,18 225,46 270,32
           C 315,18 340,38 360,32"
        stroke="#7A8C6E" strokeWidth="1.5" opacity="0.55"
      />
      {/* Leaves — proper bezier shapes, no ellipses */}
      {leafData.map((l, i) => (
        <Leaf key={i} cx={l.cx} cy={l.cy} rotation={l.rot} scale={l.scale} dark={l.dark} />
      ))}
      {/* 4-petal blossoms at branch peaks */}
      {blossomXs.map((x, i) => {
        const y = blossomY(x)
        return (
          <g key={i} transform={`translate(${x},${y})`}>
            {[0, 90, 180, 270].map(deg => (
              <path
                key={deg}
                d="M 0,0 C -2.5,-1.5 -3,-5 0,-7 C 3,-5 2.5,-1.5 0,0 Z"
                fill={i % 2 === 0 ? '#E8B4B8' : '#D9A8AC'}
                opacity="0.80"
                transform={`rotate(${deg})`}
              />
            ))}
            <circle cx="0" cy="0" r="2" fill="#C9A87C" opacity="0.88" />
          </g>
        )
      })}
      {/* Tendrils at the ends */}
      <path d="M 0,32 C -6,28 -8,22 -4,18" stroke="#84A472" strokeWidth="0.8" opacity="0.35" />
      <path d="M 360,32 C 366,28 368,22 364,18" stroke="#84A472" strokeWidth="0.8" opacity="0.35" />
    </svg>
  )
}
