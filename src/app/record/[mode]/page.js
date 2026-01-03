'use client'

import { useState, use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { modeQuestions, getRandomQuestion } from '@/utils/modeQuestions'
import { difficultyLevels } from '@/utils/difficultyLevels'
import PricingModal from '@/components/PricingModal'

export default function SetupPage({ params }) {
  // Use the 'use' hook to unwrap params if you are using Next.js 15
  const { mode } = use(params)
  const router = useRouter()
  
  const [questionMode, setQuestionMode] = useState('suggested')
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [customQuestion, setCustomQuestion] = useState('')
  const [customDuration, setCustomDuration] = useState(90)
  
  // Default selection is now 'gentle'
  const [difficulty, setDifficulty] = useState('gentle')
  
  // State for Pricing Modal
  const [showPricing, setShowPricing] = useState(false)
  const [selectedTier, setSelectedTier] = useState(null)

  const modeData = modeQuestions[mode] || modeQuestions.general

  useEffect(() => {
    setCurrentQuestion(getRandomQuestion(mode))
  }, [mode])

  const handleNewQuestion = () => {
    setCurrentQuestion(getRandomQuestion(mode))
  }

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
    
    sessionStorage.setItem('talkbetter_setup', JSON.stringify({
      mode,
      question: activeQuestion,
      difficulty,
    }))
    
    router.push(`/record/${mode}/session`)
  }

  // Handle clicking a coaching style
  const handleDifficultySelect = (level) => {
    if (level.id === 'gentle') {
      setDifficulty('gentle')
      return
    }

    // If balanced or tough is clicked, show the modal
    // Note: ensure level.id matches 'balanced' or 'tough' as defined in PricingModal
    setSelectedTier(level.id)
    setShowPricing(true)
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

      <div className="space-y-6">
        {/* Question Selection */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-sm text-indigo-400">1</span>
            Choose Your Prompt
          </h2>
          
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setQuestionMode('suggested')}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                questionMode === 'suggested' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              💡 Suggested Prompts
            </button>
            <button
              onClick={() => setQuestionMode('custom')}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                questionMode === 'custom' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              ✏️ Custom Prompt
            </button>
          </div>

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
                  <button onClick={handleNewQuestion} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-indigo-500/10 transition-colors">
                    Shuffle
                  </button>
                </div>
              </div>
            </div>
          )}

          {questionMode === 'custom' && (
            <textarea
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              placeholder="Write your specific scenario..."
              className="w-full h-36 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 transition-all"
            />
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
                onClick={() => handleDifficultySelect(level)}
                className={`
                  p-4 rounded-xl text-center transition-all
                  ${difficulty === level.id
                    ? 'bg-indigo-500/20 border-2 border-indigo-500 scale-105'
                    : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
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
          className={`w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
            isNextDisabled ? 'bg-gray-700 text-gray-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
          }`}
        >
          Start Recording
        </button>
      </div>

      {/* Pricing Modal */}
      {showPricing && selectedTier && (
        <PricingModal
          tier={selectedTier}
          onClose={() => setShowPricing(false)}
          onConfirm={(tier) => {
            setDifficulty(tier)
            setShowPricing(false)
          }}
        />
      )}
    </div>
  )
}