import { Router } from 'express'
import { getPrisma } from '../db.js'

const prisma = getPrisma()
const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const empresas = await prisma.empresa.findMany({
      orderBy: { orden: 'asc' }
    })
    res.json(empresas)
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { nombre, color } = req.body
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' })

    const existente = await prisma.empresa.findUnique({ where: { nombre } })
    if (existente) return res.status(409).json({ error: 'La empresa ya existe' })

    const maxOrden = await prisma.empresa.aggregate({ _max: { orden: true } })
    const empresa = await prisma.empresa.create({
      data: { nombre, color: color || '#3b82f6', orden: (maxOrden._max.orden ?? -1) + 1 }
    })

    res.status(201).json(empresa)
  } catch (error) {
    next(error)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const { nombre, color, activa, orden } = req.body

    const existente = await prisma.empresa.findUnique({ where: { id } })
    if (!existente) return res.status(404).json({ error: 'Empresa no encontrada' })

    const actualizada = await prisma.empresa.update({
      where: { id },
      data: {
        nombre: nombre !== undefined ? nombre : existente.nombre,
        color: color !== undefined ? color : existente.color,
        activa: activa !== undefined ? activa : existente.activa,
        orden: orden !== undefined ? orden : existente.orden,
      }
    })

    if (nombre !== undefined && nombre !== existente.nombre) {
      await prisma.trabajador.updateMany({
        where: { empresaId: id },
        data: { empresa: nombre }
      })
    }

    res.json(actualizada)
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const existente = await prisma.empresa.findUnique({
      where: { id },
      include: { _count: { select: { trabajadores: true } } }
    })
    if (!existente) return res.status(404).json({ error: 'Empresa no encontrada' })
    if (existente._count.trabajadores > 0) {
      return res.status(409).json({
        error: `No se puede eliminar. ${existente._count.trabajadores} trabajador(es) pertenecen a esta empresa.`
      })
    }
    await prisma.empresa.delete({ where: { id } })
    res.json({ message: 'Empresa eliminada', id })
  } catch (error) {
    next(error)
  }
})

export default router
