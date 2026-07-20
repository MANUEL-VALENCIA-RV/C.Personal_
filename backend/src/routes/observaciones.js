import { Router } from 'express'
import { z } from 'zod'
import { getPrisma } from '../db.js'
import logger from '../logger.js'

const router = Router()

const createSchema = z.object({
  trabajadorId: z.number().int().positive(),
  texto: z.string().min(1, 'La observación no puede estar vacía').max(2000),
  importante: z.boolean().optional(),
})

const updateSchema = z.object({
  texto: z.string().min(1).max(2000).optional(),
  importante: z.boolean().optional(),
})

router.get('/', async (req, res, next) => {
  try {
    const prisma = getPrisma()
    const trabajadorId = req.query.trabajadorId ? parseInt(req.query.trabajadorId) : null

    if (req.query.trabajadorId && (trabajadorId === null || isNaN(trabajadorId))) {
      return res.status(400).json({ error: 'trabajadorId inválido.' })
    }

    const observaciones = await prisma.observacion.findMany({
      where: trabajadorId ? { trabajadorId } : {},
      orderBy: { createdAt: 'desc' },
      include: { trabajador: { select: { id: true, nombre: true } } },
    })
    res.json(observaciones)
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

    const { trabajadorId, texto, importante } = parsed.data
    const trabajador = await prisma.trabajador.findUnique({ where: { id: trabajadorId } })
    if (!trabajador) return res.status(404).json({ error: 'Trabajador no encontrado.' })

    const observacion = await prisma.observacion.create({
      data: { trabajadorId, texto, importante: importante || false },
      include: { trabajador: { select: { id: true, nombre: true } } },
    })
    logger.info({ observacionId: observacion.id }, 'Observación creada')
    res.status(201).json(observacion)
  } catch (error) {
    next(error)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const prisma = getPrisma()
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' })

    const existente = await prisma.observacion.findUnique({ where: { id } })
    if (!existente) return res.status(404).json({ error: 'Observación no encontrada.' })

    const parsed = updateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors })
    }

    const { texto, importante } = parsed.data
    const observacion = await prisma.observacion.update({
      where: { id },
      data: {
        texto: texto !== undefined ? texto : existente.texto,
        importante: importante !== undefined ? importante : existente.importante,
      },
      include: { trabajador: { select: { id: true, nombre: true } } },
    })
    res.json(observacion)
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const prisma = getPrisma()
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' })

    const existente = await prisma.observacion.findUnique({ where: { id } })
    if (!existente) return res.status(404).json({ error: 'Observación no encontrada.' })

    await prisma.observacion.delete({ where: { id } })
    res.json({ message: 'Observación eliminada', id })
  } catch (error) {
    next(error)
  }
})

export default router
