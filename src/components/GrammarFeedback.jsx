// src/components/GrammarFeedback.jsx

'use client'

import { useState } from 'react'

const issueTypeLabels = {
  agreement: { label: 'Subject-Verb Agreement', icon: '🔗', color: 'text-yellow-400' },
  tense: { label: 'Tense Issue', icon: '⏰', color: 'text-orange-400' },
  structure: { label: 'Sentence Structure', icon: '📐', color: 'text-blue-400' },
  word_choice: { label: 'Word Choice', icon: '📝', color: 'text-purple-400' },
  article: { label: 'Article Usage', icon: '📄', color: 'text-cyan-400' },
  pronoun: { label: 'Pronoun Issue', icon: '👤', color: 'text-pink-400' },
  homophones: { label: 'Homophones', icon: '👂', color: 'text-indigo-400' },
  other: { label: 'Other', icon: '❓', color: 'text-gray-400' },
}

export default function GrammarFeedback({ grammar }) {
  const [expanded, setExpanded] = useState(false)

  if (!grammar) return null

  const { score, issues = [], feedback } = grammar
  
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-400'
    if (score >= 75) return 'text-yellow-400'
    if (score >= 60) return 'text-orange-400'
    return 'text-red-400'
  }

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excellent'
    if (score >= 75) return 'Good'
    if (score >= 60) return 'Fair'
    return 'Needs Work'
  }

  const displayedIssues = expanded ? issues : issues.slice(0, 3)

  return (
    <div className="glass rounded-2xl p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 
                        flex items-center justify-center text-2xl border border-purple-500/30">
            📝
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Grammar Analysis</h3>
            <p className="text-sm text-gray-400">{feedback}</p>
          </div>
        </div>
        
        {/* Score */}
        <div className="text-center">
          <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
            {score}
          </div>
          <div className="text-xs text-gray-500">{getScoreLabel(score)}</div>
        </div>
      </div>

      {/* Score Bar */}
      <div className="mb-6">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              score >= 90 ? 'bg-green-500' :
              score >= 75 ? 'bg-yellow-500' :
              score >= 60 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Issues List */}
      {issues.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-400 font-medium">
            {issues.length} issue{issues.length !== 1 ? 's' : ''} found:
          </p>
          
          {displayedIssues.map((issue, index) => {
            const typeInfo = issueTypeLabels[issue.type] || issueTypeLabels.other
            
            return (
              <div 
                key={index}
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Type Icon */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm ${typeInfo.color}`}>
                    {typeInfo.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Type Label */}
                    <span className={`text-xs font-medium ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                    
                    {/* Original vs Suggestion */}
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {issue.original && (
                        <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-sm line-through">
                          {issue.original}
                        </span>
                      )}
                      {issue.original && issue.suggestion && (
                        <span className="text-gray-500">→</span>
                      )}
                      {issue.suggestion && (
                        <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-sm">
                          {issue.suggestion}
                        </span>
                      )}
                    </div>
                    
                    {/* Explanation */}
                    {issue.explanation && (
                      <p className="mt-2 text-sm text-gray-400">
                        {issue.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Show More Button */}
          {issues.length > 3 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full py-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {expanded ? '← Show Less' : `Show ${issues.length - 3} More →`}
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <span className="text-3xl">✨</span>
          <p className="text-green-400 font-medium mt-2">No grammar issues detected!</p>
          <p className="text-gray-500 text-sm">Your grammar looks great.</p>
        </div>
      )}
    </div>
  )
}