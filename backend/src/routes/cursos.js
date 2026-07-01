import { Router } from 'express'
import { prisma } from '../index.js'
import { broadcast } from '../services/sse.js'

const router = Router()

function obtenerId(value) {
  const id = parseInt(value)
  return Number.isNaN(id) ? null : id
}

function obtenerFecha(value) {
  if (!value) return null
  const fecha = new Date(value)
  return Number.isNaN(fecha.getTime()) ? null : fecha
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

    const cursos = await prisma.cursosTrabajador.findMany({
      where: trabajadorId ? { trabajadorId } : {},
      orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
      include: {
        trabajador: { select: { id: true, nombre: true } }
      }
    })

    res.json(cursos)
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const trabajadorId = obtenerId(req.body.trabajadorId)
    const curso = String(req.body.curso || '').trim()
    const fecha = obtenerFecha(req.body.fecha)

    if (!trabajadorId) {
      return res.status(400).json({ error: 'trabajadorId requerido.' })
    }

    if (!curso) {
      return res.status(400).json({ error: 'El curso no puede estar vacío.' })
    }

    if (!(await existeTrabajador(trabajadorId))) {
      return res.status(404).json({ error: 'Trabajador no encontrado.' })
    }

    const nuevoCurso = await prisma.cursosTrabajador.create({
      data: { trabajadorId, curso, fecha },
      include: {
        trabajador: { select: { id: true, nombre: true } }
      }
    })

    broadcast('curso:created', nuevoCurso)
    broadcast('trabajador:updated', { id: trabajadorId })
    res.status(201).json(nuevoCurso)
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

    const existente = await prisma.cursosTrabajador.findUnique({ where: { id } })
    if (!existente) {
      return res.status(404).json({ error: 'Curso no encontrado.' })
    }

    const curso = req.body.curso !== undefined ? String(req.body.curso).trim() : existente.curso
    if (!curso) {
      return res.status(400).json({ error: 'El curso no puede estar vacío.' })
    }

    const actualizado = await prisma.cursosTrabajador.update({
      where: { id },
      data: {
        curso,
        fecha: req.body.fecha !== undefined ? obtenerFecha(req.body.fecha) : existente.fecha,
      },
      include: {
        trabajador: { select: { id: true, nombre: true } }
      }
    })

    broadcast('curso:updated', actualizado)
    broadcast('trabajador:updated', { id: actualizado.trabajadorId })
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

    const existente = await prisma.cursosTrabajador.findUnique({ where: { id } })
    if (!existente) {
      return res.status(404).json({ error: 'Curso no encontrado.' })
    }

    await prisma.cursosTrabajador.delete({ where: { id } })

    broadcast('curso:deleted', { id, trabajadorId: existente.trabajadorId })
    broadcast('trabajador:updated', { id: existente.trabajadorId })
    res.json({ message: 'Curso eliminado', id })
  } catch (error) {
    next(error)
  }
})

export default router
