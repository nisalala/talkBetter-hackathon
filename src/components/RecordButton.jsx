'use client'

export default function RecordButton({ 
  isRecording, 
  isPaused, 
  onStart, 
  onStop, 
  onPause, 
  onResume,
  disabled 
}) {
  if (!isRecording) {
    // Start button
    return (
      <button
        onClick={onStart}
        disabled={disabled}
        className={`
          group relative w-20 h-20 rounded-full 
          bg-gradient-to-br from-red-500 to-red-600
          hover:from-red-400 hover:to-red-500
          transition-all duration-300 hover:scale-110
          focus:outline-none focus:ring-4 focus:ring-red-500/50
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
          shadow-lg shadow-red-500/30 hover:shadow-red-500/50
        `}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        </div>
      </button>
    )
  }

  // Recording controls
  return (
    <div className="flex items-center gap-4">
      {/* Pause/Resume button */}
      <button
        onClick={isPaused ? onResume : onPause}
        className={`
          w-14 h-14 rounded-full 
          ${isPaused 
            ? 'bg-green-500 hover:bg-green-400' 
            : 'bg-yellow-500 hover:bg-yellow-400'
          }
          transition-all duration-200 hover:scale-105
          focus:outline-none focus:ring-4 focus:ring-white/30
          flex items-center justify-center
        `}
      >
        {isPaused ? (
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        )}
      </button>

      {/* Stop button */}
      <button
        onClick={onStop}
        className={`
          w-20 h-20 rounded-full 
          bg-gradient-to-br from-gray-700 to-gray-800
          hover:from-gray-600 hover:to-gray-700
          transition-all duration-200 hover:scale-105
          focus:outline-none focus:ring-4 focus:ring-white/30
          flex items-center justify-center
          border-4 border-red-500
        `}
      >
        <div className="w-8 h-8 bg-red-500 rounded-sm" />
      </button>
    </div>
  )
}