// src/app/conversation/page.js

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { conversationScenarios } from '@/utils/conversationScenarios'
import { useAuth } from '@/contexts/AuthContext'

export default function ConversationModePage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [selectedMode, setSelectedMode] = useState(null)
  const [selectedScenario, setSelectedScenario] = useState(null)

  const modes = Object.values(conversationScenarios)

  const handleStart = () => {
    if (!selectedMode || !selectedScenario) return
    
    // Store scenario in session storage
    sessionStorage.setItem('conversation_scenario', JSON.stringify({
      mode: selectedMode,
      scenario: selectedScenario,
    }))
    
    router.push(`/conversation/${selectedMode.id}`)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 mb-4">
          <span className="text-xl">✨</span>
          <span className="text-indigo-400 font-medium">Premium Feature</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">AI Conversation Practice</h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          Have a real back-and-forth conversation with AI. Practice interviews, 
          difficult talks, and more with realistic responses.
        </p>
      </div>

      {/* Premium Gate for non-authenticated users */}
      {!isAuthenticated && (
        <div className="glass rounded-2xl p-6 mb-8 border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🔒</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">Premium Feature</h3>
              <p className="text-gray-400 text-sm">
                Sign up for free to try AI Conversation Mode
              </p>
            </div>
            <button
              onClick={() => router.push('/profile')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 
                       text-white font-semibold hover:from-indigo-400 hover:to-purple-400"
            >
              Sign Up Free
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Select Mode */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-sm">1</span>
          Choose a Mode
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => {
                setSelectedMode(mode)
                setSelectedScenario(null)
              }}
              disabled={!isAuthenticated}
              className={`p-4 rounded-xl text-left transition-all ${
                selectedMode?.id === mode.id
                  ? 'bg-indigo-500/20 border-2 border-indigo-500'
                  : 'glass border border-white/10 hover:border-white/30'
              } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="text-3xl mb-2">{mode.icon}</div>
              <div className="font-semibold text-white">{mode.name}</div>
              <div className="text-sm text-gray-400">{mode.scenarios.length} scenarios</div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Select Scenario */}
      {selectedMode && (
        <div className="mb-8 animate-fadeIn">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-sm">2</span>
            Choose a Scenario
          </h2>
          <div className="space-y-3">
            {selectedMode.scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => setSelectedScenario(scenario)}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  selectedScenario?.id === scenario.id
                    ? 'bg-indigo-500/20 border-2 border-indigo-500'
                    : 'glass border border-white/10 hover:border-white/30'
                }`}
              >
                <div className="font-semibold text-white">{scenario.name}</div>
                <div className="text-sm text-gray-400 mt-1">{scenario.description}</div>
                <div className="text-xs text-gray-500 mt-2 italic">
                  "{scenario.openingLine.substring(0, 80)}..."
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Start */}
      {selectedScenario && (
        <div className="animate-fadeIn">
          <div className="glass rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">Ready to Practice?</h3>
            <p className="text-gray-400 text-sm mb-4">
              You'll have a 7-turn conversation with the AI. Speak naturally and 
              respond to their questions. You can end early if needed.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <span>🎤</span> Microphone required
              </div>
              <div className="flex items-center gap-2">
                <span>🔊</span> Audio will play
              </div>
              <div className="flex items-center gap-2">
                <span>⏱️</span> ~5 minutes
              </div>
            </div>
          </div>

          <button
            onClick={handleStart}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 
                     text-white font-semibold text-lg
                     hover:from-indigo-400 hover:to-purple-400 transition-all
                     shadow-lg shadow-indigo-500/25"
          >
            🎙️ Start Conversation
          </button>
        </div>
      )}

      {/* How it works */}
      <div className="mt-12 glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">How It Works</h3>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { icon: '🎯', title: 'Choose Scenario', desc: 'Pick a realistic situation' },
            { icon: '🗣️', title: 'AI Speaks First', desc: 'Listen to the opening' },
            { icon: '🎤', title: 'You Respond', desc: 'Speak naturally' },
            { icon: '📊', title: 'Get Analysis', desc: 'Detailed feedback' },
          ].map((step, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl mb-2">{step.icon}</div>
              <div className="font-medium text-white text-sm">{step.title}</div>
              <div className="text-xs text-gray-400">{step.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}