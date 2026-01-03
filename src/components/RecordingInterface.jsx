// src/components/RecordingInterface.jsx

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import useAudioRecorder from '@/hooks/useAudioRecorder'
import useLiveFeedback from '@/hooks/useLiveFeedback'
import Timer from '@/components/Timer'
import RecordButton from '@/components/RecordButton'
import LiveFeedback from '@/components/LiveFeedback'
import LiveStats from '@/components/LiveStats'
import { saveSession } from '@/lib/storage'
import { useAuth } from '@/contexts/AuthContext'

export default function RecordingInterface({ 
  mode, 
  question,
  isFreePractice = false,
}) {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStage, setProcessingStage] = useState('')
  const [showLiveFeedback, setShowLiveFeedback] = useState(true)

  // Recording hook
  const {
    isRecording,
    isPaused,
    audioBlob,
    audioUrl,
    duration,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
  } = useAudioRecorder()

  // Live feedback hook
  const {
    currentFeedback,
    dismissFeedback,
    stats,
    startFeedback,
    stopFeedback,
  } = useLiveFeedback({
    targetDuration: question?.duration || 60,
    isRecording,
    currentDuration: duration,
  })

  // Track live feedback state
  const liveFeedbackActiveRef = useRef(false)

  // Handle live feedback start/stop
  useEffect(() => {
    const shouldRun = isRecording && showLiveFeedback && !isPaused

    if (shouldRun && !liveFeedbackActiveRef.current) {
      liveFeedbackActiveRef.current = true
      startFeedback()
    } else if (!shouldRun && liveFeedbackActiveRef.current) {
      liveFeedbackActiveRef.current = false
      stopFeedback()
    }
  }, [isRecording, isPaused, showLiveFeedback, startFeedback, stopFeedback])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (liveFeedbackActiveRef.current) {
        stopFeedback()
      }
    }
  }, [stopFeedback])

  const handleStartRecording = () => {
    startRecording()
  }

  const handleStopRecording = () => {
    liveFeedbackActiveRef.current = false
    stopFeedback()
    stopRecording()
  }

  const handleRestartRecording = () => {
    liveFeedbackActiveRef.current = false
    stopFeedback()
    resetRecording()
    setTimeout(() => {
      startRecording()
    }, 100)
  }

  const handleSubmit = async () => {
    if (!audioBlob) return

    const questionData = question || {
      text: 'Free practice session',
      duration: null,
      isCustom: true,
    }

    setIsProcessing(true)
    try {
      setProcessingStage('Transcribing your audio...')
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      
      const transcribeRes = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })
      
      if (!transcribeRes.ok) {
        throw new Error('Transcription failed')
      }
      
      const { text: transcript } = await transcribeRes.json()

      setProcessingStage('Analyzing your communication...')
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          duration,
          mode: mode || 'general',
          question: questionData,
        }),
      })
      
      if (!analyzeRes.ok) {
        throw new Error('Analysis failed')
      }
      
      const analysis = await analyzeRes.json()

      const result = {
        transcript,
        duration,
        mode: mode || 'general',
        question: questionData,
        analysis,
        liveStats: stats,
      }

      if (isAuthenticated) {
        saveSession(result)
      }

      sessionStorage.setItem('talkbetter_results', JSON.stringify(result))
      router.push('/results')
    } catch (err) {
      console.error('Processing error:', err)
      alert('Something went wrong. Please try again.')
    } finally {
      setIsProcessing(false)
      setProcessingStage('')
    }
  }

  // Microphone Error State
  if (error && !isRecording && !audioBlob) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">🎙️</div>
        <h2 className="text-xl font-bold text-white mb-2">Microphone Access Required</h2>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">{error}</p>
        
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 
                   text-white font-medium transition-colors"
        >
          Try Again
        </button>
        
        <div className="mt-6 p-4 bg-white/5 rounded-xl text-left max-w-md mx-auto">
          <p className="text-sm font-medium text-gray-300 mb-2">Troubleshooting:</p>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Make sure you&apos;re using Chrome, Firefox, or Safari</li>
            <li>• Check that your microphone is connected</li>
            <li>• Allow microphone access when prompted</li>
          </ul>
        </div>
      </div>
    )
  }

  // Review Recording State
  if (audioBlob) {
    return (
      <div className="animate-fadeIn">
        {/* Live Feedback Popup */}
        <LiveFeedback feedback={currentFeedback} onDismiss={dismissFeedback} />

        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-white">Review Your Recording</h4>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/10 text-sm text-gray-300">
              ⏱️ {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
            </span>
            {question?.duration && (
              <span className={`px-3 py-1 rounded-full text-sm ${
                duration >= question.duration * 0.8 && duration <= question.duration * 1.2
                  ? 'bg-green-500/20 text-green-400'
                  : duration < question.duration * 0.8
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-orange-500/20 text-orange-400'
              }`}>
                {duration >= question.duration * 0.8 && duration <= question.duration * 1.2
                  ? '✓ Good length'
                  : duration < question.duration * 0.8
                  ? '↓ A bit short'
                  : '↑ A bit long'
                }
              </span>
            )}
          </div>
        </div>

        {/* Live Stats Summary */}
        {showLiveFeedback && stats.wordCount > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-2 rounded-lg bg-white/5">
              <div className="text-lg font-bold text-white">{stats.wordCount}</div>
              <div className="text-xs text-gray-400">Words</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-white/5">
              <div className={`text-lg font-bold ${
                stats.wpm >= 120 && stats.wpm <= 150 ? 'text-green-400' : 'text-yellow-400'
              }`}>{stats.wpm}</div>
              <div className="text-xs text-gray-400">WPM</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-white/5">
              <div className={`text-lg font-bold ${
                stats.fillerCount === 0 ? 'text-green-400' : 'text-yellow-400'
              }`}>{stats.fillerCount}</div>
              <div className="text-xs text-gray-400">Fillers</div>
            </div>
          </div>
        )}
        
        {/* Audio player */}
        <audio 
          src={audioUrl} 
          controls 
          className="w-full mb-6 rounded-lg"
        />

        {/* Action buttons */}
        <div className="flex gap-4">
          <button
            onClick={resetRecording}
            disabled={isProcessing}
            className="flex-1 px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 
                     text-white font-medium transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2
                     border border-white/10 hover:border-white/20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Record Again
          </button>
          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="flex-1 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 
                     hover:from-indigo-400 hover:to-purple-400
                     text-white font-medium transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2
                     shadow-lg shadow-indigo-500/25"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span className="truncate">{processingStage}</span>
              </>
            ) : (
              <>
                <span>Get AI Feedback</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  // Active Recording State
  return (
    <div className="text-center">
      {/* Live Feedback Popup */}
      <LiveFeedback feedback={currentFeedback} onDismiss={dismissFeedback} />

      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-1">
          {isFreePractice && !question
            ? '🎙️ Free Practice Mode' 
            : '🎯 Record Your Response'
          }
        </h3>
        <p className="text-gray-400 text-sm">
          {isFreePractice && !question
            ? 'Practice anything - introduce yourself, tell a story, or rehearse a speech'
            : 'Speak naturally and clearly'
          }
        </p>
      </div>

      {/* Live Feedback Toggle */}
      <div className="flex justify-center mb-4">
        <button
          onClick={() => setShowLiveFeedback(!showLiveFeedback)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            showLiveFeedback
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-white/5 text-gray-400 border border-white/10'
          }`}
        >
          <span>{showLiveFeedback ? '⚡' : '○'}</span>
          Live Feedback {showLiveFeedback ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Timer */}
      <div className="flex justify-center mb-6">
        <Timer 
          seconds={duration} 
          isRecording={isRecording} 
          isPaused={isPaused}
          targetDuration={question?.duration}
        />
      </div>

      {/* Live Stats (shown while recording) */}
      {isRecording && showLiveFeedback && !isPaused && (
        <LiveStats stats={stats} />
      )}

      {/* Recording Controls */}
      <div className="flex items-center justify-center gap-4 mb-6">
        {isRecording && (
          <button
            onClick={handleRestartRecording}
            className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 
                     transition-all flex items-center justify-center
                     hover:scale-105 active:scale-95"
            title="Restart recording"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
        
        <RecordButton
          isRecording={isRecording}
          isPaused={isPaused}
          onStart={handleStartRecording}
          onStop={handleStopRecording}
          onPause={pauseRecording}
          onResume={resumeRecording}
        />
      </div>
      
      <p className="text-gray-500 text-sm">
        {isRecording 
          ? (isPaused 
              ? 'Paused - Click to resume' 
              : (showLiveFeedback ? '⚡ Live feedback active • Click square to stop' : 'Click the square to stop')
            ) 
          : 'Click the microphone to start recording'
        }
      </p>

      {/* Recording error during recording */}
      {error && isRecording && (
        <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}
    </div>
  )
}