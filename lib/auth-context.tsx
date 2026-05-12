'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { User, UserRole } from '@/types'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  loginMock: (role: UserRole) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Storage keys
const TOKEN_KEY = 'civicresolve-token'
const USER_KEY = 'civicresolve-user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY)
    const savedUser = localStorage.getItem(USER_KEY)
    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  // Real login — calls the citizen login API
  const login = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const res = await fetch('/api/auth/citizen/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { error: data.error || 'Login failed' }
      }
      setToken(data.token)
      setUser(data.user)
      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      return {}
    } catch {
      return { error: 'Network error. Please try again.' }
    }
  }, [])

  // Mock login for demo/dev purposes (officer, admin portals that aren't wired yet)
  const loginMock = useCallback((role: UserRole) => {
    const mockUsers: Record<UserRole, User> = {
      CITIZEN: { id: 'mock-citizen', name: 'Demo Citizen', phone: '+919999999999', email: 'demo@citizen.com', role: 'CITIZEN' },
      OFFICER: { id: 'mock-officer', name: 'Demo Officer', phone: '+919999999998', email: 'demo@officer.com', role: 'OFFICER', department: 'Roads' },
      ADMIN: { id: 'mock-admin', name: 'Demo Admin', phone: '+919999999997', email: 'demo@admin.com', role: 'ADMIN' },
    }
    setUser(mockUsers[role])
    setToken(null)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isLoading, login, loginMock, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
