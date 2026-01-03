// src/components/ConversationBubble.jsx

'use client'

export default function ConversationBubble({ message, isLatest = false }) {
  const isAI = message.role === 'ai' || message.role === 'assistant'
  
  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
      <div 
        className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
          isAI 
            ? 'bg-white/10 text-white rounded-bl-sm' 
            : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-br-sm'
        } ${isLatest ? 'animate-fadeIn' : ''}`}
      >
        <p className="text-sm leading-relaxed">{message.content}</p>
        {message.timestamp && (
          <p className={`text-xs mt-1 ${isAI ? 'text-gray-500' : 'text-white/60'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  )
}