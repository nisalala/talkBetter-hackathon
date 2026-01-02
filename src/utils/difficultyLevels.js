export const difficultyLevels = {
  gentle: {
    id: 'gentle',
    name: 'Gentle',
    icon: '🌱',
    description: 'Encouraging feedback focused on your strengths',
    promptModifier: `Be encouraging and supportive. Focus heavily on strengths while gently suggesting improvements. 
Use positive language. Score generously - this user is building confidence.
Scores should generally be 70-95 range for decent attempts.`,
  },
  
  balanced: {
    id: 'balanced',
    name: 'Balanced',
    icon: '🎯',
    description: 'Fair and honest feedback',
    promptModifier: `Be fair and balanced. Acknowledge strengths genuinely but also provide honest, constructive criticism.
Score accurately - good performance gets 75-90, average gets 55-75, poor gets below 55.`,
  },
  
  tough: {
    id: 'tough',
    name: 'Tough Love',
    icon: '🔥',
    description: 'Brutally honest feedback to push you harder',
    promptModifier: `Be a demanding coach. Hold the speaker to professional standards.
Be specific about flaws and what needs improvement. Don't sugarcoat.
Score strictly - only exceptional performance gets above 80. Average is 50-65.
Point out every filler word, unclear statement, and missed opportunity.`,
  },
}

export function getDifficultyModifier(difficultyId) {
  return difficultyLevels[difficultyId]?.promptModifier || difficultyLevels.balanced.promptModifier
}