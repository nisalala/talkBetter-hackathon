// src/components/PremiumGate.jsx

'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import PricingModal from '@/components/PricingModal'

export default function PremiumGate({ children, feature = 'this feature' }) {
  const { isAuthenticated, isPremium } = useAuth()
  const [showPricing, setShowPricing] = useState(false)

  // If user is premium, show the children
  if (isAuthenticated && isPremium()) {
    return children
  }

  // Otherwise, show the locked state
  return (
    <>
      <div className="relative">
        {/* Blurred/disabled content */}
        <div className="opacity-50 pointer-events-none blur-[2px]">
          {children}
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl backdrop-blur-sm">
          <div className="text-center p-4">
            <div className="text-3xl mb-2">🔒</div>
            <p className="text-white font-medium text-sm mb-2">Premium Feature</p>
            <button
              onClick={() => setShowPricing(true)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 
                       text-white text-sm font-medium hover:from-indigo-400 hover:to-purple-400 
                       transition-all shadow-lg"
            >
              Unlock {feature}
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Modal */}
      {showPricing && (
        <PricingModal
          onClose={() => setShowPricing(false)}
          feature={feature}
        />
      )}
    </>
  )
}