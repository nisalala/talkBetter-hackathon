// src/app/page.js

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import useAudioRecorder from '@/hooks/useAudioRecorder'
import Timer from '@/components/Timer'
import RecordButton from '@/components/RecordButton'
import { saveSession } from '@/lib/storage'
import { useAuth } from '@/contexts/AuthContext'
import { modeQuestions } from '@/utils/modeQuestions'

// Mode styling configuration
const modeStyles = {
  pitch: {
    color: 'from-orange-500 to-red-500',
    ringColor: 'ring-orange-500/50',
  },
  interview: {
    color: 'from-blue-500 to-cyan-500',
    ringColor: 'ring-blue-500/50',
  },
  meeting: {
    color: 'from-green-500 to-emerald-500',
    ringColor: 'ring-green-500/50',
  },
  date: {
    color: 'from-pink-500 to-rose-500',
    ringColor: 'ring-pink-500/50',
  },
  difficult: {
    color: 'from-purple-500 to-violet-500',
    ringColor: 'ring-purple-500/50',
  },
  speech: {
    color: 'from-yellow-500 to-amber-500',
    ringColor: 'ring-yellow-500/50',
  },
  general: {
    color: 'from-gray-500 to-gray-600',
    ringColor: 'ring-gray-500/50',
  },
}

// Mode descriptions
const modeDescriptions = {
  pitch: 'Nail your startup pitch or sales presentation',
  interview: 'Ace your job interviews with confidence',
  meeting: 'Make your points clearly in meetings',
  date: 'Be your authentic self on dates',
  difficult: 'Navigate tough conversations gracefully',
  speech: 'Deliver impactful public speeches',
  general: 'Practice anything freely',
}

// Convert modeQuestions to modes array format for the UI (excluding general)
const questionModes = Object.entries(modeQuestions)
  .filter(([id]) => id !== 'general')
  .map(([id, data]) => ({
    id,
    title: data.name,
    icon: data.icon,
    description: modeDescriptions[id] || 'Practice your communication skills',
    color: modeStyles[id]?.color || 'from-gray-500 to-gray-600',
    ringColor: modeStyles[id]?.ringColor || 'ring-gray-500/50',
    questions: data.questions.map(q => ({
      id: q.id,
      text: q.text,
      duration: q.duration,
      tips: q.tips || [],
    })),
  }))

// General/Free Practice mode (separate)
const freePracticeMode = {
  id: 'general',
  title: 'Free Practice',
  icon: '🎙️',
  description: 'Practice anything freely',
  color: 'from-gray-500 to-gray-600',
  ringColor: 'ring-gray-500/50',
}

// All modes combined for tabs
const allModes = [freePracticeMode, ...questionModes]

