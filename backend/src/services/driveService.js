import { google } from 'googleapis'
import fs from 'fs'

const drive = google.drive('v3')

async function authenticate() {
  const credentialsPath = process.env.GOOGLE_DRIVE_CREDENTIALS || './credentials-drive.json'
  
  if (!fs.existsSync(credentialsPath)) {
    throw new Error(`Archivo de credenciales no encontrado: ${credentialsPath}`)
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: ['https://www.googleapis.com/auth/drive'],
  })

  return auth.getClient()
}

export async function uploadDocumento(file, trabajadorNombre) {
  try {
    const auth = await authenticate()
    const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || 'root'

    // Crear carpeta del trabajador si no existe
    const carpetaId = await getOrCreateFolder(
      auth,
      `${trabajadorNombre}`,
      parentFolderId
    )

    // Subir archivo
    const fileMetadata = {
      name: file.originalname,
      parents: [carpetaId],
    }

    const media = {
      mimeType: file.mimetype,
      body: fs.createReadStream(file.path),
    }

    const response = await drive.files.create({
      auth,
      resource: fileMetadata,
      media,
      fields: 'id, webViewLink, name, mimeType, createdTime',
    })

    // Eliminar archivo temporal
    fs.unlinkSync(file.path)

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
    // Buscar carpeta existente
    const response = await drive.files.list({
      auth,
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
      spaces: 'drive',
      pageSize: 1,
      fields: 'files(id)',
    })

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id
    }

    // Crear nueva carpeta
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
