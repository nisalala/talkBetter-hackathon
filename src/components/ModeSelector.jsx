// src/components/ModeSelector.jsx

'use client'

import { modeQuestions } from '@/utils/modeQuestions'
import { getModeStyle } from '@/utils/modeConfig'

export default function ModeSelector({ selectedMode, onModeChange }) {
  // Build modes array from modeQuestions
  const modes = [
    { id: 'general', title: 'Free Practice', icon: '🎙️' },
    ...Object.entries(modeQuestions)
      .filter(([id]) => id !== 'general')
      .map(([id, data]) => ({
        id,
        title: data.name,
        icon: data.icon,
      }))
  ]

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2">
        {modes.map((mode) => {
          const style = getModeStyle(mode.id)
          const isSelected = selectedMode === mode.id
          
          return (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className={`px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2
                ${isSelected 
                  ? `bg-gradient-to-r ${style.color} text-white shadow-lg ring-2 ${style.ringColor}` 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300'
                }`}
            >
              <span>{mode.icon}</span>
              <span className="hidden sm:inline">{mode.title}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}