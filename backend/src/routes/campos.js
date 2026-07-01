import { Router } from 'express'
import { prisma } from '../index.js'
import { broadcast } from '../services/sse.js'
const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const campos = await prisma.campoFormulario.findMany({ orderBy: [{ seccion: 'asc' }, { orden: 'asc' }] })
    res.json(campos)
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { seccion, nombre, etiqueta, tipo, obligatorio, activo, orden, opciones } = req.body
    if (!seccion || !nombre) return res.status(400).json({ error: 'Sección y nombre requeridos' })
    const campo = await prisma.campoFormulario.create({
      data: { seccion, nombre, etiqueta: etiqueta || nombre, tipo: tipo || 'text', obligatorio: !!obligatorio, activo: activo !== false, orden: orden ?? 0, opciones: opciones || null }
    })
    broadcast('campo:created', campo)
    res.status(201).json(campo)
  } catch (error) {
    next(error)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const existente = await prisma.campoFormulario.findUnique({ where: { id } })
    if (!existente) return res.status(404).json({ error: 'Campo no encontrado' })

    const { seccion, nombre, etiqueta, tipo, obligatorio, activo, orden, opciones } = req.body
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
      }
    })
    broadcast('campo:updated', actualizado)
    res.json(actualizado)
  } catch (error) {
    next(error)
  }
})

router.put('/reordenar', async (req, res, next) => {
  try {
    const { orden } = req.body
    if (!Array.isArray(orden)) return res.status(400).json({ error: 'Se requiere un array con ids' })
    for (let i = 0; i < orden.length; i++) {
      await prisma.campoFormulario.update({ where: { id: orden[i] }, data: { orden: i } })
    }
    const campos = await prisma.campoFormulario.findMany({ orderBy: [{ seccion: 'asc' }, { orden: 'asc' }] })
    broadcast('campo:updated', { bulk: true })
    res.json(campos)
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const existente = await prisma.campoFormulario.findUnique({ where: { id } })
    if (!existente) return res.status(404).json({ error: 'Campo no encontrado' })
    await prisma.campoFormulario.delete({ where: { id } })
    broadcast('campo:deleted', { id })
    res.json({ message: 'Campo eliminado', id })
  } catch (error) {
    next(error)
  }
})

export default router
