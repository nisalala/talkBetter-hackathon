'use client'

import { useRouter } from 'next/navigation'

const modes = [
  {
    id: 'pitch',
    name: 'Pitch',
    description: 'Nail your startup pitch or sales presentation',
    icon: '🚀',
    color: 'from-orange-500 to-red-500',
    hoverGlow: 'hover:shadow-orange-500/25',
    metrics: ['Clarity', 'Structure', 'Persuasion', 'Call-to-Action'],
  },
  {
    id: 'interview',
    name: 'Interview',
    description: 'Ace your job interviews with confidence',
    icon: '💼',
    color: 'from-blue-500 to-cyan-500',
    hoverGlow: 'hover:shadow-blue-500/25',
    metrics: ['Relevance', 'Specificity', 'Confidence', 'Hireability'],
  },
  {
    id: 'meeting',
    name: 'Meeting',
    description: 'Make your points clearly in meetings',
    icon: '📊',
    color: 'from-green-500 to-emerald-500',
    hoverGlow: 'hover:shadow-green-500/25',
    metrics: ['Conciseness', 'Value-Add', 'Action Items', 'Clarity'],
  },
  {
    id: 'date',
    name: 'Date',
    description: 'Be your authentic self on dates',
    icon: '💝',
    color: 'from-pink-500 to-rose-500',
    hoverGlow: 'hover:shadow-pink-500/25',
    metrics: ['Authenticity', 'Questions Asked', 'Talk Ratio', 'Engagement'],
  },
  {
    id: 'difficult',
    name: 'Difficult Talk',
    description: 'Navigate tough conversations gracefully',
    icon: '🤝',
    color: 'from-purple-500 to-violet-500',
    hoverGlow: 'hover:shadow-purple-500/25',
    metrics: ['Empathy', 'Assertiveness', 'Respectfulness', 'Resolution'],
  },
  {
    id: 'speech',
    name: 'Speech',
    description: 'Deliver impactful public speeches',
    icon: '🎤',
    color: 'from-yellow-500 to-amber-500',
    hoverGlow: 'hover:shadow-yellow-500/25',
    metrics: ['Engagement', 'Structure', 'Opening', 'Closing'],
  },
  {
    id: 'general',
    name: 'General',
    description: 'Improve everyday communication',
    icon: '💬',
    color: 'from-indigo-500 to-purple-500',
    hoverGlow: 'hover:shadow-indigo-500/25',
    metrics: ['Clarity', 'Confidence', 'Pace', 'Filler Words'],
  },
]

export default function ModeSelector() {
  const router = useRouter()

  const handleModeSelect = (modeId) => {
    router.push(`/record/${modeId}`)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => handleModeSelect(mode.id)}
          className={`
            group relative overflow-hidden rounded-2xl p-6 text-left
            glass transition-all duration-300 ease-out
            hover:scale-105 hover:shadow-2xl ${mode.hoverGlow}
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900
          `}
        >
          {/* Gradient background on hover */}
          <div className={`
            absolute inset-0 bg-gradient-to-br ${mode.color} opacity-0 
            group-hover:opacity-10 transition-opacity duration-300
          `} />
          
          {/* Icon */}
          <div className={`
            w-14 h-14 rounded-xl bg-gradient-to-br ${mode.color} 
            flex items-center justify-center text-2xl mb-4
            group-hover:scale-110 transition-transform duration-300
          `}>
            {mode.icon}
          </div>
          
          {/* Content */}
          <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-indigo-300 transition-colors">
            {mode.name}
          </h3>
          <p className="text-gray-400 text-sm mb-4 leading-relaxed">
            {mode.description}
          </p>
          
          {/* Metrics preview */}
          <div className="flex flex-wrap gap-2">
            {mode.metrics.slice(0, 3).map((metric) => (
              <span
                key={metric}
                className="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-300"
              >
                {metric}
              </span>
            ))}
          </div>
          
          {/* Arrow indicator */}
          <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </button>
      ))}
    </div>
  )
}