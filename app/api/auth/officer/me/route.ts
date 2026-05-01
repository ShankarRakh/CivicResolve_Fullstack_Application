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

    // Determine which table to query based on role
    const isAdmin = payload.role === 'ADMIN' || payload.role === 'COMMISSIONER'

    let result

    if (isAdmin) {
      result = await pool.query(
        `SELECT id, email, name, admin_role as role, avatar_url, is_active, is_verified,
                preferred_language, 'ADMIN' as user_type
         FROM admins
         WHERE id = $1`,
        [payload.userId]
      )
    } else {
      // Officer - join with department, ward, zone for names
      result = await pool.query(
        `SELECT o.id, o.email, o.name, o.officer_role as role, o.avatar_url,
                o.is_active, o.is_verified, o.department_id, o.ward_id, o.zone_id,
                o.preferred_language, 'OFFICER' as user_type,
                d.name as department_name, w.name as ward_name, z.name as zone_name
         FROM officers o
         LEFT JOIN departments d ON o.department_id = d.id
         LEFT JOIN wards w ON o.ward_id = w.id
         LEFT JOIN zones z ON o.zone_id = z.id
         WHERE o.id = $1`,
        [payload.userId]
      )
    }

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
        userType: user.user_type,
        departmentId: user.department_id || null,
        departmentName: user.department_name || null,
        wardId: user.ward_id || null,
        wardName: user.ward_name || null,
        zoneId: user.zone_id || null,
        zoneName: user.zone_name || null,
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
