export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer
      className="py-16 px-6 text-center"
      style={{ backgroundColor: '#1E2A18' }}
    >
      {/* Botanical divider top */}
      <div aria-hidden="true" className="flex items-center justify-center gap-3 mb-8">
        <div className="h-px w-20 bg-sage/25" />
        <span className="text-blush/50 text-base">✿</span>
        <div className="h-px w-8  bg-sage/20" />
        <span className="text-gold/40  text-xl">✦</span>
        <div className="h-px w-8  bg-sage/20" />
        <span className="text-blush/50 text-base">❀</span>
        <div className="h-px w-20 bg-sage/25" />
      </div>

      {/* Names */}
      <p
        className="font-script text-gold mb-2"
        style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
      >
        Snigdha &amp; Pramod
      </p>

      {/* Date */}
      <p className="font-sans text-ivory/35 text-xs tracking-[0.3em] uppercase mb-8">
        August 16, 2026
      </p>

      {/* Nav links */}
      <nav className="flex flex-wrap items-center justify-center gap-6 mb-8" aria-label="Footer navigation">
        {[
          ['Home',          '#home'],
          ['Invitation',    '#invitation'],
          ['Celebrations',  '#celebrations'],
          ['Gallery',       '#gallery'],
          ['RSVP',          '#rsvp'],
        ].map(([label, href]) => (
          <a
            key={label}
            href={href}
            className="font-sans text-[10px] tracking-[0.2em] uppercase text-ivory/35 hover:text-ivory/70 transition-colors duration-200"
          >
            {label}
          </a>
        ))}
      </nav>

      {/* Bottom line */}
      <div className="flex items-center justify-center gap-3 mb-6" aria-hidden="true">
        <div className="h-px w-12 bg-sage/20" />
        <span className="text-blush/30 text-sm">✦</span>
        <div className="h-px w-12 bg-sage/20" />
      </div>

      <p className="font-sans text-ivory/20 text-[10px] tracking-widest uppercase">
        © {year} Snigdha &amp; Pramod · Made with love
      </p>
    </footer>
  )
}
