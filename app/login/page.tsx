'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [activeTab, setActiveTab] = useState('citizen')

  // Citizen login state
  const [citizenEmail, setCitizenEmail] = useState('')
  const [citizenPassword, setCitizenPassword] = useState('')
  const [showCitizenPassword, setShowCitizenPassword] = useState(false)
  const [citizenErrors, setCitizenErrors] = useState<Record<string, string>>({})

  // Officer login state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [isLoading, setIsLoading] = useState(false)

  // Client-side validation for citizen login
  const validateCitizenLogin = (): boolean => {
    const errors: Record<string, string> = {}
    if (!citizenEmail.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(citizenEmail)) {
      errors.email = 'Please enter a valid email address'
    }
    if (!citizenPassword) {
      errors.password = 'Password is required'
    }
    setCitizenErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCitizenLogin = async () => {
    if (!validateCitizenLogin()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/citizen/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: citizenEmail.trim().toLowerCase(),
          password: citizenPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.errors) {
          const serverErrors: Record<string, string> = {}
          data.errors.forEach((e: { field: string; message: string }) => {
            serverErrors[e.field] = e.message
          })
          setCitizenErrors(serverErrors)
        } else {
          toast.error(data.error || 'Login failed')
        }
        return
      }

      // Store JWT token and user data
      localStorage.setItem('citizen_token', data.token)
      localStorage.setItem('citizen_user', JSON.stringify(data.user))

      login('citizen')
      toast.success('Login successful!')
      router.push('/citizen')
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOfficerLogin = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password')
      return
    }
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/officer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Login failed')
        return
      }

      // Store JWT token and user data
      localStorage.setItem('officer_token', data.token)
      localStorage.setItem('officer_user', JSON.stringify(data.user))

      // Route based on role
      if (data.user.role === 'ADMIN' || data.user.role === 'COMMISSIONER') {
        login('admin')
        toast.success('Welcome, Admin!')
        router.push('/admin')
      } else {
        login('officer')
        toast.success('Login successful!')
        router.push('/officer')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <span className="text-xl font-bold">CR</span>
            </div>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Welcome to CivicResolve</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to report and track civic issues
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Login</CardTitle>
            <CardDescription className="text-center">
              Choose your login method
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="citizen">Citizen</TabsTrigger>
                <TabsTrigger value="officer">Officer</TabsTrigger>
              </TabsList>

              {/* ===== CITIZEN LOGIN TAB ===== */}
              <TabsContent value="citizen" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="citizenEmail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="citizenEmail"
                      type="email"
                      placeholder="name@example.com"
                      className={`pl-10 ${citizenErrors.email ? 'border-destructive' : ''}`}
                      value={citizenEmail}
                      onChange={(e) => {
                        setCitizenEmail(e.target.value)
                        if (citizenErrors.email) setCitizenErrors(prev => { const u = {...prev}; delete u.email; return u })
                      }}
                    />
                  </div>
                  {citizenErrors.email && (
                    <p className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {citizenErrors.email}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="citizenPassword">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="citizenPassword"
                      type={showCitizenPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className={`pl-10 pr-10 ${citizenErrors.password ? 'border-destructive' : ''}`}
                      value={citizenPassword}
                      onChange={(e) => {
                        setCitizenPassword(e.target.value)
                        if (citizenErrors.password) setCitizenErrors(prev => { const u = {...prev}; delete u.password; return u })
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleCitizenLogin()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCitizenPassword(!showCitizenPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCitizenPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {citizenErrors.password && (
                    <p className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {citizenErrors.password}
                    </p>
                  )}
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleCitizenLogin}
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className="text-primary hover:underline">
                    Register here
                  </Link>
                </p>
              </TabsContent>

              {/* ===== OFFICER LOGIN TAB ===== */}
              <TabsContent value="officer" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@municipality.gov.in"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      className="pl-10 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleOfficerLogin()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleOfficerLogin}
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  For officer/admin access, contact your department head.
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          A Govt. of Maharashtra Initiative under Digital India Programme
        </p>
      </div>
    </div>
  )
}
