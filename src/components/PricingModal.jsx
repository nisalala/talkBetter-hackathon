'use client'
import { useState } from 'react'

export default function PricingModal({ onClose, onConfirm }) {
  const [cycle, setCycle] = useState('monthly')

  const monthlyPrice = 250
  const yearlyPrice = 24000
  const price = cycle === 'monthly' ? monthlyPrice : yearlyPrice

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8">
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Unlock Premium</h2>
          <p className="text-gray-400">Get ruthless, honest, life-changing feedback</p>
        </div>

        {/* Monthly / Yearly Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800 p-1 rounded-full flex">
            <button
              onClick={() => setCycle('monthly')}
              className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${
                cycle === 'monthly' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setCycle('yearly')}
              className={`px-8 py-3 rounded-full text-sm font-bold transition-all relative ${
                cycle === 'yearly' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400'
              }`}
            >
              Yearly
              {cycle === 'yearly' && (
                <span className="absolute -top-2 -right-3 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  BEST VALUE
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Price */}
        <div className="text-center64 mb-10">
          <div className="text-5xl font-bold text-white">
            Rs.{price.toLocaleString('en-IN')}
            <span className="text-xl text-gray-400 font-normal">/{cycle === 'monthly' ? 'month' : 'year'}</span>
          </div>
          {cycle === 'yearly' && (
            <p className="text-green-400 text-sm font-bold mt-3">
              Save Rs.6,000/year 
            </p>
          )}
        </div>

        {/* Features */}
        <div className="space-y-4 mb-10">
          {[
            "Brutally honest AI feedback (no sugarcoating)",
            "Advanced persuasion & confidence metrics",
            "Real-time micro-expression analysis",
            "Hardcore interview & speech drills",
            "Unlimited session history & rewinds",
            "Priority AI processing (faster results)"
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-4 text-gray-300">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium">{feature}</span>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => onConfirm('premium', 'trial')}
            className="w-full py-5 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all shadow-2xl text-lg"
          >
            Start 7-Day Free Trial
          </button>
          
          <button
            onClick={() => onConfirm('premium', 'subscribe')}
            className="w-full py-4 rounded-xl font-bold text-white bg-white/10 border border-white/10 hover:bg-white/20 transition-all"
          >
            Subscribe Directly
          </button>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6 uppercase tracking-widest">
          Cancel anytime • Full access during trial
        </p>
      </div>
    </div>
  )
}