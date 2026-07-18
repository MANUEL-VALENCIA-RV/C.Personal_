const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL, 
  connectionTimeoutMillis: 10000, 
  statement_timeout: 10000,
  ssl: { rejectUnauthorized: false } 
});

async function main() {
  const client = await pool.connect();
  try {
    const r = await client.query("SELECT id, nombre, LEFT(documentos::text, 500) as docs_preview FROM \"Trabajador\" WHERE documentos::text != '{}' LIMIT 3");
    r.rows.forEach(row => {
      console.log(`ID:${row.id} ${row.nombre}: ${row.docs_preview}`);
    });
  } finally {
    client.release();
    await pool.end();
  }
}
main().catch(e => { console.error(e.message); process.exit(1); });
