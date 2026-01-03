// src/app/profile/page.js

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getStats, getAchievements, getHistory, clearHistory, deleteSession } from '@/lib/storage'
import PremiumBadge from '@/components/PremiumBadge'
import PricingModal from '@/components/PricingModal'
import ProgressChart from '@/components/ProgressChart'

const modeIcons = {
  pitch: '🚀',
  interview: '💼',
  meeting: '📊',
  date: '💝',
  difficult: '🤝',
  speech: '🎤',
  general: '💬',
  conversation: '🤖',
}

const modeLabels = {
  pitch: 'Pitch',
  interview: 'Interview',
  meeting: 'Meeting',
  date: 'Date',
  difficult: 'Difficult Talk',
  speech: 'Speech',
  general: 'General',
  conversation: 'AI Conversation',
}

export default function ProfilePage() {
  const router = useRouter()
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    signup, 
    login, 
    logout,
    isPremium,
    getPremiumInfo,
    cancelPremium,
  } = useAuth()
  
  const [isSignUp, setIsSignUp] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [showAllHistory, setShowAllHistory] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [historyFilter, setHistoryFilter] = useState('all')

  const stats = getStats()
  const achievements = getAchievements()
  const premiumInfo = getPremiumInfo ? getPremiumInfo() : null
  const hasPremium = isPremium ? isPremium() : false

  useEffect(() => {
    setHistory(getHistory())
    
    // Check for pending action from pricing modal
    const pendingAction = sessionStorage.getItem('talkbetter_pending_action')
    if (pendingAction && isAuthenticated) {
      sessionStorage.removeItem('talkbetter_pending_action')
      if (pendingAction === 'start_trial' || pendingAction === 'subscribe') {
        setShowPricingModal(true)
      }
    }
  }, [isAuthenticated])

  // In profile/page.js

// Add this to ensure history refreshes properly
useEffect(() => {
  if (isAuthenticated) {
    const loadedHistory = getHistory()
    console.log('📋 Profile loaded history:', loadedHistory.length, 'sessions')
    setHistory(loadedHistory)
  }
}, [isAuthenticated])

