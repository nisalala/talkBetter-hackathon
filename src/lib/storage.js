// ============================================
// TalkBetter - localStorage Database
// User-Specific Storage
// ============================================

// ----- HELPER: Get current user ID -----
function getCurrentUserId() {
  if (typeof window === 'undefined') return null
  const profile = localStorage.getItem('talkbetter_current_user')
  if (!profile) return null
  try {
    const parsed = JSON.parse(profile)
    return parsed.id || null
  } catch {
    return null
  }
}

// ----- HELPER: Get user-specific storage key -----
function getUserKey(baseKey) {
  const userId = getCurrentUserId()
  if (!userId) return null
  return `talkbetter_${userId}_${baseKey}`
}

// ----- CURRENT USER (who is logged in) -----

export function getCurrentUser() {
  if (typeof window === 'undefined') return null
  const data = localStorage.getItem('talkbetter_current_user')
  return data ? JSON.parse(data) : null
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem('talkbetter_current_user', JSON.stringify(user))
  } else {
    localStorage.removeItem('talkbetter_current_user')
  }
}

// ----- USER ACCOUNTS (all registered users) -----

function getAllUsers() {
  if (typeof window === 'undefined') return {}
  const data = localStorage.getItem('talkbetter_users')
  return data ? JSON.parse(data) : {}
}

function saveAllUsers(users) {
  localStorage.setItem('talkbetter_users', JSON.stringify(users))
}

export function createUser(name, email) {
  const users = getAllUsers()
  
  // Check if email already exists
  const existingUser = Object.values(users).find(u => u.email.toLowerCase() === email.toLowerCase())
  if (existingUser) {
    return { success: false, error: 'Email already registered' }
  }
  
  // Create new user with unique ID
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const newUser = {
    id: userId,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    createdAt: Date.now(),
  }
  
  users[userId] = newUser
  saveAllUsers(users)
  
  return { success: true, user: newUser }
}

export function findUserByEmail(email) {
  const users = getAllUsers()
  return Object.values(users).find(u => u.email.toLowerCase() === email.toLowerCase().trim()) || null
}

export function deleteUser(userId) {
  const users = getAllUsers()
  delete users[userId]
  saveAllUsers(users)
  
  // Also delete user's history
  const historyKey = `talkbetter_${userId}_history`
  localStorage.removeItem(historyKey)
  
  // Clear current user if it's the deleted one
  const currentUser = getCurrentUser()
  if (currentUser?.id === userId) {
    setCurrentUser(null)
  }
}

// ----- USER PROFILE -----

export function getProfile() {
  return getCurrentUser()
}

export function saveProfile(profile) {
  const currentUser = getCurrentUser()
  if (!currentUser) return
  
  const users = getAllUsers()
  const updatedUser = {
    ...currentUser,
    ...profile,
    updatedAt: Date.now(),
  }
  
  users[currentUser.id] = updatedUser
  saveAllUsers(users)
  setCurrentUser(updatedUser)
}

export function deleteProfile() {
  const currentUser = getCurrentUser()
  if (currentUser) {
    deleteUser(currentUser.id)
  }
}

// ----- SESSION HISTORY (User-Specific) -----

export function getHistory() {
  if (typeof window === 'undefined') return []
  
  const historyKey = getUserKey('history')
  if (!historyKey) return []
  
  const data = localStorage.getItem(historyKey)
  return data ? JSON.parse(data) : []
}

export function saveSession(session) {
  const historyKey = getUserKey('history')
  if (!historyKey) {
    console.warn('No user logged in, session not saved')
    return session
  }
  
  const history = getHistory()
  const newSession = {
    ...session,
    id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    userId: getCurrentUserId(),
  }
  
  history.unshift(newSession)
  
  // Keep only last 100 sessions per user
  localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 100)))
  
  return newSession
}

export function clearHistory() {
  const historyKey = getUserKey('history')
  if (historyKey) {
    localStorage.removeItem(historyKey)
  }
}

export function deleteSession(sessionId) {
  const historyKey = getUserKey('history')
  if (!historyKey) return
  
  const history = getHistory()
  const filtered = history.filter(s => s.id !== sessionId)
  localStorage.setItem(historyKey, JSON.stringify(filtered))
}

// ----- USER STATS (User-Specific) -----

