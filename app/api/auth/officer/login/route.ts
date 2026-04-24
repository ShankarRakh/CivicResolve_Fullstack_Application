import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'
import { signToken } from '@/lib/jwt'

// Officer roles from the Prisma schema
const OFFICER_ROLES = ['FIELD_OFFICER', 'ZONAL_OFFICER', 'DEPT_HEAD', 'ADMIN', 'COMMISSIONER']

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Query the users table for the officer by email with an officer role
    const result = await pool.query(
      `SELECT id, email, password_hash, name, role::text, department_id, ward_id, zone_id,
              is_active, is_verified, avatar_url
       FROM users
       WHERE email = $1 AND role::text = ANY($2::text[])`,
      [email, OFFICER_ROLES]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const officer = result.rows[0]

    // Check if account is active
    if (!officer.is_active) {
      return NextResponse.json(
        { error: 'Account is deactivated. Contact your department head.' },
        { status: 403 }
      )
    }

    // Check password hash exists
    if (!officer.password_hash) {
      return NextResponse.json(
        { error: 'Password not set. Contact your administrator.' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, officer.password_hash)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Update last login timestamp
    await pool.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [officer.id]
    )

    // Generate JWT
    const token = signToken({
      userId: officer.id,
      email: officer.email,
      role: officer.role,
      name: officer.name,
    })

    return NextResponse.json({
      token,
      user: {
        id: officer.id,
        name: officer.name,
        email: officer.email,
        role: officer.role,
        departmentId: officer.department_id,
        wardId: officer.ward_id,
        zoneId: officer.zone_id,
        avatarUrl: officer.avatar_url,
        isVerified: officer.is_verified,
      },
    })
  } catch (error: unknown) {
    console.error('Officer login error:', error)

    const pgError = error as { code?: string }
    if (pgError.code === '42P01') {
      return NextResponse.json(
        { error: 'Database tables not initialized. Please run the seed script first.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
