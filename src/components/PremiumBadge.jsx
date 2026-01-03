// src/components/PremiumBadge.jsx

'use client'

import { useAuth } from '@/contexts/AuthContext'

export default function PremiumBadge({ showDetails = false }) {
  const { isPremium, getPremiumInfo } = useAuth()

  if (!isPremium()) return null

  const info = getPremiumInfo()
  if (!info) return null

  const isTrial = info.type === 'trial'
  const daysLeft = info.daysLeft

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
      isTrial 
        ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-500/30'
        : 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30'
    }`}>
      <span>{isTrial ? '⏳' : '✨'}</span>
      <span>
        {isTrial 
          ? `Trial: ${daysLeft}d left` 
          : 'Premium'
        }
      </span>
      
      {showDetails && isTrial && daysLeft <= 2 && (
        <span className="ml-1 px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px]">
          Expiring soon!
        </span>
      )}
    </div>
  )
}