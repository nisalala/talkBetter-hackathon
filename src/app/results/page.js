'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ScoreDisplay from '@/components/ScoreDisplay'
import FeedbackCard from '@/components/FeedbackCard'
import TranscriptViewer from '@/components/TranscriptViewer'
import { useAuth } from '@/contexts/AuthContext'

const modeNames = {
  pitch: 'Pitch',
  interview: 'Interview',
  meeting: 'Meeting',
  date: 'Date',
  difficult: 'Difficult Talk',
  speech: 'Speech',
  general: 'General',
}

const difficultyLabels = {
  gentle: { name: 'Gentle', icon: '🌱' },
  balanced: { name: 'Balanced', icon: '🎯' },
  tough: { name: 'Tough Love', icon: '🔥' },
}

export default function ResultsPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [results, setResults] = useState(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('talkbetter_results')
    if (!stored) {
      router.push('/')
      return
    }
    setResults(JSON.parse(stored))
  }, [router])

  if (!results) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  const { transcript, duration, mode, difficulty, question, analysis } = results

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  const difficultyInfo = difficultyLabels[difficulty] || difficultyLabels.balanced

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Your Results</h1>
        <div className="flex items-center justify-center gap-3 text-gray-400">
          <span>{modeNames[mode]}</span>
          <span>•</span>
          <span>{formatDuration(duration)}</span>
          <span>•</span>
          <span>{difficultyInfo.icon} {difficultyInfo.name}</span>
        </div>
      </div>

      {/* Question they were answering */}
      {question && (
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">
              {question.isCustom ? '✏️ Custom Prompt' : '💡 Prompt'}
            </span>
          </div>
          <p className="text-lg text-white leading-relaxed">
            "{question.text}"
          </p>
        </div>
      )}

      {/* Overall Score */}
      <div className="glass rounded-2xl p-8 mb-8">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          <ScoreDisplay 
            score={analysis.overallScore || 0} 
            label="Overall Score" 
            size="large" 
          />
          
          {/* Metric scores */}
          <div className="grid grid-cols-2 gap-6">
            {analysis.scores && Object.entries(analysis.scores).map(([key, value]) => (
              <ScoreDisplay 
                key={key} 
                score={value || 0} 
                label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{analysis.metrics?.wpm || 0}</div>
          <div className="text-sm text-gray-400">Words/min</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{analysis.metrics?.wordCount || 0}</div>
          <div className="text-sm text-gray-400">Total Words</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{analysis.metrics?.fillerWords?.total || 0}</div>
          <div className="text-sm text-gray-400">Filler Words</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{formatDuration(duration)}</div>
          <div className="text-sm text-gray-400">Duration</div>
        </div>
      </div>

      {/* WPM Rating */}
      {analysis.metrics?.wpmRating && (
        <div className="glass rounded-xl p-4 mb-8">
          <p className="text-gray-300">
            <span className="font-medium text-white">Pace: </span>
            {analysis.metrics.wpmRating.message}
          </p>
        </div>
      )}

      {/* Feedback Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <FeedbackCard 
          title="Strengths" 
          items={analysis.strengths || []} 
          type="strengths" 
        />
        <FeedbackCard 
          title="Areas to Improve" 
          items={analysis.improvements || []} 
          type="improvements" 
        />
      </div>

      {/* Rewritten Example */}
      {analysis.rewrittenExample && (
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-xl">
              ✨
            </div>
            <h3 className="text-lg font-semibold text-indigo-400">Example Improvement</h3>
          </div>
          <p className="text-gray-300 italic">&ldquo;{analysis.rewrittenExample}&rdquo;</p>
        </div>
      )}

      {/* Transcript */}
      <TranscriptViewer transcript={transcript} />

      {/* Track Progress CTA (only for non-logged in users) */}
{!isAuthenticated && (
  <div className="glass rounded-2xl p-6 mb-8 border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-center sm:text-left">
        <h3 className="text-lg font-semibold text-white mb-1">
          📈 Want to track your improvement?
        </h3>
        <p className="text-gray-400 text-sm">
          Create a free profile to save your sessions and see progress over time
        </p>
      </div>
      <button
        onClick={() => router.push('/profile')}
        className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 
                 text-white font-semibold hover:from-indigo-400 hover:to-purple-400 
                 transition-all whitespace-nowrap shadow-lg shadow-indigo-500/25"
      >
        Track My Progress
      </button>
    </div>
  </div>
)}

{/* Action Buttons */}
<div className="flex flex-col sm:flex-row gap-4 mt-8">
  <button
    onClick={() => router.push(`/record/${mode}`)}
    className="flex-1 px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 
             text-white font-medium transition-colors text-center"
  >
    🔄 Try Again
  </button>
  {isAuthenticated ? (
    <button
      onClick={() => router.push('/profile')}
      className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 
               hover:from-indigo-400 hover:to-purple-400
               text-white font-medium transition-all text-center"
    >
      📈 View Progress
    </button>
  ) : (
    <button
      onClick={() => router.push('/')}
      className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 
               hover:from-indigo-400 hover:to-purple-400
               text-white font-medium transition-all text-center"
    >
      🎤 New Session
    </button>
  )}
</div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <button
          onClick={() => router.push(`/record/${mode}`)}
          className="flex-1 px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 
                   text-white font-medium transition-colors text-center"
        >
          Try Again
        </button>
        <button
          onClick={() => router.push('/')}
          className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 
                   hover:from-indigo-400 hover:to-purple-400
                   text-white font-medium transition-all text-center"
        >
          Choose New Mode
        </button>
      </div>
    </div>
  )
}