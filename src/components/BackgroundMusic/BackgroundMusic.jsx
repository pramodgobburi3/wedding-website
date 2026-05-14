import { useEffect, useRef, useState } from 'react'

// Replace with your own YouTube video ID. To find it, open the YouTube URL —
// the ID is the value after `v=` (e.g. dQw4w9WgXcQ in
// https://www.youtube.com/watch?v=dQw4w9WgXcQ).
const VIDEO_ID = 'dQw4w9WgXcQ'

function SpeakerOnIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  )
}

function SpeakerOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <line x1="22" y1="9" x2="16" y2="15" />
      <line x1="16" y1="9" x2="22" y2="15" />
    </svg>
  )
}

export default function BackgroundMusic() {
  const playerRef    = useRef(null)
  const containerRef = useRef(null)
  const [muted, setMuted] = useState(true)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    function createPlayer() {
      if (cancelled || !containerRef.current || !window.YT?.Player) return
      playerRef.current = new window.YT.Player(containerRef.current, {
        height:  '0',
        width:   '0',
        videoId: VIDEO_ID,
        playerVars: {
          autoplay:       1,
          mute:           1,
          loop:           1,
          playlist:       VIDEO_ID,  // required for loop to actually loop
          controls:       0,
          modestbranding: 1,
          playsinline:    1,
          disablekb:      1,
          rel:            0,
          iv_load_policy: 3,
        },
        events: {
          onReady: () => { if (!cancelled) setReady(true) },
        },
      })
    }

    if (window.YT?.Player) {
      createPlayer()
    } else {
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prev === 'function') prev()
        createPlayer()
      }
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(tag)
      }
    }

    return () => {
      cancelled = true
      try { playerRef.current?.destroy?.() } catch { /* noop */ }
      playerRef.current = null
    }
  }, [])

  function toggle() {
    if (!ready || !playerRef.current) return
    if (muted) {
      playerRef.current.unMute()
      playerRef.current.playVideo()
      setMuted(false)
    } else {
      playerRef.current.mute()
      setMuted(true)
    }
  }

  return (
    <>
      {/* Hidden iframe — positioned off-screen so the player still loads & plays */}
      <div
        aria-hidden="true"
        style={{
          position:      'fixed',
          left:          -9999,
          top:           0,
          width:         1,
          height:        1,
          opacity:       0,
          pointerEvents: 'none',
          overflow:      'hidden',
        }}
      >
        <div ref={containerRef} />
      </div>

      <button
        type="button"
        onClick={toggle}
        disabled={!ready}
        aria-label={muted ? 'Unmute background music' : 'Mute background music'}
        title={muted ? 'Unmute music' : 'Mute music'}
        className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-sm border transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          backgroundColor: 'rgba(244, 232, 214, 0.85)',
          borderColor:     'rgba(196, 126, 133, 0.5)',
          color:           '#5C3D2E',
        }}
      >
        {muted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
      </button>
    </>
  )
}
