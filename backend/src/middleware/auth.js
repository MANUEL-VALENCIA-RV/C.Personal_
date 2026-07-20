import jwt from 'jsonwebtoken'
import logger from '../logger.js'

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES = process.env.JWT_EXPIRES || '24h'

if (!JWT_SECRET) {
  logger.fatal('JWT_SECRET no definido en variables de entorno')
  process.exit(1)
}

export function generarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  )
}

export function verificarToken(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso denegado. Token requerido.' })
  }
  try {
    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)
    req.usuario = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado.' })
  }
}

export function requireAdmin(req, res, next) {
  if (!req.usuario || req.usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' })
  }
  next()
}
