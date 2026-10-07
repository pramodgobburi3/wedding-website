import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { fetchByTag, imgUrl, videoUrl, videoPoster, CLOUD_NAME } from '../../lib/cloudinary'
import Lightbox from '../Gallery/Lightbox'

const GALLERY_TAG    = import.meta.env.VITE_CLOUDINARY_TAG_GALLERY    || 'wedding-gallery'
const TRAILER_TAG    = import.meta.env.VITE_CLOUDINARY_TAG_TRAILER    || 'wedding-trailer'
const HERO_BG_TAG    = import.meta.env.VITE_CLOUDINARY_TAG_HERO_BG    || 'wedding-thankyou-background'

// Cap full-res on phones — 1600px is wasted bandwidth on small screens.
const FULL_RES = typeof window !== 'undefined' && window.innerWidth <= 768 ? 900 : 1600

function Divider() {
  return (
    <div className="flex items-center justify-center gap-4">
      <div className="h-px w-16 bg-gold/50" />
      <span className="text-gold text-xl">✦</span>
      <div className="h-px w-16 bg-gold/50" />
    </div>
  )
}

function SpinningLotus() {
  // Rotates once every 40s — slow enough to feel meditative, not distracting.
  return (
    <motion.svg
      viewBox="0 0 120 120"
      className="mx-auto w-24 h-24 md:w-28 md:h-28 mb-6"
      aria-hidden="true"
      animate={{ rotate: 360 }}
      transition={{ duration: 40, ease: 'linear', repeat: Infinity }}
      style={{ transformOrigin: '50% 50%' }}
    >
      {Array.from({ length: 8 }, (_, i) => (
        <path
          key={`o-${i}`}
          d="M 60,60 C 52,44 52,28 60,20 C 68,28 68,44 60,60 Z"
          fill="#C9A87C" opacity="0.45"
          transform={`rotate(${i * 45} 60 60)`}
        />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <path
          key={`m-${i}`}
          d="M 60,60 C 54,48 54,36 60,30 C 66,36 66,48 60,60 Z"
          fill="#C9A87C" opacity="0.65"
          transform={`rotate(${i * 45 + 22.5} 60 60)`}
        />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <path
          key={`i-${i}`}
          d="M 60,60 C 56,52 56,44 60,40 C 64,44 64,52 60,60 Z"
          fill="#C9A87C" opacity="0.85"
          transform={`rotate(${i * 60} 60 60)`}
        />
      ))}
      <circle cx="60" cy="60" r="6.5" fill="#C9A87C" opacity="0.95" />
      <circle cx="60" cy="60" r="3.5" fill="#F5EFE3" opacity="0.9" />
      {Array.from({ length: 6 }, (_, i) => (
        <circle
          key={`s-${i}`}
          cx={60 + Math.cos(i * 60 * Math.PI / 180) * 2.5}
          cy={60 + Math.sin(i * 60 * Math.PI / 180) * 2.5}
          r="0.7" fill="#C9A87C" opacity="0.6"
        />
      ))}
    </motion.svg>
  )
}

function MessageHero({ bgUrl }) {
  return (
    <motion.section
      className="relative pt-24 md:pt-32 pb-20 md:pb-28 px-6 text-center overflow-hidden"
      style={{ backgroundColor: '#1E2A18' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.0, ease: 'easeOut' }}
    >
      {bgUrl && (
        <>
          <img
            src={bgUrl}
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
            style={{ opacity: 0.55 }}
          />
          {/* Dark green wash for text legibility */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, rgba(30,42,24,0.20) 0%, rgba(30,42,24,0.30) 55%, rgba(30,42,24,0.45) 100%)',
            }}
            aria-hidden="true"
          />
        </>
      )}

      <div className="relative z-10 max-w-2xl mx-auto">
        <SpinningLotus />
        <p className="font-script text-gold text-2xl md:text-3xl mb-3 text-shadow-light">With love</p>
        <h1
          className="font-serif text-ivory text-5xl md:text-7xl mb-6 text-shadow-bloom"
          style={{ fontWeight: 300 }}
        >
          Thank You
        </h1>

        <div className="mb-8"><Divider /></div>

        <p className="font-serif italic text-ivory/85 text-xl md:text-2xl leading-relaxed">
          To every friend and family member who traveled, danced, laughed,
          and celebrated with us — thank you. Our wedding was made whole
          by your presence, and these moments will stay with us always.
        </p>

        <p className="font-script text-gold text-3xl md:text-4xl mt-10 text-shadow-light">
          Snigdha &amp; Pramod
        </p>
      </div>
    </motion.section>
  )
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

function MediaTile({ item, index, onOpen }) {
  return (
    <motion.div
      className="relative w-full rounded-sm overflow-hidden hover:opacity-90 transition-opacity duration-300"
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

export default function ThankYou() {
  const [photos, setPhotos]   = useState([])
  const [videos, setVideos]   = useState([])
  const [heroBg, setHeroBg]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState(null)

  useEffect(() => {
    async function load() {
      if (!CLOUD_NAME) {
        setLoading(false)
        return
      }

      const [galleryData, trailerData, heroData] = await Promise.all([
        fetchByTag(GALLERY_TAG),
        fetchByTag(TRAILER_TAG),
        fetchByTag(HERO_BG_TAG),
      ])

      const heroImage = heroData.images[0]
      if (heroImage) setHeroBg(imgUrl(heroImage.public_id, 1920))

      const orderedPhotos = [...galleryData.images]
        .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
        .map((r, i) => ({
          type:    'image',
          id:      r.public_id,
          src:     imgUrl(r.public_id, 800),
          fullSrc: imgUrl(r.public_id, FULL_RES),
          alt:     `Snigdha & Pramod — ${i + 1}`,
        }))

      const orderedVideos = [...trailerData.videos]
        .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
        .map((r) => ({
          type:    'video',
          id:      r.public_id,
          src:     videoUrl(r.public_id),
          poster:  videoPoster(r.public_id, 1200),
          alt:     'Wedding trailer',
          caption: r.context?.custom?.caption
                ?? r.context?.custom?.title
                ?? r.context?.caption
                ?? null,
        }))

      setPhotos(orderedPhotos)
      setVideos(orderedVideos)
      setLoading(false)
    }
    load()
  }, [])

  // Videos first, then photos — matches Gallery ordering + Lightbox indexing.
  const ordered = useMemo(() => [...videos, ...photos], [videos, photos])

  return (
    <main id="legal-root" className="min-h-screen" style={{ backgroundColor: '#EDE4D8' }}>
      <MessageHero bgUrl={heroBg} />

      {/* Memories */}
      <section className="pt-20 md:pt-28 pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="font-script text-dustyRose text-2xl mb-2">A few of our favorites</p>
            <h2 className="font-serif text-3xl md:text-4xl text-bark mb-4" style={{ fontWeight: 300 }}>
              Memories
            </h2>
            <Divider />
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : ordered.length === 0 ? (
            <p className="text-center font-sans text-sm text-bark/45 italic">
              Photos are being uploaded — check back soon.
            </p>
          ) : (
            <>
              {/* Trailer(s) — grouped above the photos, each with its caption */}
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
      </section>

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
    </main>
  )
}
