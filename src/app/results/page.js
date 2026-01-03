// src/app/results/page.js

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ScoreDisplay from '@/components/ScoreDisplay'
import FeedbackCard from '@/components/FeedbackCard'
import TranscriptViewer from '@/components/TranscriptViewer'
import ComparisonRadar from '@/components/ComparisonRadar'
import VoiceCoach from '@/components/VoiceCoach'
import PricingModal from '@/components/PricingModal'
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
  const { isAuthenticated, isPremium, isLoading } = useAuth()
  const [results, setResults] = useState(null)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const stored = sessionStorage.getItem('talkbetter_results')
    if (!stored) {
      router.push('/')
      return
    }
    setResults(JSON.parse(stored))
  }, [router])

  // Check premium status after mount
  const hasPremium = mounted && isAuthenticated && isPremium && isPremium()

  if (!results) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  const { transcript, duration, mode, difficulty, question, analysis, liveStats, audioUrl } = results

  // ============================================
  // 🎯 CONTEXT-AWARE: Check if response is off-topic
  // ============================================
  const relevanceScore = analysis.relevanceScore ?? 100
  const isOffTopic = relevanceScore <= 20
  const isSomewhatOffTopic = relevanceScore > 20 && relevanceScore <= 50

  // Apply zero scores if completely off-topic
  const displayScores = isOffTopic 
    ? Object.fromEntries(Object.keys(analysis.scores || {}).map(key => [key, 0]))
    : analysis.scores || {}

  const displayOverallScore = isOffTopic ? 0 : (analysis.overallScore || 0)

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

  // Helper to get relevance color
  const getRelevanceColor = (score) => {
    if (score <= 20) return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' }
    if (score <= 50) return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' }
    if (score <= 75) return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' }
    return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' }
  }

  const relevanceStyle = getRelevanceColor(relevanceScore)

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
      {/* 🎯 RELEVANCE SCORE DISPLAY                  */}
      {/* ============================================ */}
      {analysis.relevanceScore !== undefined && (
        <div className={`glass rounded-2xl p-6 mb-8 border-2 ${relevanceStyle.border} ${relevanceStyle.bg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">
                {isOffTopic ? '🚫' : isSomewhatOffTopic ? '⚠️' : '✅'}
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${relevanceStyle.text}`}>
                  {isOffTopic ? 'Off-Topic Response' : 
                   isSomewhatOffTopic ? 'Partially Relevant' : 
                   'On Topic'}
                </h3>
                <p className="text-gray-400 text-sm">
                  {isOffTopic 
                    ? 'Your response didn\'t address the prompt. All scores set to 0.'
                    : isSomewhatOffTopic
                    ? 'Your response partially addressed the prompt.'
                    : 'Great job staying on topic!'}
                </p>
              </div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${relevanceStyle.text}`}>
                {relevanceScore}
              </div>
              <div className="text-xs text-gray-500">Relevance</div>
            </div>
          </div>
          
          {analysis.relevanceIssue && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-gray-300 text-sm">{analysis.relevanceIssue}</p>
            </div>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* ⚠️ OFF-TOPIC WARNING                        */}
      {/* ============================================ */}
      {isOffTopic && (
        <div className="glass rounded-2xl p-6 mb-8 border-2 border-red-500/50 bg-gradient-to-r from-red-500/20 to-orange-500/20">
          <div className="flex items-start gap-4">
            <div className="text-4xl flex-shrink-0 animate-pulse">🚨</div>
            <div>
              <h3 className="text-xl font-bold text-red-400 mb-2">
                Scores Set to Zero
              </h3>
              <p className="text-gray-300 mb-4">
                Because your response was completely off-topic (relevance score: {relevanceScore}/100), 
                all performance scores have been set to zero.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 rounded-full bg-red-500/20 text-red-400 text-sm font-medium">
                  💡 Tip: Listen carefully to the prompt
                </span>
                <span className="px-3 py-1.5 rounded-full bg-red-500/20 text-red-400 text-sm font-medium">
                  🎯 Address the question directly
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overall Score */}
      <div className={`glass rounded-2xl p-8 mb-8 ${isOffTopic ? 'opacity-60' : ''}`}>
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          <div className="relative">
            <ScoreDisplay 
              score={displayOverallScore} 
              label="Overall Score" 
              size="large" 
            />
            {isOffTopic && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl opacity-30">🚫</span>
              </div>
            )}
          </div>
          
          {/* Metric scores */}
          <div className="grid grid-cols-2 gap-6">
            {Object.entries(displayScores).map(([key, value]) => (
              <ScoreDisplay 
                key={key} 
                score={value || 0} 
                label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} 
              />
            ))}
          </div>
        </div>
        
        {isOffTopic && (
          <p className="text-center text-gray-500 text-sm mt-4">
            Scores shown as 0 due to off-topic response
          </p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{analysis.metrics?.wpm || liveStats?.wpm || 0}</div>
          <div className="text-sm text-gray-400">Words/min</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{analysis.metrics?.wordCount || liveStats?.wordCount || 0}</div>
          <div className="text-sm text-gray-400">Total Words</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className={`text-2xl font-bold ${
            (analysis.metrics?.fillerWords?.total || liveStats?.fillerCount || 0) === 0 ? 'text-green-400' :
            (analysis.metrics?.fillerWords?.total || liveStats?.fillerCount || 0) <= 3 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {analysis.metrics?.fillerWords?.total || liveStats?.fillerCount || 0}
          </div>
          <div className="text-sm text-gray-400">Filler Words</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{formatDuration(duration)}</div>
          <div className="text-sm text-gray-400">Duration</div>
        </div>
      </div>

      {/* Only show detailed feedback if NOT off-topic */}
      {!isOffTopic && (
        <>
        {/* 🌟 AI Voice Coach */}
          <div className="mb-8">
            <VoiceCoach feedback={analysis} score={displayOverallScore} />
          </div>
          {/* ⏱️ TIMING FEEDBACK */}
          {analysis.metrics?.durationEvaluation && (
            <div className={`glass rounded-xl p-4 mb-4 border ${getTimingStatusStyle(analysis.metrics.durationEvaluation.status)}`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {analysis.metrics.durationEvaluation.status === 'perfect' ? '✅' : '⏱️'}
                </span>
                <div>
                  <p className="text-white font-medium">Timing</p>
                  <p className="text-gray-300 text-sm">{analysis.metrics.durationEvaluation.message}</p>
                </div>
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

          {/* Feedback Cards - Strengths & Improvements */}
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

      

          {/* Filler Words Breakdown */}
          {(analysis.metrics?.fillerWords?.counts || liveStats?.fillerWords) && 
           Object.keys(analysis.metrics?.fillerWords?.counts || liveStats?.fillerWords || {}).length > 0 && (
            <div className="glass rounded-xl p-4 mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🔄</span>
                <span className="text-white font-medium">Filler Words Used</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(analysis.metrics?.fillerWords?.counts || liveStats?.fillerWords || {})
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

          {/* 🌟 Comparison Radar Chart - Moved towards the end */}
          <div className="mb-8">
            <ComparisonRadar 
              userScores={displayScores} 
              mode={mode} 
            />
          </div>
        </>
      )}

      {/* Off-topic specific feedback */}
      {isOffTopic && (
        <div className="glass rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>📝</span> How to Improve
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-yellow-400 mt-1">1.</span>
              <span className="text-gray-300">Read or listen to the prompt carefully before responding</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-400 mt-1">2.</span>
              <span className="text-gray-300">Start your response by directly addressing the question</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-400 mt-1">3.</span>
              <span className="text-gray-300">Stay focused on the topic - don&apos;t go on tangents</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-yellow-400 mt-1">4.</span>
              <span className="text-gray-300">Use keywords from the prompt in your answer</span>
            </li>
          </ul>
        </div>
      )}

      {/* Transcript */}
      <TranscriptViewer transcript={transcript} />

      {/* ============================================ */}
      {/* ✨ PREMIUM UPSELL - Get Better Analysis     */}
      {/* ============================================ */}
      {mounted && !hasPremium && (
        <div className="glass rounded-2xl p-6 mb-8 border border-purple-500/30 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-pink-500/10 overflow-hidden relative mt-5">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-500/20 to-transparent rounded-full blur-2xl" />
          
          <div className="relative">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-2xl shadow-lg shadow-purple-500/30">
                  🚀
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">
                  Want Even Better Insights?
                </h3>
                <p className="text-gray-300 text-sm mb-3">
                  Unlock premium features for deeper analysis and faster improvement
                </p>
                
                {/* Premium features preview */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { icon: '💬', text: 'Two-way AI conversations' },
                    { icon: '🎯', text: 'Advanced coaching tips' },
                    { icon: '📈', text: 'Detailed progress tracking' },
                    { icon: '⚡', text: 'Priority AI processing' },
                  ].map((feature, i) => (
                    <span 
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-xs text-gray-300"
                    >
                      <span>{feature.icon}</span>
                      {feature.text}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col gap-2 w-full md:w-auto">
                <button
                  onClick={() => setShowPricingModal(true)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 
                           text-white font-semibold hover:from-purple-400 hover:to-indigo-400 
                           transition-all shadow-lg shadow-purple-500/25 whitespace-nowrap"
                >
                  ✨ Upgrade to Premium
                </button>
                <p className="text-center text-xs text-gray-500">
                  7-day free trial available
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Track Progress CTA (for non-logged in users) */}
      {mounted && !isAuthenticated && (
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
        {mounted && isAuthenticated ? (
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

      {/* Pricing Modal */}
      {showPricingModal && (
        <PricingModal 
          onClose={() => setShowPricingModal(false)} 
          feature="Premium Analysis"
        />
      )}
    </div>
  )
}