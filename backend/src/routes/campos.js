import { Router } from 'express'
import { z } from 'zod'
import { getPrisma } from '../db.js'
import logger from '../logger.js'

const router = Router()

const campoCreateSchema = z.object({
  seccion: z.string().min(1, 'Sección requerida').max(50),
  nombre: z.string().min(1, 'Nombre requerido').max(50),
  etiqueta: z.string().max(100).optional(),
  tipo: z.string().max(20).optional(),
  obligatorio: z.boolean().optional(),
  activo: z.boolean().optional(),
  orden: z.number().int().optional(),
  opciones: z.any().nullable().optional(),
})

const campoUpdateSchema = z.object({
  seccion: z.string().min(1).max(50).optional(),
  nombre: z.string().min(1).max(50).optional(),
  etiqueta: z.string().max(100).optional(),
  tipo: z.string().max(20).optional(),
  obligatorio: z.boolean().optional(),
  activo: z.boolean().optional(),
  orden: z.number().int().optional(),
  opciones: z.any().nullable().optional(),
})

const reordenarSchema = z.object({
  orden: z.array(z.number().int().positive()),
})

router.get('/', async (req, res, next) => {
  try {
    const prisma = getPrisma()
    const campos = await prisma.campoFormulario.findMany({
      orderBy: [{ seccion: 'asc' }, { orden: 'asc' }],
    })
    res.json(campos)
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const prisma = getPrisma()
    const parsed = campoCreateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors })
    }

    const { seccion, nombre, etiqueta, tipo, obligatorio, activo, orden, opciones } = parsed.data
    const campo = await prisma.campoFormulario.create({
      data: {
        seccion,
        nombre,
        etiqueta: etiqueta || nombre,
        tipo: tipo || 'text',
        obligatorio: !!obligatorio,
        activo: activo !== false,
        orden: orden ?? 0,
        opciones: opciones || null,
      },
    })
    logger.info({ campoId: campo.id }, 'Campo creado')
    res.status(201).json(campo)
  } catch (error) {
    next(error)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const prisma = getPrisma()
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' })

    const existente = await prisma.campoFormulario.findUnique({ where: { id } })
    if (!existente) return res.status(404).json({ error: 'Campo no encontrado' })

    const parsed = campoUpdateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors })
    }

    const { seccion, nombre, etiqueta, tipo, obligatorio, activo, orden, opciones } = parsed.data
    const actualizado = await prisma.campoFormulario.update({
      where: { id },
      data: {
        seccion: seccion !== undefined ? seccion : existente.seccion,
        nombre: nombre !== undefined ? nombre : existente.nombre,
        etiqueta: etiqueta !== undefined ? etiqueta : existente.etiqueta,
        tipo: tipo !== undefined ? tipo : existente.tipo,
        obligatorio: obligatorio !== undefined ? !!obligatorio : existente.obligatorio,
        activo: activo !== undefined ? activo : existente.activo,
        orden: orden !== undefined ? orden : existente.orden,
        opciones: opciones !== undefined ? opciones : existente.opciones,
      },
    })
    logger.info({ campoId: id }, 'Campo actualizado')
    res.json(actualizado)
  } catch (error) {
    next(error)
  }
})

router.put('/reordenar', async (req, res, next) => {
  try {
    const prisma = getPrisma()
    const parsed = reordenarSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Se requiere un array con ids' })
    }

    for (let i = 0; i < parsed.data.orden.length; i++) {
      await prisma.campoFormulario.update({
        where: { id: parsed.data.orden[i] },
        data: { orden: i },
      })
    }
    const campos = await prisma.campoFormulario.findMany({
      orderBy: [{ seccion: 'asc' }, { orden: 'asc' }],
    })
    logger.info('Campos reordenados')
    res.json(campos)
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const prisma = getPrisma()
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' })

    const existente = await prisma.campoFormulario.findUnique({ where: { id } })
    if (!existente) return res.status(404).json({ error: 'Campo no encontrado' })

    await prisma.campoFormulario.delete({ where: { id } })
    logger.info({ campoId: id }, 'Campo eliminado')
    res.json({ message: 'Campo eliminado', id })
  } catch (error) {
    next(error)
  }
})

export default router
