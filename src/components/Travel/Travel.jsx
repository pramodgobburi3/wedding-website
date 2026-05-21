function AirportBlock({ name, distance }) {
  return (
    <div className="mb-5 last:mb-0">
      <p className="font-serif text-xl md:text-2xl text-bark leading-snug" style={{ fontWeight: 400 }}>
        {name}
      </p>
      <p className="font-sans text-xs tracking-wide uppercase text-bark/45 mt-1">{distance}</p>
    </div>
  )
}

export default function Travel() {
  return (
    <section
      id="travel"
      className="section-pad relative overflow-hidden"
      style={{ backgroundColor: '#EDE4D8' }}
    >
      <div className="max-w-xl mx-auto px-6 text-center relative z-10">
        <p className="font-script text-dustyRose text-2xl mb-2">Getting Here</p>
        <h2 className="font-serif text-4xl md:text-5xl text-bark mb-4" style={{ fontWeight: 300 }}>
          Travel
        </h2>

        <div className="flex items-center justify-center gap-4 mb-10">
          <div className="h-px w-16 bg-gold/50" />
          <span className="text-gold text-xl">✦</span>
          <div className="h-px w-16 bg-gold/50" />
        </div>

        <div className="mb-10">
          <p className="font-sans text-xs tracking-widest uppercase text-dustyRose mb-3">Closest Airport</p>
          <AirportBlock
            name="Ronald Reagan Washington National Airport (DCA)"
            distance="4 miles from the Waldorf"
          />
        </div>

        <div className="mb-10">
          <p className="font-sans text-xs tracking-widest uppercase text-dustyRose mb-3">Additional Airport Options</p>
          <AirportBlock
            name="Washington Dulles International Airport (IAD)"
            distance="25 miles from the Waldorf"
          />
          <AirportBlock
            name="Baltimore/Washington International Thurgood Marshall Airport (BWI)"
            distance="31 miles from the Waldorf"
          />
        </div>

        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-12 bg-gold/50" />
          <span className="text-gold">✦</span>
          <div className="h-px w-12 bg-gold/50" />
        </div>

        <p className="font-sans text-xs tracking-widest uppercase text-dustyRose mb-4">Please Note</p>
        <p className="font-serif italic text-bark/70 text-lg md:text-xl leading-relaxed">
          For our family and friends staying at the hotel, we'll be providing
          shuttle service to and from the hotel and our Sangeet and Reception
          venues.
        </p>
        <p className="font-serif italic text-bark/70 text-lg md:text-xl leading-relaxed mt-5">
          For our family and friends who are local to DC, we'll be providing
          valet service at the event venues.
        </p>

        <p className="font-serif italic text-bark/55 text-base md:text-lg leading-relaxed mt-8">
          As our wedding weekend approaches, additional travel information will be
          updated here.
        </p>
      </div>
    </section>
  )
}
