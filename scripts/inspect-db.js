// Quick DB inspection script
const { Pool } = require('pg');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  try {
    // 1. Officers and their departments
    console.log('\n=== OFFICERS ===');
    const officers = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.department_id, d.name as dept_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.role = 'OFFICER'`
    );
    console.table(officers.rows);

    // 2. Departments
    console.log('\n=== DEPARTMENTS ===');
    const depts = await pool.query(`SELECT id, name, head_id FROM departments`);
    console.table(depts.rows);

    // 3. Categories
    console.log('\n=== CATEGORIES ===');
    const cats = await pool.query(`SELECT id, name FROM categories`);
    console.table(cats.rows);

    // 4. Recent complaints
    console.log('\n=== RECENT COMPLAINTS ===');
    const complaints = await pool.query(
      `SELECT id, display_id, category_id, subcategory_id, status, department_id, assigned_officer_id, citizen_id
       FROM complaints ORDER BY created_at DESC LIMIT 10`
    );
    console.table(complaints.rows);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

main();