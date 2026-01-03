// src/components/LiveFeedback.jsx

'use client'

import { useState, useEffect } from 'react'

const feedbackTypes = {
  // Pace
  pace_slow: {
    icon: '🐢',
    color: 'from-yellow-500/20 to-orange-500/20',
    borderColor: 'border-yellow-500/50',
    textColor: 'text-yellow-400',
  },
  pace_fast: {
    icon: '🐇',
    color: 'from-orange-500/20 to-red-500/20',
    borderColor: 'border-orange-500/50',
    textColor: 'text-orange-400',
  },
  pace_improved: {
    icon: '✨',
    color: 'from-green-500/20 to-emerald-500/20',
    borderColor: 'border-green-500/50',
    textColor: 'text-green-400',
  },
  
  // Filler words
  filler_words: {
    icon: '🔄',
    color: 'from-purple-500/20 to-pink-500/20',
    borderColor: 'border-purple-500/50',
    textColor: 'text-purple-400',
  },
  filler_alert: {
    icon: '🚨',
    color: 'from-red-500/20 to-pink-500/20',
    borderColor: 'border-red-500/50',
    textColor: 'text-red-400',
  },
  
  // Time
  time_warning: {
    icon: '⏱️',
    color: 'from-red-500/20 to-orange-500/20',
    borderColor: 'border-red-500/50',
    textColor: 'text-red-400',
  },
  time_halfway: {
    icon: '⏰',
    color: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/50',
    textColor: 'text-blue-400',
  },
  
  // Positive
  good_pace: {
    icon: '👍',
    color: 'from-green-500/20 to-emerald-500/20',
    borderColor: 'border-green-500/50',
    textColor: 'text-green-400',
  },
  great_streak: {
    icon: '🌟',
    color: 'from-yellow-500/20 to-green-500/20',
    borderColor: 'border-yellow-500/50',
    textColor: 'text-yellow-400',
  },
  
  // Content issues
  silence: {
    icon: '🤫',
    color: 'from-gray-500/20 to-slate-500/20',
    borderColor: 'border-gray-500/50',
    textColor: 'text-gray-400',
  },
  rambling: {
    icon: '📝',
    color: 'from-yellow-500/20 to-amber-500/20',
    borderColor: 'border-yellow-500/50',
    textColor: 'text-yellow-400',
  },
  repetition: {
    icon: '🔁',
    color: 'from-orange-500/20 to-yellow-500/20',
    borderColor: 'border-orange-500/50',
    textColor: 'text-orange-400',
  },
}

export default function LiveFeedback({ feedback, onDismiss }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    if (feedback) {
      setIsVisible(true)
      setIsLeaving(false)

      // High priority feedback stays longer
      const duration = feedback.priority === 'high' ? 5000 : 4000

      const timer = setTimeout(() => {
        setIsLeaving(true)
        setTimeout(() => {
          setIsVisible(false)
          onDismiss?.()
        }, 300)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [feedback, onDismiss])

  if (!feedback || !isVisible) return null

  const style = feedbackTypes[feedback.type] || feedbackTypes.good_pace

  return (
    <>
      {/* Background pulse effect */}
      <div 
        className={`fixed inset-0 pointer-events-none z-40 
                  bg-gradient-to-b ${style.color} opacity-0 animate-screenPulse`}
      />
      
      {/* Main feedback toast */}
      <div
        className={`fixed bottom-32 left-1/2 -translate-x-1/2 z-50 
                  transition-all duration-300 ${
                    isLeaving 
                      ? 'opacity-0 translate-y-4 scale-95' 
                      : 'opacity-100 translate-y-0 scale-100'
                  }`}
      >
        <div
          className={`relative flex items-center gap-3 px-6 py-4 rounded-2xl 
                    bg-gradient-to-r ${style.color} 
                    border-2 ${style.borderColor}
                    backdrop-blur-xl shadow-2xl
                    animate-slideUp
                    ${feedback.priority === 'high' ? 'ring-2 ring-white/20' : ''}`}
        >
          {/* Animated icon */}
          <span className="text-3xl animate-bounce">{style.icon}</span>
          
          {/* Message */}
          <p className={`font-semibold text-lg ${style.textColor} max-w-md`}>
            {feedback.message}
          </p>
          
          {/* Dismiss button */}
          <button
            onClick={() => {
              setIsLeaving(true)
              setTimeout(() => {
                setIsVisible(false)
                onDismiss?.()
              }, 300)
            }}
            className="ml-2 p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5 text-white/50 hover:text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </>
  )
}