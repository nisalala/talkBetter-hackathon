// src/app/page.js

'use client'

import { useState, useEffect, useCallback } from 'react'
import ModeSelector from '@/components/ModeSelector'
import QuestionCard from '@/components/QuestionCard'
import RecordingInterface from '@/components/RecordingInterface'
import CustomQuestionInput from '@/components/CustomQuestionInput'
import { modeQuestions } from '@/utils/modeQuestions'

const DEFAULT_MODE = 'general'

export default function Home() {
  // State
  const [selectedMode, setSelectedMode] = useState(DEFAULT_MODE)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [usedQuestionIds, setUsedQuestionIds] = useState([])
  const [isCustomMode, setIsCustomMode] = useState(false)
  
  // Check if it's free practice mode
  const isFreePractice = selectedMode === 'general'
  
  // Get current mode data
  const currentModeData = modeQuestions[selectedMode]

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

  // Handle mode change
  const handleModeChange = (modeId) => {
    setSelectedMode(modeId)
    setIsCustomMode(false)
    
    if (modeId !== 'general' && modeQuestions[modeId]) {
      const { question } = getRandomQuestion(modeQuestions[modeId].questions, [])
      setCurrentQuestion(question)
      setUsedQuestionIds([question.id])
    } else {
      setCurrentQuestion(null)
      setUsedQuestionIds([])
    }
  }

  // Handle shuffle
  const handleShuffle = () => {
    if (!currentModeData || isFreePractice) return
    
    const { question, resetUsed } = getRandomQuestion(currentModeData.questions, usedQuestionIds)
    
    if (resetUsed) {
      setUsedQuestionIds([question.id])
    } else {
      setUsedQuestionIds(prev => [...prev, question.id])
    }
    
    setCurrentQuestion(question)
    setIsCustomMode(false)
  }

  // Handle custom question
  const handleCustomQuestion = (text) => {
    setCurrentQuestion({
      id: 'custom',
      text: text,
      duration: 60,
      isCustom: true,
      tips: [],
    })
    setIsCustomMode(true)
  }

  // Handle clear custom
  const handleClearCustom = () => {
    setIsCustomMode(false)
    
    if (!isFreePractice && currentModeData) {
      const { question } = getRandomQuestion(currentModeData.questions, [])
      setCurrentQuestion(question)
      setUsedQuestionIds([question.id])
    } else {
      setCurrentQuestion(null)
    }
  }

  // Initialize with random question if mode has questions
  useEffect(() => {
    if (currentModeData && !isFreePractice) {
      const { question } = getRandomQuestion(currentModeData.questions, [])
      setCurrentQuestion(question)
      setUsedQuestionIds([question.id])
    }
  }, []) // Only on mount

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <div className="text-[16px] font-semibold">
          Record your voice. Improve clarity and confidence.
        </div>
      </div>

      {/* Mode Tabs */}
      <ModeSelector 
        selectedMode={selectedMode} 
        onModeChange={handleModeChange} 
      />

      {/* Main Container */}
      <div className="glass rounded-2xl p-6 md:p-8 mb-6">
        
        {/* Question Card */}
        {currentQuestion && (
          <QuestionCard
            mode={selectedMode}
            question={currentQuestion}
            isCustom={isCustomMode}
            onShuffle={!isFreePractice ? handleShuffle : null}
            onClear={isCustomMode ? handleClearCustom : null}
          />
        )}

        {/* Recording Interface with Live Feedback */}
        <RecordingInterface 
          mode={selectedMode}
          question={currentQuestion}
          isFreePractice={isFreePractice}
        />
      </div>

      {/* Custom Question Input */}
      {!isCustomMode && (
        <CustomQuestionInput 
          isFreePractice={isFreePractice}
          onSubmit={handleCustomQuestion}
        />
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