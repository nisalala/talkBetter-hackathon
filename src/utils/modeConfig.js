// src/utils/modeConfig.js

export const modeStyles = {
  pitch: {
    color: 'from-orange-500 to-red-500',
    ringColor: 'ring-orange-500/50',
    bgColor: 'bg-orange-500/10',
  },
  interview: {
    color: 'from-blue-500 to-cyan-500',
    ringColor: 'ring-blue-500/50',
    bgColor: 'bg-blue-500/10',
  },
  meeting: {
    color: 'from-green-500 to-emerald-500',
    ringColor: 'ring-green-500/50',
    bgColor: 'bg-green-500/10',
  },
  date: {
    color: 'from-pink-500 to-rose-500',
    ringColor: 'ring-pink-500/50',
    bgColor: 'bg-pink-500/10',
  },
  difficult: {
    color: 'from-purple-500 to-violet-500',
    ringColor: 'ring-purple-500/50',
    bgColor: 'bg-purple-500/10',
  },
  speech: {
    color: 'from-yellow-500 to-amber-500',
    ringColor: 'ring-yellow-500/50',
    bgColor: 'bg-yellow-500/10',
  },
  general: {
    color: 'from-gray-500 to-gray-600',
    ringColor: 'ring-gray-500/50',
    bgColor: 'bg-gray-500/10',
  },
}

export const modeDescriptions = {
  pitch: 'Nail your startup pitch or sales presentation',
  interview: 'Ace your job interviews with confidence',
  meeting: 'Make your points clearly in meetings',
  date: 'Be your authentic self on dates',
  difficult: 'Navigate tough conversations gracefully',
  speech: 'Deliver impactful public speeches',
  general: 'Practice anything freely',
}

export const getModeStyle = (modeId) => {
  return modeStyles[modeId] || modeStyles.general
}

export const getModeDescription = (modeId) => {
  return modeDescriptions[modeId] || 'Practice your communication skills'
}