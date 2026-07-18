import { google } from 'googleapis';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN });

  const drive = google.drive('v3');
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  // Test upload
  fs.writeFileSync('/tmp/test_drive.txt', 'Conexion exitosa - Control Personal');
  
  const upload = await drive.files.create({
    auth: oauth2Client,
    resource: { name: 'testConexion.txt', parents: [folderId] },
    media: { mimeType: 'text/plain', body: fs.createReadStream('/tmp/test_drive.txt') },
    fields: 'id, name, webViewLink',
  });

  console.log('Subido:', upload.data.name);
  console.log('Link:', upload.data.webViewLink);

  // Eliminar test
  await drive.files.delete({ auth: oauth2Client, fileId: upload.data.id });
  console.log('Test eliminado');
  console.log('\n✅ Google Drive funciona con OAuth2!');
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
