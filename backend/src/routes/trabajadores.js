import { Router } from 'express'
import { z } from 'zod'
import { getPrisma } from '../db.js'
import { validarTrabajador } from '../middleware/validacion.js'
import logger from '../logger.js'

const router = Router()

const includeEmpresa = {
  empresaRel: { select: { id: true, nombre: true, color: true } },
  observaciones: { orderBy: { createdAt: 'desc' } },
  CursosTrabajador: { orderBy: [{ fecha: 'desc' }, { id: 'desc' }] },
  eventosCalendario: { orderBy: { fecha: 'asc' } },
  Documentos: { select: { id: true, nombre: true, mimeType: true, driveFileId: true } },
}

function serializar(t) {
  return {
    ...t,
    empresa: t.empresaRel?.nombre || 'N/A',
    empresaId: t.empresaRel?.id || t.empresaId,
    empresaColor: t.empresaRel?.color || null,
    cursos: t.CursosTrabajador || [],
    documentosSubidos: t.Documentos || [],
    CursosTrabajador: undefined,
    empresaRel: undefined,
    Documentos: undefined,
  }
}

router.get('/', async (req, res, next) => {
  try {
    const prisma = getPrisma()
    const { q, estado, page: pageStr, limit: limitStr } = req.query
    const page = Math.max(1, parseInt(pageStr) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(limitStr) || 20))
    const skip = (page - 1) * limit

    const where = {}
    if (estado && estado !== 'Todas') {
      where.estado = estado
    }
    if (q) {
      where.OR = [
        { nombre: { contains: q, mode: 'insensitive' } },
        { datos_completos: { path: ['CURP'], string_contains: q } },
        { datos_completos: { path: ['RFC'], string_contains: q } },
      ]
    }

    const [total, data] = await Promise.all([
      prisma.trabajador.count({ where }),
      prisma.trabajador.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: includeEmpresa,
      }),
    ])

    res.json({
      data: data.map(serializar),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const prisma = getPrisma()
    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido.' })
    }
    const trabajador = await prisma.trabajador.findUnique({
      where: { id },
      include: includeEmpresa,
    })
    if (!trabajador) {
      return res.status(404).json({ error: 'Trabajador no encontrado' })
    }
    res.json(serializar(trabajador))
  } catch (error) {
    next(error)
  }
})

router.post('/', validarTrabajador, async (req, res, next) => {
  try {
    const prisma = getPrisma()
    const data = req.body
    let empresaIdVal = data.empresaId || null
    const trabajador = await prisma.trabajador.create({
      data: {
        nombre: data.nombre || '',
        empresaId: empresaIdVal,
        puesto: data.puesto || 'N/A',
        area: data.area || 'N/A',
        telefono: data.telefono || 'N/A',
        correo: data.correo || 'N/A',
        fechaIngreso: data.fechaIngreso || new Date().toISOString().split('T')[0],
        estado: data.estado || 'Activo',
        foto: data.foto || null,
        datos_completos: data.datos_completos || {},
        aptitudes: data.aptitudes || {},
        resultado_psicometrico: data.resultado_psicometrico || null,
      },
      include: includeEmpresa,
    })
    logger.info({ trabajadorId: trabajador.id }, 'Trabajador creado')
    res.status(201).json(serializar(trabajador))
  } catch (error) {
    next(error)
  }
})

router.put('/:id', validarTrabajador, async (req, res, next) => {
  try {
    const prisma = getPrisma()
    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido.' })
    }

    const existente = await prisma.trabajador.findUnique({ where: { id } })
    if (!existente) {
      return res.status(404).json({ error: 'Trabajador no encontrado' })
    }

    const data = req.body
    let empresaIdVal = data.empresaId !== undefined ? data.empresaId : existente.empresaId
    const actualizado = await prisma.trabajador.update({
      where: { id },
      data: {
        nombre: data.nombre !== undefined ? data.nombre : existente.nombre,
        empresaId: empresaIdVal,
        puesto: data.puesto !== undefined ? data.puesto : existente.puesto,
        area: data.area !== undefined ? data.area : existente.area,
        telefono: data.telefono !== undefined ? data.telefono : existente.telefono,
        correo: data.correo !== undefined ? data.correo : existente.correo,
        fechaIngreso: data.fechaIngreso !== undefined ? data.fechaIngreso : existente.fechaIngreso,
        estado: data.estado !== undefined ? data.estado : existente.estado,
        foto: data.foto !== undefined ? data.foto : existente.foto,
        datos_completos: data.datos_completos !== undefined ? data.datos_completos : existente.datos_completos,
        aptitudes: data.aptitudes !== undefined ? data.aptitudes : existente.aptitudes,
        resultado_psicometrico: data.resultado_psicometrico !== undefined ? data.resultado_psicometrico : existente.resultado_psicometrico,
      },
      include: includeEmpresa,
    })
    logger.info({ trabajadorId: id }, 'Trabajador actualizado')
    res.json(serializar(actualizado))
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const prisma = getPrisma()
    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido.' })
    }

    const existente = await prisma.trabajador.findUnique({ where: { id } })
    if (!existente) {
      return res.status(404).json({ error: 'Trabajador no encontrado' })
    }
    await prisma.trabajador.delete({ where: { id } })
    logger.info({ trabajadorId: id }, 'Trabajador eliminado')
    res.json({ message: 'Trabajador eliminado', id })
  } catch (error) {
    next(error)
  }
})

export default router
