import { Router } from 'express'
import { z } from 'zod'
import { getPrisma } from '../db.js'
import logger from '../logger.js'

const router = Router()

const createSchema = z.object({
  trabajadorId: z.number().int().positive().nullable().optional(),
  titulo: z.string().min(1, 'Título requerido').max(200),
  descripcion: z.string().max(2000).nullable().optional(),
  fecha: z.string().min(1, 'Fecha requerida'),
  tipo: z.string().max(50).optional(),
})

const updateSchema = z.object({
  trabajadorId: z.number().int().positive().nullable().optional(),
  titulo: z.string().min(1).max(200).optional(),
  descripcion: z.string().max(2000).nullable().optional(),
  fecha: z.string().optional(),
  tipo: z.string().max(50).optional(),
})

router.get('/', async (req, res, next) => {
  try {
    const prisma = getPrisma()
    const trabajadorId = req.query.trabajadorId ? parseInt(req.query.trabajadorId) : null
    const desde = req.query.desde ? new Date(req.query.desde) : null
    const hasta = req.query.hasta ? new Date(req.query.hasta) : null

    if (req.query.trabajadorId && (trabajadorId === null || isNaN(trabajadorId))) {
      return res.status(400).json({ error: 'trabajadorId inválido.' })
    }

    const where = {}
    if (trabajadorId) where.trabajadorId = trabajadorId
    if (desde || hasta) {
      where.fecha = {}
      if (desde && !isNaN(desde.getTime())) where.fecha.gte = desde
      if (hasta && !isNaN(hasta.getTime())) where.fecha.lte = hasta
    }

    const eventos = await prisma.eventoCalendario.findMany({
      where,
      orderBy: { fecha: 'asc' },
      include: { trabajador: { select: { id: true, nombre: true } } },
    })
    res.json(eventos)
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const prisma = getPrisma()
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors })
    }

    const { trabajadorId, titulo, descripcion, fecha, tipo } = parsed.data
    const fechaVal = new Date(fecha)
    if (isNaN(fechaVal.getTime())) return res.status(400).json({ error: 'Fecha inválida.' })

    if (trabajadorId) {
      const trabajador = await prisma.trabajador.findUnique({ where: { id: trabajadorId } })
      if (!trabajador) return res.status(404).json({ error: 'Trabajador no encontrado.' })
    }

    const evento = await prisma.eventoCalendario.create({
      data: {
        trabajadorId: trabajadorId || null,
        titulo,
        descripcion: descripcion || null,
        fecha: fechaVal,
        tipo: tipo || 'general',
      },
      include: { trabajador: { select: { id: true, nombre: true } } },
    })
    logger.info({ eventoId: evento.id }, 'Evento creado')
    res.status(201).json(evento)
  } catch (error) {
    next(error)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const prisma = getPrisma()
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' })

    const existente = await prisma.eventoCalendario.findUnique({ where: { id } })
    if (!existente) return res.status(404).json({ error: 'Evento no encontrado.' })

    const parsed = updateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors })
    }

    const { trabajadorId, titulo, descripcion, fecha, tipo } = parsed.data
    const fechaVal = fecha !== undefined ? new Date(fecha) : existente.fecha

    if (fecha !== undefined && isNaN(fechaVal.getTime())) {
      return res.status(400).json({ error: 'Fecha inválida.' })
    }

    const actualizado = await prisma.eventoCalendario.update({
      where: { id },
      data: {
        trabajadorId: trabajadorId !== undefined ? trabajadorId : existente.trabajadorId,
        titulo: titulo !== undefined ? titulo : existente.titulo,
        descripcion: descripcion !== undefined ? descripcion : existente.descripcion,
        fecha: fechaVal,
        tipo: tipo !== undefined ? tipo : existente.tipo,
      },
      include: { trabajador: { select: { id: true, nombre: true } } },
    })
    res.json(actualizado)
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const prisma = getPrisma()
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' })

    const existente = await prisma.eventoCalendario.findUnique({ where: { id } })
    if (!existente) return res.status(404).json({ error: 'Evento no encontrado.' })

    await prisma.eventoCalendario.delete({ where: { id } })
    res.json({ message: 'Evento eliminado', id })
  } catch (error) {
    next(error)
  }
})

export default router
