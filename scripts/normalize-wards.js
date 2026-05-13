require('dotenv').config();
const { Pool } = require('pg');

if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestWardId(lat, lng, wards) {
  let bestId = null;
  let bestDist = Infinity;

  for (const w of wards) {
    if (w.center_lat == null || w.center_lng == null) continue;
    const d = haversineKm(lat, lng, Number(w.center_lat), Number(w.center_lng));
    if (d < bestDist) {
      bestDist = d;
      bestId = w.id;
    }
  }

  return bestId;
}

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const wardsRes = await client.query(
      "select id, name, zone, center_lat, center_lng from wards where id not like 'ward-%'"
    );
    const wards = wardsRes.rows;

    const nullWardRes = await client.query(
      "select id, latitude, longitude, address from complaints where ward_id is null or ward_id like 'ward-%'"
    );

    if (nullWardRes.rows.length > 0) {
      const complaintIds = nullWardRes.rows.map((r) => r.id);
      await client.query(
        "update complaints set ward_id = null where ward_id like 'ward-%' or id = any($1)",
        [complaintIds]
      );
    }

    const missingRes = await client.query(
      "select id, latitude, longitude, address from complaints where ward_id is null"
    );

    for (const row of missingRes.rows) {
      if (row.latitude != null && row.longitude != null) {
        const nearest = findNearestWardId(Number(row.latitude), Number(row.longitude), wards);
        if (nearest) {
          await client.query(
            'update complaints set ward_id = $1 where id = $2',
            [nearest, row.id]
          );
        }
      }
    }

    // Fallback: match by ward name in address
    for (const w of wards) {
      await client.query(
        'update complaints set ward_id = $1 where ward_id is null and address is not null and address ilike $2',
        [w.id, `%${w.name}%`]
      );
    }

    await client.query("delete from wards where id like 'ward-%'");

    await client.query('COMMIT');
    console.log('Ward normalization complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Ward normalization failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(() => process.exit(1));
