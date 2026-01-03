// src/components/AIAvatar.jsx

'use client'

export default function AIAvatar({ 
  isSpeaking = false, 
  isListening = false, 
  isThinking = false,
  size = 'lg' 
}) {
  const sizeClasses = {
    sm: 'w-12 h-12 text-xl',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-20 h-20 text-3xl',
  }

  return (
    <div className="relative">
      {/* Main avatar */}
      <div 
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 
                  flex items-center justify-center transition-all duration-300
                  ${isSpeaking ? 'scale-110' : ''}
                  ${isThinking ? 'opacity-70' : ''}`}
      >
        {isThinking ? '🤔' : isSpeaking ? '🗣️' : isListening ? '👂' : '🤖'}
      </div>

      {/* Speaking animation rings */}
      {isSpeaking && (
        <>
          <div className="absolute inset-0 rounded-full border-2 border-indigo-400 animate-ping opacity-30" />
          <div className="absolute inset-0 rounded-full border-2 border-purple-400 animate-ping opacity-20" 
               style={{ animationDelay: '0.2s' }} />
        </>
      )}

      {/* Listening indicator */}
      {isListening && (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 
                      flex items-center justify-center animate-pulse">
          <div className="w-2 h-2 rounded-full bg-white" />
        </div>
      )}

      {/* Thinking animation */}
      {isThinking && (
        <div className="absolute -bottom-1 -right-1 flex gap-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
      )}
    </div>
  )
}