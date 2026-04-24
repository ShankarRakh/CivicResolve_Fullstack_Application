// Seed script to create test officers in the database
// Run: node scripts/seed-officer.js

const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL.replace('sslmode=require', 'sslmode=no-verify'),
  ssl: { rejectUnauthorized: false },
})

async function seedOfficer() {
  try {
    // Create the users table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        email TEXT UNIQUE,
        phone TEXT UNIQUE,
        password_hash TEXT,
        name TEXT NOT NULL,
        avatar_url TEXT,
        role TEXT NOT NULL DEFAULT 'CITIZEN',
        department_id TEXT,
        ward_id TEXT,
        zone_id TEXT,
        is_active BOOLEAN DEFAULT true,
        is_verified BOOLEAN DEFAULT false,
        aadhaar_verified BOOLEAN DEFAULT false,
        fcm_token TEXT,
        preferred_language TEXT DEFAULT 'EN',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        last_login_at TIMESTAMPTZ
      )
    `)
    console.log('✅ Users table ready')

    // Seed a test Field Officer
    const officerPassword = await bcrypt.hash('officer123', 12)
    const officerResult = await pool.query(`
      INSERT INTO users (id, email, password_hash, name, role, is_active, is_verified, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, true, true, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET password_hash = $3, updated_at = NOW()
      RETURNING id, email, name, role
    `, [
      'officer-test-1',
      'officer@municipality.gov.in',
      officerPassword,
      'R.K. Pawar',
      'FIELD_OFFICER'
    ])

    console.log('\n✅ Test officer created:')
    console.log(officerResult.rows[0])
    console.log('   Email:    officer@municipality.gov.in')
    console.log('   Password: officer123')

    // Seed a test Admin
    const adminPassword = await bcrypt.hash('admin123', 12)
    const adminResult = await pool.query(`
      INSERT INTO users (id, email, password_hash, name, role, is_active, is_verified, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, true, true, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET password_hash = $3, updated_at = NOW()
      RETURNING id, email, name, role
    `, [
      'admin-test-1',
      'admin@municipality.gov.in',
      adminPassword,
      'Suresh Kumar',
      'ADMIN'
    ])

    console.log('\n✅ Test admin created:')
    console.log(adminResult.rows[0])
    console.log('   Email:    admin@municipality.gov.in')
    console.log('   Password: admin123')

    console.log('\n🎉 Seeding complete! You can now login with these credentials.')

  } catch (error) {
    console.error('❌ Seeding failed:', error.message)
  } finally {
    await pool.end()
  }
}

seedOfficer()
