'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { 
  getCurrentUser, 
  setCurrentUser, 
  createUser, 
  findUserByEmail,
  deleteUser 
} from '@/lib/storage'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    const currentUser = getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
    }
    setLoading(false)
  }, [])

  const signup = (name, email) => {
    const result = createUser(name, email)
    
    if (result.success) {
      setCurrentUser(result.user)
      setUser(result.user)
      return { success: true }
    }
    
    return result
  }

  const login = (email) => {
    const existingUser = findUserByEmail(email)
    
    if (!existingUser) {
      return { success: false, error: 'No account found with this email. Please sign up.' }
    }
    
    setCurrentUser(existingUser)
    setUser(existingUser)
    return { success: true }
  }

  const logout = () => {
    setCurrentUser(null)
    setUser(null)
  }

  const deleteAccount = () => {
    if (user) {
      deleteUser(user.id)
      setUser(null)
    }
  }

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    signup,
    login,
    logout,
    deleteAccount,
  }

  return (
    <AuthContext.Provider value={value}>
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