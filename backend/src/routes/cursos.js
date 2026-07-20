import { Router } from 'express'
import { z } from 'zod'
import { getPrisma } from '../db.js'
import logger from '../logger.js'

const router = Router()

const createSchema = z.object({
  trabajadorId: z.number().int().positive(),
  curso: z.string().min(1, 'El curso no puede estar vacío').max(200),
  fecha: z.string().nullable().optional(),
})

const updateSchema = z.object({
  curso: z.string().min(1).max(200).optional(),
  fecha: z.string().nullable().optional(),
})

router.get('/', async (req, res, next) => {
  try {
    const prisma = getPrisma()
    const trabajadorId = req.query.trabajadorId ? parseInt(req.query.trabajadorId) : null

    if (req.query.trabajadorId && (trabajadorId === null || isNaN(trabajadorId))) {
      return res.status(400).json({ error: 'trabajadorId inválido.' })
    }

    const cursos = await prisma.cursosTrabajador.findMany({
      where: trabajadorId ? { trabajadorId } : {},
      orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
      include: { trabajador: { select: { id: true, nombre: true } } },
    })
    res.json(cursos)
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

    const { trabajadorId, curso, fecha } = parsed.data
    const trabajador = await prisma.trabajador.findUnique({ where: { id: trabajadorId } })
    if (!trabajador) return res.status(404).json({ error: 'Trabajador no encontrado.' })

    const fechaVal = fecha ? new Date(fecha) : null
    const nuevoCurso = await prisma.cursosTrabajador.create({
      data: { trabajadorId, curso, fecha: fechaVal && !isNaN(fechaVal.getTime()) ? fechaVal : null },
      include: { trabajador: { select: { id: true, nombre: true } } },
    })
    logger.info({ cursoId: nuevoCurso.id }, 'Curso creado')
    res.status(201).json(nuevoCurso)
  } catch (error) {
    next(error)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const prisma = getPrisma()
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' })

    const existente = await prisma.cursosTrabajador.findUnique({ where: { id } })
    if (!existente) return res.status(404).json({ error: 'Curso no encontrado.' })

    const parsed = updateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors })
    }

    const { curso, fecha } = parsed.data
    const fechaVal = fecha !== undefined ? (fecha ? new Date(fecha) : null) : existente.fecha
    const actualizado = await prisma.cursosTrabajador.update({
      where: { id },
      data: {
        curso: curso !== undefined ? curso : existente.curso,
        fecha: fecha !== undefined ? (fechaVal && !isNaN(fechaVal.getTime()) ? fechaVal : null) : existente.fecha,
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

    const existente = await prisma.cursosTrabajador.findUnique({ where: { id } })
    if (!existente) return res.status(404).json({ error: 'Curso no encontrado.' })

    await prisma.cursosTrabajador.delete({ where: { id } })
    res.json({ message: 'Curso eliminado', id })
  } catch (error) {
    next(error)
  }
})

export default router
