// src/components/QuestionCard.jsx

'use client'

import { getModeStyle } from '@/utils/modeConfig'
import { modeQuestions } from '@/utils/modeQuestions'

export default function QuestionCard({ 
  mode, 
  question, 
  isCustom, 
  onShuffle, 
  onClear 
}) {
  if (!question) return null
  
  const modeData = modeQuestions[mode]
  const style = getModeStyle(mode)

  return (
    <div className="mb-8 pb-8 border-b border-white/10">
      {/* Header */}
      {modeData && mode !== 'general' && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>{modeData.icon}</span>
            {modeData.name}
          </h3>
        </div>
      )}
      
      {/* Question Display */}
      <div className={`p-4 rounded-xl bg-white/5 border border-white/10`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-medium">
                {isCustom ? '✏️ Custom' : '💡 Prompt'}
              </span>
              
              {/* Shuffle button (only for non-custom) */}
              {!isCustom && onShuffle && (
                <button
                  onClick={onShuffle}
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
              
              {/* Clear custom button */}
              {isCustom && onClear && (
                <button
                  onClick={onClear}
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
              &quot;{question.text}&quot;
            </p>
            
            {/* Tips */}
            {question.tips && question.tips.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {question.tips.map((tip, index) => (
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
          
          {/* Duration badge */}
          {question.duration && (
            <div className="flex-shrink-0 text-center px-4 py-3 bg-white/5 rounded-xl">
              <div className="text-2xl font-bold text-indigo-400">
                {question.duration < 60 
                  ? question.duration 
                  : Math.floor(question.duration / 60)}
              </div>
              <div className="text-xs text-gray-400">
                {question.duration < 60 ? 'sec' : 'min'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}