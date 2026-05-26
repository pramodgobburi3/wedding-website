import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Lightbox from './Lightbox'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const TAG        = import.meta.env.VITE_CLOUDINARY_TAG || 'wedding'

function imgUrl(publicId, width = 800) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},q_auto,f_auto/${publicId}`
}

// Cloudinary can serve a still frame from a video by swapping the extension to
// an image one; so_auto picks a representative frame for the poster/thumbnail.
function videoPoster(publicId, width = 800) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/w_${width},q_auto,f_auto,so_auto/${publicId}.jpg`
}

function videoUrl(publicId) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/q_auto/${publicId}.mp4`
}

// Cap full-res at 900px on mobile (screens ≤768px) — 1600px is wasted on phone displays
const FULL_RES = typeof window !== 'undefined' && window.innerWidth <= 768 ? 900 : 1600

function imageListUrl() {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/list/${TAG}.json`
}

function videoListUrl() {
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/list/${TAG}.json`
}

function PlayBadge() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <span className="w-12 h-12 rounded-full bg-bark/45 backdrop-blur-sm flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-ivory ml-0.5" fill="currentColor" aria-hidden="true">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </div>
  )
}

// `index` is the position in the combined (videos-then-photos) list, which the
// lightbox uses for navigation.
function MediaTile({ item, index, onOpen }) {
  return (
    <motion.div
      className="relative w-full rounded-sm overflow-hidden hover:opacity-90 transition-opacity duration-300"
      style={{ cursor: 'none' }}
      initial={{ opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, delay: (index % 8) * 0.06 }}
      onClick={() => onOpen(index)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(index)}
      tabIndex={0}
      role="button"
      aria-label={item.type === 'video' ? 'Play video' : 'Open photo'}
    >
      <img
        src={item.type === 'video' ? item.poster : item.src}
        alt={item.alt}
        loading="lazy"
        decoding="async"
        className="w-full block object-cover"
      />
      {item.type === 'video' && <PlayBadge />}
    </motion.div>
  )
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
      <p className="font-serif italic text-bark/40 text-lg">Photos &amp; videos coming soon</p>
      <p className="font-sans text-xs text-bark/30 tracking-widest uppercase mt-2">
        Upload media to your Cloudinary folder to populate the gallery
      </p>
    </div>
  )
}

export default function Gallery() {
  const [media, setMedia]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [selectedIndex, setSelectedIndex] = useState(null)

  // Group videos before photos. The combined order (videos first) is what the
  // lightbox indexes into, so the tiles pass their position in this list.
  const videos  = media.filter((m) => m.type === 'video')
  const photos  = media.filter((m) => m.type === 'image')
  const ordered = [...videos, ...photos]

  useEffect(() => {
    if (!CLOUD_NAME) {
      setLoading(false)
      return
    }

    const safeFetch = (url) => fetch(url).then((r) => r.json()).catch(() => ({ resources: [] }))

    Promise.all([safeFetch(imageListUrl()), safeFetch(videoListUrl())])
      .then(([imgData, vidData]) => {
        const images = (imgData.resources ?? []).map((r) => ({
          type:    'image',
          id:      r.public_id,
          created: r.created_at,
          src:     imgUrl(r.public_id, 800),
          fullSrc: imgUrl(r.public_id, FULL_RES),
        }))
        const videos = (vidData.resources ?? []).map((r) => ({
          type:    'video',
          id:      r.public_id,
          created: r.created_at,
          src:     videoUrl(r.public_id),
          poster:  videoPoster(r.public_id, 800),
          // Caption from the asset's contextual metadata (the "Caption" field in
          // the Cloudinary Media Library). Check a few shapes for safety.
          caption: r.context?.custom?.caption
                ?? r.context?.custom?.title
                ?? r.context?.caption
                ?? null,
        }))
        // Interleave by recency so videos sit naturally among the photos.
        const merged = [...images, ...videos].sort((a, b) =>
          (b.created ?? '').localeCompare(a.created ?? '')
        )
        setMedia(merged.map((m, i) => ({ ...m, alt: `Snigdha & Pramod — ${i + 1}` })))
      })
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
        ) : media.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Videos — grouped above the photos, centered, each with its caption */}
            {videos.length > 0 && (
              <div className="mb-10 flex flex-wrap justify-center gap-8">
                {videos.map((item, i) => (
                  <div key={item.id} className="w-full sm:w-[30rem] max-w-full">
                    {item.caption && (
                      <p className="font-sans text-xs tracking-[0.25em] uppercase text-bark/60 text-center mb-3">
                        {item.caption}
                      </p>
                    )}
                    <MediaTile item={item} index={i} onOpen={setSelectedIndex} />
                  </div>
                ))}
              </div>
            )}

            {/* Photos — masonry */}
            {photos.length > 0 && (
              <p className="font-sans text-xs tracking-[0.25em] uppercase text-bark/60 text-center mb-4">
                Our Favorite Moments
              </p>
            )}
            <div className="columns-2 md:columns-3 lg:columns-4 gap-3">
              {photos.map((item, i) => (
                <div key={item.id} className="break-inside-avoid mb-3">
                  <MediaTile item={item} index={videos.length + i} onOpen={setSelectedIndex} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <Lightbox
          items={ordered.map((m) =>
            m.type === 'video'
              ? { ...m, src: m.src, thumb: m.poster }
              : { ...m, src: m.fullSrc, thumb: m.src }
          )}
          selectedIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onNavigate={setSelectedIndex}
        />
      )}
    </section>
  )
}
