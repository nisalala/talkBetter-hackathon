// src/app/results/page.js

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ScoreDisplay from '@/components/ScoreDisplay'
import FeedbackCard from '@/components/FeedbackCard'
import TranscriptViewer from '@/components/TranscriptViewer'
import ComparisonRadar from '@/components/ComparisonRadar'
import VoiceCoach from '@/components/VoiceCoach'
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

  // Helper to get timing status color
  const getTimingStatusStyle = (status) => {
    if (!status) return 'border-gray-500/30 bg-gray-500/10'
    if (status === 'perfect') return 'border-green-500/30 bg-green-500/10'
    if (status.includes('short')) return 'border-yellow-500/30 bg-yellow-500/10'
    return 'border-orange-500/30 bg-orange-500/10'
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Your Results</h1>
        <div className="flex items-center justify-center gap-3 text-gray-400">
          <span>{modeNames[mode]}</span>
          <span>•</span>
          <span>{formatDuration(duration)}</span>
          {difficulty && (
            <>
              <span>•</span>
              <span>{difficultyInfo.icon} {difficultyInfo.name}</span>
            </>
          )}
        </div>
      </div>

      {/* Question they were answering */}
      {question && (
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">
              {question.isCustom ? '✏️ Custom Prompt' : '💡 Prompt'}
            </span>
            {question.duration && (
              <span className="text-sm text-gray-500">
                • Target: {question.duration < 60 ? `${question.duration}s` : `${Math.floor(question.duration / 60)}m`}
              </span>
            )}
          </div>
          <p className="text-lg text-white leading-relaxed">
            &quot;{question.text}&quot;
          </p>
        </div>
      )}

      {/* ============================================ */}
      {/* ⚠️ RELEVANCE WARNING (if off-topic)         */}
      {/* ============================================ */}
      {analysis.relevanceIssue && (
        <div className="glass rounded-2xl p-6 mb-8 border-2 border-red-500/30 bg-red-500/10">
          <div className="flex items-start gap-4">
            <div className="text-3xl flex-shrink-0">⚠️</div>
            <div>
              <h3 className="text-lg font-semibold text-red-400 mb-2">Off-Topic Response Detected</h3>
              <p className="text-gray-300 mb-3">{analysis.relevanceIssue}</p>
              <p className="text-sm text-gray-400">
                Your response didn&apos;t fully address the prompt. For the best feedback, make sure to answer the question directly.
              </p>
              {analysis.relevanceScore !== undefined && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20">
                  <span className="text-sm text-red-400">Relevance Score:</span>
                  <span className="text-sm font-bold text-red-300">{analysis.relevanceScore}/100</span>
                </div>
              )}
            </div>
          </div>
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

      {/* ============================================ */}
      {/* 🌟 WOW FACTOR #1: AI Voice Coach            */}
      {/* ============================================ */}
      <div className="mb-8">
        <VoiceCoach feedback={analysis} score={analysis.overallScore || 0} />
      </div>

      {/* ============================================ */}
      {/* 🌟 WOW FACTOR #2: Comparison Radar Chart    */}
      {/* ============================================ */}
      <div className="mb-8">
        <ComparisonRadar 
          userScores={analysis.scores || {}} 
          mode={mode} 
        />
      </div>

      {/* ============================================ */}
      {/* ⏱️ TIMING FEEDBACK                          */}
      {/* ============================================ */}
      {analysis.metrics?.durationEvaluation && (
        <div className={`glass rounded-xl p-4 mb-4 border ${getTimingStatusStyle(analysis.metrics.durationEvaluation.status)}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {analysis.metrics.durationEvaluation.status === 'perfect' ? '✅' : 
               analysis.metrics.durationEvaluation.status === 'too_short' ? '⏱️' :
               analysis.metrics.durationEvaluation.status === 'slightly_short' ? '⏱️' :
               '⏱️'}
            </span>
            <div>
              <p className="text-white font-medium">Timing</p>
              <p className="text-gray-300 text-sm">{analysis.metrics.durationEvaluation.message}</p>
            </div>
          </div>
        </div>
      )}

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
          <div className={`text-2xl font-bold ${
            (analysis.metrics?.fillerWords?.total || 0) === 0 ? 'text-green-400' :
            (analysis.metrics?.fillerWords?.total || 0) <= 3 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {analysis.metrics?.fillerWords?.total || 0}
          </div>
          <div className="text-sm text-gray-400">Filler Words</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{formatDuration(duration)}</div>
          <div className="text-sm text-gray-400">Duration</div>
        </div>
      </div>

      {/* Filler Words Breakdown (if any) */}
      {analysis.metrics?.fillerWords?.counts && Object.keys(analysis.metrics.fillerWords.counts).length > 0 && (
        <div className="glass rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🔄</span>
            <span className="text-white font-medium">Filler Words Used</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(analysis.metrics.fillerWords.counts)
              .sort((a, b) => b[1] - a[1])
              .map(([word, count]) => (
                <span 
                  key={word}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                    count >= 5 ? 'bg-red-500/20 text-red-400' :
                    count >= 3 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  &quot;{word}&quot; × {count}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* WPM Rating */}
      {analysis.metrics?.wpmRating && (
        <div className={`glass rounded-xl p-4 mb-8 border ${
          analysis.metrics.wpmRating.status === 'good' ? 'border-green-500/30 bg-green-500/10' :
          analysis.metrics.wpmRating.status === 'slow' || analysis.metrics.wpmRating.status === 'fast' 
            ? 'border-yellow-500/30 bg-yellow-500/10' :
          'border-orange-500/30 bg-orange-500/10'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {analysis.metrics.wpmRating.status === 'good' ? '✅' : 
               analysis.metrics.wpmRating.status === 'too_slow' ? '🐢' :
               analysis.metrics.wpmRating.status === 'too_fast' ? '🐇' :
               '🎯'}
            </span>
            <div>
              <p className="text-white font-medium">
                Speaking Pace: {analysis.metrics.wpmRating.rating || 'N/A'}
              </p>
              <p className="text-gray-300 text-sm">{analysis.metrics.wpmRating.message}</p>
            </div>
          </div>
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

      {/* Timing & Pace Specific Feedback */}
      {(analysis.timingFeedback || analysis.paceFeedback) && (
        <div className="glass rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>📊</span> Delivery Analysis
          </h3>
          <div className="space-y-4">
            {analysis.timingFeedback && (
              <div className="flex items-start gap-3">
                <span className="text-xl">⏱️</span>
                <div>
                  <p className="text-white font-medium">Timing</p>
                  <p className="text-gray-400 text-sm">{analysis.timingFeedback}</p>
                </div>
              </div>
            )}
            {analysis.paceFeedback && (
              <div className="flex items-start gap-3">
                <span className="text-xl">🎙️</span>
                <div>
                  <p className="text-white font-medium">Pace</p>
                  <p className="text-gray-400 text-sm">{analysis.paceFeedback}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
          onClick={() => router.push('/')}
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
    </div>
  )
}