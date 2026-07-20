import { Router } from 'express'
import { z } from 'zod'
import { getPrisma } from '../db.js'
import logger from '../logger.js'

const router = Router()

const empresaSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(100),
  color: z.string().max(9).optional(),
})

const empresaUpdateSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  color: z.string().max(9).optional(),
  activa: z.boolean().optional(),
  orden: z.number().int().optional(),
})

router.get('/', async (req, res, next) => {
  try {
    const prisma = getPrisma()
    const empresas = await prisma.empresa.findMany({ orderBy: { orden: 'asc' } })
    res.json(empresas)
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const prisma = getPrisma()
    const parsed = empresaSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors })
    }

    const { nombre, color } = parsed.data
    const existente = await prisma.empresa.findUnique({ where: { nombre } })
    if (existente) return res.status(409).json({ error: 'La empresa ya existe' })

    const maxOrden = await prisma.empresa.aggregate({ _max: { orden: true } })
    const empresa = await prisma.empresa.create({
      data: { nombre, color: color || '#3b82f6', orden: (maxOrden._max.orden ?? -1) + 1 },
    })

    logger.info({ empresaId: empresa.id }, 'Empresa creada')
    res.status(201).json(empresa)
  } catch (error) {
    next(error)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const prisma = getPrisma()
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' })

    const parsed = empresaUpdateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors })
    }

    const existente = await prisma.empresa.findUnique({ where: { id } })
    if (!existente) return res.status(404).json({ error: 'Empresa no encontrada' })

    const { nombre, color, activa, orden } = parsed.data
    const actualizada = await prisma.empresa.update({
      where: { id },
      data: {
        nombre: nombre !== undefined ? nombre : existente.nombre,
        color: color !== undefined ? color : existente.color,
        activa: activa !== undefined ? activa : existente.activa,
        orden: orden !== undefined ? orden : existente.orden,
      },
    })

    if (nombre !== undefined && nombre !== existente.nombre) {
      await prisma.trabajador.updateMany({
        where: { empresaId: id },
        data: { empresa: nombre },
      })
    }

    logger.info({ empresaId: id }, 'Empresa actualizada')
    res.json(actualizada)
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const prisma = getPrisma()
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' })

    const existente = await prisma.empresa.findUnique({
      where: { id },
      include: { _count: { select: { trabajadores: true } } },
    })
    if (!existente) return res.status(404).json({ error: 'Empresa no encontrada' })
    if (existente._count.trabajadores > 0) {
      return res.status(409).json({
        error: `No se puede eliminar. ${existente._count.trabajadores} trabajador(es) pertenecen a esta empresa.`,
      })
    }
    await prisma.empresa.delete({ where: { id } })
    logger.info({ empresaId: id }, 'Empresa eliminada')
    res.json({ message: 'Empresa eliminada', id })
  } catch (error) {
    next(error)
  }
})

export default router
