function mapUrl(query) {
  return `https://maps.google.com/?q=${encodeURIComponent(query)}`
}

function VenueBlock({ label, name, sublines = [], address, distance }) {
  return (
    <div className="mb-20 last:mb-0">
      <p className="font-sans text-xs tracking-widest uppercase text-dustyRose mb-2">{label}</p>
      <p className="font-serif text-2xl md:text-3xl text-bark leading-snug" style={{ fontWeight: 400 }}>
        {name}
      </p>
      {sublines.map((line) => (
        <p key={line} className="font-serif italic text-bark/60 text-base md:text-lg mt-1">
          {line}
        </p>
      ))}
      <p className="font-sans text-sm text-bark/60 mt-2">{address}</p>
      {distance && (
        <p className="font-sans text-xs tracking-wide uppercase text-bark/45 mt-1">{distance}</p>
      )}
      <a
        href={mapUrl(`${name}, ${address}`)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 mt-3 font-sans text-xs tracking-widest uppercase text-dustyRose hover:text-dustyRose-dark transition-colors duration-200"
      >
        <svg viewBox="0 0 16 16" className="w-3 h-3 flex-shrink-0" fill="currentColor" aria-hidden="true">
          <path d="M8 1a4.5 4.5 0 0 0-4.5 4.5C3.5 9 8 15 8 15s4.5-6 4.5-9.5A4.5 4.5 0 0 0 8 1zm0 6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
        </svg>
        Get Directions
      </a>
    </div>
  )
}

export default function Venues() {
  return (
    <section
      id="venues"
      className="section-pad relative overflow-hidden"
      style={{ backgroundColor: '#EDE4D8' }}
    >
      <div className="max-w-xl mx-auto px-6 text-center relative z-10">
        <p className="font-script text-dustyRose text-2xl mb-2">Where We'll Celebrate</p>
        <h2 className="font-serif text-4xl md:text-5xl text-bark mb-4" style={{ fontWeight: 300 }}>
          Venues
        </h2>

        <div className="flex items-center justify-center gap-4 mb-10">
          <div className="h-px w-16 bg-gold/50" />
          <span className="text-gold text-xl">✦</span>
          <div className="h-px w-16 bg-gold/50" />
        </div>

        <VenueBlock
          label="Hotel & Wedding Events"
          name="The Waldorf Astoria Washington DC"
          address="1100 Pennsylvania Ave NW, Washington, DC 20004"
        />

        <VenueBlock
          label="Sangeet"
          name="The Robert and Arlene Kogod Courtyard"
          sublines={['Inside the Smithsonian American Art Museum & the National Portrait Gallery']}
          address="8th Street Northwest & G St NW, Washington, DC 20001"
          distance="0.5 miles from the Waldorf"
        />

        <VenueBlock
          label="Reception"
          name="The Andrew W. Mellon Auditorium"
          address="1301 Constitution Ave. NW, Washington, DC 20240"
          distance="0.5 miles from the Waldorf"
        />
      </div>
    </section>
  )
}
