'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getStats, getAchievements, getHistory, clearHistory, deleteSession } from '@/lib/storage'
import ProgressChart from '@/components/ProgressChart'

const modeIcons = {
  pitch: '🚀',
  interview: '💼',
  meeting: '📊',
  date: '💝',
  difficult: '🤝',
  speech: '🎤',
  general: '💬',
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, loading, signup, login, logout, deleteAccount } = useAuth()
  
  const [isSignUp, setIsSignUp] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [showAllHistory, setShowAllHistory] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const stats = getStats()
  const achievements = getAchievements()

  useEffect(() => {
    setHistory(getHistory())
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (isSignUp) {
      if (!name.trim()) {
        setError('Please enter your name')
        return
      }
      if (!email.trim()) {
        setError('Please enter your email')
        return
      }
      const result = signup(name, email)
      if (!result.success) setError(result.error)
    } else {
      if (!email.trim()) {
        setError('Please enter your email')
        return
      }
      const result = login(email)
      if (!result.success) setError(result.error)
    }
  }

  const handleViewResult = (session) => {
    sessionStorage.setItem('talkbetter_results', JSON.stringify(session))
    router.push('/results')
  }

  const handleDeleteSession = (sessionId) => {
    deleteSession(sessionId)
    setHistory(getHistory())
  }

  const handleDeleteAccount = () => {
    clearHistory()
    deleteAccount()
    setShowDeleteConfirm(false)
    router.push('/')
  }

  const formatTime = (seconds) => {
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
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  if (loading) {
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
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📈</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Track Your Progress
          </h1>
          <p className="text-gray-400">
            Create a free profile to save your practice sessions and track improvement over time
          </p>
        </div>

        <div className="glass rounded-2xl p-8">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setIsSignUp(true); setError('') }}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                isSignUp 
                  ? 'bg-indigo-500 text-white' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => { setIsSignUp(false); setError('') }}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                !isSignUp 
                  ? 'bg-indigo-500 text-white' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Log In
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
                  placeholder="John Doe"
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

          {/* Benefits */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-sm text-gray-400 mb-3">With a profile you get:</p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Progress tracking with charts
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Session history
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Streak tracking 🔥
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Achievements & badges 🏆
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    )
  }

  // =====================
  // LOGGED IN - Show Dashboard
  // =====================
  const displayedHistory = showAllHistory ? history : history.slice(0, 5)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 
                        flex items-center justify-center text-3xl font-bold text-white shadow-lg">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          
          {/* Info */}
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl font-bold text-white">{user.name}</h1>
            <p className="text-gray-400">{user.email}</p>
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

      {/* Progress Chart */}
      <div className="mb-6">
        <ProgressChart />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-white">{stats.totalSessions}</div>
          <div className="text-sm text-gray-400">Sessions</div>
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
          <div className="text-xl font-bold text-white">{stats.totalWords.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Words Spoken</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-white">{stats.avgWPM}</div>
          <div className="text-xs text-gray-400">Avg WPM</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-yellow-400">{stats.totalFillerWords}</div>
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

      {/* Recent Sessions */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">📜 Session History</h2>
          {history.length > 5 && (
            <button
              onClick={() => setShowAllHistory(!showAllHistory)}
              className="text-sm text-indigo-400 hover:text-indigo-300"
            >
              {showAllHistory ? 'Show Less' : `View All (${history.length})`}
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-gray-400">No sessions yet. Start practicing!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedHistory.map((session) => (
              <div
                key={session.id}
                className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 
                         transition-colors group"
              >
                {/* Mode Icon */}
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center 
                              justify-center text-xl flex-shrink-0">
                  {modeIcons[session.mode] || '💬'}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-white capitalize">{session.mode}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-400">{formatDuration(session.duration)}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-500">{formatDate(session.timestamp)}</span>
                  </div>
                  {session.question?.text && (
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {session.question.text}
                    </p>
                  )}
                </div>

                {/* Score */}
                <div className={`text-lg font-bold ${getScoreColor(session.analysis?.overallScore)}`}>
                  {session.analysis?.overallScore || 0}
                </div>

                {/* Actions */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleViewResult(session)}
                    className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 
                             hover:bg-indigo-500/30 transition-colors"
                    title="View"
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
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <button
          onClick={() => router.push('/')}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 
                   text-white font-semibold hover:from-indigo-400 hover:to-purple-400 
                   transition-all shadow-lg shadow-indigo-500/25"
        >
          🎤 Start Practicing
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

      {/* Delete Confirmation Modal */}
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
    </div>
  )
}