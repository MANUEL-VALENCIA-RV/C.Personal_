import { google } from 'googleapis'

const drive = google.drive('v3')

async function authenticate() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL

  if (!privateKey || !clientEmail) {
    throw new Error('Faltan GOOGLE_PRIVATE_KEY o GOOGLE_CLIENT_EMAIL en variables de entorno')
  }

  const credentials = {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID || 'control-personal-drive-502722',
    private_key: privateKey.replace(/\\n/g, '\n'),
    client_email: clientEmail,
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`,
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  })

  return auth
}

export async function uploadDocumento(file, trabajadorNombre) {
  try {
    const auth = await authenticate()
    const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || 'root'

    const carpetaId = await getOrCreateFolder(
      auth,
      `${trabajadorNombre}`,
      parentFolderId
    )

    const fileMetadata = {
      name: file.originalname,
      parents: [carpetaId],
    }

    const media = {
      mimeType: file.mimetype,
      body: file.buffer,
    }

    const response = await drive.files.create({
      auth,
      resource: fileMetadata,
      media,
      fields: 'id, webViewLink, name, mimeType, createdTime',
    })

    // NO hacer el archivo público. El acceso se controla vía:
    // - Service account (backend puede leer/subir/borrar)
    // - Compartir carpeta/archivo con usuarios específicos de la organización si hace falta
    // await drive.permissions.create({ ... }) // REMOVIDO: type: 'anyone' exponía PII

    return {
      driveFileId: response.data.id,
      webViewLink: response.data.webViewLink,
      carpetaId,
      nombre: response.data.name,
    }
  } catch (error) {
    console.error('Error en uploadDocumento:', error)
    throw error
  }
}

async function getOrCreateFolder(auth, folderName, parentId) {
  try {
    // Sanitizar nombre de carpeta para evitar inyección en Drive query
    const safeName = folderName.replace(/['\\]/g, '')
    const response = await drive.files.list({
      auth,
      q: `name='${safeName}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
      spaces: 'drive',
      pageSize: 1,
      fields: 'files(id)',
    })

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id
    }

    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    }

    const created = await drive.files.create({
      auth,
      resource: folderMetadata,
      fields: 'id',
    })

    return created.data.id
  } catch (error) {
    console.error('Error en getOrCreateFolder:', error)
    throw error
  }
}

export async function deleteDocumento(fileId) {
  try {
    const auth = await authenticate()
    await drive.files.delete({
      auth,
      fileId,
    })
  } catch (error) {
    console.error('Error en deleteDocumento:', error)
    throw error
  }
}

export async function getDocumentoLink(fileId) {
  try {
    const auth = await authenticate()
    const response = await drive.files.get({
      auth,
      fileId,
      fields: 'webViewLink, downloadUrl',
    })

    return response.data
  } catch (error) {
    console.error('Error en getDocumentoLink:', error)
    throw error
  }
}
