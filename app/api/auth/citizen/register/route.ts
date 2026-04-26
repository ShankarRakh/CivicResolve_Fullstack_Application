import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'
import { signToken } from '@/lib/jwt'
import { citizenRegisterSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Server-side validation with Zod
    const parsed = citizenRegisterSchema.safeParse(body)
    if (!parsed.success) {
      const errors = parsed.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      return NextResponse.json(
        { error: 'Validation failed', errors },
        { status: 400 }
      )
    }

    const { fullName, email, phone, password, addressLine1, addressLine2, city, pincode, ward } = parsed.data

    // Check if email already exists
    const existingEmail = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )
    if (existingEmail.rows.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please login instead.' },
        { status: 409 }
      )
    }

    // Check if phone already exists
    const existingPhone = await pool.query(
      'SELECT id FROM users WHERE phone = $1',
      ['+91' + phone]
    )
    if (existingPhone.rows.length > 0) {
      return NextResponse.json(
        { error: 'An account with this phone number already exists. Please login instead.' },
        { status: 409 }
      )
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 12)

    // Build full address
    const fullAddress = [addressLine1, addressLine2, city, pincode].filter(Boolean).join(', ')

    // Insert the citizen into the database
    const result = await pool.query(
      `INSERT INTO users (
        id, email, phone, password_hash, name, role, is_active, is_verified,
        preferred_language, created_at, updated_at
      ) VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'CITIZEN'::"Role", true, false, 'EN', NOW(), NOW())
      RETURNING id, email, phone, name, role::text`,
      [email, '+91' + phone, passwordHash, fullName]
    )

    const user = result.rows[0]

    // Generate JWT token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    })

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        city,
        pincode,
        address: fullAddress,
        ward: ward || null,
      },
    }, { status: 201 })

  } catch (error: unknown) {
    console.error('Citizen registration error:', error)

    const pgError = error as { code?: string; constraint?: string }

    // Handle unique constraint violations
    if (pgError.code === '23505') {
      if (pgError.constraint?.includes('email')) {
        return NextResponse.json(
          { error: 'An account with this email already exists.' },
          { status: 409 }
        )
      }
      if (pgError.constraint?.includes('phone')) {
        return NextResponse.json(
          { error: 'An account with this phone number already exists.' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: 'Account already exists.' },
        { status: 409 }
      )
    }

    if (pgError.code === '42P01') {
      return NextResponse.json(
        { error: 'Database not initialized. Please run the seed script first.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}
