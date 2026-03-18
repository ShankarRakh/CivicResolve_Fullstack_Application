'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { User, UserRole } from '@/types'
import { MOCK_CITIZEN, MOCK_OFFICER, MOCK_ADMIN } from './mock-data'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (role: UserRole) => void
  logout: () => void
  switchRole: (role: UserRole) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = useCallback((role: UserRole) => {
    switch (role) {
      case 'citizen':
        setUser(MOCK_CITIZEN)
        break
      case 'officer':
      case 'field_worker':
        setUser(MOCK_OFFICER)
        break
      case 'admin':
        setUser(MOCK_ADMIN)
        break
      default:
        setUser(MOCK_CITIZEN)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  const switchRole = useCallback((role: UserRole) => {
    login(role)
  }, [login])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, switchRole }}>
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
