import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 15000,
  statement_timeout: 15000,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    // Tamaño total de la BD
    const size = await client.query("SELECT pg_size_pretty(pg_database_size(current_database())) as total");
    console.log('Tamaño total BD:', size.rows[0].total);

    // Tamaño por tabla
    const tables = await client.query(`
      SELECT tablename, pg_size_pretty(pg_total_relation_size('"' || tablename || '"')) as size
      FROM pg_tables WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size('"' || tablename || '"') DESC
    `);
    console.log('\nTamaño por tabla:');
    tables.rows.forEach(r => console.log(`  ${r.tablename}: ${r.size}`));
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
