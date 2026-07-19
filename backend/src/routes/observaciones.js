import { Router } from 'express'
import { getPrisma } from '../db.js'

const prisma = getPrisma()


const router = Router()

function obtenerId(value) {
  const id = parseInt(value)
  return Number.isNaN(id) ? null : id
}

async function existeTrabajador(trabajadorId) {
  const trabajador = await prisma.trabajador.findUnique({ where: { id: trabajadorId } })
  return !!trabajador
}

router.get('/', async (req, res, next) => {
  try {
    const trabajadorId = req.query.trabajadorId ? obtenerId(req.query.trabajadorId) : null

    if (req.query.trabajadorId && !trabajadorId) {
      return res.status(400).json({ error: 'trabajadorId inválido.' })
    }

    const observaciones = await prisma.observacion.findMany({
      where: trabajadorId ? { trabajadorId } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        trabajador: { select: { id: true, nombre: true } }
      }
    })

    res.json(observaciones)
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const trabajadorId = obtenerId(req.body.trabajadorId)
    const texto = String(req.body.texto || '').trim()
    const importante = !!req.body.importante

    if (!trabajadorId) {
      return res.status(400).json({ error: 'trabajadorId requerido.' })
    }

    if (!texto) {
      return res.status(400).json({ error: 'La observación no puede estar vacía.' })
    }

    if (!(await existeTrabajador(trabajadorId))) {
      return res.status(404).json({ error: 'Trabajador no encontrado.' })
    }

    const observacion = await prisma.observacion.create({
      data: { trabajadorId, texto, importante },
      include: {
        trabajador: { select: { id: true, nombre: true } }
      }
    })

    res.status(201).json(observacion)
  } catch (error) {
    next(error)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const id = obtenerId(req.params.id)
    if (!id) {
      return res.status(400).json({ error: 'ID inválido.' })
    }

    const existente = await prisma.observacion.findUnique({ where: { id } })
    if (!existente) {
      return res.status(404).json({ error: 'Observación no encontrada.' })
    }

    const texto = req.body.texto !== undefined ? String(req.body.texto).trim() : existente.texto
    if (!texto) {
      return res.status(400).json({ error: 'La observación no puede estar vacía.' })
    }

    const observacion = await prisma.observacion.update({
      where: { id },
      data: {
        texto,
        importante: req.body.importante !== undefined ? !!req.body.importante : existente.importante,
      },
      include: {
        trabajador: { select: { id: true, nombre: true } }
      }
    })

    res.json(observacion)
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const id = obtenerId(req.params.id)
    if (!id) {
      return res.status(400).json({ error: 'ID inválido.' })
    }

    const existente = await prisma.observacion.findUnique({ where: { id } })
    if (!existente) {
      return res.status(404).json({ error: 'Observación no encontrada.' })
    }

    await prisma.observacion.delete({ where: { id } })

    res.json({ message: 'Observación eliminada', id })
  } catch (error) {
    next(error)
  }
})

export default router
