import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
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
    const citizen = await prisma.user.findFirst({
      where: { email, role: 'CITIZEN' },
      select: { id: true, email: true, phone: true, passwordHash: true, name: true, role: true }
    })

    if (!citizen) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check password hash exists
    if (!citizen.passwordHash) {
      return NextResponse.json(
        { error: 'Password not set. Please register again.' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, citizen.passwordHash)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }


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
