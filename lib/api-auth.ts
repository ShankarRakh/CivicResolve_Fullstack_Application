import { NextRequest } from 'next/server'
import { verifyToken, type JwtPayload } from '@/lib/jwt'

/**
 * Extract and verify JWT from a request.
 * Checks Authorization Bearer header first, then cookie fallback.
 * Returns the payload or null if invalid/missing.
 */
export function getAuthPayload(request: NextRequest): JwtPayload | null {
  const authHeader = request.headers.get('authorization')
  let token: string | undefined

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1]
  } else {
    token = request.cookies.get('civicresolve-token')?.value
  }

  if (!token) return null
  return verifyToken(token)
}
