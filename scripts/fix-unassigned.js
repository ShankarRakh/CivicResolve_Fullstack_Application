// Fix existing unassigned complaints by assigning them to the right department/officer
const { Pool } = require('pg');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Same mapping as in POST /api/complaints
const CATEGORY_TO_DEPT = {
  water: 'dept-water',
  roads: 'dept-roads',
  garbage: 'dept-sanitation',
  lights: 'dept-electrical',
  drainage: 'dept-water',
  health: 'dept-health',
  trees: 'dept-sanitation',
  building: 'dept-roads',
  encroachment: 'dept-sanitation',
  other: 'dept-roads',
};

async function main() {
  try {
    // Get officers by department
    const officersByDept = {};
    const officerRows = await pool.query(
      `SELECT id, name, department_id FROM users WHERE role = 'OFFICER'`
    );
    for (const o of officerRows.rows) {
      if (!officersByDept[o.department_id]) officersByDept[o.department_id] = [];
      officersByDept[o.department_id].push(o);
    }
    console.log('Officers by department:', officersByDept);

    // Get unassigned complaints
    const unassigned = await pool.query(
      `SELECT id, display_id, category_id FROM complaints WHERE assigned_officer_id IS NULL`
    );
    console.log(`\nFound ${unassigned.rows.length} unassigned complaints`);

    for (const c of unassigned.rows) {
      const deptId = CATEGORY_TO_DEPT[c.category_id];
      if (!deptId) {
        console.log(`  Skipping ${c.display_id} — no dept mapping for category "${c.category_id}"`);
        continue;
      }

      const deptOfficers = officersByDept[deptId];
      if (!deptOfficers || deptOfficers.length === 0) {
        console.log(`  Skipping ${c.display_id} — no officers in dept "${deptId}"`);
        continue;
      }

      // Pick first officer (they all get the existing ones distributed)
      const officer = deptOfficers[0];
      
      await pool.query(
        `UPDATE complaints SET department_id = $1, assigned_officer_id = $2, status = 'ASSIGNED' WHERE id = $3`,
        [deptId, officer.id, c.id]
      );

      // Add timeline entry
      const tlId = 'tl-fix-' + Math.random().toString(36).substring(2, 10);
      await pool.query(
        `INSERT INTO complaint_timeline (id, complaint_id, status, message, created_at)
         VALUES ($1, $2, 'ASSIGNED', $3, NOW())`,
        [tlId, c.id, `Complaint auto-assigned to ${officer.name}`]
      );

      console.log(`  ✅ ${c.display_id} (${c.category_id}) → ${officer.name} (${deptId})`);
    }

    console.log('\nDone! All complaints assigned.');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

main();