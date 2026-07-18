import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 15000,
  statement_timeout: 120000,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('Antes de VACUUM:');
    const before = await client.query("SELECT pg_size_pretty(pg_total_relation_size('\"Trabajador\"')) as size");
    console.log('  Trabajador:', before.rows[0].size);

    const dbBefore = await client.query("SELECT pg_size_pretty(pg_database_size(current_database())) as total");
    console.log('  Total BD:', dbBefore.rows[0].total);

    console.log('\nEjecutando VACUUM FULL...');
    await client.query('VACUUM FULL "Trabajador"');
    console.log('✓ VACUUM FULL completado');

    console.log('\nDespués de VACUUM:');
    const after = await client.query("SELECT pg_size_pretty(pg_total_relation_size('\"Trabajador\"')) as size");
    console.log('  Trabajador:', after.rows[0].size);

    const dbAfter = await client.query("SELECT pg_size_pretty(pg_database_size(current_database())) as total");
    console.log('  Total BD:', dbAfter.rows[0].total);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