// Also add a manual refresh option for debugging
const refreshHistory = () => {
  const loadedHistory = getHistory()
  console.log('🔄 Manual refresh - loaded:', loadedHistory.length, 'sessions')
  setHistory(loadedHistory)
}

  // Calculate separate stats for solo vs conversation
  const soloSessions = history.filter(s => s.type !== 'conversation')
  const conversationSessions = history.filter(s => s.type === 'conversation')

  const conversationStats = {
    count: conversationSessions.length,
    avgScore: conversationSessions.length > 0
      ? Math.round(conversationSessions.reduce((acc, s) => acc + (s.analysis?.overallScore || 0), 0) / conversationSessions.length)
      : 0,
    bestScore: conversationSessions.length > 0
      ? Math.max(...conversationSessions.map(s => s.analysis?.overallScore || 0))
      : 0,
  }

  const soloStats = {
    count: soloSessions.length,
    avgScore: soloSessions.length > 0
      ? Math.round(soloSessions.reduce((acc, s) => acc + (s.analysis?.overallScore || 0), 0) / soloSessions.length)
      : 0,
    bestScore: soloSessions.length > 0
      ? Math.max(...soloSessions.map(s => s.analysis?.overallScore || 0))
      : 0,
  }

  // Filter history based on selected filter
  const filteredHistory = history.filter(session => {
    if (historyFilter === 'all') return true
    if (historyFilter === 'solo') return session.type !== 'conversation'
    if (historyFilter === 'conversation') return session.type === 'conversation'
    return true
  })

  const displayedHistory = showAllHistory ? filteredHistory : filteredHistory.slice(0, 5)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

    const trimmedEmail = email.trim()
    const trimmedName = name.trim()
    const trimmedPassword = password.trim()

    if (!trimmedEmail) {
      setError('Please enter your email')
      return
    }
    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address')
      return
    }
    if (!trimmedPassword) {
      setError('Please enter a password')
      return
    }

    if (isSignUp) {
      if (!trimmedName) {
        setError('Please enter your name')
        return
      }
      const result = signup(trimmedName, trimmedEmail, trimmedPassword)
      if (!result.success) setError(result.error)
    } else {
      const result = login(trimmedEmail, trimmedPassword)
      if (!result.success) setError(result.error)
    }
  }

  const handleViewResult = (session) => {
    sessionStorage.setItem('talkbetter_results', JSON.stringify(session))
    if (session.type === 'conversation') {
      router.push('/results/conversation')
    } else {
      router.push('/results')
    }
  }

  const handleDeleteSession = (sessionId) => {
    deleteSession(sessionId)
    setHistory(getHistory())
  }

  const handleDeleteAccount = () => {
    clearHistory()
    logout()
    setShowDeleteConfirm(false)
    router.push('/')
  }

  const handleCancelPremium = () => {
    if (cancelPremium) {
      cancelPremium()
    }
    setShowCancelConfirm(false)
  }

  const formatTime = (seconds) => {
    if (!seconds) return '0m'
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    if (diff < 604800000) return date.toLocaleDateString('en-US', { weekday: 'short' })
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '0s'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  // =====================
  // NOT LOGGED IN - Show Login/Signup
  // =====================
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto">
        <div className="glass rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="mb-2">
              <svg className="mx-auto w-12 h-12 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3v18h18" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 13l4-4 4 4 6-6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Save your practice — create a profile</h1>
            <p className="text-sm text-gray-400">Sign in or create a profile to store sessions and track improvement.</p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setIsSignUp(true); setError('') }}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                isSignUp 
                  ? 'bg-indigo-500 text-white' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Create
            </button>
            <button
              onClick={() => { setIsSignUp(false); setError('') }}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                !isSignUp 
                  ? 'bg-indigo-500 text-white' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Sign In
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 
                           text-white placeholder-gray-500
                           focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 
                         text-white placeholder-gray-500
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 
                         text-white placeholder-gray-500
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-lg p-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 
                       text-white font-semibold
                       hover:from-indigo-400 hover:to-purple-400 transition-all
                       shadow-lg shadow-indigo-500/25"
            >
              {isSignUp ? 'Create Profile' : 'Log In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            Progress charts · Session history · Achievements
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  // =====================
  // LOGGED IN - Show Dashboard
  // =====================
  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 
                        flex items-center justify-center text-3xl font-bold text-white shadow-lg">
            {user?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          
          {/* Info */}
          <div className="text-center sm:text-left flex-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
              <PremiumBadge showDetails />
            </div>
            <p className="text-gray-400">{user?.email}</p>
          </div>

          {/* Streak Badge */}
          {stats.streak > 0 && (
            <div className="text-center px-6 py-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 
                          border border-orange-500/30">
              <div className="text-3xl font-bold text-orange-400">{stats.streak}🔥</div>
              <div className="text-sm text-gray-400">Day Streak</div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* PREMIUM STATUS SECTION                      */}
      {/* ============================================ */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              Subscription Status
            </h3>
            {hasPremium ? (
              <div className="flex items-center gap-3 flex-wrap">
                <PremiumBadge showDetails />
                {premiumInfo?.type === 'trial' && (
                  <span className="text-sm text-gray-400">
                    Expires {new Date(premiumInfo.expiresAt).toLocaleDateString()}
                  </span>
                )}
                {premiumInfo?.type === 'subscription' && (
                  <span className="text-sm text-gray-400">
                    {premiumInfo.cycle === 'yearly' ? 'Annual' : 'Monthly'} plan
                  </span>
                )}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Free plan - Limited features</p>
            )}
          </div>
          
          {hasPremium ? (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 
                       text-gray-400 hover:text-white text-sm transition-all"
            >
              {premiumInfo?.type === 'trial' ? 'Cancel Trial' : 'Manage Subscription'}
            </button>
          ) : (
            <button
              onClick={() => setShowPricingModal(true)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 
                       hover:from-indigo-400 hover:to-purple-400
                       text-white font-medium text-sm transition-all"
            >
              Upgrade to Premium
            </button>
          )}
        </div>

        {/* Premium Features List - Show when not premium */}
        {!hasPremium && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-sm text-gray-400 mb-3">Premium includes:</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                '💬 Two-way AI chats',
                '⚡ Live feedback',
                '🎯 Context analysis',
                '📊 Advanced metrics',
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="text-green-400">✓</span>
                  {feature}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trial countdown warning */}
        {premiumInfo?.type === 'trial' && premiumInfo.daysLeft <= 3 && (
          <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-center gap-2 text-yellow-400 text-sm">
              <span>⏰</span>
              <span>
                Your trial ends in {premiumInfo.daysLeft} day{premiumInfo.daysLeft !== 1 ? 's' : ''}. 
                <button 
                  onClick={() => setShowPricingModal(true)}
                  className="ml-2 underline hover:no-underline"
                >
                  Upgrade now
                </button>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Practice Mode Stats */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Solo Practice Stats */}
        <div className="glass rounded-2xl p-5 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 
                          flex items-center justify-center text-2xl">
              🎤
            </div>
            <div>
              <h3 className="font-semibold text-white">Solo Practice</h3>
              <p className="text-sm text-gray-400">Record & get feedback</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-white/5">
              <div className="text-xl font-bold text-white">{soloStats.count}</div>
              <div className="text-xs text-gray-400">Sessions</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/5">
              <div className={`text-xl font-bold ${getScoreColor(soloStats.avgScore)}`}>
                {soloStats.avgScore || '-'}
              </div>
              <div className="text-xs text-gray-400">Avg Score</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/5">
              <div className={`text-xl font-bold ${getScoreColor(soloStats.bestScore)}`}>
                {soloStats.bestScore || '-'}
              </div>
              <div className="text-xs text-gray-400">Best</div>
            </div>
          </div>
        </div>

        {/* AI Conversation Stats */}
        <div className={`glass rounded-2xl p-5 border ${
          hasPremium 
            ? 'border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 to-purple-500/5' 
            : 'border-white/10'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 
                          flex items-center justify-center text-2xl">
              🤖
            </div>
            <div>
              <h3 className="font-semibold text-white">AI Conversations</h3>
              <p className="text-sm text-gray-400">Two-way practice</p>
            </div>
            {!hasPremium && (
              <span className="ml-auto px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                🔒 Premium
              </span>
            )}
            {hasPremium && (
              <span className="ml-auto px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-medium">
                ✨ Active
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-white/5">
              <div className="text-xl font-bold text-white">{conversationStats.count}</div>
              <div className="text-xs text-gray-400">Sessions</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/5">
              <div className={`text-xl font-bold ${getScoreColor(conversationStats.avgScore)}`}>
                {conversationStats.avgScore || '-'}
              </div>
              <div className="text-xs text-gray-400">Avg Score</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/5">
              <div className={`text-xl font-bold ${getScoreColor(conversationStats.bestScore)}`}>
                {conversationStats.bestScore || '-'}
              </div>
              <div className="text-xs text-gray-400">Best</div>
            </div>
          </div>
          
          {/* Upgrade prompt for non-premium */}
          {!hasPremium && (
            <button
              onClick={() => setShowPricingModal(true)}
              className="w-full mt-3 py-2 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 
                       text-indigo-400 text-sm font-medium hover:from-indigo-500/30 hover:to-purple-500/30 
                       transition-all border border-indigo-500/30"
            >
              Unlock AI Conversations →
            </button>
          )}
        </div>
      </div>

      {/* Progress Chart */}
      <div className="mb-6">
        <ProgressChart />
      </div>

      {/* Overall Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-white">{stats.totalSessions}</div>
          <div className="text-sm text-gray-400">Total Sessions</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-indigo-400">{stats.avgScore}</div>
          <div className="text-sm text-gray-400">Avg Score</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-400">{stats.bestScore}</div>
          <div className="text-sm text-gray-400">Best Score</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className={`text-3xl font-bold ${stats.improvement >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.improvement >= 0 ? '+' : ''}{stats.improvement}
          </div>
          <div className="text-sm text-gray-400">Improvement</div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-white">{formatTime(stats.totalPracticeTime)}</div>
          <div className="text-xs text-gray-400">Practice Time</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-white">{stats.totalWords?.toLocaleString() || 0}</div>
          <div className="text-xs text-gray-400">Words Spoken</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-white">{stats.avgWPM || 0}</div>
          <div className="text-xs text-gray-400">Avg WPM</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-yellow-400">{stats.totalFillerWords || 0}</div>
          <div className="text-xs text-gray-400">Filler Words</div>
        </div>
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="glass rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">🏆 Achievements</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {achievements.map((achievement) => (
              <div 
                key={achievement.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-white/5 to-white/0 
                         border border-white/10"
              >
                <div className="text-2xl">{achievement.icon}</div>
                <div>
                  <div className="font-medium text-white text-sm">{achievement.name}</div>
                  <div className="text-xs text-gray-400">{achievement.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session History with Filters */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-white">📜 Session History</h2>
          
          {/* Filter Tabs */}
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'All', count: history.length },
              { id: 'solo', label: '🎤 Solo', count: soloSessions.length },
              { id: 'conversation', label: '🤖 AI', count: conversationSessions.length },
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => {
                  setHistoryFilter(filter.id)
                  setShowAllHistory(false)
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  historyFilter === filter.id
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>

        {/* View All Button */}
        {filteredHistory.length > 5 && (
          <button
            onClick={() => setShowAllHistory(!showAllHistory)}
            className="text-sm text-indigo-400 hover:text-indigo-300 mb-4"
          >
            {showAllHistory ? 'Show Less' : `View All (${filteredHistory.length})`}
          </button>
        )}

        {filteredHistory.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">
              {historyFilter === 'conversation' ? '🤖' : historyFilter === 'solo' ? '🎤' : '📭'}
            </div>
            <p className="text-gray-400">
              {historyFilter === 'conversation' 
                ? 'No AI conversations yet. Try the conversation mode!' 
                : historyFilter === 'solo'
                ? 'No solo practice sessions yet. Start practicing!'
                : 'No sessions yet. Start practicing!'}
            </p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-4 py-2 rounded-lg bg-indigo-500/20 text-indigo-400 
                       hover:bg-indigo-500/30 transition-colors text-sm"
            >
              Start Practicing
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedHistory.map((session) => {
              const isConversation = session.type === 'conversation'
              
              return (
                <div
                  key={session.id}
                  className={`flex items-center gap-4 p-3 rounded-xl transition-colors group ${
                    isConversation 
                      ? 'bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20' 
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {/* Mode Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${
                    isConversation 
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-500' 
                      : 'bg-white/10'
                  }`}>
                    {isConversation ? '🤖' : modeIcons[session.mode] || '💬'}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      {isConversation ? (
                        <>
                          <span className="font-medium text-indigo-400">AI Conversation</span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-400">{session.scenario?.name || 'Practice'}</span>
                        </>
                      ) : (
                        <>
                          <span className="font-medium text-white capitalize">
                            {modeLabels[session.mode] || session.mode}
                          </span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-400">{formatDuration(session.duration)}</span>
                        </>
                      )}
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-500">{formatDate(session.timestamp)}</span>
                    </div>
                    
                    {/* Secondary info */}
                    {isConversation ? (
                      <p className="text-xs text-gray-500 mt-1">
                        {session.messageCount || session.messages?.length || 0} exchanges
                      </p>
                    ) : session.question?.text && (
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {session.question.text}
                      </p>
                    )}
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getScoreColor(session.analysis?.overallScore)}`}>
                      {session.analysis?.overallScore || 0}
                    </div>
                    {isConversation && (
                      <div className="text-xs text-gray-500">score</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleViewResult(session)}
                      className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 
                               hover:bg-indigo-500/30 transition-colors"
                      title="View Details"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      className="p-2 rounded-lg bg-red-500/20 text-red-400 
                               hover:bg-red-500/30 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => router.push('/')}
          className="flex items-center justify-center gap-3 py-4 rounded-xl 
                   bg-white/5 hover:bg-white/10 border border-white/10
                   text-white font-medium transition-all"
        >
          <span className="text-2xl">🎤</span>
          <span>Solo Practice</span>
        </button>
        <button
          onClick={() => {
            if (hasPremium) {
              router.push('/')
              // Ideally would set to two-way mode, but routing to home is simpler
            } else {
              setShowPricingModal(true)
            }
          }}
          className={`flex items-center justify-center gap-3 py-4 rounded-xl 
                   text-white font-semibold transition-all ${
                     hasPremium
                       ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 shadow-lg shadow-indigo-500/25'
                       : 'bg-white/5 hover:bg-white/10 border border-white/10'
                   }`}
        >
          <span className="text-2xl">🤖</span>
          <span>AI Conversation</span>
          {!hasPremium && <span className="text-yellow-400">🔒</span>}
        </button>
      </div>

      {/* Account Actions */}
      <div className="flex justify-center gap-6 text-sm">
        <button
          onClick={logout}
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          Log Out
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="text-gray-500 hover:text-red-400 transition-colors"
        >
          Delete Account
        </button>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="glass rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-2">Delete Account?</h3>
            <p className="text-gray-400 mb-6">
              This will delete your profile and all {history.length} practice sessions. This cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 
                         text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-400 
                         text-white font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Premium Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="glass rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-2">
              Cancel {premiumInfo?.type === 'trial' ? 'Trial' : 'Subscription'}?
            </h3>
            <p className="text-gray-400 mb-6">
              You&apos;ll lose access to premium features including two-way conversations 
              and advanced analytics.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 
                         text-white font-medium transition-colors"
              >
                Keep Premium
              </button>
              <button
                onClick={handleCancelPremium}
                className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-400 font-medium 
                         hover:bg-red-500/30 transition-all border border-red-500/30"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      {showPricingModal && (
        <PricingModal 
          onClose={() => setShowPricingModal(false)} 
          feature="Premium Features"
        />
      )}
    </div>
  )
}