'use client'

export default function Timer({ seconds, isRecording, isPaused, targetDuration }) {
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Calculate progress towards target
  const progress = targetDuration ? Math.min((seconds / targetDuration) * 100, 100) : 0
  const isOverTime = targetDuration && seconds > targetDuration

  return (
    <div className="relative">
      {/* Outer ring */}
      <div className={`
        w-48 h-48 rounded-full flex items-center justify-center
        ${isRecording && !isPaused 
          ? isOverTime
            ? 'bg-orange-500/10 ring-4 ring-orange-500/50'
            : 'bg-red-500/10 ring-4 ring-red-500/50 animate-pulse' 
          : isPaused 
          ? 'bg-yellow-500/10 ring-4 ring-yellow-500/50' 
          : 'bg-gray-800/50 ring-4 ring-gray-700'
        }
        transition-all duration-300
      `}>
        {/* Progress ring (if target duration exists) */}
        {targetDuration && isRecording && (
          <svg className="absolute inset-0 w-48 h-48 -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="90"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-white/10"
            />
            <circle
              cx="96"
              cy="96"
              r="90"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              className={isOverTime ? 'text-orange-500' : 'text-indigo-500'}
              style={{
                strokeDasharray: `${2 * Math.PI * 90}`,
                strokeDashoffset: `${2 * Math.PI * 90 * (1 - progress / 100)}`,
                transition: 'stroke-dashoffset 0.3s ease-out',
              }}
            />
          </svg>
        )}

        {/* Inner circle */}
        <div className={`
          w-40 h-40 rounded-full flex flex-col items-center justify-center
          ${isRecording && !isPaused 
            ? isOverTime
              ? 'bg-orange-500/20'
              : 'bg-red-500/20' 
            : isPaused 
            ? 'bg-yellow-500/20' 
            : 'bg-gray-800'
          }
          transition-all duration-300 z-10
        `}>
          <span className="text-5xl font-mono font-bold text-white">
            {formatTime(seconds)}
          </span>
          <span className={`
            text-sm mt-2 font-medium
            ${isRecording && !isPaused 
              ? isOverTime
                ? 'text-orange-400'
                : 'text-red-400' 
              : isPaused 
              ? 'text-yellow-400' 
              : 'text-gray-400'
            }
          `}>
            {isRecording && !isPaused 
              ? isOverTime
                ? '⏰ Over time'
                : '● Recording' 
              : isPaused 
              ? '⏸ Paused' 
              : 'Ready'
            }
          </span>
          
          {/* Target duration indicator */}
          {targetDuration && !isRecording && (
            <span className="text-xs text-gray-500 mt-1">
              Target: {targetDuration}s
            </span>
          )}
        </div>
      </div>

      {/* Animated ring when recording (not over time) */}
      {isRecording && !isPaused && !isOverTime && (
        <div className="absolute inset-0 w-48 h-48 rounded-full border-4 border-red-500 animate-ping opacity-20" />
      )}
    </div>
  )
}