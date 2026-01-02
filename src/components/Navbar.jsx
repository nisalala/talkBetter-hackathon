'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function Navbar() {
  const { user, isAuthenticated } = useAuth()

  return (
    <nav className="glass sticky top-0 z-50 px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            TalkBetter
          </span>
        </Link>
        
        {/* Profile Link */}
        <Link 
          href="/profile" 
          className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/10 transition-colors"
        >
          {isAuthenticated ? (
            <>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 
                            flex items-center justify-center text-white text-sm font-bold">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline text-gray-300">{user.name}</span>
            </>
          ) : (
            <>
              <span className="text-gray-400">Sign In</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </>
          )}
        </Link>
      </div>
    </nav>
  )
}