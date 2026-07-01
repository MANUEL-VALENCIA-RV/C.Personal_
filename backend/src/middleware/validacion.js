import { z } from 'zod'

export const trabajadorSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(200).optional(),
  empresa: z.string().max(100).optional(),
  empresaId: z.number().int().positive().nullable().optional(),
  puesto: z.string().max(100).optional(),
  area: z.string().max(100).optional(),
  telefono: z.string().max(50).optional(),
  correo: z.string().max(100).optional(),
  fechaIngreso: z.string().max(20).optional(),
  estado: z.string().max(50).optional(),
  foto: z.string().nullable().optional(),
  datos_completos: z.record(z.any()).optional(),
  aptitudes: z.record(z.any()).optional(),
  resultado_psicometrico: z.any().nullable().optional(),
  documentos: z.record(z.any()).optional()
})

export function validarTrabajador(req, res, next) {
  const result = trabajadorSchema.safeParse(req.body)
  if (!result.success) {
    const errores = result.error.flatten().fieldErrors
    return res.status(400).json({ error: 'Datos inválidos', detalles: errores })
  }
  req.body = result.data
  next()
}