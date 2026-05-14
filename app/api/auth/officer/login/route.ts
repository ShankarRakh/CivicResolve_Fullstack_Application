import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/jwt'

// Officer roles from the Prisma schema
const OFFICER_ROLES = ['OFFICER', 'ADMIN']

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
    const officer = await prisma.user.findFirst({
      where: { email, role: { in: ['OFFICER', 'ADMIN'] } },
      select: { id: true, email: true, passwordHash: true, name: true, role: true, departmentId: true }
    })

    if (!officer) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check password hash exists
    if (!officer.passwordHash) {
      return NextResponse.json(
        { error: 'Password not set. Contact your administrator.' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, officer.passwordHash)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }


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
        departmentId: officer.departmentId,
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
