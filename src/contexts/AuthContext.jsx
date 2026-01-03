// src/contexts/AuthContext.jsx

'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('talkbetter_user')
    if (storedUser) {
      const userData = JSON.parse(storedUser)
      
      // Check if trial has expired
      if (userData.premium?.type === 'trial' && userData.premium?.expiresAt) {
        const now = new Date().getTime()
        if (now > userData.premium.expiresAt) {
          // Trial expired - remove premium
          userData.premium = null
          localStorage.setItem('talkbetter_user', JSON.stringify(userData))
        }
      }
      
      setUser(userData)
      setIsAuthenticated(true)
      
      // ✅ FIX: Sync with storage.js key for session history
      localStorage.setItem('talkbetter_current_user', JSON.stringify(userData))
    }
    setIsLoading(false)
  }, [])

  const login = (email, password) => {
    // Check if user exists
    const users = JSON.parse(localStorage.getItem('talkbetter_users') || '{}')
    const existingUser = users[email]
    
    if (!existingUser) {
      return { success: false, error: 'No account found with this email' }
    }
    
    if (existingUser.password !== password) {
      return { success: false, error: 'Incorrect password' }
    }

    // Check trial expiry on login
    if (existingUser.premium?.type === 'trial' && existingUser.premium?.expiresAt) {
      const now = new Date().getTime()
      if (now > existingUser.premium.expiresAt) {
        existingUser.premium = null
        users[email] = existingUser
        localStorage.setItem('talkbetter_users', JSON.stringify(users))
      }
    }

    setUser(existingUser)
    setIsAuthenticated(true)
    localStorage.setItem('talkbetter_user', JSON.stringify(existingUser))
    
    // ✅ FIX: Sync with storage.js key for session history
    localStorage.setItem('talkbetter_current_user', JSON.stringify(existingUser))
    
    return { success: true }
  }

  const signup = (name, email, password) => {
    const users = JSON.parse(localStorage.getItem('talkbetter_users') || '{}')
    
    if (users[email]) {
      return { success: false, error: 'An account with this email already exists' }
    }

    const newUser = {
      id: `user_${Date.now()}`,
      name,
      email,
      password,
      premium: null, // No premium by default
      createdAt: new Date().toISOString(),
      stats: {
        totalSessions: 0,
        totalMinutes: 0,
        averageScore: 0,
        streak: 0,
        lastSessionDate: null,
      }
    }

    users[email] = newUser
    localStorage.setItem('talkbetter_users', JSON.stringify(users))
    localStorage.setItem('talkbetter_user', JSON.stringify(newUser))
    
    // ✅ FIX: Sync with storage.js key for session history
    localStorage.setItem('talkbetter_current_user', JSON.stringify(newUser))
    
    setUser(newUser)
    setIsAuthenticated(true)
    
    return { success: true }
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('talkbetter_user')
    
    // ✅ FIX: Also remove storage.js key
    localStorage.removeItem('talkbetter_current_user')
  }

  // ============================================
  // PREMIUM FUNCTIONS
  // ============================================
  
  const isPremium = () => {
    if (!user?.premium) return false
    
    // Check if trial has expired
    if (user.premium.type === 'trial' && user.premium.expiresAt) {
      const now = new Date().getTime()
      if (now > user.premium.expiresAt) {
        // Expired - update state
        const updatedUser = { ...user, premium: null }
        updateUser(updatedUser)
        return false
      }
    }
    
    return true
  }

  const getPremiumInfo = () => {
    if (!user?.premium) return null
    
    const now = new Date().getTime()
    const expiresAt = user.premium.expiresAt
    
    if (user.premium.type === 'trial' && expiresAt) {
      const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))
      const hoursLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60))
      
      return {
        ...user.premium,
        daysLeft: Math.max(0, daysLeft),
        hoursLeft: Math.max(0, hoursLeft),
        isExpired: now > expiresAt,
      }
    }
    
    return user.premium
  }

  const activateTrial = () => {
    if (!user) return { success: false, error: 'Not logged in' }
    
    // Check if user already used trial
    if (user.trialUsed) {
      return { success: false, error: 'You have already used your free trial' }
    }
    
    const now = new Date().getTime()
    const sevenDaysFromNow = now + (7 * 24 * 60 * 60 * 1000) // 7 days in ms
    
    const updatedUser = {
      ...user,
      premium: {
        type: 'trial',
        activatedAt: now,
        expiresAt: sevenDaysFromNow,
      },
      trialUsed: true,
    }
    
    updateUser(updatedUser)
    return { success: true }
  }

  const activateSubscription = (cycle) => {
    if (!user) return { success: false, error: 'Not logged in' }
    
    const now = new Date().getTime()
    const oneMonth = 30 * 24 * 60 * 60 * 1000
    const oneYear = 365 * 24 * 60 * 60 * 1000
    
    const duration = cycle === 'yearly' ? oneYear : oneMonth
    
    const updatedUser = {
      ...user,
      premium: {
        type: 'subscription',
        cycle,
        activatedAt: now,
        expiresAt: now + duration,
      },
    }
    
    updateUser(updatedUser)
    return { success: true }
  }

  const cancelPremium = () => {
    if (!user) return { success: false, error: 'Not logged in' }
    
    const updatedUser = {
      ...user,
      premium: null,
    }
    
    updateUser(updatedUser)
    return { success: true }
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('talkbetter_user', JSON.stringify(updatedUser))
    
    // ✅ FIX: Sync with storage.js key for session history
    localStorage.setItem('talkbetter_current_user', JSON.stringify(updatedUser))
    
    // Also update in users list
    const users = JSON.parse(localStorage.getItem('talkbetter_users') || '{}')
    if (users[updatedUser.email]) {
      users[updatedUser.email] = updatedUser
      localStorage.setItem('talkbetter_users', JSON.stringify(users))
    }
  }

  const updateUserStats = (newStats) => {
    if (!user) return
    
    const updatedUser = {
      ...user,
      stats: { ...user.stats, ...newStats }
    }
    
    updateUser(updatedUser)
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      signup,
      logout,
      updateUser,
      updateUserStats,
      // Premium functions
      isPremium,
      getPremiumInfo,
      activateTrial,
      activateSubscription,
      cancelPremium,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}