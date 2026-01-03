// src/components/LiveStats.jsx

'use client'

export default function LiveStats({ stats }) {
  const { wordCount, wpm, fillerCount, sentenceCount, avgWordsPerSentence } = stats

  const getPaceStatus = () => {
    if (wpm === 0) return { label: 'Start speaking...', color: 'text-gray-400', bg: 'bg-gray-500/20' }
    if (wpm < 100) return { label: '🐢 Too slow', color: 'text-yellow-400', bg: 'bg-yellow-500/20' }
    if (wpm > 170) return { label: '🐇 Too fast', color: 'text-orange-400', bg: 'bg-orange-500/20' }
    if (wpm >= 120 && wpm <= 150) return { label: '✨ Perfect!', color: 'text-green-400', bg: 'bg-green-500/20' }
    return { label: '👍 Good', color: 'text-blue-400', bg: 'bg-blue-500/20' }
  }

  const getFillerStatus = () => {
    if (fillerCount === 0) return { color: 'text-green-400', bg: 'bg-green-500/20' }
    if (fillerCount <= 2) return { color: 'text-yellow-400', bg: 'bg-yellow-500/20' }
    return { color: 'text-red-400', bg: 'bg-red-500/20' }
  }

  const paceStatus = getPaceStatus()
  const fillerStatus = getFillerStatus()

  return (
    <div className="glass rounded-xl p-4 mb-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium text-gray-400">Live Stats</span>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${paceStatus.color} ${paceStatus.bg}`}>
          {paceStatus.label}
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-3">
        {/* Words */}
        <div className="text-center p-2 rounded-lg bg-white/5">
          <div className="text-xl font-bold text-white">{wordCount}</div>
          <div className="text-xs text-gray-500">Words</div>
        </div>
        
        {/* WPM */}
        <div className={`text-center p-2 rounded-lg ${paceStatus.bg}`}>
          <div className={`text-xl font-bold ${paceStatus.color}`}>
            {wpm || '-'}
          </div>
          <div className="text-xs text-gray-500">WPM</div>
        </div>
        
        {/* Fillers */}
        <div className={`text-center p-2 rounded-lg ${fillerStatus.bg}`}>
          <div className={`text-xl font-bold ${fillerStatus.color}`}>
            {fillerCount}
          </div>
          <div className="text-xs text-gray-500">Fillers</div>
        </div>
        
        {/* Sentences */}
        <div className="text-center p-2 rounded-lg bg-white/5">
          <div className="text-xl font-bold text-white">{sentenceCount || 0}</div>
          <div className="text-xs text-gray-500">Sentences</div>
        </div>
      </div>

      {/* Filler word breakdown (if any) */}
      {stats.fillerWords && Object.keys(stats.fillerWords).length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.fillerWords)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 4)
              .map(([word, count]) => (
                <span 
                  key={word}
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    count >= 3 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  "{word}" × {count}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}