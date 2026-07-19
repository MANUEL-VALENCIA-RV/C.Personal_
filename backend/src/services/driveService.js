import { google } from 'googleapis'

const drive = google.drive('v3')

async function authenticate() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Faltan credenciales OAuth2 en .env (GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN)')
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret)
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  return oauth2Client
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

    // Hacer el archivo públicamente visible para previsualización
    await drive.permissions.create({
      auth,
      fileId: response.data.id,
      resource: {
        role: 'reader',
        type: 'anyone',
      },
    })

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
