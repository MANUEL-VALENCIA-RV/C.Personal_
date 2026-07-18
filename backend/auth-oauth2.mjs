import { google } from 'googleapis';
import http from 'http';
import url from 'url';
import dotenv from 'dotenv';

dotenv.config();

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3001/oauth2callback';
const SCOPES = ['https://www.googleapis.com/auth/drive'];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Error: GOOGLE_OAUTH_CLIENT_ID y GOOGLE_OAUTH_CLIENT_SECRET deben estar en .env');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent',
});

console.log('\n🔗 Abre esta URL en tu navegador:\n');
console.log(authUrl);
console.log('\nEsperando autorización...\n');

const server = http.createServer(async (req, res) => {
  const query = url.parse(req.url, true).query;

  if (query.code) {
    try {
      const { tokens } = await oauth2Client.getToken(query.code);
      
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>✅ Autorización exitosa!</h1><p>Puedes cerrar esta ventana.</p>');

      console.log('========================================');
      console.log('REFRESH_TOKEN:');
      console.log(tokens.refresh_token);
      console.log('\nCopia el REFRESH_TOKEN y guárdalo en tu .env');
      console.log('========================================');

      server.close();
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>Error al obtener token</h1>');
      console.error('Error:', error.message);
      server.close();
    }
  }
});

server.listen(3001, () => {
  console.log('Servidor de callback escuchando en http://localhost:3001');
});
