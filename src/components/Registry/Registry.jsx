export default function Registry() {
  return (
    <section
      id="registry"
      className="section-pad relative overflow-hidden"
      style={{ backgroundColor: '#EDE4D8' }}
    >
      <div className="max-w-xl mx-auto px-6 text-center relative z-10">
        {/* <p className="font-script text-dustyRose text-2xl mb-2">Your Presence Is the Present</p> */}
        <h2 className="font-serif text-4xl md:text-5xl text-bark mb-4" style={{ fontWeight: 300 }}>
          Registry
        </h2>

        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-16 bg-gold/50" />
          <span className="text-gold text-xl">✦</span>
          <div className="h-px w-16 bg-gold/50" />
        </div>

        <p className="font-serif italic text-bark/70 text-lg md:text-xl leading-relaxed">
          Your presence at our celebration is the greatest gift of all. 
          As we’ll be moving shortly after our wedding, we kindly request no boxed gifts. 
        </p>

        <div className="flex items-center justify-center gap-4 mt-10">
          <div className="h-px w-12 bg-gold/50" />
          <span className="text-gold">✦</span>
          <div className="h-px w-12 bg-gold/50" />
        </div>
        <p className="font-sans font-light text-bark/70 text-md mt-4">
          Thank you for your love and support!
        </p>
      </div>
    </section>
  )
}
