// src/app/results/conversation/page.js

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { saveSession } from '@/lib/storage'
import ConversationBubble from '@/components/ConversationBubble'
import GrammarFeedback from '@/components/GrammarFeedback'
import PronunciationFeedback from '@/components/PronunciationFeedback'
import VoiceCoach from '@/components/VoiceCoach'

const tabs = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'feedback', label: 'Feedback', icon: '💬' },
  { id: 'language', label: 'Language', icon: '📝' },
  { id: 'conversation', label: 'Chat Log', icon: '🗨️' },
]

export default function ConversationResultsPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [results, setResults] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const stored = sessionStorage.getItem('talkbetter_results')
    if (!stored) {
      router.push('/')
      return
    }
    
    const data = JSON.parse(stored)
    if (data.type !== 'conversation') {
      router.push('/results')
      return
    }
    
    setResults(data)

    // Save to history if authenticated
    if (isAuthenticated && data.analysis) {
      saveSession({
        type: 'conversation',
        mode: data.mode,
        scenario: data.scenario,
        duration: data.duration,
        messageCount: data.messages?.length || 0,
        analysis: data.analysis,
      })
    }
  }, [router, isAuthenticated])

  if (!results) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  const { messages = [], scenario = {}, analysis = {}, duration = 0 } = results

  // Scores & Metrics
  const relevanceScore = analysis.relevanceScore ?? 100
  const isOffTopic = relevanceScore <= 20
  const displayOverallScore = isOffTopic ? 0 : (analysis.overallScore || 0)
  const displayScores = isOffTopic 
    ? Object.fromEntries(Object.keys(analysis.scores || {}).map(key => [key, 0]))
    : analysis.scores || {}

  // Quick metrics
  const userResponses = analysis.metrics?.userResponses || 0
  const avgWords = analysis.metrics?.avgWordsPerResponse || 0
  const wordCount = analysis.metrics?.wordCount || 0
  const fillerCount = analysis.metrics?.fillerWords || 0
  const grammarScore = analysis.grammar?.score || 0
  const pronunciationScore = analysis.pronunciation?.score || 0
  const flowScore = analysis.conversationFlow?.score || 0
  const questionScore = analysis.questionHandling?.score || 0

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

  return (
    <div className="max-w-4xl mx-auto">
      {/* ============================================ */}
      {/* HERO SECTION                                */}
      {/* ============================================ */}
      <div className={`glass rounded-3xl p-8 mb-6 bg-gradient-to-br ${getScoreBg(displayOverallScore)} border`}>
        {/* Off-topic warning */}
        {isOffTopic && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center gap-3">
            <span className="text-2xl">🚫</span>
            <div>
              <p className="text-red-400 font-medium">Off-Topic Conversation</p>
              <p className="text-red-400/70 text-sm">Responses didn&apos;t match the scenario. Scores set to 0.</p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Score Circle */}
          <div className="relative flex-shrink-0">
            <div className="w-36 h-36 rounded-full bg-gradient-to-br from-white/10 to-white/5 
                          flex items-center justify-center border border-white/20 shadow-2xl">
              <div className="text-center">
                <div className={`text-5xl font-bold ${getScoreColor(displayOverallScore)}`}>
                  {displayOverallScore}
                </div>
                <div className="text-gray-400 text-xs mt-1">Overall</div>
              </div>
            </div>
            {/* Conversation badge */}
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 
                          flex items-center justify-center text-lg shadow-lg">
              💬
            </div>
          </div>

          {/* Scenario Info & Quick Stats */}
          <div className="flex-1 text-center lg:text-left">
            {/* Scenario name */}
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
              <span className="px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-400 text-sm font-medium">
                AI Conversation
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {scenario.name || 'Conversation Practice'}
            </h1>
            <p className="text-gray-400 text-sm mb-4">
              {messages.length} exchanges • {formatDuration(duration)}
            </p>

            {/* Quick Stats Row */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-3">
              <QuickStat 
                value={userResponses} 
                label="Responses" 
                status="neutral"
              />
              <QuickStat 
                value={avgWords} 
                label="Avg Words" 
                status={avgWords >= 20 ? 'good' : avgWords >= 10 ? 'warn' : 'bad'}
              />
              <QuickStat 
                value={fillerCount} 
                label="Fillers" 
                status={fillerCount === 0 ? 'good' : fillerCount <= 3 ? 'warn' : 'bad'}
              />
              <QuickStat 
                value={`${flowScore}%`} 
                label="Flow" 
                status={flowScore >= 80 ? 'good' : flowScore >= 60 ? 'warn' : 'bad'}
              />
            </div>
          </div>

          {/* Category Scores - Compact Grid */}
          <div className="grid grid-cols-2 gap-2 flex-shrink-0">
            {Object.entries(displayScores).slice(0, 4).map(([key, value]) => (
              <div key={key} className="text-center p-3 rounded-xl bg-white/5 min-w-[75px]">
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
            {/* Badge for language issues */}
            {tab.id === 'language' && (grammarScore < 80 || pronunciationScore < 80) && (
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
            )}
            {/* Badge for conversation count */}
            {tab.id === 'conversation' && (
              <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-xs">
                {messages.length}
              </span>
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
            {/* AI Coach Summary */}
            {!isOffTopic && (
              <VoiceCoach feedback={analysis} score={displayOverallScore} />
            )}

            {/* Focus Area */}
            {!isOffTopic && analysis.recommendedFocus && (
              <div className="glass rounded-2xl p-5 border border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-xl flex-shrink-0">
                    🎯
                  </div>
                  <div>
                    <h3 className="text-indigo-400 font-semibold mb-1">Focus Area</h3>
                    <p className="text-gray-300 text-sm">{analysis.recommendedFocus}</p>
                  </div>
                </div>
              </div>
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

            {/* Overall Feedback */}
            {!isOffTopic && analysis.overallFeedback && (
              <div className="glass rounded-2xl p-5">
                <h3 className="flex items-center gap-2 text-white font-semibold mb-2">
                  <span>💡</span> Summary
                </h3>
                <p className="text-gray-300 text-sm">{analysis.overallFeedback}</p>
              </div>
            )}

            {/* Off-topic tips */}
            {isOffTopic && (
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">📝 Tips for Staying On Topic</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { icon: '📖', text: 'Read the scenario before starting' },
                    { icon: '🎭', text: 'Stay in character' },
                    { icon: '👂', text: 'Respond to what the AI says' },
                    { icon: '❓', text: 'Answer questions before changing topics' },
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
            {/* Conversation Skills */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">🎯 Conversation Skills</h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Conversation Flow */}
                {analysis.conversationFlow && (
                  <SkillCard 
                    icon="🌊"
                    label="Conversation Flow"
                    score={analysis.conversationFlow.score}
                    feedback={analysis.conversationFlow.feedback}
                  />
                )}

                {/* Question Handling */}
                {analysis.questionHandling && (
                  <SkillCard 
                    icon="❓"
                    label="Question Handling"
                    score={analysis.questionHandling.score}
                    feedback={analysis.questionHandling.feedback}
                  />
                )}
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">📊 Your Stats</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard 
                  icon="💬"
                  value={userResponses}
                  label="Responses"
                  type="neutral"
                />
                <MetricCard 
                  icon="📝"
                  value={avgWords}
                  label="Avg Words"
                  type={avgWords >= 20 ? 'good' : avgWords >= 10 ? 'warn' : 'bad'}
                />
                <MetricCard 
                  icon="📚"
                  value={wordCount}
                  label="Total Words"
                  type="neutral"
                />
                <MetricCard 
                  icon="🔄"
                  value={fillerCount}
                  label="Fillers"
                  type={fillerCount === 0 ? 'good' : fillerCount <= 3 ? 'warn' : 'bad'}
                />
              </div>
            </div>

            {/* Key Moments */}
            {analysis.keyMoments && analysis.keyMoments.length > 0 && (
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">🔑 Key Moments</h3>
                <div className="space-y-3">
                  {analysis.keyMoments.map((moment, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-xl ${
                        moment.type === 'strength'
                          ? 'bg-green-500/10 border border-green-500/20'
                          : 'bg-yellow-500/10 border border-yellow-500/20'
                      }`}
                    >
                      <p className="text-white text-sm mb-2 italic">&ldquo;{moment.quote}&rdquo;</p>
                      <p className={`text-xs ${moment.type === 'strength' ? 'text-green-400' : 'text-yellow-400'}`}>
                        {moment.feedback}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Scores */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">📈 All Scores</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(displayScores).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                    <span className="text-gray-400 text-sm capitalize">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span className={`font-bold ${getScoreColor(value)}`}>{value}</span>
                  </div>
                ))}
              </div>
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

            {/* No issues message */}
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

        {/* CONVERSATION TAB */}
        {activeTab === 'conversation' && (
          <div className="animate-fadeIn">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span>💬</span> Full Conversation
                </h3>
                <span className="text-gray-400 text-sm">{messages.length} messages</span>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                {messages.map((message, index) => (
                  <ConversationBubble key={message.id || index} message={message} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* BOTTOM CTAs                                 */}
      {/* ============================================ */}
      <div className="mt-8 space-y-4">
        {/* Track Progress CTA */}
        {mounted && !isAuthenticated && (
          <div className="glass rounded-2xl p-4 border border-indigo-500/20">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📈</span>
                <div>
                  <p className="text-white font-medium">Track Your Progress</p>
                  <p className="text-gray-400 text-sm">Save this session and see improvement over time</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/profile')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 
                         text-white font-medium text-sm hover:from-indigo-400 hover:to-purple-400 
                         transition-all shadow-lg shadow-indigo-500/25"
              >
                Sign Up Free
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/conversation')}
            className="flex-1 px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 
                     text-white font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span>🔄</span> Try Another
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 
                     hover:from-indigo-400 hover:to-purple-400
                     text-white font-medium transition-all flex items-center justify-center gap-2
                     shadow-lg shadow-indigo-500/25"
          >
            <span>🏠</span> Back to Home
          </button>
        </div>
      </div>
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
    <div className="px-3 py-2 rounded-xl bg-white/10 text-center min-w-[65px]">
      <div className={`text-lg font-bold ${statusColors[status]}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}

function SkillCard({ icon, label, score, feedback }) {
  const getScoreColor = (s) => {
    if (s >= 80) return 'text-green-400'
    if (s >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreBg = (s) => {
    if (s >= 80) return 'border-green-500/30 bg-green-500/10'
    if (s >= 60) return 'border-yellow-500/30 bg-yellow-500/10'
    return 'border-red-500/30 bg-red-500/10'
  }

  return (
    <div className={`p-4 rounded-xl border ${getScoreBg(score)}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="text-white font-medium text-sm">{label}</span>
        </div>
        <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
      </div>
      <p className="text-gray-400 text-xs">{feedback}</p>
    </div>
  )
}

function MetricCard({ icon, value, label, type }) {
  const typeColors = {
    good: 'text-green-400',
    warn: 'text-yellow-400',
    bad: 'text-red-400',
    neutral: 'text-white',
  }

  return (
    <div className="text-center p-4 rounded-xl bg-white/5">
      <div className="text-xl mb-1">{icon}</div>
      <div className={`text-2xl font-bold ${typeColors[type]}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}