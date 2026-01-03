// src/components/CustomQuestionInput.jsx

'use client'

import { useState } from 'react'

export default function CustomQuestionInput({ 
  isFreePractice = false, 
  onSubmit 
}) {
  const [customQuestion, setCustomQuestion] = useState('')

  const handleSubmit = () => {
    if (customQuestion.trim()) {
      onSubmit(customQuestion.trim())
      setCustomQuestion('')
    }
  }

  return (
    <div className="glass rounded-xl p-4 mb-6">
      <p className="text-sm text-gray-400 mb-3">
        {isFreePractice 
          ? 'Want a specific prompt to practice?' 
          : 'Or create your own prompt:'
        }
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={customQuestion}
          onChange={(e) => setCustomQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder={isFreePractice ? "Enter a question or scenario to practice..." : "Type your own question or scenario..."}
          className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
        />
        <button
          onClick={handleSubmit}
          disabled={!customQuestion.trim()}
          className="px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-500"
        >
          Use
        </button>
      </div>
    </div>
  )
}