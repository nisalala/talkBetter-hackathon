'use client'

import { useState, use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { modeQuestions, getRandomQuestion } from '@/utils/modeQuestions'
import { difficultyLevels } from '@/utils/difficultyLevels'

export default function SetupPage({ params }) {
  const { mode } = use(params)
  const router = useRouter()
  
  const [questionMode, setQuestionMode] = useState('suggested')
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [customQuestion, setCustomQuestion] = useState('')
  const [customDuration, setCustomDuration] = useState(90)
  const [difficulty, setDifficulty] = useState('balanced')
  
  const modeData = modeQuestions[mode] || modeQuestions.general

  // Set initial random question
  useEffect(() => {
    setCurrentQuestion(getRandomQuestion(mode))
  }, [mode])

  const handleNewQuestion = () => {
    setCurrentQuestion(getRandomQuestion(mode))
  }

  // Get the active question
  const getActiveQuestion = () => {
    if (questionMode === 'custom' && customQuestion.trim()) {
      return {
        id: 'custom',
        text: customQuestion.trim(),
        duration: customDuration,
        tips: [],
        isCustom: true,
      }
    }
    return currentQuestion
  }

  const handleNext = () => {
    const activeQuestion = getActiveQuestion()
    
    // Save setup to sessionStorage
    sessionStorage.setItem('talkbetter_setup', JSON.stringify({
      mode,
      question: activeQuestion,
      difficulty,
    }))
    
    // Navigate to recording page
    router.push(`/record/${mode}/session`)
  }

  const isNextDisabled = questionMode === 'custom' && !customQuestion.trim()

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 mb-4">
          <span className="text-2xl">{modeData.icon}</span>
          <span className="font-medium text-white">{modeData.name} Mode</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Set Up Your Practice</h1>
        <p className="text-gray-400">Choose what you want to practice and how you want to be coached</p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
          1
        </div>
        <div className="w-12 h-1 bg-white/10 rounded" />
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-500 font-bold text-sm">
          2
        </div>
        <div className="w-12 h-1 bg-white/10 rounded" />
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-500 font-bold text-sm">
          3
        </div>
      </div>

      <div className="space-y-6">
        {/* Question Selection */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-sm text-indigo-400">1</span>
            Choose Your Prompt
          </h2>
          
          {/* Toggle Buttons */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setQuestionMode('suggested')}
              className={`
                flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all
                ${questionMode === 'suggested'
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }
              `}
            >
              💡 Suggested Prompts
            </button>
            <button
              onClick={() => setQuestionMode('custom')}
              className={`
                flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all
                ${questionMode === 'custom'
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }
              `}
            >
              ✏️ Custom Prompt
            </button>
          </div>

          {/* Suggested Question */}
          {questionMode === 'suggested' && currentQuestion && (
            <div>
              <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-xl p-5 border border-white/10">
                <p className="text-lg text-white leading-relaxed mb-4">
                  {currentQuestion.text}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {currentQuestion.duration}s recommended
                  </div>
                  
                  <button
                    onClick={handleNewQuestion}
                    className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 
                             px-3 py-1 rounded-lg hover:bg-indigo-500/10 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Shuffle
                  </button>
                </div>
              </div>

              {/* Tips */}
              {currentQuestion.tips && currentQuestion.tips.length > 0 && (
                <div className="mt-4 p-4 bg-white/5 rounded-xl">
                  <p className="text-sm font-medium text-gray-300 mb-2">💡 Tips for this prompt:</p>
                  <ul className="space-y-1">
                    {currentQuestion.tips.map((tip, i) => (
                      <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                        <span className="text-indigo-400 mt-0.5">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Custom Question Input */}
          {questionMode === 'custom' && (
            <div>
              <textarea
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder={`Write your specific scenario...\n\nExample: "${
                  mode === 'interview' 
                    ? "You're interviewing at Google for a PM role. Tell me about a time you had to make a difficult decision with incomplete data."
                    : mode === 'pitch'
                    ? "Pitch your AI startup to Sequoia. You have 2 minutes to explain your product and ask for $3M Series A."
                    : mode === 'speech'
                    ? "Give a best man speech at your brother Mike's wedding to Sarah."
                    : mode === 'date'
                    ? "You're on a first date at a coffee shop. They asked what you do for fun."
                    : mode === 'difficult'
                    ? "Ask your manager for a 20% raise after exceeding all your targets for 2 years."
                    : mode === 'meeting'
                    ? "Present your Q3 marketing results to leadership. Budget was $50K."
                    : "Practice speaking clearly about any topic of your choice."
                }"`}
                className="w-full h-36 bg-white/5 border border-white/10 rounded-xl p-4 
                         text-white placeholder-gray-500 resize-none
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                         transition-all"
              />
              
              {/* Duration selector */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="text-sm text-gray-400">Target duration:</span>
                <div className="flex gap-2">
                  {[30, 60, 90, 120, 180].map((secs) => (
                    <button
                      key={secs}
                      onClick={() => setCustomDuration(secs)}
                      className={`
                        px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                        ${customDuration === secs
                          ? 'bg-indigo-500 text-white'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }
                      `}
                    >
                      {secs < 60 ? `${secs}s` : `${secs / 60}m`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pro tip */}
              <div className="mt-4 p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <p className="text-sm text-indigo-300">
                  💡 <strong>Pro tip:</strong> The more specific your prompt, the better the AI feedback. 
                  Include company names, roles, or specific scenarios!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Coaching Style */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-sm text-indigo-400">2</span>
            Choose Coaching Style
          </h2>
          
          <div className="grid grid-cols-3 gap-3">
            {Object.values(difficultyLevels).map((level) => (
              <button
                key={level.id}
                onClick={() => setDifficulty(level.id)}
                className={`
                  p-4 rounded-xl text-center transition-all
                  ${difficulty === level.id
                    ? 'bg-indigo-500/20 border-2 border-indigo-500 scale-105 shadow-lg shadow-indigo-500/10'
                    : 'bg-white/5 border-2 border-transparent hover:bg-white/10 hover:border-white/10'
                  }
                `}
              >
                <div className="text-3xl mb-2">{level.icon}</div>
                <div className="font-medium text-white">{level.name}</div>
                <div className="text-xs text-gray-400 mt-1">{level.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={isNextDisabled}
          className={`
            w-full py-4 rounded-xl font-semibold text-lg transition-all
            flex items-center justify-center gap-2
            ${isNextDisabled
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02]'
            }
          `}
        >
          Start Recording
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>

        {/* Back link */}
        <div className="text-center">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            ← Choose different mode
          </button>
        </div>
      </div>
    </div>
  )
}