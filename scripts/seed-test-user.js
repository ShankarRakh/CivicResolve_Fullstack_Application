require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const jwt = require('jsonwebtoken')

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'civicresolve-dev-secret-change-in-production'

async function main() {
  // Create a test citizen user
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      phone: '+919999999999',
      passwordHash: 'test-hash',
      name: 'Test Citizen',
      role: 'CITIZEN',
    },
  })
  console.log('User:', user.id)

  // Generate JWT using the SAME secret as lib/jwt.ts
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  )
  console.log('Token:', token)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
