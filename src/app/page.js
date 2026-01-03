// src/app/page.js

'use client'

import { useState, useEffect, useCallback } from 'react'
import { modeQuestions } from '@/utils/modeQuestions'
import { getModesForTabs, getModeStyle, DEFAULT_MODE } from '@/utils/modeConfig'
import { useAuth } from '@/contexts/AuthContext'
import RecordingInterface from '@/components/RecordingInterface'
import CustomQuestionInput from '@/components/CustomQuestionInput'
import ConversationInterface from '@/components/ConservationInterface'
import PricingModal from '@/components/PricingModal'

// Get all modes for tabs
const allModes = getModesForTabs()

export default function Home() {
  const { isAuthenticated, isPremium, isLoading } = useAuth()
  
  // State
  const [interactionType, setInteractionType] = useState('single')
  const [selectedMode, setSelectedMode] = useState(DEFAULT_MODE)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [usedQuestionIds, setUsedQuestionIds] = useState([])
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Handle hydration - only render auth-dependent UI after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if it's free practice mode
  const isFreePractice = selectedMode === 'general'

  // Get current mode data
  const currentModeData = allModes.find((m) => m.id === selectedMode)
  const modeStyle = getModeStyle(selectedMode)

  // Get questions for current mode (if not free practice)
  const modeQuestionsData = !isFreePractice
    ? modeQuestions[selectedMode]?.questions || []
    : []

  // Check if user has premium access - only after mount to avoid hydration mismatch
  const hasPremiumAccess = mounted && isAuthenticated && isPremium()

  // Get a random question from available questions
  const getRandomQuestion = useCallback((questions, excludeIds = []) => {
    if (!questions || questions.length === 0)
      return { question: null, resetUsed: false }

    const availableQuestions = questions.filter(
      (q) => !excludeIds.includes(q.id)
    )

    if (availableQuestions.length === 0) {
      const randomIndex = Math.floor(Math.random() * questions.length)
      return { question: questions[randomIndex], resetUsed: true }
    }

    const randomIndex = Math.floor(Math.random() * availableQuestions.length)
    return { question: availableQuestions[randomIndex], resetUsed: false }
  }, [])

  // Shuffle to get new question
  const handleShuffle = useCallback(() => {
    if (isFreePractice || modeQuestionsData.length === 0) return

    const { question, resetUsed } = getRandomQuestion(
      modeQuestionsData,
      usedQuestionIds
    )

    if (resetUsed) {
      setUsedQuestionIds([question.id])
    } else {
      setUsedQuestionIds((prev) => [...prev, question.id])
    }

    setCurrentQuestion(question)
    setIsCustomMode(false)
  }, [isFreePractice, modeQuestionsData, usedQuestionIds, getRandomQuestion])

  // When mode changes, get a random question (only for question-based modes)
  useEffect(() => {
    if (!isFreePractice && modeQuestionsData.length > 0) {
      const { question } = getRandomQuestion(modeQuestionsData, [])
      setCurrentQuestion(question)
      setUsedQuestionIds([question?.id].filter(Boolean))
      setIsCustomMode(false)
    } else {
      setCurrentQuestion(null)
      setUsedQuestionIds([])
      setIsCustomMode(false)
    }
  }, [selectedMode, isFreePractice, getRandomQuestion])

  // Handle tab click
  const handleTabClick = (modeId) => {
    if (selectedMode === modeId) return
    setSelectedMode(modeId)
    setIsCustomMode(false)
  }

  // ✅ UPDATED: Handle custom question with duration
  const handleCustomQuestion = (questionText, duration = 60) => {
    setCurrentQuestion({
      id: 'custom',
      text: questionText,
      duration: duration, // Now accepts custom duration from slider
      isCustom: true,
      tips: [],
    })
    setIsCustomMode(true)
  }

  // Clear custom and go back to random (or no question for free practice)
  const handleClearCustom = () => {
    setIsCustomMode(false)

    if (!isFreePractice && modeQuestionsData.length > 0) {
      const { question } = getRandomQuestion(modeQuestionsData, [])
      setCurrentQuestion(question)
      setUsedQuestionIds([question?.id].filter(Boolean))
    } else {
      setCurrentQuestion(null)
    }
  }

  // Handle interaction type toggle
  const handleInteractionToggle = () => {
    if (interactionType === 'single') {
      if (!hasPremiumAccess) {
        setShowPricingModal(true)
        return
      }
      setInteractionType('two-way')
    } else {
      setInteractionType('single')
    }
  }

  // Handle pricing modal close
  const handlePricingClose = () => {
    setShowPricingModal(false)
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
                ${
                  selectedMode === mode.id
                    ? `bg-gradient-to-r ${mode.color} text-white shadow-lg ring-2 ${mode.ringColor}`
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300'
                }`}
            >
              <span>{mode.icon}</span>
              <span className="hidden sm:inline">{mode.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ============================================ */}
      {/* MAIN CONTAINER - Recording/Conversation     */}
      {/* ============================================ */}
      <div className="relative glass rounded-2xl p-6 md:p-8 mb-6">
        {/* Interaction Type Toggle */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-5 z-10">
          <button
            onClick={handleInteractionToggle}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2
              ${interactionType === 'two-way'
                ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30'
                : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10'
              }`}
          >
            {interactionType === 'two-way' ? (
              <>
                <span>🎙️</span>
                <span className="hidden sm:inline">Single</span>
              </>
            ) : (
              <>
                <span>💬</span>
                <span className="hidden sm:inline">Two-way</span>
                <span className="sm:hidden">2-way</span>
                {mounted && !hasPremiumAccess && (
                  <span className="text-yellow-400 text-xs">🔒</span>
                )}
              </>
            )}
          </button>
        </div>

        {/* Conditional Interface Rendering */}
        {interactionType === 'single' ? (
          <RecordingInterface
            mode={selectedMode}
            question={currentQuestion}
            isCustom={isCustomMode}
            isFreePractice={isFreePractice && !isCustomMode}
            onShuffle={handleShuffle}
            onClearCustom={handleClearCustom}
          />
        ) : (
          <ConversationInterface
            mode={selectedMode}
            isFreePractice={isFreePractice}
          />
        )}
      </div>

      {/* Custom Question Section - Only show for single interaction mode */}
      {interactionType === 'single' && !isCustomMode && (
        <CustomQuestionInput
          isFreePractice={isFreePractice}
          onSubmit={handleCustomQuestion}
        />
      )}

      {/* Premium Upsell Banner */}
      {mounted && interactionType === 'single' && !hasPremiumAccess && (
        <div className="glass rounded-2xl p-4 mb-6 border border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">💬</div>
              <div>
                <p className="text-white font-medium text-sm">
                  Want realistic two-way conversations?
                </p>
                <p className="text-gray-400 text-xs">
                  Practice interviews, negotiations, and more with AI
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPricingModal(true)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 
                       text-white font-medium text-sm hover:from-indigo-400 hover:to-purple-400 
                       transition-all whitespace-nowrap"
            >
              Unlock Premium
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

      {/* Pricing Modal */}
      {showPricingModal && (
        <PricingModal
          onClose={handlePricingClose}
          feature="Two-Way Conversations"
        />
      )}
    </div>
  )
}