import express from 'express'
import multer from 'multer'
import fs from 'fs'
import { prisma } from '../index.js'
import { uploadDocumento, deleteDocumento } from '../services/driveService.js'

const router = express.Router()

// Tipos de archivo permitidos
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

// Configurar multer para archivos temporales
const upload = multer({
  dest: 'temp-uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`))
    }
  },
})

// POST - Subir documento para un trabajador
router.post('/:trabajadorId/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó archivo' })
    }

    const { trabajadorId } = req.params
    const campo = req.body.campo || req.file.originalname

    // Validar que el trabajador existe
    const trabajador = await prisma.trabajador.findUnique({
      where: { id: parseInt(trabajadorId) },
    })

    if (!trabajador) {
      // Limpiar archivo temporal si el trabajador no existe
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path)
      }
      return res.status(404).json({ error: 'Trabajador no encontrado' })
    }

    // Subir a Google Drive
    const { driveFileId, webViewLink, carpetaId, nombre } = await uploadDocumento(
      req.file,
      `${trabajador.nombre}_${trabajadorId}`
    )

    // Guardar referencia en BD usando el campo como nombre
    const documento = await prisma.documento.create({
      data: {
        trabajadorId: parseInt(trabajadorId),
        driveFileId,
        nombre: campo,
        mimeType: req.file.mimetype,
        carpetaId,
      },
    })

    res.json({
      success: true,
      documento,
      webViewLink,
    })
  } catch (error) {
    console.error('Error al subir documento:', error)
    // Limpiar archivo temporal en caso de error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }
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

    // Eliminar de Google Drive
    await deleteDocumento(documento.driveFileId)

    // Eliminar de BD
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
