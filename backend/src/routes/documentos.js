import express from 'express'
import multer from 'multer'
import { google } from 'googleapis'
import { getPrisma } from '../db.js'
import { uploadDocumento, deleteDocumento } from '../services/driveService.js'

const prisma = getPrisma()
const router = express.Router()

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`))
    }
  },
})

// GET - Proxy para servir archivos desde Google Drive (ANTES de /:trabajadorId)
router.get('/file/:driveFileId', async (req, res) => {
  try {
    const { driveFileId } = req.params

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN

    if (!clientId || !clientSecret || !refreshToken) {
      return res.status(500).json({ error: 'Google Drive no configurado' })
    }

    const oauth2 = new google.auth.OAuth2(clientId, clientSecret)
    oauth2.setCredentials({ refresh_token: refreshToken })

    const drive = google.drive('v3')

    const fileMeta = await drive.files.get({
      auth: oauth2,
      fileId: driveFileId,
      fields: 'name, mimeType',
      supportsAllDrives: true,
    })

    const response = await drive.files.get({
      auth: oauth2,
      fileId: driveFileId,
      alt: 'media',
      supportsAllDrives: true,
    })

    res.setHeader('Content-Type', fileMeta.data.mimeType || 'application/octet-stream')
    res.setHeader('Cache-Control', 'public, max-age=86400')
    response.data.pipe(res)
  } catch (error) {
    console.error('Error proxying file:', error)
    res.status(500).json({ error: 'Error al obtener archivo de Drive' })
  }
})

// POST - Subir documento para un trabajador
router.post('/:trabajadorId/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó archivo' })
    }

    const { trabajadorId } = req.params
    const campo = req.body.campo || req.file.originalname

    const trabajador = await prisma.trabajador.findUnique({
      where: { id: parseInt(trabajadorId) },
    })

    if (!trabajador) {
      return res.status(404).json({ error: 'Trabajador no encontrado' })
    }

    const { driveFileId, webViewLink, carpetaId, nombre } = await uploadDocumento(
      req.file,
      `${trabajador.nombre}_${trabajadorId}`
    )

    const documento = await prisma.documento.create({
      data: {
        trabajadorId: parseInt(trabajadorId),
        driveFileId,
        nombre: campo,
        mimeType: req.file.mimetype,
        carpetaId,
      },
    })

    res.json({ success: true, documento, webViewLink })
  } catch (error) {
    console.error('Error al subir documento:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET - Obtener documentos de un trabajador
router.get('/:trabajadorId', async (req, res) => {
  try {
    const { trabajadorId } = req.params

    const documentos = await prisma.documento.findMany({
      where: { trabajadorId: parseInt(trabajadorId) },
      orderBy: { creadoAt: 'desc' },
    })

    res.json({ documentos })
  } catch (error) {
    console.error('Error al obtener documentos:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE - Eliminar documento
router.delete('/:documentoId', async (req, res) => {
  try {
    const { documentoId } = req.params

    const documento = await prisma.documento.findUnique({
      where: { id: parseInt(documentoId) },
    })

    if (!documento) {
      return res.status(404).json({ error: 'Documento no encontrado' })
    }

    await deleteDocumento(documento.driveFileId)

    await prisma.documento.delete({
      where: { id: parseInt(documentoId) },
    })

    res.json({ success: true, mensaje: 'Documento eliminado' })
  } catch (error) {
    console.error('Error al eliminar documento:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
