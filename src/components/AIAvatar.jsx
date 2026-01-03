// src/components/AIAvatar.jsx

'use client'

export default function AIAvatar({ isSpeaking, isListening, isThinking }) {
  return (
    <div className="relative">
      {/* Outer ring animation */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-300 ${
          isSpeaking
            ? 'bg-indigo-500/20 animate-ping'
            : isListening
            ? 'bg-green-500/20 animate-pulse'
            : isThinking
            ? 'bg-yellow-500/20 animate-pulse'
            : ''
        }`}
        style={{ transform: 'scale(1.3)' }}
      />

      {/* Main avatar */}
      <div
        className={`relative w-24 h-24 rounded-full flex items-center justify-center text-4xl
                  transition-all duration-300 ${
                    isSpeaking
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-500 scale-110'
                      : isListening
                      ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                      : isThinking
                      ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
                      : 'bg-gradient-to-br from-gray-600 to-gray-700'
                  }`}
      >
        {isSpeaking && '🗣️'}
        {isListening && '👂'}
        {isThinking && '🤔'}
        {!isSpeaking && !isListening && !isThinking && '🤖'}
      </div>

      {/* Status indicator */}
      <div
        className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium ${
          isSpeaking
            ? 'bg-indigo-500 text-white'
            : isListening
            ? 'bg-green-500 text-white'
            : isThinking
            ? 'bg-yellow-500 text-black'
            : 'bg-gray-600 text-white'
        }`}
      >
        {isSpeaking && 'Speaking'}
        {isListening && 'Listening'}
        {isThinking && 'Thinking'}
        {!isSpeaking && !isListening && !isThinking && 'Ready'}
      </div>
    </div>
  )
}