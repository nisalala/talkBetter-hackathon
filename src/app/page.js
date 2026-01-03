// src/app/page.js

import Link from 'next/link'
import ModeSelector from '@/components/ModeSelector'

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Speak Better.
          </span>
          <br />
          <span className="text-white">Communicate Confidently.</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Record yourself speaking, get instant AI-powered feedback on clarity, 
          confidence, and impact. Choose a mode to get started.
        </p>
      </div>

      {/* ============================================ */}
      {/* NEW: AI Conversation Feature - Hero Card    */}
      {/* ============================================ */}
      <div className="mb-12">
        <Link
          href="/conversation"
          className="block glass rounded-2xl p-6 md:p-8 border-2 border-indigo-500/50 
                   bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10
                   hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/20
                   transition-all group relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 
                        rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <div className="relative flex flex-col md:flex-row items-center gap-6">
            {/* Icon */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 
                          flex items-center justify-center text-4xl shadow-lg shadow-indigo-500/30
                          group-hover:scale-110 transition-transform">
              💬
            </div>
            
            {/* Content */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                <h2 className="text-2xl font-bold text-white">AI Conversation Practice</h2>
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 
                               text-white text-xs font-bold uppercase tracking-wide animate-pulse">
                  New
                </span>
              </div>
              <p className="text-gray-400 mb-4">
                Have real back-and-forth conversations with AI. Practice interviews, difficult talks, 
                networking, and more with realistic responses that adapt to what you say.
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="text-indigo-400">✓</span> Real-time dialogue
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="text-indigo-400">✓</span> AI adapts to you
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="text-indigo-400">✓</span> Detailed analysis
                </div>
              </div>
            </div>
            
            {/* Arrow */}
            <div className="flex items-center gap-2 text-indigo-400 group-hover:text-white transition-colors">
              <span className="hidden md:block font-medium">Try it now</span>
              <svg 
                className="w-6 h-6 group-hover:translate-x-1 transition-transform" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <span className="text-gray-500 text-sm font-medium">OR PRACTICE SOLO</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* How it works */}
      <div className="flex flex-wrap justify-center gap-8 mb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
            1
          </div>
          <span className="text-gray-300">Choose a mode</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
            2
          </div>
          <span className="text-gray-300">Record yourself</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
            3
          </div>
          <span className="text-gray-300">Get AI feedback</span>
        </div>
      </div>

      {/* Mode Selector */}
      <ModeSelector />

      {/* Footer info */}
      <div className="mt-12 text-center">
        <p className="text-gray-500 text-sm">
          🔒 Your recordings are processed securely and never stored
        </p>
      </div>
    </div>
  )
}