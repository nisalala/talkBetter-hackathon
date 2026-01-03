'use client'

import { useState, useEffect } from 'react'

export default function VoiceCoach({ feedback, score }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)
  const [isSupported, setIsSupported] = useState(true)

  useEffect(() => {
    // Check if speech synthesis is supported
    if (typeof window !== 'undefined' && !('speechSynthesis' in window)) {
      setIsSupported(false)
    }
  }, [])

  const generateCoachingScript = () => {
    // Opening based on score
    let intro
    if (score >= 80) {
      intro = "Excellent work! You're showing really strong communication skills here."
    } else if (score >= 60) {
      intro = "Good effort! You're definitely on the right track with some areas we can polish."
    } else {
      intro = "Thanks for practicing! Let me share some tips to help you improve."
    }

    // Get top 2 improvements
    const improvements = feedback.improvements?.slice(0, 2) || []
    let mainFeedback = ''
    if (improvements.length > 0) {
      mainFeedback = `Here's what to focus on: ${improvements[0]}.`
      if (improvements.length > 1) {
        mainFeedback += ` Also, ${improvements[1]}.`
      }
    }

    // Get top strength
    const strengths = feedback.strengths?.slice(0, 1) || []
    let strengthFeedback = ''
    if (strengths.length > 0) {
      strengthFeedback = `One thing you did really well: ${strengths[0]}.`
    }

    // Encouraging close
    const encouragement = "Keep practicing and you'll see amazing progress. You've got this!"

    return `${intro} ${strengthFeedback} ${mainFeedback} ${encouragement}`
  }

  const playCoaching = () => {
    if (!('speechSynthesis' in window)) {
      alert('Voice coaching is not supported in your browser. Try Chrome or Safari.')
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const script = generateCoachingScript()
    const utterance = new SpeechSynthesisUtterance(script)

    // Wait for voices to load, then pick a good one
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices()
      const preferredVoice = voices.find(v => 
        v.name.includes('Samantha') || 
        v.name.includes('Google US English') ||
        v.name.includes('Microsoft Zira') ||
        (v.lang.startsWith('en') && v.name.includes('Female'))
      ) || voices.find(v => v.lang.startsWith('en')) || voices[0]

      if (preferredVoice) {
        utterance.voice = preferredVoice
      }
    }

    // Voices might not be loaded yet
    if (window.speechSynthesis.getVoices().length > 0) {
      setVoice()
    } else {
      window.speechSynthesis.onvoiceschanged = setVoice
    }

    utterance.rate = 0.9
    utterance.pitch = 1.05
    utterance.volume = 1

    utterance.onstart = () => setIsPlaying(true)
    utterance.onend = () => {
      setIsPlaying(false)
      setHasPlayed(true)
    }
    utterance.onerror = (e) => {
      console.error('Speech error:', e)
      setIsPlaying(false)
    }

    window.speechSynthesis.speak(utterance)
  }

  const stopCoaching = () => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
  }

  if (!isSupported) {
    return null // Don't show if not supported
  }

  return (
    <div className="glass rounded-2xl p-6 border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Coach Avatar */}
        <div className="relative">
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 
                        flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/30
                        ${isPlaying ? 'animate-pulse' : ''}`}>
            🎧
          </div>
          {isPlaying && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full 
                          flex items-center justify-center animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-lg font-semibold text-white mb-1">
            🤖 AI Voice Coach
          </h3>
          <p className="text-sm text-gray-400">
            {isPlaying 
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
          className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2
                    ${isPlaying 
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
              className="w-1 bg-gradient-to-t from-indigo-500 to-purple-400 rounded-full animate-pulse"
              style={{
                height: `${Math.random() * 24 + 8}px`,
                animationDelay: `${i * 0.05}s`,
                animationDuration: '0.5s'
              }}
            />
          ))}
          <span className="ml-3 text-sm text-indigo-400">Speaking...</span>
        </div>
      )}
    </div>
  )
}