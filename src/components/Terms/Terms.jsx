export default function Terms() {
  return (
    <main
      className="min-h-screen py-20 px-6"
      style={{ backgroundColor: '#EDE4D8' }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <p className="font-script text-dustyRose text-2xl mb-2">Fine Print</p>
          <h1 className="font-serif text-4xl md:text-5xl text-bark" style={{ fontWeight: 300 }}>
            Terms &amp; Conditions
          </h1>
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="h-px w-16 bg-gold/50" />
            <span className="text-gold text-xl">✦</span>
            <div className="h-px w-16 bg-gold/50" />
          </div>
        </div>

        <div className="space-y-5 font-serif text-bark/80 leading-relaxed text-base md:text-lg">
          <p>
            These terms apply to SMS notifications sent in connection with the
            wedding of Snigdha &amp; Pramod. By providing your phone number and
            submitting the RSVP form on snigdhaandpramod.com, you agree to
            receive transactional SMS messages related to this event, including
            RSVP confirmations, event details, and day-of updates.
          </p>
          <p>
            Message and data rates may apply. Message frequency will vary. You
            may opt out at any time by reaching out to the hosts.
          </p>
        </div>

        <div className="mt-16 text-center">
          <a
            href="#home"
            onClick={e => { e.preventDefault(); window.location.hash = '' }}
            className="font-sans text-xs tracking-widest uppercase text-dustyRose hover:text-dustyRose-dark border border-dustyRose/40 hover:border-dustyRose rounded-full px-6 py-2 transition-colors duration-200"
          >
            ← Back home
          </a>
        </div>
      </div>
    </main>
  )
}
