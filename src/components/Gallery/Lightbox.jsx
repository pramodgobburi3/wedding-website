import { useEffect, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Preload an image URL into the browser cache without rendering it
function preload(url) {
  if (!url) return
  const img = new Image()
  img.src = url
}

export default function Lightbox({ photos, selectedIndex, onClose, onNavigate }) {
  const photo = photos[selectedIndex]

  // Track whether the full-res image has finished loading
  const [fullLoaded, setFullLoaded] = useState(false)

  // Reset loaded state whenever the photo changes
  useEffect(() => {
    setFullLoaded(false)
  }, [selectedIndex])

  // Preload adjacent full-res images in the background
  useEffect(() => {
    const prev = photos[(selectedIndex - 1 + photos.length) % photos.length]
    const next = photos[(selectedIndex + 1) % photos.length]
    preload(prev?.src)
    preload(next?.src)
  }, [selectedIndex, photos])

  const handlePrev = useCallback(() => {
    onNavigate((selectedIndex - 1 + photos.length) % photos.length)
  }, [selectedIndex, photos.length, onNavigate])

  const handleNext = useCallback(() => {
    onNavigate((selectedIndex + 1) % photos.length)
  }, [selectedIndex, photos.length, onNavigate])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape')     onClose()
      if (e.key === 'ArrowLeft')  handlePrev()
      if (e.key === 'ArrowRight') handleNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, handlePrev, handleNext])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <AnimatePresence>
      {photo && (
        <motion.div
          className="fixed inset-0 z-[9000] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-bark-dark/88"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Image container */}
          <motion.div
            className="relative z-10 max-w-5xl w-full mx-4 flex flex-col items-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1,   opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="relative">
              {/* Thumbnail — shown immediately (already cached from grid) */}
              <img
                src={photo.thumb || photo.src}
                alt={photo.alt}
                className="max-h-[82vh] w-auto object-contain rounded-sm shadow-2xl"
                style={{ maxWidth: '100%', display: 'block' }}
              />

              {/* Full-res — loads silently, fades in over the thumbnail when ready */}
              {photo.thumb && (
                <img
                  key={photo.src}
                  src={photo.src}
                  alt=""
                  aria-hidden="true"
                  onLoad={() => setFullLoaded(true)}
                  className="absolute inset-0 max-h-[82vh] w-auto object-contain rounded-sm"
                  style={{
                    maxWidth: '100%',
                    opacity: fullLoaded ? 1 : 0,
                    transition: 'opacity 0.4s ease',
                  }}
                />
              )}
            </div>

            {/* Caption */}
            {photo.alt && (
              <p className="mt-3 font-serif italic text-ivory/60 text-sm text-center">
                {photo.alt}
              </p>
            )}
            {/* Counter */}
            <p className="mt-1 font-sans text-[10px] tracking-widest uppercase text-ivory/35">
              {selectedIndex + 1} / {photos.length}
            </p>
          </motion.div>

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close lightbox"
            className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full bg-blush/20 hover:bg-blush/40 flex items-center justify-center transition-colors duration-200"
          >
            <svg viewBox="0 0 20 20" className="w-5 h-5 text-ivory" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="4" x2="16" y2="16" />
              <line x1="16" y1="4" x2="4" y2="16" />
            </svg>
          </button>

          {/* Prev arrow */}
          <button
            onClick={handlePrev}
            aria-label="Previous photo"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-ivory/10 hover:bg-ivory/25 flex items-center justify-center transition-colors duration-200"
          >
            <svg viewBox="0 0 20 20" className="w-5 h-5 text-ivory" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="13,4 7,10 13,16" />
            </svg>
          </button>

          {/* Next arrow */}
          <button
            onClick={handleNext}
            aria-label="Next photo"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-ivory/10 hover:bg-ivory/25 flex items-center justify-center transition-colors duration-200"
          >
            <svg viewBox="0 0 20 20" className="w-5 h-5 text-ivory" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="7,4 13,10 7,16" />
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
