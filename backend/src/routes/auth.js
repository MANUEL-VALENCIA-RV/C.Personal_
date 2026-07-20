import { Router } from 'express'
import bcrypt from 'bcryptjs'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { getPrisma } from '../db.js'
import { generarToken, verificarToken } from '../middleware/auth.js'
import logger from '../logger.js'

const router = Router()
const SALT_ROUNDS = 12
const MAX_INTENTOS = 5
const BLOQUEO_MINUTOS = 30

const loginSchema = z.object({
  email: z.string().email('Email inválido').max(255),
  password: z.string().min(1, 'Contraseña requerida').max(128),
})

const passwordSchema = z.object({
  passwordActual: z.string().min(1, 'Contraseña actual requerida').max(128),
  passwordNueva: z.string().min(12, 'La nueva contraseña debe tener al menos 12 caracteres').max(128),
})

router.all('/register', (req, res) => {
  res.status(403).json({ error: 'El registro de nuevos usuarios no está permitido.' })
})

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera 15 minutos.' },
})

const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de cambio de contraseña. Espera 15 minutos.' },
})

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors })
    }

    const { email, password } = parsed.data
    const prisma = getPrisma()
    const ip = req.ip || req.socket?.remoteAddress || 'desconocida'
    const emailLimpio = email.toLowerCase().trim()

    const usuario = await prisma.usuario.findUnique({ where: { email: emailLimpio } })
    if (!usuario) {
      await prisma.loginLog.create({ data: { email: emailLimpio, ip, exitoso: false } })
      return res.status(401).json({ error: 'Credenciales inválidas.' })
    }

    if (usuario.bloqueadoHasta && new Date() < usuario.bloqueadoHasta) {
      const mins = Math.ceil((usuario.bloqueadoHasta - new Date()) / 60000)
      return res.status(423).json({ error: `Cuenta bloqueada. Intenta de nuevo en ${mins} minutos.` })
    }

    const valido = await bcrypt.compare(password, usuario.password)
    if (!valido) {
      const nuevosIntentos = usuario.intentosFallidos + 1
      const datosUpdate = { intentosFallidos: nuevosIntentos }

      if (nuevosIntentos >= MAX_INTENTOS) {
        datosUpdate.bloqueadoHasta = new Date(Date.now() + BLOQUEO_MINUTOS * 60 * 1000)
      }

      await prisma.usuario.update({ where: { id: usuario.id }, data: datosUpdate })
      await prisma.loginLog.create({ data: { email: emailLimpio, ip, exitoso: false } })

      const restantes = MAX_INTENTOS - nuevosIntentos
      return res.status(restantes > 0 ? 401 : 423).json({
        error: restantes > 0
          ? `Credenciales inválidas. Te quedan ${restantes} intentos.`
          : `Cuenta bloqueada por ${BLOQUEO_MINUTOS} minutos por demasiados intentos.`,
      })
    }

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { intentosFallidos: 0, bloqueadoHasta: null, ultimoAcceso: new Date() },
    })

    await prisma.loginLog.create({ data: { email: emailLimpio, ip, exitoso: true } })

    const token = generarToken(usuario)
    res.json({
      token,
      cambiarPassword: usuario.debeCambiarPassword,
      usuario: { id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol },
    })
  } catch (error) {
    next(error)
  }
})

router.get('/verify', verificarToken, async (req, res, next) => {
  try {
    const prisma = getPrisma()
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.id },
      select: { id: true, email: true, nombre: true, rol: true },
    })
    if (!usuario) {
      return res.status(401).json({ error: 'Usuario no encontrado.' })
    }
    res.json({ usuario })
  } catch (error) {
    next(error)
  }
})

router.post('/cambiar-password', verificarToken, passwordLimiter, async (req, res, next) => {
  try {
    const parsed = passwordSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors })
    }

    const { passwordActual, passwordNueva } = parsed.data
    const prisma = getPrisma()

    const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario.id } })
    if (!usuario) {
      return res.status(401).json({ error: 'Usuario no encontrado.' })
    }

    const valido = await bcrypt.compare(passwordActual, usuario.password)
    if (!valido) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta.' })
    }

    if (passwordActual === passwordNueva) {
      return res.status(400).json({ error: 'La nueva contraseña debe ser diferente a la actual.' })
    }

    const hashed = await bcrypt.hash(passwordNueva, SALT_ROUNDS)
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { password: hashed, debeCambiarPassword: false, intentosFallidos: 0, bloqueadoHasta: null },
    })

    logger.info({ userId: usuario.id }, 'Contraseña actualizada')
    res.json({ message: 'Contraseña actualizada exitosamente.' })
  } catch (error) {
    next(error)
  }
})

export default router
