export default function Privacy() {
  return (
    <main
      className="min-h-screen py-20 px-6"
      style={{ backgroundColor: '#EDE4D8' }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <p className="font-script text-dustyRose text-2xl mb-2">Fine Print</p>
          <h1 className="font-serif text-4xl md:text-5xl text-bark" style={{ fontWeight: 300 }}>
            Privacy Policy
          </h1>
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="h-px w-16 bg-gold/50" />
            <span className="text-gold text-xl">✦</span>
            <div className="h-px w-16 bg-gold/50" />
          </div>
        </div>

        <div className="space-y-5 font-serif text-bark/80 leading-relaxed text-base md:text-lg">
          <p>
            This privacy policy applies to information collected through
            snigdhaandpramod.com. We collect your name, phone number, and RSVP
            details solely for the purpose of coordinating attendance at our
            wedding event.
          </p>
          <p>
            We do not sell, share, or distribute your personal information to
            third parties. Your phone number will only be used to send
            event-related SMS notifications. All data is stored securely and
            will not be used beyond the scope of this event.
          </p>
          <p>
            For questions or to request removal of your information, please
            contact us.
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
