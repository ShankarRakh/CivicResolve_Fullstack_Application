/**
 * Seed script: Creates departments, officers, categories, and wards
 * Run: node scripts/seed-officers.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🏗️  Seeding departments...');

    // Create departments
    const departments = [
      { id: 'dept-roads',      name: 'Roads Department',   email: 'roads@municipality.gov.in',      phone: '+91-20-26120001' },
      { id: 'dept-water',      name: 'Water Supply',       email: 'water@municipality.gov.in',      phone: '+91-20-26120002' },
      { id: 'dept-sanitation', name: 'Sanitation',         email: 'sanitation@municipality.gov.in', phone: '+91-20-26120003' },
      { id: 'dept-electrical', name: 'Electrical',         email: 'electrical@municipality.gov.in', phone: '+91-20-26120004' },
      { id: 'dept-health',     name: 'Health & Safety',    email: 'health@municipality.gov.in',     phone: '+91-20-26120005' },
    ];

    for (const dept of departments) {
      await client.query(
        `INSERT INTO departments (id, name, email, phone)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET name = $2, email = $3, phone = $4`,
        [dept.id, dept.name, dept.email, dept.phone]
      );
    }
    console.log(`   ✅ ${departments.length} departments created`);

    console.log('📂 Seeding categories...');

    // Create categories
    const categories = [
      { id: 'water',        name: 'Water Supply',       icon: 'Droplets' },
      { id: 'roads',        name: 'Roads',              icon: 'Route' },
      { id: 'garbage',      name: 'Garbage & Sanitation', icon: 'Trash2' },
      { id: 'lights',       name: 'Street Lights',      icon: 'Lightbulb' },
      { id: 'drainage',     name: 'Drainage',           icon: 'Waves' },
      { id: 'health',       name: 'Health & Safety',    icon: 'Heart' },
      { id: 'trees',        name: 'Trees & Parks',      icon: 'TreeDeciduous' },
      { id: 'building',     name: 'Buildings',          icon: 'Building2' },
      { id: 'encroachment', name: 'Encroachment',       icon: 'Ban' },
      { id: 'other',        name: 'Other',              icon: 'MoreHorizontal' },
    ];

    for (const cat of categories) {
      await client.query(
        `INSERT INTO categories (id, name, icon)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET name = $2, icon = $3`,
        [cat.id, cat.name, cat.icon]
      );
    }
    console.log(`   ✅ ${categories.length} categories created`);

    console.log('🗺️  Seeding wards...');

    // Create wards
    const wards = [];
    for (let i = 1; i <= 20; i++) {
      wards.push({
        id: `ward-${i}`,
        name: `Ward ${i}`,
        zone: `Zone ${Math.ceil(i / 5)}`,
      });
    }

    for (const ward of wards) {
      await client.query(
        `INSERT INTO wards (id, name, zone)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET name = $2, zone = $3`,
        [ward.id, ward.name, ward.zone]
      );
    }
    console.log(`   ✅ ${wards.length} wards created`);

    console.log('👮 Seeding officers & admin...');

    // Hash password (same for all seed users)
    const passwordHash = await bcrypt.hash('Officer@123', 12);
    const adminPasswordHash = await bcrypt.hash('Admin@123', 12);

    const officers = [
      {
        id: 'officer-1',
        email: 'rk.pawar@municipality.gov.in',
        phone: '+919876543210',
        name: 'R.K. Pawar',
        role: 'OFFICER',
        departmentId: 'dept-roads',
        passwordHash,
      },
      {
        id: 'officer-2',
        email: 'manoj.d@municipality.gov.in',
        phone: '+919876543211',
        name: 'Manoj Deshmukh',
        role: 'OFFICER',
        departmentId: 'dept-water',
        passwordHash,
      },
      {
        id: 'officer-3',
        email: 'sneha.k@municipality.gov.in',
        phone: '+919876543212',
        name: 'Sneha Kulkarni',
        role: 'OFFICER',
        departmentId: 'dept-sanitation',
        passwordHash,
      },
      {
        id: 'admin-1',
        email: 'admin@municipality.gov.in',
        phone: '+919988776655',
        name: 'Suresh Kumar',
        role: 'ADMIN',
        departmentId: null,
        passwordHash: adminPasswordHash,
      },
    ];

    for (const user of officers) {
      await client.query(
        `INSERT INTO users (id, email, phone, password_hash, name, role, department_id)
         VALUES ($1, $2, $3, $4, $5, $6::"Role", $7)
         ON CONFLICT (id) DO UPDATE SET
           email = $2, phone = $3, password_hash = $4,
           name = $5, role = $6::"Role", department_id = $7`,
        [user.id, user.email, user.phone, user.passwordHash, user.name, user.role, user.departmentId]
      );
    }
    console.log(`   ✅ ${officers.length} users created`);

    // Set department heads
    await client.query(
      `UPDATE departments SET head_id = 'officer-1' WHERE id = 'dept-roads'`
    );
    await client.query(
      `UPDATE departments SET head_id = 'officer-2' WHERE id = 'dept-water'`
    );
    await client.query(
      `UPDATE departments SET head_id = 'officer-3' WHERE id = 'dept-sanitation'`
    );
    console.log('   ✅ Department heads assigned');

    await client.query('COMMIT');

    console.log('\n🎉 Seed complete!\n');
    console.log('═══════════════════════════════════════════');
    console.log('  LOGIN CREDENTIALS');
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log('  OFFICERS (password: Officer@123)');
    console.log('  ─────────────────────────────────────────');
    console.log('  R.K. Pawar     → rk.pawar@municipality.gov.in');
    console.log('  Manoj Deshmukh → manoj.d@municipality.gov.in');
    console.log('  Sneha Kulkarni → sneha.k@municipality.gov.in');
    console.log('');
    console.log('  ADMIN (password: Admin@123)');
    console.log('  ─────────────────────────────────────────');
    console.log('  Suresh Kumar   → admin@municipality.gov.in');
    console.log('═══════════════════════════════════════════');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(() => process.exit(1));
