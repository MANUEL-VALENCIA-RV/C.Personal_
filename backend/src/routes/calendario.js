import { Router } from 'express'
import { prisma } from '../index.js'
import { broadcast } from '../services/sse.js'

const router = Router()

function obtenerId(value) {
  const id = parseInt(value)
  return Number.isNaN(id) ? null : id
}

function obtenerFechaObligatoria(value) {
  if (!value) return null
  const fecha = new Date(value)
  return Number.isNaN(fecha.getTime()) ? null : fecha
}

async function existeTrabajador(trabajadorId) {
  if (!trabajadorId) return true
  const trabajador = await prisma.trabajador.findUnique({ where: { id: trabajadorId } })
  return !!trabajador
}

router.get('/', async (req, res, next) => {
  try {
    const trabajadorId = req.query.trabajadorId ? obtenerId(req.query.trabajadorId) : null
    const desde = req.query.desde ? new Date(req.query.desde) : null
    const hasta = req.query.hasta ? new Date(req.query.hasta) : null

    if (req.query.trabajadorId && !trabajadorId) {
      return res.status(400).json({ error: 'trabajadorId inválido.' })
    }

    const where = {}
    if (trabajadorId) where.trabajadorId = trabajadorId
    if (desde || hasta) {
      where.fecha = {}
      if (desde && !Number.isNaN(desde.getTime())) where.fecha.gte = desde
      if (hasta && !Number.isNaN(hasta.getTime())) where.fecha.lte = hasta
    }

    const eventos = await prisma.eventoCalendario.findMany({
      where,
      orderBy: { fecha: 'asc' },
      include: {
        trabajador: { select: { id: true, nombre: true } }
      }
    })

    res.json(eventos)
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const trabajadorId = req.body.trabajadorId ? obtenerId(req.body.trabajadorId) : null
    const titulo = String(req.body.titulo || '').trim()
    const descripcion = req.body.descripcion ? String(req.body.descripcion).trim() : null
    const fecha = obtenerFechaObligatoria(req.body.fecha)
    const tipo = String(req.body.tipo || 'general').trim() || 'general'

    if (!titulo) {
      return res.status(400).json({ error: 'Título requerido.' })
    }

    if (!fecha) {
      return res.status(400).json({ error: 'Fecha inválida o requerida.' })
    }

    if (!(await existeTrabajador(trabajadorId))) {
      return res.status(404).json({ error: 'Trabajador no encontrado.' })
    }

    const evento = await prisma.eventoCalendario.create({
      data: { trabajadorId, titulo, descripcion, fecha, tipo },
      include: {
        trabajador: { select: { id: true, nombre: true } }
      }
    })

    broadcast('calendario:created', evento)
    if (trabajadorId) broadcast('trabajador:updated', { id: trabajadorId })
    res.status(201).json(evento)
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

    const existente = await prisma.eventoCalendario.findUnique({ where: { id } })
    if (!existente) {
      return res.status(404).json({ error: 'Evento no encontrado.' })
    }

    const trabajadorId = req.body.trabajadorId !== undefined
      ? (req.body.trabajadorId ? obtenerId(req.body.trabajadorId) : null)
      : existente.trabajadorId

    const titulo = req.body.titulo !== undefined ? String(req.body.titulo).trim() : existente.titulo
    const fecha = req.body.fecha !== undefined ? obtenerFechaObligatoria(req.body.fecha) : existente.fecha

    if (!titulo) {
      return res.status(400).json({ error: 'Título requerido.' })
    }

    if (!fecha) {
      return res.status(400).json({ error: 'Fecha inválida o requerida.' })
    }

    if (!(await existeTrabajador(trabajadorId))) {
      return res.status(404).json({ error: 'Trabajador no encontrado.' })
    }

    const actualizado = await prisma.eventoCalendario.update({
      where: { id },
      data: {
        trabajadorId,
        titulo,
        descripcion: req.body.descripcion !== undefined ? (req.body.descripcion ? String(req.body.descripcion).trim() : null) : existente.descripcion,
        fecha,
        tipo: req.body.tipo !== undefined ? String(req.body.tipo || 'general').trim() || 'general' : existente.tipo,
      },
      include: {
        trabajador: { select: { id: true, nombre: true } }
      }
    })

    broadcast('calendario:updated', actualizado)
    if (actualizado.trabajadorId) broadcast('trabajador:updated', { id: actualizado.trabajadorId })
    res.json(actualizado)
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

    const existente = await prisma.eventoCalendario.findUnique({ where: { id } })
    if (!existente) {
      return res.status(404).json({ error: 'Evento no encontrado.' })
    }

    await prisma.eventoCalendario.delete({ where: { id } })

    broadcast('calendario:deleted', { id, trabajadorId: existente.trabajadorId })
    if (existente.trabajadorId) broadcast('trabajador:updated', { id: existente.trabajadorId })
    res.json({ message: 'Evento eliminado', id })
  } catch (error) {
    next(error)
  }
})

export default router
