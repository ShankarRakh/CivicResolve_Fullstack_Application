import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Fetch latest user data from DB with department/ward/zone names
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.role, u.avatar_url, u.is_active, u.is_verified,
              u.department_id, u.ward_id, u.zone_id, u.preferred_language,
              d.name as department_name, w.name as ward_name, z.name as zone_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN wards w ON u.ward_id = w.id
       LEFT JOIN zones z ON u.zone_id = z.id
       WHERE u.id = $1`,
      [payload.userId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const user = result.rows[0]

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.department_id,
        departmentName: user.department_name,
        wardId: user.ward_id,
        wardName: user.ward_name,
        zoneId: user.zone_id,
        zoneName: user.zone_name,
        avatarUrl: user.avatar_url,
        isVerified: user.is_verified,
      },
    })
  } catch (error) {
    console.error('Auth verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
