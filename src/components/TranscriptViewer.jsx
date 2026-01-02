'use client'

import { useState } from 'react'
import { FILLER_WORDS } from '@/utils/fillerWords'

export default function TranscriptViewer({ transcript, highlightFillers = true }) {
  const [showFillers, setShowFillers] = useState(highlightFillers)

  const highlightText = (text) => {
    if (!showFillers) return text

    let result = text
    FILLER_WORDS.forEach(filler => {
      const regex = new RegExp(`\\b(${filler})\\b`, 'gi')
      result = result.replace(regex, `<mark class="bg-yellow-500/30 text-yellow-300 px-1 rounded">$1</mark>`)
    })
    return result
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Your Transcript</h3>
        <button
          onClick={() => setShowFillers(!showFillers)}
          className={`
            px-3 py-1 rounded-lg text-sm transition-colors
            ${showFillers 
              ? 'bg-yellow-500/20 text-yellow-400' 
              : 'bg-white/5 text-gray-400'
            }
          `}
        >
          {showFillers ? '● Filler words highlighted' : '○ Show filler words'}
        </button>
      </div>
      <div 
        className="text-gray-300 leading-relaxed whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: highlightText(transcript) }}
      />
    </div>
  )
}