import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres.wcapgkldhsxmqtwicxox:manuel071125T%2Bqm@aws-1-us-east-2.pooler.supabase.com:6543/postgres',
  connectionTimeoutMillis: 15000,
  statement_timeout: 15000,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'Trabajador' ORDER BY ordinal_position");
    console.log('Columnas Trabajador:', cols.rows.map(r => r.column_name));

    const tables = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
    console.log('\nTablas:', tables.rows.map(r => r.tablename));
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
