// src/app/results/conversation/page.js

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { saveSession } from '@/lib/storage'
import ScoreDisplay from '@/components/ScoreDisplay'
import ConversationBubble from '@/components/ConversationBubble'

export default function ConversationResultsPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [results, setResults] = useState(null)
  const [showFullConversation, setShowFullConversation] = useState(false)

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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 mb-4">
          <span className="text-xl">💬</span>
          <span className="text-indigo-400 font-medium">Conversation Analysis</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">{scenario.name || 'Conversation Practice'}</h1>
        <div className="flex items-center justify-center gap-3 text-gray-400">
          <span>{messages.length} exchanges</span>
          <span>•</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      {/* Overall Score */}
      <div className="glass rounded-2xl p-8 mb-8">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          <ScoreDisplay
            score={analysis.overallScore || 0}
            label="Overall Performance"
            size="large"
          />

          {/* Individual scores */}
          {analysis.scores && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Object.entries(analysis.scores).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(value)}`}>
                    {value}
                  </div>
                  <div className="text-sm text-gray-400 capitalize">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Overall Feedback */}
      {analysis.overallFeedback && (
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="text-3xl">💡</div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Summary</h3>
              <p className="text-gray-300">{analysis.overallFeedback}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recommended Focus */}
      {analysis.recommendedFocus && (
        <div className="glass rounded-2xl p-6 mb-8 border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🎯</div>
            <div>
              <h3 className="text-lg font-semibold text-indigo-400 mb-2">Focus Area</h3>
              <p className="text-white">{analysis.recommendedFocus}</p>
            </div>
          </div>
        </div>
      )}

      {/* Conversation Flow & Question Handling */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {analysis.conversationFlow && (
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Conversation Flow</h3>
              <span className={`text-2xl font-bold ${getScoreColor(analysis.conversationFlow.score)}`}>
                {analysis.conversationFlow.score}
              </span>
            </div>
            <p className="text-gray-400 text-sm">{analysis.conversationFlow.feedback}</p>
          </div>
        )}

        {analysis.questionHandling && (
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Question Handling</h3>
              <span className={`text-2xl font-bold ${getScoreColor(analysis.questionHandling.score)}`}>
                {analysis.questionHandling.score}
              </span>
            </div>
            <p className="text-gray-400 text-sm">{analysis.questionHandling.feedback}</p>
          </div>
        )}
      </div>

      {/* Strengths & Improvements */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {analysis.strengths && analysis.strengths.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
              <span>✅</span> What You Did Well
            </h3>
            <ul className="space-y-3">
              {analysis.strengths.map((strength, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">•</span>
                  <span className="text-gray-300 text-sm">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.improvements && analysis.improvements.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
              <span>📈</span> Areas to Improve
            </h3>
            <ul className="space-y-3">
              {analysis.improvements.map((improvement, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-yellow-400 mt-1">•</span>
                  <span className="text-gray-300 text-sm">{improvement}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Key Moments */}
      {analysis.keyMoments && analysis.keyMoments.length > 0 && (
        <div className="glass rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">🔑 Key Moments</h3>
          <div className="space-y-4">
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
                <p className={`text-sm ${moment.type === 'strength' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {moment.feedback}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {analysis.metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{analysis.metrics.userResponses || 0}</div>
            <div className="text-sm text-gray-400">Your Responses</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{analysis.metrics.avgWordsPerResponse || 0}</div>
            <div className="text-sm text-gray-400">Avg Words/Response</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{analysis.metrics.wordCount || 0}</div>
            <div className="text-sm text-gray-400">Total Words</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{analysis.metrics.fillerWords || 0}</div>
            <div className="text-sm text-gray-400">Filler Words</div>
          </div>
        </div>
      )}

      {/* Conversation Transcript */}
      {messages.length > 0 && (
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">💬 Conversation</h3>
            <button
              onClick={() => setShowFullConversation(!showFullConversation)}
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {showFullConversation ? 'Collapse' : 'Expand'}
            </button>
          </div>

          <div className={`space-y-4 ${!showFullConversation ? 'max-h-64 overflow-hidden relative' : ''}`}>
            {messages.map((message, index) => (
              <ConversationBubble key={message.id || index} message={message} />
            ))}
            
            {!showFullConversation && messages.length > 4 && (
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none" />
            )}
          </div>
        </div>
      )}

      {/* CTA for non-authenticated */}
      {!isAuthenticated && (
        <div className="glass rounded-2xl p-6 mb-8 border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-semibold text-white mb-1">
                📈 Track Your Conversations
              </h3>
              <p className="text-gray-400 text-sm">
                Sign up to save this session and track your improvement over time
              </p>
            </div>
            <button
              onClick={() => router.push('/profile')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 
                       text-white font-semibold hover:from-indigo-400 hover:to-purple-400 
                       transition-all whitespace-nowrap"
            >
              Sign Up Free
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => router.push('/conversation')}
          className="flex-1 px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 
                   text-white font-medium transition-colors text-center"
        >
          🔄 Try Another Scenario
        </button>
        <button
          onClick={() => router.push('/')}
          className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 
                   hover:from-indigo-400 hover:to-purple-400
                   text-white font-medium transition-all text-center"
        >
          🏠 Back to Home
        </button>
      </div>
    </div>
  )
}