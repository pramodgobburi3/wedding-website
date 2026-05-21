import { useEffect, useRef, useState } from 'react'

// Replace with your own YouTube video ID. To find it, open the YouTube URL —
// the ID is the value after `v=` (e.g. dQw4w9WgXcQ in
// https://www.youtube.com/watch?v=dQw4w9WgXcQ).
const VIDEO_ID = 'P1aHG6IqCtM'

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
  const wantSoundRef = useRef(false)
  const [muted, setMuted] = useState(true)
  const [ready, setReady] = useState(false)
  const [showHint, setShowHint] = useState(false)

  // Once the player is ready, nudge the guest that music is available. Shows on
  // every page load — dismissing only hides it for the current view.
  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => setShowHint(true), 1200)
    return () => clearTimeout(t)
  }, [ready])

  function dismissHint() {
    setShowHint(false)
  }

  useEffect(() => {
    let cancelled = false

    function createPlayer() {
      if (cancelled || !containerRef.current || !window.YT?.Player) return
      playerRef.current = new window.YT.Player(containerRef.current, {
        height:  '0',
        width:   '0',
        videoId: VIDEO_ID,
        playerVars: {
          autoplay:       0,  // don't play on load — starts on first speaker click
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
          // Mobile players often ignore an unMute() issued before playback has
          // actually started. Re-apply it once the video reaches PLAYING so the
          // first tap reliably produces sound.
          onStateChange: (e) => {
            const PLAYING = window.YT?.PlayerState?.PLAYING ?? 1
            if (e.data === PLAYING && wantSoundRef.current) {
              e.target.unMute()
              e.target.setVolume(100)
            }
          },
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
    dismissHint()
    const p = playerRef.current
    if (muted) {
      // Start playback within the user gesture, then unmute. If the unmute
      // doesn't "stick" before playback begins (common on mobile), the
      // onStateChange PLAYING handler re-applies it.
      wantSoundRef.current = true
      p.playVideo()
      p.unMute()
      p.setVolume(100)
      setMuted(false)
    } else {
      wantSoundRef.current = false
      p.mute()
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

      {/* Hint bubble — nudges guests that music is available */}
      <div
        aria-hidden={!showHint}
        className="fixed bottom-20 right-6 z-50 max-w-[15rem] transition-all duration-500"
        style={{
          opacity:        showHint ? 1 : 0,
          transform:      showHint ? 'translateY(0)' : 'translateY(8px)',
          pointerEvents:  showHint ? 'auto' : 'none',
        }}
      >
        <div
          className="relative rounded-2xl px-4 py-3 shadow-lg backdrop-blur-sm border"
          style={{
            backgroundColor: 'rgba(244, 232, 214, 0.96)',
            borderColor:     'rgba(196, 126, 133, 0.5)',
            color:           '#5C3D2E',
          }}
        >
          <button
            type="button"
            onClick={dismissHint}
            aria-label="Dismiss"
            className="absolute -top-2 -left-2 w-5 h-5 rounded-full flex items-center justify-center text-xs leading-none border"
            style={{
              backgroundColor: 'rgba(244, 232, 214, 1)',
              borderColor:     'rgba(196, 126, 133, 0.5)',
              color:           '#5C3D2E',
            }}
          >
            ×
          </button>
          <button type="button" onClick={toggle} className="text-left">
            {/* <p className="font-script text-dustyRose text-lg leading-tight mb-0.5">A little music?</p> */}
            <p className="font-sans text-xs text-bark/70 leading-snug">
              Click the speaker to enjoy a musical experience&nbsp;♪
            </p>
          </button>
          {/* Caret pointing down toward the button */}
          <div
            className="absolute right-5 -bottom-1.5 w-3 h-3 rotate-45 border-b border-r"
            style={{
              backgroundColor: 'rgba(244, 232, 214, 0.96)',
              borderColor:     'rgba(196, 126, 133, 0.5)',
            }}
            aria-hidden="true"
          />
        </div>
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
