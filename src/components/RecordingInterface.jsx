// src/components/RecordingInterface.jsx

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import useAudioRecorder from '@/hooks/useAudioRecorder'
import useLiveFeedback from '@/hooks/useLiveFeedback'
import Timer from '@/components/Timer'
import RecordButton from '@/components/RecordButton'
import LiveStats from '@/components/LiveStats'
import { useAuth } from '@/contexts/AuthContext'
import { modeQuestions } from '@/utils/modeQuestions'
import { getModeDescription } from '@/utils/modeConfig'
import { saveSession } from '@/lib/storage'

// Minimum recording duration in seconds
const MIN_RECORDING_DURATION = 10

export default function RecordingInterface({
  mode,
  question,
  isCustom = false,
  isFreePractice = false,
  onShuffle,
  onClearCustom,
}) {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStage, setProcessingStage] = useState('')
  const [showLiveFeedback, setShowLiveFeedback] = useState(true)
  const [liveFeedbackToast, setLiveFeedbackToast] = useState(null)

  // Get mode data
  const modeData = modeQuestions[mode]
  const modeDescription = getModeDescription(mode)

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

  // Live feedback hook - now with context awareness
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
    mode: mode || 'general',
    questionText: question?.text || '',
  })

  // Track live feedback state with ref to prevent infinite loops
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

  // Handle live feedback toast - show briefly then auto-dismiss
  useEffect(() => {
    if (currentFeedback) {
      setLiveFeedbackToast(currentFeedback)
      const timer = setTimeout(() => {
        setLiveFeedbackToast(null)
        dismissFeedback()
      }, 4000) // Auto-dismiss after 4 seconds
      return () => clearTimeout(timer)
    }
  }, [currentFeedback, dismissFeedback])

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

  // Check if recording is too short
  const isTooShort = duration < MIN_RECORDING_DURATION

  const handleSubmit = async () => {
    if (!audioBlob) return

    // Block short recordings
    if (isTooShort) {
      return
    }

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
        audioUrl: audioUrl,
        type: 'solo',
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

  // Helper to get the title
  const getTitle = () => {
    if (isFreePractice) return '🎙️ Free Practice Mode'
    if (modeData) return `${modeData.icon} ${modeData.name} Mode`
    return '🎙️ Practice Mode'
  }

  // Helper to get the description/question text
  const getDescription = () => {
    if (question) return `"${question.text}"`
    if (isFreePractice) return 'Practice anything - self introduction, story telling, or rehearse'
    return 'Select a prompt or start recording'
  }

  // Get toast style based on feedback type
  const getToastStyle = (type) => {
    switch (type) {
      case 'great_streak':
      case 'pace_improved':
      case 'good_pace':
        return 'bg-green-500/90 border-green-400/50 text-white'
      case 'context_warning':
      case 'context_hint':
        return 'bg-orange-500/90 border-orange-400/50 text-white'
      case 'filler_alert':
      case 'pace_fast':
      case 'pace_slow':
      case 'rambling':
        return 'bg-yellow-500/90 border-yellow-400/50 text-white'
      case 'time_warning':
      case 'time_halfway':
        return 'bg-blue-500/90 border-blue-400/50 text-white'
      default:
        return 'bg-indigo-500/90 border-indigo-400/50 text-white'
    }
  }

  // Get toast icon based on feedback type
  const getToastIcon = (type) => {
    switch (type) {
      case 'great_streak':
      case 'pace_improved':
      case 'good_pace':
        return '✅'
      case 'context_warning':
        return '🎯'
      case 'context_hint':
        return '📌'
      case 'filler_alert':
      case 'filler_words':
        return '🔄'
      case 'pace_fast':
        return '🐇'
      case 'pace_slow':
        return '🐢'
      case 'rambling':
        return '📝'
      case 'time_warning':
      case 'time_halfway':
        return '⏱️'
      default:
        return '💡'
    }
  }

  // Microphone Error State
  if (error && !isRecording && !audioBlob) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">🎙️</div>
        <h2 className="text-xl font-bold text-white mb-2">
          Microphone Access Required
        </h2>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">{error}</p>

        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-medium transition-colors"
        >
          Try Again
        </button>

        <div className="mt-6 p-4 bg-white/5 rounded-xl text-left max-w-md mx-auto">
          <p className="text-sm font-medium text-gray-300 mb-2">
            Troubleshooting:
          </p>
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
        <div className="flex items-center justify-between mb-4 mt-7">
          <h4 className="text-lg font-medium text-white">
            Review Your Recording
          </h4>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/10 text-sm text-gray-300">
              ⏱️ {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
            </span>
            {question?.duration && (
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  duration >= question.duration * 0.8 && duration <= question.duration * 1.2
                    ? 'bg-green-500/20 text-green-400'
                    : duration < question.duration * 0.8
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-orange-500/20 text-orange-400'
                }`}
              >
                {duration >= question.duration * 0.8 && duration <= question.duration * 1.2
                  ? '✓ Good length'
                  : duration < question.duration * 0.8
                  ? '↓ A bit short'
                  : '↑ A bit long'}
              </span>
            )}
          </div>
        </div>

        {/* Too Short Warning */}
        {isTooShort && (
          <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 mt-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-red-400 font-medium">Recording Too Short</p>
                <p className="text-red-400/70 text-sm">
                  Please record at least {MIN_RECORDING_DURATION} seconds for meaningful analysis. 
                  You recorded {duration} second{duration !== 1 ? 's' : ''}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Live Stats Summary */}
        {showLiveFeedback && stats.wordCount > 0 && !isTooShort && (
          <div className={`grid gap-3 mb-4 ${mode !== 'general' ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <div className="text-center p-2 rounded-lg bg-white/5">
              <div className="text-lg font-bold text-white">{stats.wordCount}</div>
              <div className="text-xs text-gray-400">Words</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-white/5">
              <div className={`text-lg font-bold ${stats.wpm >= 120 && stats.wpm <= 150 ? 'text-green-400' : 'text-yellow-400'}`}>
                {stats.wpm}
              </div>
              <div className="text-xs text-gray-400">WPM</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-white/5">
              <div className={`text-lg font-bold ${stats.fillerCount === 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                {stats.fillerCount}
              </div>
              <div className="text-xs text-gray-400">Fillers</div>
            </div>
            {/* Context Score - Only for non-general modes */}
            {mode !== 'general' && stats.contextScore !== undefined && (
              <div className="text-center p-2 rounded-lg bg-white/5">
                <div className={`text-lg font-bold ${
                  stats.contextScore >= 70 ? 'text-green-400' : 
                  stats.contextScore >= 50 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {stats.contextScore >= 70 ? '✓' : stats.contextScore >= 50 ? '~' : '!'}
                </div>
                <div className="text-xs text-gray-400">Topic</div>
              </div>
            )}
          </div>
        )}

        <audio src={audioUrl} controls className="w-full mb-6 rounded-lg" />

        <div className="flex gap-4">
          <button
            onClick={resetRecording}
            disabled={isProcessing}
            className="flex-1 px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-white/10 hover:border-white/20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Record Again
          </button>
          <button
            onClick={handleSubmit}
            disabled={isProcessing || isTooShort}
            className={`flex-1 px-6 py-3.5 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2 ${
              isTooShort
                ? 'bg-gray-500/50 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span className="truncate">{processingStage}</span>
              </>
            ) : isTooShort ? (
              <>
                <span>Need {MIN_RECORDING_DURATION - duration}s more</span>
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

  // ============================================
  // ACTIVE RECORDING STATE
  // ============================================
  return (
    <div className="text-center relative">
      {/* Live Feedback Toast - Fixed position at top right, non-intrusive */}
      {liveFeedbackToast && isRecording && (
        <div className="fixed top-20 right-4 z-50 max-w-xs animate-slideIn">
          <div className={`px-4 py-3 rounded-xl shadow-lg backdrop-blur-sm border ${getToastStyle(liveFeedbackToast.type)}`}>
            <div className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">
                {getToastIcon(liveFeedbackToast.type)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{liveFeedbackToast.message}</p>
              </div>
              <button 
                onClick={() => {
                  setLiveFeedbackToast(null)
                  dismissFeedback()
                }}
                className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="mb-6">
        {/* Title Row with Controls */}
        <div className="flex items-center justify-center gap-3 mb-1">
          <h3 className="text-xl font-bold text-white">
            {getTitle()}
          </h3>
          
          {/* Inline controls - Only show when there's a question */}
          {question && !isFreePractice && (
            <div className="flex items-center gap-1">
              {/* Shuffle button */}
              {!isCustom && onShuffle && (
                <button
                  onClick={onShuffle}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-all hover:rotate-180 duration-300"
                  title="Shuffle question"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
              
              {/* Clear custom button */}
              {isCustom && onClearCustom && (
                <button
                  onClick={onClearCustom}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-all"
                  title="Back to prompts"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              
              {/* Duration badge - inline */}
              {question.duration && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-medium ml-1">
                  {question.duration < 60 ? `${question.duration}s` : `${Math.floor(question.duration / 60)}m`}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Description/Question Text */}
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          {getDescription()}
        </p>
      </div>

      {/* Live Feedback Toggle - Below header */}
      <div className="flex justify-center mb-4">
        <button
          onClick={() => setShowLiveFeedback(!showLiveFeedback)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            showLiveFeedback
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-white/5 text-gray-400 border border-white/10'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${showLiveFeedback ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
          Live Coach {showLiveFeedback ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Live Stats - Show while recording */}
      {isRecording && !isPaused && showLiveFeedback && (
        <LiveStats 
          stats={stats} 
          showContextScore={mode !== 'general'}
        />
      )}

      {/* Timer */}
      <div className="flex justify-center mb-8">
        <Timer
          seconds={duration}
          isRecording={isRecording}
          isPaused={isPaused}
          targetDuration={question?.duration}
        />
      </div>

      {/* Minimum duration indicator while recording */}
      {isRecording && duration < MIN_RECORDING_DURATION && (
        <div className="mb-4 text-center">
          <span className="text-xs text-gray-500">
            Minimum {MIN_RECORDING_DURATION}s required • {MIN_RECORDING_DURATION - duration}s to go
          </span>
        </div>
      )}

      {/* Recording Controls */}
      <div className="flex items-center justify-center gap-4 mb-6">
        {isRecording && (
          <button
            onClick={handleRestartRecording}
            className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center hover:scale-105 active:scale-95 flex-shrink-0"
            title="Restart recording"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
          ? isPaused
            ? 'Paused - Click to resume'
            : showLiveFeedback 
              ? '⚡ Live feedback active • Click square to stop'
              : 'Click the square to stop'
          : 'Click the microphone to start recording'}
      </p>

      {/* Recording error */}
      {error && isRecording && (
        <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}
    </div>
  )
}