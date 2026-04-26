import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'
import { signToken } from '@/lib/jwt'
import { citizenLoginSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Server-side validation with Zod
    const parsed = citizenLoginSchema.safeParse(body)
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

    const { email, password } = parsed.data

    // Query citizen by email with CITIZEN role
    const result = await pool.query(
      `SELECT id, email, phone, password_hash, name, role::text, avatar_url,
              is_active, is_verified, aadhaar_verified
       FROM users
       WHERE email = $1 AND role::text = 'CITIZEN'`,
      [email]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const citizen = result.rows[0]

    // Check if account is active
    if (!citizen.is_active) {
      return NextResponse.json(
        { error: 'Account is deactivated. Contact support.' },
        { status: 403 }
      )
    }

    // Check password hash exists
    if (!citizen.password_hash) {
      return NextResponse.json(
        { error: 'Password not set. Please register again.' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, citizen.password_hash)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Update last login timestamp
    await pool.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [citizen.id]
    )

    // Generate JWT
    const token = signToken({
      userId: citizen.id,
      email: citizen.email,
      role: citizen.role,
      name: citizen.name,
    })

    return NextResponse.json({
      token,
      user: {
        id: citizen.id,
        name: citizen.name,
        email: citizen.email,
        phone: citizen.phone,
        role: citizen.role,
        avatarUrl: citizen.avatar_url,
        isVerified: citizen.is_verified,
        aadhaarVerified: citizen.aadhaar_verified,
      },
    })

  } catch (error: unknown) {
    console.error('Citizen login error:', error)

    const pgError = error as { code?: string }
    if (pgError.code === '42P01') {
      return NextResponse.json(
        { error: 'Database not initialized. Please run the seed script first.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
}
