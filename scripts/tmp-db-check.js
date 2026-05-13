require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const queries = [
  {
    name: 'complaints_missing_ward',
    sql: 'select id, display_id, ward_id, address from complaints where ward_id is null limit 20',
  },
  {
    name: 'complaint_categories',
    sql: 'select category_id, subcategory_id, count(*) as count from complaints group by 1,2 order by count(*) desc limit 20',
  },
  {
    name: 'wards_list',
    sql: 'select id, name, zone from wards order by name limit 50',
  },
  {
    name: 'complaints_join_wards',
    sql: 'select c.id, c.display_id, c.ward_id, w.name as ward_name, w.zone from complaints c left join wards w on w.id = c.ward_id limit 20',
  },
  {
    name: 'notifications_shape',
    sql: 'select id, user_id, type, message, is_read, created_at from notifications order by created_at desc limit 20',
  },
];

async function run() {
  const client = await pool.connect();
  try {
    for (const q of queries) {
      const res = await client.query(q.sql);
      console.log(`## ${q.name}`);
      console.log(JSON.stringify(res.rows, null, 2));
    }
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('DB query failed:', err.message);
  process.exit(1);
});
