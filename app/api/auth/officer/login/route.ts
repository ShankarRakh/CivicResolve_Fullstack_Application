import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'
import { signToken } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Try officers table first
    let result = await pool.query(
      `SELECT id, email, password_hash, name, officer_role, department_id, ward_id, zone_id,
              is_active, is_verified, avatar_url, 'OFFICER' as user_type
       FROM officers
       WHERE email = $1`,
      [email]
    )

    // If not found in officers, try admins table
    if (result.rows.length === 0) {
      result = await pool.query(
        `SELECT id, email, password_hash, name, admin_role, NULL as department_id,
                NULL as ward_id, NULL as zone_id,
                is_active, is_verified, avatar_url, 'ADMIN' as user_type
         FROM admins
         WHERE email = $1`,
        [email]
      )
    }

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const user = result.rows[0]

    // Check if account is active
    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Account is deactivated. Contact your department head.' },
        { status: 403 }
      )
    }

    // Check password hash exists
    if (!user.password_hash) {
      return NextResponse.json(
        { error: 'Password not set. Contact your administrator.' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Update last login timestamp in the correct table
    const tableName = user.user_type === 'ADMIN' ? 'admins' : 'officers'
    await pool.query(
      `UPDATE ${tableName} SET last_login_at = NOW() WHERE id = $1`,
      [user.id]
    )

    // Determine the role string for JWT
    const role = user.user_type === 'ADMIN' ? user.admin_role : user.officer_role

    // Generate JWT
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: role,
      name: user.name,
    })

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: role,
        userType: user.user_type,
        departmentId: user.department_id,
        wardId: user.ward_id,
        zoneId: user.zone_id,
        avatarUrl: user.avatar_url,
        isVerified: user.is_verified,
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
