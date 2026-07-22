import { google } from 'googleapis'
import { Readable } from 'stream'

const drive = google.drive('v3')

const DRIVE_OPTS = { supportsAllDrives: true, includeItemsFromAllDrives: true }

let oauth2Client = null

function getOAuth2Client() {
  if (!oauth2Client) {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('Faltan GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET o GOOGLE_REFRESH_TOKEN en variables de entorno')
    }

    oauth2Client = new google.auth.OAuth2(clientId, clientSecret)
    oauth2Client.setCredentials({ refresh_token: refreshToken })
  }
  return oauth2Client
}

export async function uploadDocumento(file, trabajadorNombre) {
  try {
    const auth = getOAuth2Client()
    const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID

    if (!parentFolderId) {
      throw new Error('GOOGLE_DRIVE_FOLDER_ID no está configurado en variables de entorno')
    }

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
      body: Readable.from(file.buffer),
    }

    const response = await drive.files.create({
      auth,
      resource: fileMetadata,
      media,
      fields: 'id, webViewLink, name, mimeType, createdTime',
      ...DRIVE_OPTS,
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
    const safeName = folderName.replace(/['\\]/g, '')
    const response = await drive.files.list({
      auth,
      q: `name='${safeName}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
      spaces: 'drive',
      pageSize: 1,
      fields: 'files(id)',
      ...DRIVE_OPTS,
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
      ...DRIVE_OPTS,
    })

    return created.data.id
  } catch (error) {
    console.error('Error en getOrCreateFolder:', error)
    throw error
  }
}

export async function deleteDocumento(fileId) {
  try {
    const auth = getOAuth2Client()
    await drive.files.delete({
      auth,
      fileId,
      ...DRIVE_OPTS,
    })
  } catch (error) {
    console.error('Error en deleteDocumento:', error)
    throw error
  }
}

export async function getDocumentoLink(fileId) {
  try {
    const auth = getOAuth2Client()
    const response = await drive.files.get({
      auth,
      fileId,
      fields: 'webViewLink, downloadUrl',
      ...DRIVE_OPTS,
    })

    return response.data
  } catch (error) {
    console.error('Error en getDocumentoLink:', error)
    throw error
  }
}