export function getStats() {
  const history = getHistory()
  const profile = getProfile()
  
  if (history.length === 0) {
    return {
      totalSessions: 0,
      avgScore: 0,
      bestScore: 0,
      worstScore: 0,
      streak: 0,
      totalPracticeTime: 0,
      totalWords: 0,
      avgWPM: 0,
      totalFillerWords: 0,
      improvement: 0,
      favoriteMode: null,
      memberSince: profile?.createdAt || Date.now(),
    }
  }

  const scores = history.map(h => h.analysis?.overallScore || 0).filter(s => s > 0)
  const durations = history.map(h => h.duration || 0)
  const wordCounts = history.map(h => h.analysis?.metrics?.wordCount || 0)
  const wpms = history.map(h => h.analysis?.metrics?.wpm || 0).filter(w => w > 0)
  const fillerCounts = history.map(h => h.analysis?.metrics?.fillerWords?.total || 0)
  
  const streak = calculateStreak(history)
  const improvement = calculateImprovement(scores)
  
  // Find favorite mode
  const modeCounts = {}
  history.forEach(h => {
    modeCounts[h.mode] = (modeCounts[h.mode] || 0) + 1
  })
  const favoriteMode = Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0]?.[0]

  return {
    totalSessions: history.length,
    avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    bestScore: scores.length > 0 ? Math.max(...scores) : 0,
    worstScore: scores.length > 0 ? Math.min(...scores) : 0,
    streak,
    totalPracticeTime: durations.reduce((a, b) => a + b, 0),
    totalWords: wordCounts.reduce((a, b) => a + b, 0),
    avgWPM: wpms.length > 0 ? Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length) : 0,
    totalFillerWords: fillerCounts.reduce((a, b) => a + b, 0),
    improvement,
    favoriteMode,
    memberSince: profile?.createdAt || Date.now(),
  }
}

function calculateStreak(history) {
  if (history.length === 0) return 0
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const oneDay = 24 * 60 * 60 * 1000
  
  let streak = 0
  let currentDate = today.getTime()
  
  for (let i = 0; i < 365; i++) {
    const dayStart = currentDate - (i * oneDay)
    const dayEnd = dayStart + oneDay
    
    const hasSession = history.some(h => {
      const sessionTime = h.timestamp
      return sessionTime >= dayStart && sessionTime < dayEnd
    })
    
    if (hasSession) {
      streak++
    } else if (i > 0) {
      break
    }
  }
  
  return streak
}

function calculateImprovement(scores) {
  if (scores.length < 2) return 0
  
  const recent = scores.slice(0, Math.min(5, Math.floor(scores.length / 2)))
  const older = scores.slice(-Math.min(5, Math.floor(scores.length / 2)))
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
  
  return Math.round(recentAvg - olderAvg)
}

// ----- ACHIEVEMENTS (User-Specific) -----

export function getAchievements() {
  const stats = getStats()
  const achievements = []
  
  if (stats.totalSessions >= 1) {
    achievements.push({ id: 'first', icon: '🎤', name: 'First Steps', desc: 'Complete your first session' })
  }
  
  if (stats.totalSessions >= 10) {
    achievements.push({ id: 'ten', icon: '🔟', name: 'Getting Started', desc: 'Complete 10 sessions' })
  }
  
  if (stats.bestScore >= 80) {
    achievements.push({ id: 'score80', icon: '⭐', name: 'Star Speaker', desc: 'Score 80 or higher' })
  }
  
  if (stats.bestScore >= 90) {
    achievements.push({ id: 'score90', icon: '🌟', name: 'Elite Speaker', desc: 'Score 90 or higher' })
  }
  
  if (stats.streak >= 3) {
    achievements.push({ id: 'streak3', icon: '🔥', name: 'On Fire', desc: '3 day streak' })
  }
  
  if (stats.streak >= 7) {
    achievements.push({ id: 'streak7', icon: '💪', name: 'Dedicated', desc: '7 day streak' })
  }
  
  if (stats.improvement >= 10) {
    achievements.push({ id: 'improve', icon: '📈', name: 'Improving', desc: 'Improve by 10+ points' })
  }
  
  return achievements
}

// ----- CHART DATA (User-Specific) -----

export function getChartData(days = 7) {
  const history = getHistory()
  const data = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const oneDay = 24 * 60 * 60 * 1000

  for (let i = days - 1; i >= 0; i--) {
    const dayStart = today.getTime() - (i * oneDay)
    const dayEnd = dayStart + oneDay
    
    const daySessions = history.filter(h => {
      return h.timestamp >= dayStart && h.timestamp < dayEnd
    })
    
    const scores = daySessions.map(s => s.analysis?.overallScore || 0).filter(s => s > 0)
    const avgScore = scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null
    
    const date = new Date(dayStart)
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
    
    data.push({
      day: dayName,
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: avgScore,
      sessions: daySessions.length,
    })
  }
  
  return data
}

export function getModeStats() {
  const history = getHistory()
  const modeStats = {}
  
  history.forEach(session => {
    const mode = session.mode || 'general'
    if (!modeStats[mode]) {
      modeStats[mode] = { count: 0, totalScore: 0, scores: [] }
    }
    modeStats[mode].count++
    const score = session.analysis?.overallScore || 0
    modeStats[mode].totalScore += score
    modeStats[mode].scores.push(score)
  })
  
  Object.keys(modeStats).forEach(mode => {
    const stats = modeStats[mode]
    stats.avgScore = stats.count > 0 
      ? Math.round(stats.totalScore / stats.count)
      : 0
    stats.bestScore = stats.scores.length > 0 
      ? Math.max(...stats.scores)
      : 0
  })
  
  return modeStats
}