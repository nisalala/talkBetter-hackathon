// src/components/ConversationBubble.jsx

'use client'

export default function ConversationBubble({ message, isLatest }) {
  const isAI = message.role === 'ai'

  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isAI
            ? 'bg-white/10 text-white rounded-tl-sm'
            : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-tr-sm'
        } ${isLatest ? 'animate-fadeIn' : ''}`}
      >
        <div className="text-xs text-white/60 mb-1">
          {isAI ? '🤖 AI' : '👤 You'}
        </div>
        <p className="text-sm leading-relaxed">{message.text}</p>
      </div>
    </div>
  )
}