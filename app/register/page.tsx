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
import { ArrowLeft, ArrowRight, Check, User, MapPin, Shield } from 'lucide-react'

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
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    pincode: '',
    ward: '',
  })

  const steps = [
    { number: 1, title: 'Basic Info', icon: User },
    { number: 2, title: 'Address', icon: MapPin },
    { number: 3, title: 'Verification', icon: Shield },
  ]

  const updateForm = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (step === 1) {
      if (!formData.fullName) {
        toast.error('Please enter your full name')
        return
      }
    }
    if (step === 2) {
      if (!formData.addressLine1 || !formData.city || !formData.pincode) {
        toast.error('Please fill all required fields')
        return
      }
    }
    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleComplete = async (skipAadhaar: boolean) => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsLoading(false)
    login('citizen')
    toast.success('Registration successful! Welcome to CivicResolve.')
    router.push('/citizen')
  }

  const progress = ((step - 1) / (steps.length - 1)) * 100

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
              {step === 3 && 'Verify Your Identity'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Enter your personal details'}
              {step === 2 && 'We need your address to route complaints to the right ward'}
              {step === 3 && 'Optional: Link Aadhaar for trusted complaint status'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => updateForm('fullName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => updateForm('email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Pre-filled from OTP"
                    value={formData.phone || '+91 93264 58912'}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Phone verified via OTP</p>
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
                    value={formData.addressLine1}
                    onChange={(e) => updateForm('addressLine1', e.target.value)}
                  />
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
                      <SelectTrigger>
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
                        {CITIES.map(city => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      placeholder="6-digit pincode"
                      value={formData.pincode}
                      onChange={(e) => updateForm('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    />
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

            {/* Step 3: Verification */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="rounded-lg border-2 border-dashed p-6 text-center">
                  <Shield className="mx-auto h-12 w-12 text-primary" />
                  <h3 className="mt-4 font-medium text-foreground">Verify with Aadhaar</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Link your Aadhaar for trusted complaint status. Verified complaints get priority attention.
                  </p>
                  <Button className="mt-4" variant="outline">
                    Link Aadhaar via DigiLocker
                  </Button>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    You can also verify later from your profile settings
                  </p>
                </div>
              </div>
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
                <div className="flex flex-col gap-2 flex-1">
                  <Button onClick={() => handleComplete(false)} disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Complete Registration'}
                  </Button>
                  <Button variant="ghost" onClick={() => handleComplete(true)} disabled={isLoading}>
                    Skip for now
                  </Button>
                </div>
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
