export const FILLER_WORDS = [
  'um', 'uh', 'uhh', 'umm', 'er', 'err', 'ah', 'ahh',
  'like', 'you know', 'basically', 'actually', 'literally',
  'so', 'well', 'right', 'okay', 'ok', 'i mean',
  'sort of', 'kind of', 'kinda', 'sorta',
  'just', 'really', 'very', 'totally',
]

export function countFillerWords(text) {
  const lowerText = text.toLowerCase()
  const counts = {}
  let total = 0

  FILLER_WORDS.forEach(filler => {
    // Use word boundaries for accurate counting
    const regex = new RegExp(`\\b${filler}\\b`, 'gi')
    const matches = lowerText.match(regex)
    const count = matches ? matches.length : 0
    if (count > 0) {
      counts[filler] = count
      total += count
    }
  })

  return { counts, total }
}