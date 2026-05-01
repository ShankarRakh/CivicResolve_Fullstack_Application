// Seed script to create tables and test accounts
// Run: node scripts/seed-officer.js

const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL.replace('sslmode=require', 'sslmode=no-verify'),
  ssl: { rejectUnauthorized: false },
})

async function seed() {
  try {
    // ==========================================
    // CREATE TABLES
    // ==========================================

    // Create OfficerRole and AdminRole enums if they don't exist
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE "OfficerRole" AS ENUM ('FIELD_OFFICER', 'ZONAL_OFFICER', 'DEPT_HEAD');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `)
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'COMMISSIONER');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `)
    console.log('✅ Enums ready')

    // Create citizens table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS citizens (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        phone TEXT UNIQUE,
        password_hash TEXT,
        name TEXT NOT NULL,
        avatar_url TEXT,
        is_active BOOLEAN DEFAULT true,
        is_verified BOOLEAN DEFAULT false,
        aadhaar_verified BOOLEAN DEFAULT false,
        address TEXT,
        city TEXT,
        pincode TEXT,
        fcm_token TEXT,
        preferred_language TEXT DEFAULT 'EN',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_login_at TIMESTAMPTZ
      )
    `)
    console.log('✅ Citizens table ready')

    // Create officers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS officers (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        phone TEXT UNIQUE,
        password_hash TEXT,
        name TEXT NOT NULL,
        avatar_url TEXT,
        officer_role "OfficerRole" NOT NULL,
        department_id TEXT,
        ward_id TEXT,
        zone_id TEXT,
        is_active BOOLEAN DEFAULT true,
        is_verified BOOLEAN DEFAULT false,
        fcm_token TEXT,
        preferred_language TEXT DEFAULT 'EN',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_login_at TIMESTAMPTZ
      )
    `)
    console.log('✅ Officers table ready')

    // Create admins table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        phone TEXT UNIQUE,
        password_hash TEXT,
        name TEXT NOT NULL,
        avatar_url TEXT,
        admin_role "AdminRole" NOT NULL,
        is_active BOOLEAN DEFAULT true,
        is_verified BOOLEAN DEFAULT false,
        fcm_token TEXT,
        preferred_language TEXT DEFAULT 'EN',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_login_at TIMESTAMPTZ
      )
    `)
    console.log('✅ Admins table ready')

    // ==========================================
    // SEED TEST DATA
    // ==========================================

    // Seed a test Field Officer
    const officerPassword = await bcrypt.hash('officer123', 12)
    const officerResult = await pool.query(`
      INSERT INTO officers (id, email, password_hash, name, officer_role, is_active, is_verified, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'FIELD_OFFICER', true, true, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET password_hash = $3, updated_at = NOW()
      RETURNING id, email, name, officer_role
    `, [
      'officer-test-1',
      'officer@municipality.gov.in',
      officerPassword,
      'R.K. Pawar'
    ])

    console.log('\n✅ Test officer created:')
    console.log(officerResult.rows[0])
    console.log('   Email:    officer@municipality.gov.in')
    console.log('   Password: officer123')

    // Seed a test Admin
    const adminPassword = await bcrypt.hash('admin123', 12)
    const adminResult = await pool.query(`
      INSERT INTO admins (id, email, password_hash, name, admin_role, is_active, is_verified, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'ADMIN', true, true, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET password_hash = $3, updated_at = NOW()
      RETURNING id, email, name, admin_role
    `, [
      'admin-test-1',
      'admin@municipality.gov.in',
      adminPassword,
      'Suresh Kumar'
    ])

    console.log('\n✅ Test admin created:')
    console.log(adminResult.rows[0])
    console.log('   Email:    admin@municipality.gov.in')
    console.log('   Password: admin123')

    // Seed a test Citizen
    const citizenPassword = await bcrypt.hash('citizen123', 12)
    const citizenResult = await pool.query(`
      INSERT INTO citizens (id, email, phone, password_hash, name, city, pincode, is_active, is_verified, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true, false, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET password_hash = $4, updated_at = NOW()
      RETURNING id, email, phone, name
    `, [
      'citizen-test-1',
      'citizen@example.com',
      '+919876543210',
      citizenPassword,
      'Amit Patil',
      'Pune',
      '411028'
    ])

    console.log('\n✅ Test citizen created:')
    console.log(citizenResult.rows[0])
    console.log('   Email:    citizen@example.com')
    console.log('   Password: citizen123')

    console.log('\n🎉 Seeding complete! All tables and test accounts are ready.')

  } catch (error) {
    console.error('❌ Seeding failed:', error.message)
  } finally {
    await pool.end()
  }
}

seed()
