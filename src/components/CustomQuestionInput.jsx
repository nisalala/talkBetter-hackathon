// src/components/CustomQuestionInput.jsx

'use client'

import { useState } from 'react'

// Duration presets for quick selection
const durationPresets = [
  { label: '30s', value: 30 },
  { label: '1m', value: 60 },
  { label: '2m', value: 120 },
  { label: '3m', value: 180 },
  { label: '5m', value: 300 },
]

export default function CustomQuestionInput({ isFreePractice, onSubmit }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [customText, setCustomText] = useState('')
  const [customDuration, setCustomDuration] = useState(60)
  const [showDurationPicker, setShowDurationPicker] = useState(false)

  const handleSubmit = () => {
    if (customText.trim()) {
      onSubmit(customText.trim(), customDuration)
      setCustomText('')
      setIsExpanded(false)
      setShowDurationPicker(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
  }

  // Collapsed State
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full glass rounded-2xl p-4 text-left hover:bg-white/5 transition-all border border-dashed border-white/20 hover:border-white/30 group mb-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
            <span className="text-xl">✏️</span>
          </div>
          <div>
            <p className="text-white font-medium">
              {isFreePractice ? 'Add a custom prompt' : 'Use your own prompt'}
            </p>
            <p className="text-gray-500 text-sm">
              Practice with any topic you want
            </p>
          </div>
          <svg 
            className="w-5 h-5 text-gray-400 ml-auto group-hover:text-white transition-colors" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </button>
    )
  }

  // Expanded State
  return (
    <div className="glass rounded-2xl p-5 animate-fadeIn mb-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">✏️</span>
          <h3 className="text-white font-semibold">Custom Prompt</h3>
        </div>
        <button
          onClick={() => {
            setIsExpanded(false)
            setCustomText('')
            setShowDurationPicker(false)
          }}
          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Text Input */}
      <textarea
        value={customText}
        onChange={(e) => setCustomText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter your practice prompt... (e.g., 'Introduce yourself for a job interview')"
        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
        rows={3}
        autoFocus
      />

      {/* Duration Section */}
      <div className="mt-4">
        <button
          onClick={() => setShowDurationPicker(!showDurationPicker)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Target Duration: <span className="text-indigo-400 font-medium">{formatDuration(customDuration)}</span></span>
          <svg 
            className={`w-4 h-4 transition-transform ${showDurationPicker ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Duration Picker */}
        {showDurationPicker && (
          <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 animate-fadeIn">
            {/* Presets */}
            <div className="flex flex-wrap gap-2 mb-4">
              {durationPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setCustomDuration(preset.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    customDuration === preset.value
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>15s</span>
                <span className="text-indigo-400 font-medium">{formatDuration(customDuration)}</span>
                <span>10m</span>
              </div>
              <input
                type="range"
                min="15"
                max="600"
                step="15"
                value={customDuration}
                onChange={(e) => setCustomDuration(parseInt(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-thumb"
              />
              {/* Visual progress bar */}
              <div className="relative h-1 bg-white/10 rounded-full -mt-3 pointer-events-none">
                <div 
                  className="absolute h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  style={{ width: `${((customDuration - 15) / (600 - 15)) * 100}%` }}
                />
              </div>
            </div>

            {/* Duration info */}
            <p className="text-xs text-gray-500 mt-3">
              💡 Tip: Match your target to the real scenario. Job pitches are usually 60-90s.
            </p>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={() => {
            setIsExpanded(false)
            setCustomText('')
            setShowDurationPicker(false)
          }}
          className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-medium transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!customText.trim()}
          className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span>Start Practice</span>
          <span className="text-xs opacity-75">({formatDuration(customDuration)})</span>
        </button>
      </div>
    </div>
  )
}