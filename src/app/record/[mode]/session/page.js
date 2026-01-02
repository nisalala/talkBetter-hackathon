'use client'

import { useState, use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAudioRecorder from '@/hooks/useAudioRecorder'
import Timer from '@/components/Timer'
import RecordButton from '@/components/RecordButton'

import { saveSession } from '@/lib/storage'
import { useAuth } from '@/contexts/AuthContext'

export default function RecordingPage({ params }) {
  const { mode } = use(params)
  const router = useRouter()
  
  const [setup, setSetup] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStage, setProcessingStage] = useState('')

  const { isAuthenticated } = useAuth()
  
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

  // Load setup from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('talkbetter_setup')
    if (!stored) {
      router.push(`/record/${mode}`)
      return
    }
    setSetup(JSON.parse(stored))
  }, [mode, router])

  const handleRestartRecording = () => {
    resetRecording()
    setTimeout(() => {
      startRecording()
    }, 100)
  }

  const handleSubmit = async () => {
    if (!audioBlob || !setup) return

    setIsProcessing(true)
    try {
      // Step 1: Transcribe
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

      // Step 2: Analyze
      setProcessingStage('Analyzing your communication...')
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          duration,
          mode: setup.mode,
          difficulty: setup.difficulty,
          question: setup.question,
        }),
      })
      
      if (!analyzeRes.ok) {
        throw new Error('Analysis failed')
      }
      
      const analysis = await analyzeRes.json()

      // Step 3: Create result object
      const result = {
        transcript,
        duration,
        mode: setup.mode,
        difficulty: setup.difficulty,
        question: setup.question,
        analysis,
      }

      // Step 4: Save to user's history if logged in
      if (isAuthenticated) {
        saveSession(result)
      }

      // Step 5: Save to sessionStorage for results page (temporary, for display)
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

  // Loading state
  if (!setup) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  // Browser/microphone error state
  if (error && !isRecording && !audioBlob) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="glass rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">🎙️</div>
          <h2 className="text-xl font-bold text-white mb-2">Microphone Access Required</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 
                       text-white font-medium transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push(`/record/${mode}`)}
              className="w-full px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 
                       text-white font-medium transition-colors"
            >
              ← Back to Setup
            </button>
          </div>

          <div className="mt-6 p-4 bg-white/5 rounded-xl text-left">
            <p className="text-sm font-medium text-gray-300 mb-2">Troubleshooting:</p>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Make sure you&apos;re using Chrome, Firefox, or Safari</li>
              <li>• Check that your microphone is connected</li>
              <li>• Allow microphone access when prompted</li>
              <li>• Close other apps that might be using the microphone</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  const { question, difficulty } = setup

  const difficultyIcons = {
    gentle: '🌱',
    balanced: '🎯',
    tough: '🔥',
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="w-12 h-1 bg-indigo-500 rounded" />
        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
          2
        </div>
        <div className="w-12 h-1 bg-white/10 rounded" />
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-500 font-bold text-sm">
          3
        </div>
      </div>

      {/* Question Card */}
      <div className="glass rounded-2xl p-5 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                {question?.isCustom ? '✏️ Your Prompt' : '💡 Prompt'}
              </span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-gray-400">
                {difficultyIcons[difficulty]} {difficulty}
              </span>
            </div>
            <p className="text-white leading-relaxed">
              &quot;{question?.text}&quot;
            </p>
          </div>
          {question?.duration && (
            <div className="flex-shrink-0 text-center">
              <div className="text-2xl font-bold text-indigo-400">
                {question.duration < 60 ? question.duration : Math.floor(question.duration / 60)}
              </div>
              <div className="text-xs text-gray-400">
                {question.duration < 60 ? 'sec' : 'min'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timer */}
      <div className="flex justify-center mb-8">
        <Timer 
          seconds={duration} 
          isRecording={isRecording} 
          isPaused={isPaused}
          targetDuration={question?.duration}
        />
      </div>

      {/* Recording error (during recording) */}
      {error && (isRecording || audioBlob) && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-center">
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col items-center gap-6">
        {!audioBlob ? (
          // Recording controls
          <>
            <div className="flex items-center gap-4">
              {isRecording && (
                <button
                  onClick={handleRestartRecording}
                  className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 
                           transition-all flex items-center justify-center
                           hover:scale-105 active:scale-95"
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
                onStart={startRecording}
                onStop={stopRecording}
                onPause={pauseRecording}
                onResume={resumeRecording}
              />
            </div>
            
            <p className="text-gray-500 text-sm text-center">
              {isRecording 
                ? 'Click the square to stop, or ↺ to restart' 
                : 'Click the microphone to start recording'
              }
            </p>
          </>
        ) : (
          // Review controls
          <div className="w-full glass rounded-2xl p-6">
            <h3 className="text-lg font-medium text-white mb-4">Review your recording</h3>
            
            {/* Duration badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-white/10 text-sm text-gray-300">
                {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')} recorded
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
                    ? 'A bit short'
                    : 'A bit long'
                  }
                </span>
              )}
            </div>
            
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
                className="flex-1 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 
                         text-white font-medium transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Record Again
              </button>
              <button
                onClick={handleSubmit}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 
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
                    <span>{processingStage}</span>
                  </>
                ) : (
                  <>
                    <span>Get Feedback</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Back button */}
      <div className="mt-8 text-center">
        <button
          onClick={() => router.push(`/record/${mode}`)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← Back to setup
        </button>
      </div>
    </div>
  )
}