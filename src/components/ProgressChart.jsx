'use client'

import { useEffect, useState } from 'react'
import { getChartData } from '@/lib/storage'

export default function ProgressChart() {
  const [data, setData] = useState([])
  const [timeRange, setTimeRange] = useState(7) // 7 days default

  useEffect(() => {
    setData(getChartData(timeRange))
  }, [timeRange])

  // Find max score for scaling
  const maxScore = Math.max(...data.map(d => d.score || 0), 100)
  
  // Calculate bar heights
  const getBarHeight = (score) => {
    if (score === null) return 0
    return (score / maxScore) * 100
  }

  // Get color based on score
  const getBarColor = (score) => {
    if (score === null) return 'bg-gray-700'
    if (score >= 80) return 'bg-gradient-to-t from-green-600 to-green-400'
    if (score >= 60) return 'bg-gradient-to-t from-yellow-600 to-yellow-400'
    return 'bg-gradient-to-t from-red-600 to-red-400'
  }

  const hasData = data.some(d => d.score !== null)

  return (
    <div className="glass rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          📈 Progress
        </h2>
        <div className="flex gap-2">
          {[7, 14, 30].map(days => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                timeRange === days
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {!hasData ? (
        <div className="h-48 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p>Complete sessions to see your progress</p>
          </div>
        </div>
      ) : (
        <div className="h-48 flex items-end justify-between gap-2">
          {data.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              {/* Bar */}
              <div className="w-full h-40 flex flex-col justify-end">
                {item.score !== null ? (
                  <div className="relative group">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${getBarColor(item.score)}`}
                      style={{ height: `${getBarHeight(item.score)}%`, minHeight: '8px' }}
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 
                                  opacity-0 group-hover:opacity-100 transition-opacity
                                  bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      Score: {item.score} ({item.sessions} session{item.sessions !== 1 ? 's' : ''})
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-2 rounded-t-lg bg-gray-700/50" />
                )}
              </div>
              
              {/* Label */}
              <div className="mt-2 text-xs text-gray-400 text-center">
                <div>{item.day}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      {hasData && (
        <div className="mt-4 flex justify-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>80+</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-500" />
            <span>60-79</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span>&lt;60</span>
          </div>
        </div>
      )}
    </div>
  )
}