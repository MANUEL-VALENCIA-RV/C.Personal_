import { google } from 'googleapis'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const drive = google.drive('v3')

async function authenticate() {
  let credentials

  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH

  if (keyJson) {
    try {
      credentials = JSON.parse(keyJson)
    } catch (e) {
      console.error('GOOGLE_SERVICE_ACCOUNT_KEY no es JSON válido:', e.message)
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY contains invalid JSON')
    }
  } else if (keyPath) {
    credentials = JSON.parse(readFileSync(keyPath, 'utf8'))
  } else {
    throw new Error('No se encontró GOOGLE_SERVICE_ACCOUNT_KEY ni GOOGLE_SERVICE_ACCOUNT_KEY_PATH en las variables de entorno')
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
