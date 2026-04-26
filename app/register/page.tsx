'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Check, User, MapPin, Lock, Eye, EyeOff, Phone, Mail, AlertCircle } from 'lucide-react'
import { citizenRegisterSchema } from '@/lib/validations'

const CITIES = [
  'Pune',
  'Mumbai',
  'Nagpur',
  'Nashik',
  'Aurangabad',
  'Solapur',
  'Kolhapur',
  'Thane',
]

export default function RegisterPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    pincode: '',
    ward: '',
  })

  const steps = [
    { number: 1, title: 'Account', icon: User },
    { number: 2, title: 'Address', icon: MapPin },
    { number: 3, title: 'Security', icon: Lock },
  ]

  const updateForm = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user types
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const updated = { ...prev }
        delete updated[field]
        return updated
      })
    }
  }

  // Client-side validation per step
  const validateStep = (stepNumber: number): boolean => {
    const errors: Record<string, string> = {}

    if (stepNumber === 1) {
      // Validate name
      if (!formData.fullName.trim()) {
        errors.fullName = 'Full name is required'
      } else if (formData.fullName.trim().length < 2) {
        errors.fullName = 'Name must be at least 2 characters'
      } else if (!/^[a-zA-Z\s.'-]+$/.test(formData.fullName)) {
        errors.fullName = 'Name can only contain letters, spaces, dots, hyphens'
      }

      // Validate email
      if (!formData.email.trim()) {
        errors.email = 'Email is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Please enter a valid email address'
      }

      // Validate phone
      if (!formData.phone.trim()) {
        errors.phone = 'Phone number is required'
      } else if (!/^\d{10}$/.test(formData.phone)) {
        errors.phone = 'Phone number must be exactly 10 digits'
      }
    }

    if (stepNumber === 2) {
      if (!formData.addressLine1.trim()) {
        errors.addressLine1 = 'Address line 1 is required'
      } else if (formData.addressLine1.trim().length < 3) {
        errors.addressLine1 = 'Address must be at least 3 characters'
      }
      if (!formData.city) {
        errors.city = 'City is required'
      }
      if (!formData.pincode) {
        errors.pincode = 'Pincode is required'
      } else if (!/^\d{6}$/.test(formData.pincode)) {
        errors.pincode = 'Pincode must be exactly 6 digits'
      }
    }

    if (stepNumber === 3) {
      if (!formData.password) {
        errors.password = 'Password is required'
      } else {
        if (formData.password.length < 8) {
          errors.password = 'Password must be at least 8 characters'
        } else if (!/[A-Z]/.test(formData.password)) {
          errors.password = 'Must contain at least one uppercase letter'
        } else if (!/[a-z]/.test(formData.password)) {
          errors.password = 'Must contain at least one lowercase letter'
        } else if (!/[0-9]/.test(formData.password)) {
          errors.password = 'Must contain at least one number'
        }
      }
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password'
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match'
      }
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Password strength calculator
  const getPasswordStrength = (): { score: number; label: string; color: string } => {
    const pw = formData.password
    if (!pw) return { score: 0, label: '', color: '' }
    let score = 0
    if (pw.length >= 8) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[a-z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^a-zA-Z0-9]/.test(pw)) score++

    if (score <= 2) return { score: (score / 5) * 100, label: 'Weak', color: 'bg-red-500' }
    if (score <= 3) return { score: (score / 5) * 100, label: 'Fair', color: 'bg-amber-500' }
    if (score <= 4) return { score: (score / 5) * 100, label: 'Good', color: 'bg-blue-500' }
    return { score: 100, label: 'Strong', color: 'bg-emerald-500' }
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    setStep(step - 1)
    setFieldErrors({})
  }

  const handleComplete = async () => {
    if (!validateStep(3)) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/citizen/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone,
          password: formData.password,
          addressLine1: formData.addressLine1.trim(),
          addressLine2: formData.addressLine2.trim(),
          city: formData.city,
          pincode: formData.pincode,
          ward: formData.ward,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.errors) {
          // Server validation errors - map back to field errors
          const serverErrors: Record<string, string> = {}
          data.errors.forEach((e: { field: string; message: string }) => {
            serverErrors[e.field] = e.message
          })
          setFieldErrors(serverErrors)
          // Go back to the relevant step
          if (serverErrors.fullName || serverErrors.email || serverErrors.phone) setStep(1)
          else if (serverErrors.addressLine1 || serverErrors.city || serverErrors.pincode) setStep(2)
          else if (serverErrors.password) setStep(3)
          toast.error('Please fix the errors and try again')
        } else {
          toast.error(data.error || 'Registration failed')
        }
        return
      }

      // Store JWT token and user data
      localStorage.setItem('citizen_token', data.token)
      localStorage.setItem('citizen_user', JSON.stringify(data.user))

      login('citizen')
      toast.success('Registration successful! Welcome to CivicResolve.')
      router.push('/citizen')
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const progress = ((step - 1) / (steps.length - 1)) * 100
  const passwordStrength = getPasswordStrength()

  const FieldError = ({ field }: { field: string }) => {
    if (!fieldErrors[field]) return null
    return (
      <p className="flex items-center gap-1 text-xs text-destructive mt-1">
        <AlertCircle className="h-3 w-3" />
        {fieldErrors[field]}
      </p>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <span className="text-xl font-bold">CR</span>
            </div>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Create Your Account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Join CivicResolve to report and track civic issues
          </p>
        </div>

        {/* Progress Stepper */}
        <div className="space-y-2">
          <Progress value={progress} className="h-1" />
          <div className="flex justify-between">
            {steps.map((s) => (
              <div 
                key={s.number} 
                className={`flex items-center gap-2 text-sm ${
                  step >= s.number ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  step > s.number 
                    ? 'bg-primary text-primary-foreground' 
                    : step === s.number
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step > s.number ? <Check className="h-3 w-3" /> : s.number}
                </div>
                <span className="hidden sm:inline">{s.title}</span>
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Basic Information'}
              {step === 2 && 'Your Address'}
              {step === 3 && 'Set Your Password'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Enter your personal details'}
              {step === 2 && 'We need your address to route complaints to the right ward'}
              {step === 3 && 'Create a strong password to secure your account'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="fullName"
                      placeholder="Enter your full name"
                      className={`pl-10 ${fieldErrors.fullName ? 'border-destructive' : ''}`}
                      value={formData.fullName}
                      onChange={(e) => updateForm('fullName', e.target.value)}
                    />
                  </div>
                  <FieldError field="fullName" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regEmail">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="regEmail"
                      type="email"
                      placeholder="name@example.com"
                      className={`pl-10 ${fieldErrors.email ? 'border-destructive' : ''}`}
                      value={formData.email}
                      onChange={(e) => updateForm('email', e.target.value)}
                    />
                  </div>
                  <FieldError field="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regPhone">Phone Number *</Label>
                  <div className="flex gap-2">
                    <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm">
                      +91
                    </div>
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="regPhone"
                        type="tel"
                        placeholder="Enter 10-digit number"
                        className={`pl-10 ${fieldErrors.phone ? 'border-destructive' : ''}`}
                        value={formData.phone}
                        onChange={(e) => updateForm('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      />
                    </div>
                  </div>
                  <FieldError field="phone" />
                </div>
              </>
            )}

            {/* Step 2: Address */}
            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="addressLine1">Address Line 1 *</Label>
                  <Input
                    id="addressLine1"
                    placeholder="House/Flat No., Building Name"
                    className={fieldErrors.addressLine1 ? 'border-destructive' : ''}
                    value={formData.addressLine1}
                    onChange={(e) => updateForm('addressLine1', e.target.value)}
                  />
                  <FieldError field="addressLine1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressLine2">Address Line 2</Label>
                  <Input
                    id="addressLine2"
                    placeholder="Street, Area, Landmark"
                    value={formData.addressLine2}
                    onChange={(e) => updateForm('addressLine2', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Select value={formData.city} onValueChange={(value) => updateForm('city', value)}>
                      <SelectTrigger className={fieldErrors.city ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
                        {CITIES.map(city => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError field="city" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      placeholder="6-digit pincode"
                      className={fieldErrors.pincode ? 'border-destructive' : ''}
                      value={formData.pincode}
                      onChange={(e) => updateForm('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    />
                    <FieldError field="pincode" />
                  </div>
                </div>
                {formData.pincode.length === 6 && (
                  <div className="rounded-md bg-muted p-3 text-sm">
                    <p className="font-medium text-foreground">Detected Ward: Ward 15</p>
                    <p className="text-muted-foreground">Zone 3, Hadapsar</p>
                  </div>
                )}
              </>
            )}

            {/* Step 3: Password */}
            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="regPassword">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="regPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      className={`pl-10 pr-10 ${fieldErrors.password ? 'border-destructive' : ''}`}
                      value={formData.password}
                      onChange={(e) => updateForm('password', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <FieldError field="password" />
                  {formData.password && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${passwordStrength.color}`}
                            style={{ width: `${passwordStrength.score}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{passwordStrength.label}</span>
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        <li className={formData.password.length >= 8 ? 'text-emerald-600' : ''}>
                          {formData.password.length >= 8 ? '✓' : '○'} At least 8 characters
                        </li>
                        <li className={/[A-Z]/.test(formData.password) ? 'text-emerald-600' : ''}>
                          {/[A-Z]/.test(formData.password) ? '✓' : '○'} One uppercase letter
                        </li>
                        <li className={/[a-z]/.test(formData.password) ? 'text-emerald-600' : ''}>
                          {/[a-z]/.test(formData.password) ? '✓' : '○'} One lowercase letter
                        </li>
                        <li className={/[0-9]/.test(formData.password) ? 'text-emerald-600' : ''}>
                          {/[0-9]/.test(formData.password) ? '✓' : '○'} One number
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      className={`pl-10 pr-10 ${fieldErrors.confirmPassword ? 'border-destructive' : ''}`}
                      value={formData.confirmPassword}
                      onChange={(e) => updateForm('confirmPassword', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <FieldError field="confirmPassword" />
                </div>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-4">
              {step > 1 && (
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
              {step < 3 ? (
                <Button onClick={handleNext} className="flex-1">
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleComplete} disabled={isLoading} className="flex-1">
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  )
}
