// src/app/conversation/[mode]/page.js

'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import useConversation from '@/hooks/useConversation'
import { getScenario } from '@/utils/conversationScenarios'
import ConversationBubble from '@/components/ConversationBubble'
import AIAvatar from '@/components/AIAvatar'

export default function ConversationPage({ params }) {
  const { mode } = use(params)
  const router = useRouter()
  
  const [scenario, setScenario] = useState(null)
  const [hasStarted, setHasStarted] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [startTime, setStartTime] = useState(null)

  // Load scenario from session storage
  useEffect(() => {
    const stored = sessionStorage.getItem('conversation_scenario')
    if (!stored) {
      router.push('/conversation')
      return
    }
    const data = JSON.parse(stored)
    setScenario(data.scenario)
  }, [router])

  const {
    messages,
    currentTurn,
    maxTurns,
    isAISpeaking,
    isUserSpeaking,
    isProcessing,
    conversationEnded,
    error,
    startConversation,
    startRecording,
    stopRecording,
    endConversation,
    stopAISpeaking,
  } = useConversation(scenario, 7)

  const handleStart = () => {
    setHasStarted(true)
    setStartTime(Date.now())
    startConversation()
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    
    try {
      const duration = Math.round((Date.now() - startTime) / 1000)
      
      const response = await fetch('/api/analyze-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          scenario,
          duration,
        }),
      })

      if (!response.ok) throw new Error('Analysis failed')

      const analysis = await response.json()

      // Store results
      const results = {
        type: 'conversation',
        messages,
        scenario,
        mode,
        duration,
        analysis,
        timestamp: Date.now(),
      }

      sessionStorage.setItem('talkbetter_results', JSON.stringify(results))
      router.push('/results/conversation')
    } catch (err) {
      console.error('Analysis error:', err)
      alert('Failed to analyze conversation. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (!scenario) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  // Pre-start screen
  if (!hasStarted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="glass rounded-2xl p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 
                        flex items-center justify-center text-4xl mx-auto mb-6">
            🎭
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">{scenario.name}</h1>
          <p className="text-gray-400 mb-6">{scenario.description}</p>
          
          <div className="glass rounded-xl p-4 mb-6 text-left">
            <div className="text-sm text-gray-400 mb-2">You'll be talking to:</div>
            <div className="text-white font-medium">{scenario.aiRole}</div>
          </div>

          <div className="flex items-center justify-center gap-6 mb-8 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <span>💬</span> 7 exchanges
            </div>
            <div className="flex items-center gap-2">
              <span>🎤</span> Voice-based
            </div>
            <div className="flex items-center gap-2">
              <span>📊</span> Full analysis
            </div>
          </div>

          <button
            onClick={handleStart}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 
                     text-white font-semibold text-lg
                     hover:from-indigo-400 hover:to-purple-400 transition-all
                     shadow-lg shadow-indigo-500/25"
          >
            🎙️ Begin Conversation
          </button>

          <button
            onClick={() => router.push('/conversation')}
            className="mt-4 text-gray-400 hover:text-white transition-colors"
          >
            ← Choose different scenario
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">{scenario.name}</h1>
          <p className="text-sm text-gray-400">Turn {currentTurn} of {maxTurns}</p>
        </div>
        
        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${(currentTurn / maxTurns) * 100}%` }}
            />
          </div>
          <span className="text-sm text-gray-400">{Math.round((currentTurn / maxTurns) * 100)}%</span>
        </div>
      </div>

      {/* AI Avatar */}
      <div className="flex justify-center mb-6">
        <AIAvatar 
          isSpeaking={isAISpeaking} 
          isListening={isUserSpeaking}
          isThinking={isProcessing}
        />
      </div>

      {/* Conversation */}
      <div className="glass rounded-2xl p-4 mb-6 max-h-[400px] overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Starting conversation...
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <ConversationBubble 
                key={message.id} 
                message={message}
                isLatest={message.id === messages[messages.length - 1]?.id}
              />
            ))}
            
            {isProcessing && (
              <div className="flex items-center gap-2 text-gray-400">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span className="text-sm">Processing...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-center">
          {error}
        </div>
      )}

      {/* Controls */}
      {!conversationEnded ? (
        <div className="space-y-4">
          {/* Main action button */}
          <div className="flex justify-center">
            {isAISpeaking ? (
              <button
                onClick={stopAISpeaking}
                className="px-8 py-4 rounded-2xl bg-gray-700 hover:bg-gray-600 
                         text-white font-medium transition-all flex items-center gap-3"
              >
                <span className="text-xl">⏭️</span>
                Skip to respond
              </button>
            ) : isUserSpeaking ? (
              <button
                onClick={stopRecording}
                className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-400 
                         text-white transition-all flex items-center justify-center
                         shadow-lg shadow-red-500/30 animate-pulse"
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            ) : (
              <button
                onClick={startRecording}
                disabled={isProcessing}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 
                         hover:from-indigo-400 hover:to-purple-400
                         text-white transition-all flex items-center justify-center
                         shadow-lg shadow-indigo-500/30
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </button>
            )}
          </div>

          {/* Status text */}
          <p className="text-center text-gray-400 text-sm">
            {isAISpeaking && '🔊 AI is speaking... Click to skip'}
            {isUserSpeaking && '🎤 Recording... Click to stop'}
            {isProcessing && '⏳ Processing your response...'}
            {!isAISpeaking && !isUserSpeaking && !isProcessing && '🎤 Click to respond'}
          </p>

          {/* End early button */}
          {messages.length >= 2 && (
            <button
              onClick={endConversation}
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 
                       text-gray-400 hover:text-white font-medium transition-all"
            >
              End Conversation & Analyze
            </button>
          )}
        </div>
      ) : (
        /* Conversation ended */
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="text-4xl mb-2">✅</div>
            <h3 className="text-xl font-bold text-white">Conversation Complete!</h3>
            <p className="text-gray-400">Ready to see how you did?</p>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 
                     text-white font-semibold text-lg
                     hover:from-indigo-400 hover:to-purple-400 transition-all
                     shadow-lg shadow-indigo-500/25
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Analyzing your conversation...
              </>
            ) : (
              <>
                📊 Get Detailed Analysis
              </>
            )}
          </button>

          <button
            onClick={() => router.push('/conversation')}
            className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 
                     text-gray-400 hover:text-white font-medium transition-all"
          >
            Try Different Scenario
          </button>
        </div>
      )}
    </div>
  )
}