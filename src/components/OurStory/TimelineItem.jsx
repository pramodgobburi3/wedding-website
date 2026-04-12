// A single milestone in the Our Story timeline.
// side: "left" | "right" determines which side the card appears on desktop.

export default function TimelineItem({ year, title, body, side, icon, index }) {
  const isLeft = side === 'left'

  return (
    <div
      className={`timeline-item relative flex items-start gap-8 md:gap-0 mb-16 md:mb-24
        ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}
      `}
      data-index={index}
    >
      {/* Card — takes up ~40% on each side */}
      <div
        className={`relative flex-1 md:max-w-[44%]
          ${isLeft ? 'md:pr-16' : 'md:pl-16'}
        `}
      >
        <div className="bg-ivory rounded-sm shadow-sm border border-sage-mist/60 p-6 md:p-8 relative overflow-hidden group">
          {/* Corner botanical ornament */}
          <svg
            aria-hidden="true"
            className="absolute top-3 right-3 w-10 h-10 text-blush/30 group-hover:text-blush/50 transition-colors duration-500"
            viewBox="0 0 40 40"
            fill="currentColor"
          >
            <ellipse cx="30" cy="10" rx="6" ry="11" transform="rotate(-30 30 10)" />
            <ellipse cx="22" cy="8"  rx="5" ry="9"  transform="rotate(-55 22 8)"  opacity="0.8" />
            <ellipse cx="35" cy="18" rx="4" ry="7"  transform="rotate(-10 35 18)" opacity="0.7" />
            <circle  cx="26" cy="14" r="3" />
          </svg>

          <p className="font-script text-dustyRose text-xl mb-1">{year}</p>
          <h3 className="font-serif text-2xl text-bark mb-3">{title}</h3>
          <div className="h-px w-10 bg-gold/50 mb-4" />
          <p className="font-serif italic text-bark/65 leading-relaxed text-base">{body}</p>
        </div>
      </div>

      {/* Center dot on the line — hidden on mobile, shown on md+ */}
      <div className="hidden md:flex absolute left-1/2 top-8 -translate-x-1/2 flex-col items-center z-10">
        <div className="w-4 h-4 rounded-full bg-blush border-2 border-sage shadow-sm" />
        <span className="mt-2 font-script text-gold text-sm">{icon}</span>
      </div>

      {/* Spacer for the other side */}
      <div className="hidden md:block flex-1 md:max-w-[44%]" />

      {/* Mobile: left dot + year pill */}
      <div className="flex md:hidden flex-col items-center gap-2 mt-1 flex-shrink-0">
        <div className="w-3 h-3 rounded-full bg-blush border-2 border-sage" />
        <div className="w-px flex-1 bg-sage-mist min-h-[3rem]" />
      </div>
    </div>
  )
}
