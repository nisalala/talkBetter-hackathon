// src/components/VoiceCoach.jsx

'use client'

import { useState, useEffect, useRef } from 'react'

export default function VoiceCoach({ feedback, score }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [voicesLoaded, setVoicesLoaded] = useState(false)
  const synthRef = useRef(null)

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return

    // Check if speech synthesis is supported
    const supported = 'speechSynthesis' in window
    setIsSupported(supported)

    if (!supported) return

    synthRef.current = window.speechSynthesis

    // Load voices
    const loadVoices = () => {
      const voices = synthRef.current?.getVoices()
      if (voices && voices.length > 0) {
        setVoicesLoaded(true)
      }
    }

    // Try loading immediately
    loadVoices()

    // Also listen for voice changes (Chrome loads async)
    if (synthRef.current) {
      synthRef.current.onvoiceschanged = loadVoices
    }

    // Cleanup
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [])

  const generateCoachingScript = () => {
    if (!feedback) return ''

    const parts = []

    // Opening based on score
    if (score >= 80) {
      parts.push("Excellent work! You're showing really strong communication skills here.")
    } else if (score >= 60) {
      parts.push("Good effort! You're definitely on the right track.")
    } else {
      parts.push("Thanks for practicing! Let me share some tips to help you improve.")
    }

    // Get top strength
    if (feedback.strengths?.length > 0) {
      parts.push(`One thing you did well: ${feedback.strengths[0]}`)
    }

    // Get top improvement
    if (feedback.improvements?.length > 0) {
      parts.push(`Focus on this: ${feedback.improvements[0]}`)
    }

    // Encouraging close
    parts.push("Keep practicing and you'll see amazing progress!")

    // Limit length to avoid issues
    return parts.join(' ').slice(0, 500)
  }

  const playCoaching = () => {
    if (!synthRef.current || !voicesLoaded) {
      console.warn('Speech synthesis not ready')
      return
    }

    // Cancel any ongoing speech
    synthRef.current.cancel()

    const script = generateCoachingScript()
    if (!script) return

    try {
      const utterance = new SpeechSynthesisUtterance(script)

      // Get available voices
      const voices = synthRef.current.getVoices()
      
      // Try to find a good English voice
      const preferredVoice = voices.find(v => 
        v.lang.startsWith('en') && (
          v.name.includes('Samantha') || 
          v.name.includes('Google') ||
          v.name.includes('Microsoft')
        )
      ) || voices.find(v => v.lang.startsWith('en')) || voices[0]

      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      utterance.rate = 0.9
      utterance.pitch = 1.0
      utterance.volume = 1.0

      utterance.onstart = () => {
        setIsPlaying(true)
      }

      utterance.onend = () => {
        setIsPlaying(false)
        setHasPlayed(true)
      }

      utterance.onerror = (event) => {
        // Ignore 'interrupted' and 'canceled' - these are normal
        if (event.error === 'interrupted' || event.error === 'canceled') {
          setIsPlaying(false)
          return
        }
        // Only log actual errors
        if (event.error) {
          console.warn('Speech synthesis error:', event.error)
        }
        setIsPlaying(false)
      }

      // Small delay to ensure everything is ready
      setTimeout(() => {
        try {
          synthRef.current?.speak(utterance)
        } catch (e) {
          console.warn('Failed to speak:', e)
          setIsPlaying(false)
        }
      }, 50)

    } catch (error) {
      console.warn('Speech setup error:', error)
      setIsPlaying(false)
    }
  }

  const stopCoaching = () => {
    if (synthRef.current) {
      synthRef.current.cancel()
    }
    setIsPlaying(false)
  }

  // Don't render if not supported or no feedback
  if (!isSupported || !feedback) {
    return null
  }

  return (
    <div className="glass rounded-2xl p-6 border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Coach Avatar */}
        <div className="relative flex-shrink-0">
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/30 ${isPlaying ? 'animate-pulse' : ''}`}>
            🎧
          </div>
          {isPlaying && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-ping" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-lg font-semibold text-white mb-1">
            🤖 AI Voice Coach
          </h3>
          <p className="text-sm text-gray-400">
            {!voicesLoaded 
              ? "Loading voice..."
              : isPlaying 
                ? "Listen to your personalized feedback..."
                : hasPlayed 
                  ? "Want to hear your feedback again?" 
                  : "Hear personalized coaching based on your performance"
            }
          </p>
        </div>

        {/* Play Button */}
        <button
          onClick={isPlaying ? stopCoaching : playCoaching}
          disabled={!voicesLoaded}
          className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            isPlaying 
              ? 'bg-red-500 hover:bg-red-400 text-white' 
              : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white shadow-lg shadow-indigo-500/25'
          }`}
        >
          {isPlaying ? (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              Stop
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              {hasPlayed ? 'Replay' : 'Listen'}
            </>
          )}
        </button>
      </div>

      {/* Audio Visualizer */}
      {isPlaying && (
        <div className="mt-4 flex items-center justify-center gap-1">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-indigo-500 to-purple-400 rounded-full"
              style={{
                height: '16px',
                animation: `pulse 0.5s ease-in-out infinite`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
          <span className="ml-3 text-sm text-indigo-400">Speaking...</span>
        </div>
      )}
    </div>
  )
}