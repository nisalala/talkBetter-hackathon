// src/app/results/page.js

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ScoreDisplay from '@/components/ScoreDisplay'
import TranscriptViewer from '@/components/TranscriptViewer'
import ComparisonRadar from '@/components/ComparisonRadar'
import VoiceCoach from '@/components/VoiceCoach'
import PricingModal from '@/components/PricingModal'
import GrammarFeedback from '@/components/GrammarFeedback'
import PronunciationFeedback from '@/components/PronunciationFeedback'
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

const tabs = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'feedback', label: 'Feedback', icon: '💬' },
  { id: 'language', label: 'Language', icon: '📝' },
  { id: 'transcript', label: 'Transcript', icon: '📄' },
]

export default function ResultsPage() {
  const router = useRouter()
  const { isAuthenticated, isPremium } = useAuth()
  const [results, setResults] = useState(null)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

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

  const hasPremium = mounted && isAuthenticated && isPremium && isPremium()

  if (!results) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  const { transcript, duration, mode, question, analysis, liveStats } = results

  const relevanceScore = analysis.relevanceScore ?? 100
  const isOffTopic = relevanceScore <= 20
  const displayOverallScore = isOffTopic ? 0 : (analysis.overallScore || 0)
  const displayScores = isOffTopic 
    ? Object.fromEntries(Object.keys(analysis.scores || {}).map(key => [key, 0]))
    : analysis.scores || {}

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreBg = (score) => {
    if (score >= 80) return 'from-green-500/20 to-emerald-500/20 border-green-500/30'
    if (score >= 60) return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30'
    return 'from-red-500/20 to-orange-500/20 border-red-500/30'
  }

  // Calculate quick insights for the header
  const wpm = analysis.metrics?.wpm || liveStats?.wpm || 0
  const wordCount = analysis.metrics?.wordCount || liveStats?.wordCount || 0
  const fillerCount = analysis.metrics?.fillerWords?.total || liveStats?.fillerCount || 0
  const grammarScore = analysis.grammar?.score || 0
  const pronunciationScore = analysis.pronunciation?.score || 0

  return (
    <div className="max-w-4xl mx-auto">
      {/* ============================================ */}
      {/* HERO SECTION - Score & Key Info             */}
      {/* ============================================ */}
      <div className={`glass rounded-3xl p-8 mb-6 bg-gradient-to-br ${getScoreBg(displayOverallScore)} border`}>
        {/* Off-topic warning banner */}
        {isOffTopic && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center gap-3">
            <span className="text-2xl">🚫</span>
            <div>
              <p className="text-red-400 font-medium">Off-Topic Response</p>
              <p className="text-red-400/70 text-sm">Your response didn&apos;t address the prompt. Scores set to 0.</p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Score Circle */}
          <div className="relative flex-shrink-0">
            <div className="w-40 h-40 rounded-full bg-gradient-to-br from-white/10 to-white/5 
                          flex items-center justify-center border border-white/20 shadow-2xl">
              <div className="text-center">
                <div className={`text-5xl font-bold ${getScoreColor(displayOverallScore)}`}>
                  {displayOverallScore}
                </div>
                <div className="text-gray-400 text-sm mt-1">Overall Score</div>
              </div>
            </div>
            {/* Decorative ring */}
            <div className="absolute inset-0 rounded-full border-4 border-white/5 animate-pulse" />
          </div>

          {/* Info & Quick Stats */}
          <div className="flex-1 text-center lg:text-left">
            {/* Mode & Duration */}
            <div className="flex items-center justify-center lg:justify-start gap-2 text-gray-400 text-sm mb-2">
              <span className="px-2 py-1 rounded-lg bg-white/10">{modeNames[mode]}</span>
              <span>•</span>
              <span>{formatDuration(duration)}</span>
            </div>

            {/* Question Preview */}
            {question && (
              <p className="text-white/80 text-lg mb-4 line-clamp-2">
                &quot;{question.text}&quot;
              </p>
            )}

            {/* Quick Stats Row */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-3">
              <QuickStat 
                value={wpm} 
                label="WPM" 
                status={wpm >= 120 && wpm <= 150 ? 'good' : wpm < 100 || wpm > 170 ? 'bad' : 'warn'}
              />
              <QuickStat 
                value={wordCount} 
                label="Words" 
                status="neutral"
              />
              <QuickStat 
                value={fillerCount} 
                label="Fillers" 
                status={fillerCount === 0 ? 'good' : fillerCount <= 3 ? 'warn' : 'bad'}
              />
              <QuickStat 
                value={`${grammarScore}%`} 
                label="Grammar" 
                status={grammarScore >= 80 ? 'good' : grammarScore >= 60 ? 'warn' : 'bad'}
              />
            </div>
          </div>

          {/* Category Scores - Compact Grid */}
          <div className="grid grid-cols-2 gap-2 flex-shrink-0">
            {Object.entries(displayScores).slice(0, 4).map(([key, value]) => (
              <div key={key} className="text-center p-3 rounded-xl bg-white/5 min-w-[80px]">
                <div className={`text-xl font-bold ${getScoreColor(value)}`}>{value}</div>
                <div className="text-xs text-gray-500 capitalize truncate">
                  {key.replace(/([A-Z])/g, ' $1')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* TAB NAVIGATION                              */}
      {/* ============================================ */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm 
                       transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {/* Badge for issues */}
            {tab.id === 'language' && (grammarScore < 80 || pronunciationScore < 80) && (
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
            )}
          </button>
        ))}
      </div>

      {/* ============================================ */}
      {/* TAB CONTENT                                 */}
      {/* ============================================ */}
      <div className="min-h-[400px]">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            {/* AI Voice Coach Summary */}
            {!isOffTopic && (
              <VoiceCoach feedback={analysis} score={displayOverallScore} />
            )}

            {/* Strengths & Improvements - Side by Side */}
            {!isOffTopic && (
              <div className="grid md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="glass rounded-2xl p-5">
                  <h3 className="flex items-center gap-2 text-green-400 font-semibold mb-3">
                    <span>✅</span> Strengths
                  </h3>
                  <ul className="space-y-2">
                    {(analysis.strengths || []).slice(0, 3).map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-green-400 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div className="glass rounded-2xl p-5">
                  <h3 className="flex items-center gap-2 text-yellow-400 font-semibold mb-3">
                    <span>📈</span> To Improve
                  </h3>
                  <ul className="space-y-2">
                    {(analysis.improvements || []).slice(0, 3).map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-yellow-400 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Example Improvement */}
            {!isOffTopic && analysis.rewrittenExample && (
              <div className="glass rounded-2xl p-5 border border-indigo-500/20">
                <h3 className="flex items-center gap-2 text-indigo-400 font-semibold mb-2">
                  <span>✨</span> Try Saying It Like This
                </h3>
                <p className="text-gray-300 italic text-sm">
                  &ldquo;{analysis.rewrittenExample}&rdquo;
                </p>
              </div>
            )}

            {/* Off-topic tips */}
            {isOffTopic && (
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">📝 How to Improve</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { icon: '👂', text: 'Listen carefully to the prompt' },
                    { icon: '🎯', text: 'Address the question directly' },
                    { icon: '🔑', text: 'Use keywords from the prompt' },
                    { icon: '📍', text: 'Stay focused, avoid tangents' },
                  ].map((tip, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                      <span className="text-xl">{tip.icon}</span>
                      <span className="text-gray-300 text-sm">{tip.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* FEEDBACK TAB */}
        {activeTab === 'feedback' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Comparison Radar */}
            {!isOffTopic && (
              <ComparisonRadar userScores={displayScores} mode={mode} />
            )}

            {/* Detailed Metrics */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">📊 Delivery Metrics</h3>
              
              <div className="space-y-4">
                {/* Speaking Pace */}
                <MetricRow 
                  icon="🎙️"
                  label="Speaking Pace"
                  value={`${wpm} WPM`}
                  status={analysis.metrics?.wpmRating?.rating || 'N/A'}
                  description={analysis.metrics?.wpmRating?.message || 'Aim for 120-150 WPM'}
                  type={wpm >= 120 && wpm <= 150 ? 'good' : wpm < 100 || wpm > 170 ? 'bad' : 'warn'}
                />

                {/* Timing */}
                {analysis.metrics?.durationEvaluation && (
                  <MetricRow 
                    icon="⏱️"
                    label="Timing"
                    value={formatDuration(duration)}
                    status={analysis.metrics.durationEvaluation.status === 'perfect' ? 'Perfect' : 'Adjust'}
                    description={analysis.metrics.durationEvaluation.message}
                    type={analysis.metrics.durationEvaluation.status === 'perfect' ? 'good' : 'warn'}
                  />
                )}

                {/* Filler Words */}
                <MetricRow 
                  icon="🔄"
                  label="Filler Words"
                  value={fillerCount}
                  status={fillerCount === 0 ? 'None!' : fillerCount <= 3 ? 'Few' : 'Too Many'}
                  description={fillerCount === 0 
                    ? 'Excellent! No filler words detected.' 
                    : `Try reducing "um", "uh", "like" in your speech`}
                  type={fillerCount === 0 ? 'good' : fillerCount <= 3 ? 'warn' : 'bad'}
                />
              </div>

              {/* Filler Words Breakdown */}
              {fillerCount > 0 && analysis.metrics?.fillerWords?.counts && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-gray-400 mb-2">Filler words used:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(analysis.metrics.fillerWords.counts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([word, count]) => (
                        <span 
                          key={word}
                          className={`px-2 py-1 rounded-lg text-xs font-medium ${
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
            </div>
          </div>
        )}

        {/* LANGUAGE TAB */}
        {activeTab === 'language' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Grammar */}
            {analysis.grammar && (
              <GrammarFeedback grammar={analysis.grammar} />
            )}

            {/* Pronunciation */}
            {analysis.pronunciation && (
              <PronunciationFeedback pronunciation={analysis.pronunciation} />
            )}

            {/* If no issues */}
            {(!analysis.grammar || analysis.grammar.issues?.length === 0) && 
             (!analysis.pronunciation || analysis.pronunciation.issues?.length === 0) && (
              <div className="glass rounded-2xl p-8 text-center">
                <div className="text-5xl mb-4">🌟</div>
                <h3 className="text-xl font-semibold text-white mb-2">Great Language Skills!</h3>
                <p className="text-gray-400">No significant grammar or pronunciation issues detected.</p>
              </div>
            )}
          </div>
        )}

        {/* TRANSCRIPT TAB */}
        {activeTab === 'transcript' && (
          <div className="animate-fadeIn">
            <TranscriptViewer transcript={transcript} />
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* BOTTOM CTAs                                 */}
      {/* ============================================ */}
      <div className="mt-8 space-y-4">
        {/* Premium Upsell - Compact */}
        {mounted && !hasPremium && (
          <div className="glass rounded-2xl p-4 border border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-lg">
                  ✨
                </div>
                <div>
                  <p className="text-white font-medium">Unlock Premium Features</p>
                  <p className="text-gray-400 text-sm">Two-way AI conversations, advanced coaching & more</p>
                </div>
              </div>
              <button
                onClick={() => setShowPricingModal(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 
                         text-white font-medium text-sm hover:from-purple-400 hover:to-indigo-400 
                         transition-all shadow-lg shadow-purple-500/25 whitespace-nowrap"
              >
                Try Free →
              </button>
            </div>
          </div>
        )}

        {/* Track Progress CTA */}
        {mounted && !isAuthenticated && (
          <div className="glass rounded-2xl p-4 border border-indigo-500/20">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📈</span>
                <div>
                  <p className="text-white font-medium">Track Your Progress</p>
                  <p className="text-gray-400 text-sm">Create a free profile to save sessions</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/profile')}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 
                         text-white font-medium text-sm transition-all"
              >
                Sign Up Free
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex-1 px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 
                     text-white font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span>🔄</span> Practice Again
          </button>
          <button
            onClick={() => router.push(isAuthenticated ? '/profile' : '/')}
            className="flex-1 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 
                     hover:from-indigo-400 hover:to-purple-400
                     text-white font-medium transition-all flex items-center justify-center gap-2
                     shadow-lg shadow-indigo-500/25"
          >
            <span>{isAuthenticated ? '📈' : '🎤'}</span>
            {isAuthenticated ? 'View Progress' : 'New Session'}
          </button>
        </div>
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

// ============================================
// HELPER COMPONENTS
// ============================================

function QuickStat({ value, label, status }) {
  const statusColors = {
    good: 'text-green-400',
    warn: 'text-yellow-400',
    bad: 'text-red-400',
    neutral: 'text-white',
  }

  return (
    <div className="px-3 py-2 rounded-xl bg-white/10 text-center min-w-[70px]">
      <div className={`text-lg font-bold ${statusColors[status]}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}

function MetricRow({ icon, label, value, status, description, type }) {
  const typeStyles = {
    good: 'border-green-500/30 bg-green-500/10',
    warn: 'border-yellow-500/30 bg-yellow-500/10',
    bad: 'border-red-500/30 bg-red-500/10',
  }

  const statusColors = {
    good: 'text-green-400 bg-green-500/20',
    warn: 'text-yellow-400 bg-yellow-500/20',
    bad: 'text-red-400 bg-red-500/20',
  }

  return (
    <div className={`p-4 rounded-xl border ${typeStyles[type]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <span className="text-white font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white font-bold">{value}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[type]}`}>
            {status}
          </span>
        </div>
      </div>
      <p className="text-gray-400 text-sm pl-9">{description}</p>
    </div>
  )
}