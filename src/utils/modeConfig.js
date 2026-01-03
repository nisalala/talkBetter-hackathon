// src/utils/modeConfig.js

import { modeQuestions } from './modeQuestions'

// Mode styling configuration
export const modeStyles = {
  pitch: {
    color: 'from-orange-500 to-red-500',
    ringColor: 'ring-orange-500/50',
    hoverGlow: 'hover:shadow-orange-500/25',
  },
  interview: {
    color: 'from-blue-500 to-cyan-500',
    ringColor: 'ring-blue-500/50',
    hoverGlow: 'hover:shadow-blue-500/25',
  },
  meeting: {
    color: 'from-green-500 to-emerald-500',
    ringColor: 'ring-green-500/50',
    hoverGlow: 'hover:shadow-green-500/25',
  },
  date: {
    color: 'from-pink-500 to-rose-500',
    ringColor: 'ring-pink-500/50',
    hoverGlow: 'hover:shadow-pink-500/25',
  },
  difficult: {
    color: 'from-purple-500 to-violet-500',
    ringColor: 'ring-purple-500/50',
    hoverGlow: 'hover:shadow-purple-500/25',
  },
  speech: {
    color: 'from-yellow-500 to-amber-500',
    ringColor: 'ring-yellow-500/50',
    hoverGlow: 'hover:shadow-yellow-500/25',
  },
  general: {
    color: 'from-gray-500 to-gray-600',
    ringColor: 'ring-gray-500/50',
    hoverGlow: 'hover:shadow-gray-500/25',
  },
}

// Mode descriptions
export const modeDescriptions = {
  pitch: 'Nail your startup pitch or sales presentation',
  interview: 'Ace your job interviews with confidence',
  meeting: 'Make your points clearly in meetings',
  date: 'Be your authentic self on dates',
  difficult: 'Navigate tough conversations gracefully',
  speech: 'Deliver impactful public speeches',
  general: 'Practice anything freely',
}

// Default mode
export const DEFAULT_MODE = 'general'

// Get modes for tabs (general first, then others)
export const getModesForTabs = () => {
  const freePracticeMode = {
    id: 'general',
    name: 'Free Practice',
    icon: '🎙️',
    description: modeDescriptions.general,
    color: modeStyles.general.color,
    ringColor: modeStyles.general.ringColor,
  }

  const questionModes = Object.entries(modeQuestions)
    .filter(([id]) => id !== 'general')
    .map(([id, data]) => ({
      id,
      name: data.name,
      icon: data.icon,
      description: modeDescriptions[id] || 'Practice your communication skills',
      color: modeStyles[id]?.color || 'from-gray-500 to-gray-600',
      ringColor: modeStyles[id]?.ringColor || 'ring-gray-500/50',
      questions: data.questions,
    }))

  return [freePracticeMode, ...questionModes]
}

// Get mode style by ID
export function getModeStyle(modeId) {
  return modeStyles[modeId] || modeStyles.general
}

// Get mode description by ID
export function getModeDescription(modeId) {
  return modeDescriptions[modeId] || 'Practice your communication skills'
}

// Get mode data by ID
export function getModeById(modeId) {
  const modes = getModesForTabs()
  return modes.find(m => m.id === modeId) || null
}