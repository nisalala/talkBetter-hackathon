// src/components/PricingModal.jsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function PricingModal({ onClose, feature = 'Premium' }) {
  const router = useRouter()
  const { isAuthenticated, user, activateTrial, activateSubscription } = useAuth()
  const [cycle, setCycle] = useState('monthly')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const monthlyPrice = 250
  const yearlyPrice = 2400
  const price = cycle === 'monthly' ? monthlyPrice : yearlyPrice

  const handleStartTrial = async () => {
    if (!isAuthenticated) {
      // Redirect to profile to sign up first
      sessionStorage.setItem('talkbetter_pending_action', 'start_trial')
      router.push('/profile')
      onClose()
      return
    }

    // Check if trial already used
    if (user?.trialUsed) {
      setError('You have already used your free trial. Please subscribe to continue.')
      return
    }

    setIsProcessing(true)
    setError(null)

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000))

    const result = activateTrial()
    
    if (result.success) {
      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 2000)
    } else {
      setError(result.error)
    }

    setIsProcessing(false)
  }

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      sessionStorage.setItem('talkbetter_pending_action', 'subscribe')
      router.push('/profile')
      onClose()
      return
    }

    setIsProcessing(true)
    setError(null)

    // In a real app, you'd integrate with a payment provider here
    // For now, we'll simulate it
    await new Promise(resolve => setTimeout(resolve, 1500))

    const result = activateSubscription(cycle)
    
    if (result.success) {
      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 2000)
    } else {
      setError(result.error)
    }

    setIsProcessing(false)
  }

  // Success state
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="relative w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to Premium!</h2>
          <p className="text-gray-400">You now have access to all premium features.</p>
          <div className="mt-4 text-green-400 text-sm">Redirecting...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">✨</div>
          <h2 className="text-2xl font-bold text-white mb-1">Unlock Premium</h2>
          <p className="text-gray-400 text-sm">Get access to {feature} and more</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Monthly / Yearly Toggle */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-800 p-1 rounded-full flex">
            <button
              onClick={() => setCycle('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                cycle === 'monthly' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setCycle('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all relative ${
                cycle === 'yearly' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Price */}
        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-white">
            ₹{price.toLocaleString('en-IN')}
            <span className="text-lg text-gray-400 font-normal">/{cycle === 'monthly' ? 'mo' : 'yr'}</span>
          </div>
          {cycle === 'yearly' && (
            <p className="text-green-400 text-sm font-medium mt-1">
              Save ₹600/year
            </p>
          )}
        </div>

        {/* Features */}
        <div className="space-y-3 mb-6">
          {[
            { icon: '💬', text: 'Two-way AI conversations' },
            { icon: '🎯', text: 'Context-aware analysis' },
            { icon: '⚡', text: 'Real-time live feedback' },
            { icon: '📊', text: 'Advanced metrics & insights' },
            { icon: '🔄', text: 'Unlimited session history' },
            { icon: '🚀', text: 'Priority AI processing' },
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-3 text-gray-300">
              <span className="text-lg">{feature.icon}</span>
              <span className="text-sm">{feature.text}</span>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          {/* Trial Button - Only show if not used */}
          {!user?.trialUsed && (
            <button
              onClick={handleStartTrial}
              disabled={isProcessing}
              className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 
                       hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Processing...
                </>
              ) : (
                '🎁 Start 7-Day Free Trial'
              )}
            </button>
          )}
          
          <button
            onClick={handleSubscribe}
            disabled={isProcessing}
            className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all
                      disabled:opacity-50 disabled:cursor-not-allowed
                      flex items-center justify-center gap-2
                      ${user?.trialUsed 
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg' 
                        : 'bg-white/10 border border-white/10 hover:bg-white/20'
                      }`}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Processing...
              </>
            ) : (
              `Subscribe Now - ₹${price.toLocaleString('en-IN')}/${cycle === 'monthly' ? 'mo' : 'yr'}`
            )}
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-4">
          {user?.trialUsed 
            ? 'Secure payment • Cancel anytime'
            : 'No credit card required • Cancel anytime'
          }
        </p>

        {/* Not logged in hint */}
        {!isAuthenticated && (
          <p className="text-center text-indigo-400 text-xs mt-3">
            You&apos;ll need to create an account first
          </p>
        )}
      </div>
    </div>
  )
}