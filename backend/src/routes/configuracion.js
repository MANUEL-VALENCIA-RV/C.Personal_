import { Router } from 'express'
import { getPrisma } from '../db.js'

const prisma = getPrisma()
const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const [documentos, aptitudes, secciones] = await Promise.all([
      prisma.documentoRequerido.findMany({ orderBy: { orden: 'asc' } }),
      prisma.aptitudConfig.findMany({ orderBy: { orden: 'asc' } }),
      prisma.seccionExpediente.findMany({ orderBy: { orden: 'asc' } }),
    ])
    res.json({ documentos, aptitudes, secciones })
  } catch (error) {
    next(error)
  }
})

router.post('/documentos', async (req, res, next) => {
  try {
    const { nombre } = req.body
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' })
    const existe = await prisma.documentoRequerido.findUnique({ where: { nombre } })
    if (existe) return res.status(409).json({ error: 'Ya existe un documento con ese nombre' })
    const max = await prisma.documentoRequerido.aggregate({ _max: { orden: true } })
    const doc = await prisma.documentoRequerido.create({
      data: { nombre, orden: (max._max.orden ?? -1) + 1 }
    })
    res.status(201).json(doc)
  } catch (error) {
    next(error)
  }
})

router.put('/documentos/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const { nombre, activo, orden } = req.body
    const existente = await prisma.documentoRequerido.findUnique({ where: { id } })
    if (!existente) return res.status(404).json({ error: 'Documento no encontrado' })
    const actualizado = await prisma.documentoRequerido.update({
      where: { id },
      data: {
        nombre: nombre !== undefined ? nombre : existente.nombre,
        activo: activo !== undefined ? activo : existente.activo,
        orden: orden !== undefined ? orden : existente.orden,
      }
    })
    res.json(actualizado)
  } catch (error) {
    next(error)
  }
})

router.delete('/documentos/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const existente = await prisma.documentoRequerido.findUnique({ where: { id } })
    if (!existente) return res.status(404).json({ error: 'Documento no encontrado' })
    await prisma.documentoRequerido.delete({ where: { id } })
    res.json({ message: 'Documento eliminado', id })
  } catch (error) {
    next(error)
  }
})

router.post('/aptitudes', async (req, res, next) => {
  try {
    const { nombre } = req.body
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' })
    const existe = await prisma.aptitudConfig.findUnique({ where: { nombre } })
    if (existe) return res.status(409).json({ error: 'Ya existe una aptitud con ese nombre' })
    const max = await prisma.aptitudConfig.aggregate({ _max: { orden: true } })
    const apt = await prisma.aptitudConfig.create({
      data: { nombre, orden: (max._max.orden ?? -1) + 1 }
    })
    res.status(201).json(apt)
  } catch (error) {
    next(error)
  }
})

router.put('/aptitudes/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const { nombre, activo, orden } = req.body
    const existente = await prisma.aptitudConfig.findUnique({ where: { id } })
    if (!existente) return res.status(404).json({ error: 'Aptitud no encontrada' })
    const actualizado = await prisma.aptitudConfig.update({
      where: { id },
      data: {
        nombre: nombre !== undefined ? nombre : existente.nombre,
        activo: activo !== undefined ? activo : existente.activo,
        orden: orden !== undefined ? orden : existente.orden,
      }
    })
    res.json(actualizado)
  } catch (error) {
    next(error)
  }
})

router.delete('/aptitudes/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const existente = await prisma.aptitudConfig.findUnique({ where: { id } })
    if (!existente) return res.status(404).json({ error: 'Aptitud no encontrada' })
    await prisma.aptitudConfig.delete({ where: { id } })
    res.json({ message: 'Aptitud eliminada', id })
  } catch (error) {
    next(error)
  }
})

router.post('/secciones', async (req, res, next) => {
  try {
    const { clave, titulo } = req.body
    if (!clave || !titulo) return res.status(400).json({ error: 'Clave y título requeridos' })
    const existe = await prisma.seccionExpediente.findUnique({ where: { clave } })
    if (existe) return res.status(409).json({ error: 'Ya existe una sección con esa clave' })
    const max = await prisma.seccionExpediente.aggregate({ _max: { orden: true } })
    const sec = await prisma.seccionExpediente.create({
      data: { clave, titulo, orden: (max._max.orden ?? -1) + 1 }
    })
    res.status(201).json(sec)
  } catch (error) {
    next(error)
  }
})

router.put('/secciones/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const { titulo, activo, orden } = req.body
    const existente = await prisma.seccionExpediente.findUnique({ where: { id } })
    if (!existente) return res.status(404).json({ error: 'Sección no encontrada' })
    const actualizado = await prisma.seccionExpediente.update({
      where: { id },
      data: {
        titulo: titulo !== undefined ? titulo : existente.titulo,
        activo: activo !== undefined ? activo : existente.activo,
        orden: orden !== undefined ? orden : existente.orden,
      }
    })
    res.json(actualizado)
  } catch (error) {
    next(error)
  }
})

router.delete('/secciones/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const existente = await prisma.seccionExpediente.findUnique({ where: { id } })
    if (!existente) return res.status(404).json({ error: 'Sección no encontrada' })
    await prisma.seccionExpediente.delete({ where: { id } })
    res.json({ message: 'Sección eliminada', id })
  } catch (error) {
    next(error)
  }
})

export default router
