import { useEffect, useRef, useState } from 'react'

// Hosted audio file. An HTML5 <audio> element (vs a YouTube iframe) is the only
// reliable way to start sound on the first tap in iOS Safari — audio.play()
// called synchronously inside the click handler counts as the user gesture.
const MUSIC_URL = 'https://vzqjacqifysrfzwlvpci.supabase.co/storage/v1/object/public/assets/music.mp3'

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
  const audioRef = useRef(null)
  const [playing, setPlaying]   = useState(false)
  const [showHint, setShowHint] = useState(false)

  // Nudge the guest that music is available, shortly after load. Shows on every
  // page load — dismissing only hides it for the current view.
  useEffect(() => {
    const t = setTimeout(() => setShowHint(true), 1200)
    return () => clearTimeout(t)
  }, [])

  function dismissHint() {
    setShowHint(false)
  }

  function toggle() {
    const a = audioRef.current
    if (!a) return
    dismissHint()
    if (a.paused) {
      // play() inside the click handler is the user gesture iOS requires.
      a.play().catch(() => { /* play was blocked or interrupted — ignore */ })
    } else {
      a.pause()
    }
  }

  return (
    <>
      {/* Hidden looping audio — playback state is mirrored from the element's
          own play/pause events so the icon stays in sync. */}
      <audio
        ref={audioRef}
        src={MUSIC_URL}
        loop
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

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
        aria-label={playing ? 'Pause background music' : 'Play background music'}
        title={playing ? 'Pause music' : 'Play music'}
        className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-sm border transition-all duration-200"
        style={{
          backgroundColor: 'rgba(244, 232, 214, 0.85)',
          borderColor:     'rgba(196, 126, 133, 0.5)',
          color:           '#5C3D2E',
        }}
      >
        {playing ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
      </button>
    </>
  )
}
