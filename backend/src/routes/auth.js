import { Router } from 'express'
import bcrypt from 'bcrypt'
import { prisma } from '../index.js'
import { generarToken, verificarToken } from '../middleware/auth.js'
import rateLimit from 'express-rate-limit'

const router = Router()

router.all('/register', (req, res) => {
  res.status(403).json({ error: 'El registro de nuevos usuarios no está permitido.' })
})

const SALT_ROUNDS = 12
const MAX_INTENTOS = 5
const BLOQUEO_MINUTOS = 30

function sanitizarEmail(email) {
  return email.toLowerCase().trim()
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Demasiados intentos. Espera 15 minutos.' }
})

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body
    const ip = req.ip || req.connection?.remoteAddress || 'desconocida'

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos.' })
    }

    const emailLimpio = sanitizarEmail(email)
    const usuario = await prisma.usuario.findUnique({ where: { email: emailLimpio } })
    if (!usuario) {
      await prisma.loginLog.create({ data: { email: emailLimpio, ip, exitoso: false } })
      return res.status(401).json({ error: 'Credenciales inválidas.' })
    }

    if (usuario.bloqueadoHasta && new Date() < usuario.bloqueadoHasta) {
      const mins = Math.ceil((usuario.bloqueadoHasta - new Date()) / 60000)
      return res.status(423).json({
        error: `Cuenta bloqueada. Intenta de nuevo en ${mins} minutos.`
      })
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
      if (restantes > 0) {
        return res.status(401).json({ error: `Credenciales inválidas. Te quedan ${restantes} intentos.` })
      } else {
        return res.status(423).json({ error: `Cuenta bloqueada por ${BLOQUEO_MINUTOS} minutos por demasiados intentos.` })
      }
    }

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { intentosFallidos: 0, bloqueadoHasta: null, ultimoAcceso: new Date() }
    })

    await prisma.loginLog.create({ data: { email: emailLimpio, ip, exitoso: true } })

    const token = generarToken(usuario)
    res.json({
      token,
      cambiarPassword: usuario.debeCambiarPassword,
      usuario: { id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol }
    })
  } catch (error) {
    next(error)
  }
})

router.get('/verify', verificarToken, async (req, res, next) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.id },
      select: { id: true, email: true, nombre: true, rol: true }
    })
    if (!usuario) {
      return res.status(401).json({ error: 'Usuario no encontrado.' })
    }
    res.json({ usuario })
  } catch (error) {
    next(error)
  }
})

router.post('/cambiar-password', verificarToken, async (req, res, next) => {
  try {
    const { passwordActual, passwordNueva } = req.body

    if (!passwordActual || !passwordNueva) {
      return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas.' })
    }

    if (passwordNueva.length < 12) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 12 caracteres.' })
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario.id } })
    if (!usuario) {
      return res.status(401).json({ error: 'Usuario no encontrado.' })
    }

    const valido = await bcrypt.compare(passwordActual, usuario.password)
    if (!valido) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta.' })
    }

    const hashed = await bcrypt.hash(passwordNueva, SALT_ROUNDS)
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { password: hashed, intentosFallidos: 0, bloqueadoHasta: null }
    })

    res.json({ message: 'Contraseña actualizada exitosamente.' })
  } catch (error) {
    next(error)
  }
})

export default router