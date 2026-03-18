'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { CategoryIcon } from '@/components/common/category-icon'
import { CATEGORIES } from '@/lib/constants'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Upload,
  X,
  Check,
  Building2,
  Clock,
  Share2,
} from 'lucide-react'
import type { Category, SubCategory, ComplaintPriority } from '@/types'

type Step = 'location' | 'category' | 'details' | 'review'

const STEPS: { id: Step; title: string }[] = [
  { id: 'location', title: 'Location' },
  { id: 'category', title: 'Category' },
  { id: 'details', title: 'Details' },
  { id: 'review', title: 'Review' },
]

const PRIORITIES: { value: ComplaintPriority; label: string; description: string }[] = [
  { value: 'low', label: 'Low', description: 'Inconvenience but manageable' },
  { value: 'medium', label: 'Medium', description: 'Affecting daily life' },
  { value: 'high', label: 'High', description: 'Safety risk / health hazard' },
  { value: 'critical', label: 'Critical', description: 'Immediate danger to life' },
]

export default function NewComplaintPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>('location')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Form state
  const [location, setLocation] = useState({
    address: '',
    landmark: '',
    ward: 'Ward 15',
    zone: 'Zone 3',
    lat: 18.5089,
    lng: 73.9259,
  })
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<SubCategory | null>(null)
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [priority, setPriority] = useState<ComplaintPriority>('medium')
  const [confirmed, setConfirmed] = useState(false)

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep)
  const progress = ((currentStepIndex) / (STEPS.length - 1)) * 100

  const handleUseCurrentLocation = () => {
    // Simulate getting location
    setLocation({
      ...location,
      address: 'Near Shivaji Chowk, Hadapsar, Pune',
    })
    toast.success('Location detected!')
  }

  const handleNext = () => {
    if (currentStep === 'location' && !location.address) {
      toast.error('Please select or enter a location')
      return
    }
    if (currentStep === 'category' && (!selectedCategory || !selectedSubcategory)) {
      toast.error('Please select a category and subcategory')
      return
    }
    if (currentStep === 'details' && description.length < 20) {
      toast.error('Please enter a more detailed description (at least 20 characters)')
      return
    }

    const idx = STEPS.findIndex(s => s.id === currentStep)
    if (idx < STEPS.length - 1) {
      setCurrentStep(STEPS[idx + 1].id)
    }
  }

  const handleBack = () => {
    const idx = STEPS.findIndex(s => s.id === currentStep)
    if (idx > 0) {
      setCurrentStep(STEPS[idx - 1].id)
    }
  }

  const handleSubmit = async () => {
    if (!confirmed) {
      toast.error('Please confirm this is a genuine civic issue')
      return
    }

    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsLoading(false)
    setIsSubmitted(true)
    toast.success('Complaint submitted successfully!')
  }

  const handleImageUpload = () => {
    // Simulate image upload
    if (images.length >= 5) {
      toast.error('Maximum 5 images allowed')
      return
    }
    setImages([...images, `/placeholder.svg?height=200&width=200&text=Image${images.length + 1}`])
    toast.success('Image uploaded!')
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  if (isSubmitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto">
          <Check className="h-10 w-10" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-foreground">Complaint Registered!</h1>
        <p className="mt-2 text-muted-foreground">
          Your complaint has been successfully submitted and assigned to the relevant department.
        </p>
        <Card className="mt-6 text-left">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Complaint ID</span>
              <span className="font-mono font-medium">CR-2026-00146</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Department</span>
              <span className="font-medium">{selectedCategory?.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Expected Resolution</span>
              <span className="font-medium">{Math.ceil((selectedSubcategory?.slaHours || 72) / 24)} days</span>
            </div>
          </CardContent>
        </Card>
        <p className="mt-4 text-sm text-muted-foreground">
          You will receive updates via SMS at your registered number.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/citizen/complaints/complaint-1">Track Complaint</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/citizen/complaints/new">File Another</Link>
          </Button>
          <Button variant="ghost" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">New Complaint</h1>
        <p className="text-muted-foreground">Report a civic issue in your area</p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <Progress value={progress} className="h-1" />
        <div className="flex justify-between text-sm">
          {STEPS.map((step, idx) => (
            <span
              key={step.id}
              className={cn(
                'transition-colors',
                idx <= currentStepIndex ? 'text-primary font-medium' : 'text-muted-foreground'
              )}
            >
              {step.title}
            </span>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 'location' && 'Where is the issue?'}
            {currentStep === 'category' && 'What type of issue?'}
            {currentStep === 'details' && 'Describe the issue'}
            {currentStep === 'review' && 'Review your complaint'}
          </CardTitle>
          <CardDescription>
            {currentStep === 'location' && 'Select the location of the civic issue'}
            {currentStep === 'category' && 'Choose the category that best describes the issue'}
            {currentStep === 'details' && 'Provide details to help officers understand the problem'}
            {currentStep === 'review' && 'Please review before submitting'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Location Step */}
          {currentStep === 'location' && (
            <>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleUseCurrentLocation}
              >
                <MapPin className="h-4 w-4" />
                Use my current location
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or enter address</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    placeholder="Enter address or search..."
                    value={location.address}
                    onChange={(e) => setLocation({ ...location, address: e.target.value })}
                  />
                </div>
                <div className="aspect-video rounded-lg bg-muted flex items-center justify-center border-2 border-dashed">
                  <div className="text-center text-muted-foreground">
                    <MapPin className="h-8 w-8 mx-auto" />
                    <p className="mt-2 text-sm">Map preview would appear here</p>
                  </div>
                </div>
                {location.address && (
                  <div className="rounded-lg bg-muted p-3 text-sm">
                    <p className="font-medium">Detected: {location.ward}, {location.zone}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Landmark (optional)</Label>
                  <Input
                    placeholder="e.g., opposite SBI bank"
                    value={location.landmark}
                    onChange={(e) => setLocation({ ...location, landmark: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          {/* Category Step */}
          {currentStep === 'category' && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category)
                      setSelectedSubcategory(null)
                    }}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-lg border transition-all',
                      selectedCategory?.id === category.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'hover:border-primary/50 hover:bg-muted'
                    )}
                  >
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full',
                      selectedCategory?.id === category.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}>
                      <CategoryIcon icon={category.icon} />
                    </div>
                    <span className="text-sm font-medium">{category.name}</span>
                  </button>
                ))}
              </div>

              {selectedCategory && (
                <div className="space-y-3">
                  <Label>Select Sub-Category</Label>
                  <RadioGroup
                    value={selectedSubcategory?.id || ''}
                    onValueChange={(value) => {
                      const sub = selectedCategory.subcategories.find(s => s.id === value)
                      setSelectedSubcategory(sub || null)
                    }}
                  >
                    {selectedCategory.subcategories.map((sub) => (
                      <div key={sub.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={sub.id} id={sub.id} />
                        <Label htmlFor={sub.id} className="cursor-pointer">{sub.name}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}
            </>
          )}

          {/* Details Step */}
          {currentStep === 'details' && (
            <>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  placeholder="Describe the issue in detail. You can write in English, Hindi, or Marathi."
                  className="min-h-32"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {description.length}/500 characters (minimum 20)
                </p>
              </div>

              <div className="space-y-3">
                <Label>Upload Photos/Videos (max 5)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={handleImageUpload}
                >
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">JPG, PNG, MP4 (max 10MB)</p>
                </div>
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative">
                        <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden">
                          <img src={img} alt={`Upload ${idx + 1}`} className="h-full w-full object-cover" />
                        </div>
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label>How urgent is this? (optional)</Label>
                <RadioGroup value={priority} onValueChange={(v) => setPriority(v as ComplaintPriority)}>
                  {PRIORITIES.map((p) => (
                    <div key={p.value} className="flex items-start space-x-2">
                      <RadioGroupItem value={p.value} id={p.value} className="mt-1" />
                      <div className="grid gap-0.5">
                        <Label htmlFor={p.value} className="cursor-pointer font-medium">{p.label}</Label>
                        <p className="text-xs text-muted-foreground">{p.description}</p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </>
          )}

          {/* Review Step */}
          {currentStep === 'review' && (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    Location
                  </div>
                  <p className="font-medium">{location.address}</p>
                  {location.landmark && <p className="text-sm text-muted-foreground">Landmark: {location.landmark}</p>}
                  <p className="text-sm text-muted-foreground">{location.ward}, {location.zone}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    Category
                  </div>
                  <p className="font-medium">
                    {selectedCategory?.name} {'>'} {selectedSubcategory?.name}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Expected Resolution
                  </div>
                  <p className="font-medium">{Math.ceil((selectedSubcategory?.slaHours || 72) / 24)} days</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-foreground">{description}</p>
                </div>

                {images.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Photos ({images.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {images.map((img, idx) => (
                        <div key={idx} className="h-16 w-16 rounded-lg bg-muted overflow-hidden">
                          <img src={img} alt={`Upload ${idx + 1}`} className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-start space-x-2 pt-4 border-t">
                <Checkbox
                  id="confirm"
                  checked={confirmed}
                  onCheckedChange={(checked) => setConfirmed(checked === true)}
                />
                <Label htmlFor="confirm" className="text-sm cursor-pointer">
                  I confirm this is a genuine civic issue and the information provided is accurate.
                </Label>
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-4 border-t">
            {currentStepIndex > 0 && (
              <Button variant="outline" onClick={handleBack} className="flex-1 sm:flex-none">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
            {currentStep !== 'review' ? (
              <Button onClick={handleNext} className="flex-1 sm:ml-auto">
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isLoading || !confirmed} className="flex-1 sm:ml-auto">
                {isLoading ? 'Submitting...' : 'Submit Complaint'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