// Default mode
const DEFAULT_MODE = 'general'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  
  // State - Default to 'general' mode
  const [selectedMode, setSelectedMode] = useState(DEFAULT_MODE)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [usedQuestionIds, setUsedQuestionIds] = useState([])
  const [customQuestion, setCustomQuestion] = useState('')
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStage, setProcessingStage] = useState('')
  
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

  // Check if it's free practice mode
  const isFreePractice = selectedMode === 'general'

  // Get current mode data (for question-based modes)
  const currentMode = questionModes.find(m => m.id === selectedMode)

  // Get current tab data (for styling)
  const currentTab = allModes.find(m => m.id === selectedMode)

  // Get a random question from available questions
  const getRandomQuestion = useCallback((questions, excludeIds = []) => {
    const availableQuestions = questions.filter(q => !excludeIds.includes(q.id))
    
    if (availableQuestions.length === 0) {
      const randomIndex = Math.floor(Math.random() * questions.length)
      return { question: questions[randomIndex], resetUsed: true }
    }
    
    const randomIndex = Math.floor(Math.random() * availableQuestions.length)
    return { question: availableQuestions[randomIndex], resetUsed: false }
  }, [])

  // Shuffle to get new question
  const handleShuffle = useCallback(() => {
    if (!currentMode) return
    
    const { question, resetUsed } = getRandomQuestion(currentMode.questions, usedQuestionIds)
    
    if (resetUsed) {
      setUsedQuestionIds([question.id])
    } else {
      setUsedQuestionIds(prev => [...prev, question.id])
    }
    
    setCurrentQuestion(question)
    setIsCustomMode(false)
    resetRecording()
  }, [currentMode, usedQuestionIds, getRandomQuestion, resetRecording])

  // When mode changes, get a random question (only for question-based modes)
  useEffect(() => {
    if (currentMode && !isFreePractice) {
      const { question } = getRandomQuestion(currentMode.questions, [])
      setCurrentQuestion(question)
      setUsedQuestionIds([question.id])
      setIsCustomMode(false)
    } else {
      // Free practice mode - no question by default
      setCurrentQuestion(null)
      setUsedQuestionIds([])
      setIsCustomMode(false)
    }
  }, [currentMode, isFreePractice, getRandomQuestion])

  // Handle tab click
  const handleTabClick = (modeId) => {
    if (selectedMode === modeId) return
    setSelectedMode(modeId)
    setCustomQuestion('')
    setIsCustomMode(false)
    resetRecording()
  }

  // Handle custom question
  const handleUseCustomQuestion = () => {
    if (customQuestion.trim()) {
      setCurrentQuestion({
        id: 'custom',
        text: customQuestion.trim(),
        duration: 60,
        isCustom: true,
        tips: [],
      })
      setIsCustomMode(true)
      resetRecording()
    }
  }

  // Clear custom and go back to random (or no question for free practice)
  const handleClearCustom = () => {
    setIsCustomMode(false)
    setCustomQuestion('')
    
    if (currentMode && !isFreePractice) {
      const { question } = getRandomQuestion(currentMode.questions, [])
      setCurrentQuestion(question)
      setUsedQuestionIds([question.id])
    } else {
      setCurrentQuestion(null)
    }
  }

  // Recording handlers
  const handleRestartRecording = () => {
    resetRecording()
    setTimeout(() => {
      startRecording()
    }, 100)
  }

  const handleSubmit = async () => {
    if (!audioBlob) return

    const question = currentQuestion || {
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
          mode: selectedMode || 'general',
          question: question,
        }),
      })
      
      if (!analyzeRes.ok) {
        throw new Error('Analysis failed')
      }
      
      const analysis = await analyzeRes.json()

      const result = {
        transcript,
        duration,
        mode: selectedMode || 'general',
        question: question,
        analysis,
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

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <div className="text-[16px] font-semibold">
          Record your voice. Improve clarity and confidence.
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {allModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleTabClick(mode.id)}
              className={`px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2
                ${selectedMode === mode.id 
                  ? `bg-gradient-to-r ${mode.color} text-white shadow-lg ring-2 ${mode.ringColor}` 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300'
                }`}
            >
              <span>{mode.icon}</span>
              <span className="hidden sm:inline">{mode.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ============================================ */}
      {/* MAIN CONTAINER - Question + Recording       */}
      {/* ============================================ */}
      <div className="glass rounded-2xl p-6 md:p-8 mb-6">
        
        {/* Question Section (only for question-based modes with a question) */}
        {currentMode && currentQuestion && !isFreePractice && (
          <div className="mb-8 pb-8 border-b border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{currentMode.icon}</span>
                {currentMode.title}
              </h3>
              <p className="text-gray-400 text-sm hidden sm:block">{currentMode.description}</p>
            </div>
            
            {/* Question Display */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-medium">
                      {isCustomMode ? '✏️ Custom' : '💡 Prompt'}
                    </span>
                    {/* Shuffle Icon (only for non-custom) */}
                    {!isCustomMode && (
                      <button
                        onClick={handleShuffle}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white 
                                 transition-all hover:rotate-180 duration-300"
                        title="Shuffle question"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    )}
                    {/* Clear Custom Icon */}
                    {isCustomMode && (
                      <button
                        onClick={handleClearCustom}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-all"
                        title="Back to prompts"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className="text-white text-lg leading-relaxed">
                    &quot;{currentQuestion.text}&quot;
                  </p>
                  
                  {/* Tips Section */}
                  {currentQuestion.tips && currentQuestion.tips.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {currentQuestion.tips.map((tip, index) => (
                        <span
                          key={index}
                          className="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-400"
                        >
                          💡 {tip}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 text-center px-4 py-3 bg-white/5 rounded-xl">
                  <div className="text-2xl font-bold text-indigo-400">
                    {currentQuestion.duration < 60 
                      ? currentQuestion.duration 
                      : Math.floor(currentQuestion.duration / 60)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {currentQuestion.duration < 60 ? 'sec' : 'min'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Prompt Display (for free practice with custom question) */}
        {isFreePractice && isCustomMode && currentQuestion && (
          <div className="mb-8 pb-8 border-b border-white/10">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-medium">
                      ✏️ Custom Prompt
                    </span>
                    <button
                      onClick={handleClearCustom}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-all"
                      title="Clear prompt"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-white text-lg leading-relaxed">
                    &quot;{currentQuestion.text}&quot;
                  </p>
                </div>
                <div className="flex-shrink-0 text-center px-4 py-3 bg-white/5 rounded-xl">
                  <div className="text-2xl font-bold text-indigo-400">1</div>
                  <div className="text-xs text-gray-400">min</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recording Section */}
        <div>
          {/* Header */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white mb-1">
              {isFreePractice && !isCustomMode
                ? '🎙️ Free Practice Mode' 
                : '🎯 Record Your Response'
              }
            </h3>
            <p className="text-gray-400 text-sm">
              {isFreePractice && !isCustomMode
                ? 'Practice anything - introduce yourself, tell a story, or rehearse a speech'
                : 'Speak naturally and clearly'
              }
            </p>
          </div>

          {/* Microphone Error State */}
          {error && !isRecording && !audioBlob ? (
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
          ) : !audioBlob ? (
            /* Active Recording Interface */
            <div className="text-center">
              {/* Timer */}
              <div className="flex justify-center mb-8">
                <Timer 
                  seconds={duration} 
                  isRecording={isRecording} 
                  isPaused={isPaused}
                  targetDuration={currentQuestion?.duration}
                />
              </div>

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
                  onStart={startRecording}
                  onStop={stopRecording}
                  onPause={pauseRecording}
                  onResume={resumeRecording}
                />
              </div>
              
              <p className="text-gray-500 text-sm">
                {isRecording 
                  ? (isPaused ? 'Paused - Click to resume' : 'Click the square to stop') 
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
          ) : (
            /* Review Recording */
            <div className="animate-fadeIn">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-white">Review Your Recording</h4>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-white/10 text-sm text-gray-300">
                    ⏱️ {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                  </span>
                  {currentQuestion?.duration && (
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      duration >= currentQuestion.duration * 0.8 && duration <= currentQuestion.duration * 1.2
                        ? 'bg-green-500/20 text-green-400'
                        : duration < currentQuestion.duration * 0.8
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {duration >= currentQuestion.duration * 0.8 && duration <= currentQuestion.duration * 1.2
                        ? '✓ Good length'
                        : duration < currentQuestion.duration * 0.8
                        ? '↓ A bit short'
                        : '↑ A bit long'
                      }
                    </span>
                  )}
                </div>
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
          )}
        </div>
      </div>

      {/* Custom Question Section - For all modes */}
      {!isCustomMode && (
        <div className="glass rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-400 mb-3">
            {isFreePractice 
              ? 'Want a specific prompt to practice?' 
              : 'Or create your own prompt:'
            }
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUseCustomQuestion()}
              placeholder={isFreePractice 
                ? "Enter a question or scenario to practice..."
                : "Type your own question or scenario..."
              }
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 
                       text-white placeholder:text-gray-500 
                       focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
                       transition-all"
            />
            <button
              onClick={handleUseCustomQuestion}
              disabled={!customQuestion.trim()}
              className="px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 
                       text-white font-medium transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed
                       disabled:hover:bg-indigo-500"
            >
              Use
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center">
        <p className="text-gray-500 text-sm">
          🔒 Your recordings are processed securely and never stored
        </p>
      </div>
    </div>
  )
}