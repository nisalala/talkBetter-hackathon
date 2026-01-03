// src/components/PronunciationFeedback.jsx

'use client'

import { useState } from 'react'

const issueTypeConfig = {
  mispronunciation: { label: 'Mispronunciation', icon: '🗣️', color: 'text-red-400', bg: 'bg-red-500/20' },
  slurred: { label: 'Slurred Speech', icon: '💨', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  unclear: { label: 'Unclear', icon: '❓', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  informal: { label: 'Informal Speech', icon: '💬', color: 'text-blue-400', bg: 'bg-blue-500/20' },
}

const clarityConfig = {
  clear: { label: 'Clear', icon: '✅', color: 'text-green-400' },
  mostly_clear: { label: 'Mostly Clear', icon: '👍', color: 'text-yellow-400' },
  unclear: { label: 'Needs Improvement', icon: '⚠️', color: 'text-red-400' },
}

export default function PronunciationFeedback({ pronunciation }) {
  const [showTips, setShowTips] = useState(false)

  if (!pronunciation) return null

  const { score, clarity, issues = [], feedback, informalSpeech = [] } = pronunciation
  
  const clarityInfo = clarityConfig[clarity] || clarityConfig.mostly_clear

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-400'
    if (score >= 75) return 'text-yellow-400'
    if (score >= 60) return 'text-orange-400'
    return 'text-red-400'
  }

  // Pronunciation tips
  const tips = [
    { icon: '🐢', tip: 'Slow down - Speaking too fast causes slurring' },
    { icon: '🎯', tip: 'Enunciate each syllable clearly' },
    { icon: '💧', tip: 'Stay hydrated - A dry throat affects clarity' },
    { icon: '🪞', tip: 'Practice in front of a mirror' },
    { icon: '📚', tip: 'Read aloud daily to improve articulation' },
    { icon: '🎧', tip: 'Record yourself and listen back' },
  ]

  return (
    <div className="glass rounded-2xl p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 
                        flex items-center justify-center text-2xl border border-cyan-500/30">
            🎙️
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Pronunciation & Clarity</h3>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${clarityInfo.color}`}>
                {clarityInfo.icon} {clarityInfo.label}
              </span>
            </div>
          </div>
        </div>
        
        {/* Score */}
        <div className="text-center">
          <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
            {score}
          </div>
          <div className="text-xs text-gray-500">Clarity Score</div>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <p className="text-gray-300 text-sm mb-4 p-3 rounded-lg bg-white/5">
          {feedback}
        </p>
      )}

      {/* Score Bar */}
      <div className="mb-6">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              score >= 90 ? 'bg-green-500' :
              score >= 75 ? 'bg-yellow-500' :
              score >= 60 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Issues */}
      {issues.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-400 font-medium mb-3">
            Potential pronunciation issues:
          </p>
          <div className="flex flex-wrap gap-2">
            {issues.map((issue, index) => {
              const typeInfo = issueTypeConfig[issue.type] || issueTypeConfig.unclear
              
              return (
                <div 
                  key={index}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${typeInfo.bg} border border-white/10`}
                >
                  <span className="text-lg">{typeInfo.icon}</span>
                  <div>
                    <span className="text-white text-sm font-medium line-through opacity-60">
                      {issue.word}
                    </span>
                    {issue.suggestion && (
                      <>
                        <span className="text-gray-500 mx-1">→</span>
                        <span className={`text-sm font-medium ${typeInfo.color}`}>
                          {issue.suggestion}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Informal Speech Section */}
      {informalSpeech && informalSpeech.length > 0 && (
        <div className="mb-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm text-blue-400 font-medium mb-2">
            💬 Informal speech patterns detected:
          </p>
          <p className="text-xs text-gray-400 mb-3">
            These are common in casual speech but may be too informal for professional settings.
          </p>
          <div className="flex flex-wrap gap-2">
            {informalSpeech.map((item, index) => (
              <span 
                key={index}
                className="px-2 py-1 rounded bg-white/10 text-sm"
              >
                <span className="text-gray-400">&quot;{item.said}&quot;</span>
                <span className="text-gray-600 mx-1">→</span>
                <span className="text-blue-400">&quot;{item.formal}&quot;</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* No Issues */}
      {issues.length === 0 && (!informalSpeech || informalSpeech.length === 0) && (
        <div className="text-center py-4">
          <span className="text-3xl">🎯</span>
          <p className="text-green-400 font-medium mt-2">Great pronunciation!</p>
          <p className="text-gray-500 text-sm">Your speech was clear and articulate.</p>
        </div>
      )}

      {/* Tips Toggle */}
      <button
        onClick={() => setShowTips(!showTips)}
        className="w-full mt-4 py-2 text-sm text-indigo-400 hover:text-indigo-300 
                 transition-colors flex items-center justify-center gap-2"
      >
        {showTips ? '← Hide Tips' : '💡 Show Pronunciation Tips'}
      </button>

      {/* Tips Section */}
      {showTips && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="grid sm:grid-cols-2 gap-2">
            {tips.map((tip, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 p-2 rounded-lg bg-white/5 text-sm"
              >
                <span className="text-lg">{tip.icon}</span>
                <span className="text-gray-300">{tip.tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}