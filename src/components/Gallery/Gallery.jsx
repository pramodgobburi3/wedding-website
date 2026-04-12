import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Lightbox from './Lightbox'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const TAG        = import.meta.env.VITE_CLOUDINARY_TAG || 'wedding'

function imgUrl(publicId, width = 800) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},q_auto,f_auto/${publicId}`
}

function listUrl() {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/list/${TAG}.json`
}

function LoadingSkeleton() {
  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="break-inside-avoid mb-3 rounded-sm bg-bark/10 animate-pulse"
          style={{ height: [180, 240, 200, 160, 220, 190, 210, 170][i] }}
        />
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <svg
        aria-hidden="true"
        className="w-16 h-16 mx-auto mb-4 text-bark/20"
        viewBox="0 0 64 64"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="8" y="16" width="48" height="36" rx="2" />
        <circle cx="24" cy="30" r="5" />
        <polyline points="8,44 22,30 32,40 42,28 56,44" />
      </svg>
      <p className="font-serif italic text-bark/40 text-lg">Photos coming soon</p>
      <p className="font-sans text-xs text-bark/30 tracking-widest uppercase mt-2">
        Upload photos to your Cloudinary folder to populate the gallery
      </p>
    </div>
  )
}

export default function Gallery() {
  const [photos, setPhotos]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [selectedIndex, setSelectedIndex] = useState(null)

  useEffect(() => {
    if (!CLOUD_NAME) {
      setLoading(false)
      return
    }

    fetch(listUrl())
      .then((r) => r.json())
      .then((data) => {
        const resources = data.resources ?? []
        setPhotos(
          resources.map((r, i) => ({
            id:      r.public_id,
            src:     imgUrl(r.public_id, 800),
            fullSrc: imgUrl(r.public_id, 1600),
            alt:     `Snigdha & Pramod — photo ${i + 1}`,
          }))
        )
      })
      .catch(() => {/* silently show empty state */})
      .finally(() => setLoading(false))
  }, [])

  return (
    <section
      id="gallery"
      className="section-pad relative overflow-hidden"
      style={{ backgroundColor: '#EDE4D8' }}
    >
      <div className="max-w-6xl mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-12">
          <p className="font-script text-dustyRose text-2xl mb-2">Memories</p>
          <h2
            className="font-serif text-4xl md:text-5xl text-bark mb-4"
            style={{ fontWeight: 300 }}
          >
            Our Gallery
          </h2>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-16 bg-gold/50" />
            <span className="text-gold text-lg">✦</span>
            <div className="h-px w-16 bg-gold/50" />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <LoadingSkeleton />
        ) : photos.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3">
            {photos.map((photo, i) => (
              <div key={photo.id} className="break-inside-avoid mb-3">
                <motion.img
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  decoding="async"
                  className="w-full rounded-sm object-cover hover:opacity-90 transition-opacity duration-300"
                  style={{ cursor: 'none' }}
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.5, delay: (i % 8) * 0.06 }}
                  onClick={() => setSelectedIndex(i)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedIndex(i)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open photo ${i + 1}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <Lightbox
          photos={photos.map((p) => ({ ...p, src: p.fullSrc }))}
          selectedIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onNavigate={setSelectedIndex}
        />
      )}
    </section>
  )
}
