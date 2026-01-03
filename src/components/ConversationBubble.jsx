// src/components/ConversationBubble.jsx

'use client'

export default function ConversationBubble({ message, isLatest = false }) {
  const isAI = message.role === 'ai'

  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isAI
            ? 'bg-white/10 text-white rounded-bl-md'
            : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-br-md'
        } ${isLatest ? 'animate-fadeIn' : ''}`}
      >
        {/* Role label */}
        <div className={`text-xs mb-1 ${isAI ? 'text-gray-400' : 'text-indigo-200'}`}>
          {isAI ? '🤖 AI' : '👤 You'}
        </div>
        
        {/* Message text */}
        <p className="text-sm leading-relaxed">{message.text}</p>
        
        {/* Timestamp */}
        {message.timestamp && (
          <div className={`text-xs mt-1 ${isAI ? 'text-gray-500' : 'text-indigo-200'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  )
}