import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const pool = new Pool({
  connectionString: 'postgresql://postgres.wcapgkldhsxmqtwicxox:manuel071125T%2Bqm@aws-1-us-east-2.pooler.supabase.com:6543/postgres',
  connectionTimeoutMillis: 15000,
  statement_timeout: 60000,
  idle_in_transaction_session_timeout: 60000,
  ssl: { rejectUnauthorized: false }
});

const OUTPUT_DIR = './documentos_extraidos';
const BATCH_SIZE = 5;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function extractWorker(row) {
  const docs = typeof row.documentos === 'string'
    ? JSON.parse(row.documentos)
    : row.documentos;

  const nombreLimpio = row.nombre.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, '').trim();
  const carpetaTrabajador = path.join(OUTPUT_DIR, `${row.id}_${nombreLimpio}`);

  if (!fs.existsSync(carpetaTrabajador)) {
    fs.mkdirSync(carpetaTrabajador, { recursive: true });
  }

  let count = 0;

  for (const [tipo, valor] of Object.entries(docs)) {
    if (!valor || typeof valor !== 'string') continue;

    if (valor.startsWith('data:')) {
      const match = valor.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) continue;

      const mimeType = match[1];
      const base64Data = match[2];

      let ext = 'bin';
      if (mimeType.includes('pdf')) ext = 'pdf';
      else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
      else if (mimeType.includes('png')) ext = 'png';
      else if (mimeType.includes('webp')) ext = 'webp';

      const nombreArchivo = `${tipo}.${ext}`;
      const rutaArchivo = path.join(carpetaTrabajador, nombreArchivo);

      fs.writeFileSync(rutaArchivo, Buffer.from(base64Data, 'base64'));
      count++;
    }
  }

  return { nombreLimpio, count };
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Get IDs first
  const idsResult = await pool.query(
    "SELECT id FROM \"Trabajador\" WHERE documentos::text != '{}'"
  );
  const ids = idsResult.rows.map(r => r.id);
  console.log(`Total trabajadores con docs: ${ids.length}`);

  let totalArchivos = 0;

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    console.log(`\nProcesando lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(ids.length / BATCH_SIZE)}...`);

    for (const id of batch) {
      const client = await pool.connect();
      try {
        const result = await client.query(
          'SELECT id, nombre, documentos FROM "Trabajador" WHERE id = $1',
          [id]
        );
        if (result.rows.length > 0) {
          const r = await extractWorker(result.rows[0]);
          console.log(`  ✓ ${r.nombreLimpio}: ${r.count} archivos`);
          totalArchivos += r.count;
        }
      } catch (e) {
        console.error(`  ✗ ID ${id}: ${e.message}`);
      } finally {
        client.release();
      }
    }

    await sleep(500);
  }

  console.log(`\n=== TOTAL: ${totalArchivos} archivos extraídos ===`);
  console.log(`Carpeta: ${path.resolve(OUTPUT_DIR)}`);

  await pool.end();
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
