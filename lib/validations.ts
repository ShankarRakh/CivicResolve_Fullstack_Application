import { z } from 'zod'

// ==========================================
// Citizen Registration Validation
// ==========================================

export const citizenRegisterSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be under 100 characters')
    .regex(/^[a-zA-Z\s.'-]+$/, 'Name can only contain letters, spaces, dots, hyphens, and apostrophes'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  phone: z
    .string()
    .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be under 72 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  addressLine1: z
    .string()
    .min(3, 'Address is required (at least 3 characters)')
    .max(200, 'Address must be under 200 characters'),
  addressLine2: z
    .string()
    .max(200, 'Address line 2 must be under 200 characters')
    .optional()
    .or(z.literal('')),
  city: z
    .string()
    .min(1, 'City is required'),
  pincode: z
    .string()
    .regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
  ward: z
    .string()
    .optional()
    .or(z.literal('')),
})

export type CitizenRegisterInput = z.infer<typeof citizenRegisterSchema>

// ==========================================
// Citizen Login Validation
// ==========================================

export const citizenLoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
})

export type CitizenLoginInput = z.infer<typeof citizenLoginSchema>

// ==========================================
// Client-side validation helpers
// ==========================================

export function validateField(schema: z.ZodObject<z.ZodRawShape>, field: string, value: string): string | null {
  try {
    const fieldSchema = schema.shape[field]
    if (fieldSchema) {
      (fieldSchema as z.ZodType).parse(value)
    }
    return null
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || 'Invalid input'
    }
    return null
  }
}
