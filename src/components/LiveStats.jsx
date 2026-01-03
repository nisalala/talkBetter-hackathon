// src/components/LiveStats.jsx

'use client'

export default function LiveStats({ stats, showContextScore = false }) {
  const { wordCount, wpm, fillerCount, contextScore } = stats

  const getPaceStatus = () => {
    if (wpm === 0) return { label: '...', color: 'text-gray-400', bg: 'bg-gray-500/20' }
    if (wpm < 100) return { label: '🐢', color: 'text-yellow-400', bg: 'bg-yellow-500/20' }
    if (wpm > 170) return { label: '🐇', color: 'text-orange-400', bg: 'bg-orange-500/20' }
    if (wpm >= 120 && wpm <= 150) return { label: '✨', color: 'text-green-400', bg: 'bg-green-500/20' }
    return { label: '👍', color: 'text-blue-400', bg: 'bg-blue-500/20' }
  }

  const getFillerStatus = () => {
    if (fillerCount === 0) return { color: 'text-green-400', bg: 'bg-green-500/20' }
    if (fillerCount <= 2) return { color: 'text-yellow-400', bg: 'bg-yellow-500/20' }
    return { color: 'text-red-400', bg: 'bg-red-500/20' }
  }

  const getContextStatus = () => {
    if (contextScore === undefined || contextScore === null) return { label: '...', color: 'text-gray-400' }
    if (contextScore >= 70) return { label: '✓', color: 'text-green-400' }
    if (contextScore >= 50) return { label: '~', color: 'text-yellow-400' }
    return { label: '!', color: 'text-red-400' }
  }

  const paceStatus = getPaceStatus()
  const fillerStatus = getFillerStatus()
  const contextStatus = getContextStatus()

  return (
    <div className="flex items-center justify-center gap-4 mb-4">
      {/* Words */}
      <div className="text-center">
        <div className="text-lg font-bold text-white">{wordCount}</div>
        <div className="text-[10px] text-gray-500 uppercase">Words</div>
      </div>
      
      {/* Divider */}
      <div className="w-px h-8 bg-white/10" />
      
      {/* WPM with status */}
      <div className="text-center">
        <div className={`text-lg font-bold ${paceStatus.color} flex items-center justify-center gap-1`}>
          {wpm || '-'}
          <span className="text-sm">{paceStatus.label}</span>
        </div>
        <div className="text-[10px] text-gray-500 uppercase">WPM</div>
      </div>
      
      {/* Divider */}
      <div className="w-px h-8 bg-white/10" />
      
      {/* Fillers */}
      <div className="text-center">
        <div className={`text-lg font-bold ${fillerStatus.color}`}>
          {fillerCount}
        </div>
        <div className="text-[10px] text-gray-500 uppercase">Fillers</div>
      </div>

      {/* Context Score - Only for non-general modes */}
      {showContextScore && (
        <>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <div className={`text-lg font-bold ${contextStatus.color}`}>
              {contextStatus.label}
            </div>
            <div className="text-[10px] text-gray-500 uppercase">Topic</div>
          </div>
        </>
      )}

      {/* Filler words popup - only show if there are fillers */}
      {stats.fillerWords && Object.keys(stats.fillerWords).length > 0 && (
        <>
          <div className="w-px h-8 bg-white/10" />
          <div className="flex gap-1">
            {Object.entries(stats.fillerWords)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 2)
              .map(([word, count]) => (
                <span 
                  key={word}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    count >= 3 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {word}:{count}
                </span>
              ))}
          </div>
        </>
      )}
    </div>
  )
}