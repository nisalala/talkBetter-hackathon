export function calculateWPM(text, durationSeconds) {
  if (!text || durationSeconds <= 0) return 0
  
  const words = text.trim().split(/\s+/).filter(word => word.length > 0)
  const minutes = durationSeconds / 60
  
  return Math.round(words.length / minutes)
}

export function getWPMRating(wpm) {
  if (wpm < 100) {
    return { rating: 'slow', message: 'Your pace is quite slow. Try to speak a bit faster to maintain engagement.' }
  } else if (wpm < 130) {
    return { rating: 'good', message: 'Your pace is perfect for clear communication.' }
  } else if (wpm < 160) {
    return { rating: 'moderate', message: 'Your pace is good but could slow down slightly for better clarity.' }
  } else {
    return { rating: 'fast', message: 'You\'re speaking quite fast. Consider slowing down for better comprehension.' }
  }
}